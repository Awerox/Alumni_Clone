// app/api/chat/stream/route.ts
//
// Architecture : sur Vercel (serverless), une connexion SSE ouverte (GET) et une requête
// POST peuvent atterrir sur deux instances différentes. Un pub/sub en mémoire partagé entre
// requêtes (l'ancienne approche) ne livre donc pas les messages de façon fiable.
// Ici, chaque connexion SSE interroge directement Postgres à intervalle court (~1.8s) pour
// les nouveautés qui la concernent : ça fonctionne correctement quel que soit le nombre
// d'instances serverless en cours d'exécution, car la base est la seule source de vérité.

import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { verify } from 'jsonwebtoken'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
// Se referme proprement avant la coupure dure de Vercel ; le client (EventSource) se
// reconnecte alors automatiquement — voir le hook côté client.
export const maxDuration = 290

const POLL_INTERVAL_MS = 1800
const HEARTBEAT_INTERVAL_MS = 45_000
const SELF_CLOSE_MS = 280_000
const ONLINE_WINDOW_SQL = `NOW() - INTERVAL '2 minutes'` // ✅ même seuil que l'annuaire (formatLastSeen)

const MAX_MESSAGE_LENGTH = 500
const BANNED_WORDS = [
  'connard', 'connasse', 'pute', 'putain', 'merde', 'salope', 'enculé',
  'enculer', 'fdp', 'ntm', 'nique', 'niquer', 'batard', 'bâtard',
  'pd', 'pédé', 'tapette', 'attardé', 'mongol', 'fils de pute',
  'va te faire', 'ferme ta gueule', 'ta gueule', 'baise', 'baiser',
  'meurtre', 'tuer', 'je vais te', 'suicide',
]

function containsBannedWord(text: string): { banned: boolean; word?: string } {
  const lower = text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  for (const word of BANNED_WORDS) {
    const normalizedWord = word.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    if (lower.includes(normalizedWord)) return { banned: true, word }
  }
  return { banned: false }
}

function validateMessage(text: string): { valid: boolean; error?: string } {
  if (!text || !text.trim()) return { valid: false, error: 'Le message ne peut pas être vide.' }
  if (text.trim().length > MAX_MESSAGE_LENGTH) return { valid: false, error: `Message trop long (max ${MAX_MESSAGE_LENGTH} caractères).` }
  const { banned } = containsBannedWord(text)
  if (banned) return { valid: false, error: 'Message refusé : contenu inapproprié.' }
  return { valid: true }
}

// ─── Vérification du token JWT (cookie, jamais un paramètre client) ──────────
async function getUserFromCookie(req: NextRequest | Request, secret: string): Promise<any | null> {
  const cookieHeader = req.headers.get('cookie') || ''
  const cookies = Object.fromEntries(
    cookieHeader.split(';').map(c => {
      const [k, ...v] = c.trim().split('=')
      return [k, v.join('=')]
    })
  )
  const token = cookies['payload-alumni-token'] || cookies['payload-token']
  if (!token) return null
  try {
    const decoded = verify(token, secret) as any
    if (decoded?.collection === 'alumni' && decoded?.id) return decoded
    return null
  } catch {
    return null
  }
}

// ─── GET : connexion SSE en écoute ────────────────────────────────────────────
export async function GET(req: Request) {
  const payload = await getPayload({ config: configPromise })

  // ⚠️ Sécurité : auparavant le userId venait directement du paramètre d'URL, sans
  // aucune vérification — n'importe qui pouvait donc écouter les messages privés d'un
  // autre utilisateur. Désormais l'identité vient uniquement du JWT vérifié.
  const user = await getUserFromCookie(req, payload.secret)
  if (!user?.id) {
    return new Response('Non autorisé', { status: 401 })
  }
  const myId = Number(user.id)

  const pool = (payload.db as any).pool
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    start(controller) {
      let closed = false
      const send = (data: any) => {
        if (closed) return
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
        } catch {
          closed = true
        }
      }

      let cursorPublic = new Date()
      let cursorPrivate = new Date()
      let cursorComments = new Date()
      let cursorThreads = new Date()
      let lastHeartbeat = 0

      const pushPresence = async () => {
        try {
          const res = await pool.query(
            `SELECT id, prenom, nom FROM alumni WHERE last_seen >= ${ONLINE_WINDOW_SQL} AND id != $1`,
            [myId]
          )
          send({
            type: 'presence-full',
            users: res.rows.map((r: any) => ({ id: String(r.id), name: `${r.prenom} ${r.nom}`, prenom: r.prenom, nom: r.nom })),
          })
        } catch (e) { console.error('[SSE presence]', e) }
      }

      const tick = async () => {
        if (closed) return
        try {
          // ── Heartbeat : rafraîchit ma propre présence + republie la liste ──────
          const now = Date.now()
          if (now - lastHeartbeat > HEARTBEAT_INTERVAL_MS) {
            lastHeartbeat = now
            await pool.query(`UPDATE "alumni" SET "last_seen" = now() WHERE "id" = $1`, [myId])
            await pushPresence()
          }

          // ── Messages publics ────────────────────────────────────────────────
          const pub = await pool.query(
            `SELECT pm.id, pm.user, pm.text, pm.time, pm.from_id, pm.created_at
             FROM "public_messages" pm
             WHERE pm.created_at > $1
             ORDER BY pm.created_at ASC LIMIT 50`,
            [cursorPublic]
          )
          for (const row of pub.rows) {
            send({
              type: 'msg-public',
              id: String(row.id),
              from: row.from_id != null ? String(row.from_id) : undefined,
              user: row.user,
              text: row.text,
              time: row.time,
              createdAt: row.created_at,
            })
          }
          if (pub.rows.length) cursorPublic = pub.rows[pub.rows.length - 1].created_at

          // ── Messages privés me concernant ───────────────────────────────────
          const priv = await pool.query(
            `SELECT dm.id, dm.from_id, dm.to_id, dm.message, dm.file_id, dm.created_at,
                    f.prenom AS from_prenom, f.nom AS from_nom,
                    m.url AS file_url, m.filename AS file_name
             FROM "direct_messages" dm
             JOIN "alumni" f ON f.id = dm.from_id
             LEFT JOIN "media" m ON m.id = dm.file_id
             WHERE (dm.from_id = $1 OR dm.to_id = $1) AND dm.created_at > $2
             ORDER BY dm.created_at ASC LIMIT 50`,
            [myId, cursorPrivate]
          )
          for (const row of priv.rows) {
            send({
              type: 'msg-prive',
              id: String(row.id),
              from: String(row.from_id),
              to: String(row.to_id),
              user: `${row.from_prenom} ${row.from_nom}`,
              fromPrenom: row.from_prenom,
              fromNom: row.from_nom,
              text: row.message || '',
              fileUrl: row.file_url || null,
              fileName: row.file_name || null,
              createdAt: row.created_at,
            })
          }
          if (priv.rows.length) cursorPrivate = priv.rows[priv.rows.length - 1].created_at

          // ── Nouveaux commentaires de forum (tous fils confondus) ────────────
          const comments = await pool.query(
            `SELECT c.id, c._parent_id AS discussion_id, c.message, c.created_at,
                    a.id AS auteur_id, a.prenom, a.nom
             FROM "discussions_commentaires" c
             JOIN "alumni" a ON a.id = c.auteur_id
             WHERE c.created_at > $1
             ORDER BY c.created_at ASC LIMIT 50`,
            [cursorComments]
          )
          for (const row of comments.rows) {
            send({
              type: 'forum-comment',
              discussionId: String(row.discussion_id),
              comment: {
                id: String(row.id),
                message: row.message,
                createdAt: row.created_at,
                auteur: { id: String(row.auteur_id), prenom: row.prenom, nom: row.nom },
              },
            })
          }
          if (comments.rows.length) cursorComments = comments.rows[comments.rows.length - 1].created_at

          // ── Nouveaux sujets de forum ─────────────────────────────────────────
          const threads = await pool.query(
            `SELECT d.id, d.titre, d.contenu, d.categorie, d.created_at,
                    a.id AS auteur_id, a.prenom, a.nom
             FROM "discussions" d
             JOIN "alumni" a ON a.id = d.auteur_id
             WHERE d.created_at > $1
             ORDER BY d.created_at ASC LIMIT 20`,
            [cursorThreads]
          )
          for (const row of threads.rows) {
            send({
              type: 'forum-thread',
              discussion: {
                id: String(row.id),
                titre: row.titre,
                contenu: row.contenu,
                categorie: row.categorie,
                createdAt: row.created_at,
                auteur: { id: String(row.auteur_id), prenom: row.prenom, nom: row.nom },
              },
            })
          }
          if (threads.rows.length) cursorThreads = threads.rows[threads.rows.length - 1].created_at
        } catch (e) {
          console.error('[SSE poll]', e)
        }
      }

      send({ type: 'connected' })
      pushPresence()
      const interval = setInterval(tick, POLL_INTERVAL_MS)

      // Se referme proprement avant la limite Vercel ; le client se reconnecte.
      const selfClose = setTimeout(() => {
        send({ type: 'reconnect' })
        closed = true
        clearInterval(interval)
        try { controller.close() } catch {}
      }, SELF_CLOSE_MS)

      const cleanup = () => {
        closed = true
        clearInterval(interval)
        clearTimeout(selfClose)
      }

      req.signal?.addEventListener('abort', cleanup)
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}

// ─── POST : envoi d'un message public (modération + persistance) ─────────────
// Les messages privés passent désormais par /api/mp et les commentaires de forum
// par /api/forum — cette route ne gère plus que le chat public.
export async function POST(req: NextRequest) {
  const payload = await getPayload({ config: configPromise })

  try {
    const body = await req.json()
    if (body?.type !== 'msg-public') {
      return NextResponse.json({ error: 'Type de message non supporté' }, { status: 400 })
    }

    const user = await getUserFromCookie(req, payload.secret)
    if (!user) {
      return NextResponse.json({ error: 'Vous devez être connecté pour envoyer un message.' }, { status: 401 })
    }

    const validation = validateMessage(body.text)
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    // ✅ Le nom affiché est dérivé du JWT vérifié, jamais de ce que le client envoie
    // (auparavant un utilisateur connecté pouvait usurper n'importe quel nom affiché).
    const alumniUser = await payload.findByID({ collection: 'alumni', id: user.id }).catch(() => null) as any
    const displayPrenom = alumniUser?.prenom || 'Membre'
    const displayNom = alumniUser?.nom || 'ENC'
    const time = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })

    const saved = await payload.create({
      collection: 'public-messages',
      overrideAccess: true,
      data: {
        user: `${displayPrenom} ${displayNom}`,
        text: body.text.trim(),
        time,
        from: user.id,
      },
    })

    return NextResponse.json({ success: true, doc: saved })
  } catch (err: any) {
    console.error('[POST /api/chat/stream]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
