// app/api/chat/stream/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { verify } from 'jsonwebtoken'

type ClientConnection = {
  id: string
  name: string
  prenom: string
  nom: string
  controller: ReadableStreamDefaultController
}

let activeClients: ClientConnection[] = []

// ─── Constantes de modération ─────────────────────────────────────────────────
const MAX_MESSAGE_LENGTH = 500

// Liste de mots interdits (insensible à la casse, partielle)
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
    if (lower.includes(normalizedWord)) {
      return { banned: true, word }
    }
  }
  return { banned: false }
}

function validateMessage(text: string): { valid: boolean; error?: string } {
  if (!text || !text.trim()) {
    return { valid: false, error: 'Le message ne peut pas être vide.' }
  }
  if (text.trim().length > MAX_MESSAGE_LENGTH) {
    return { valid: false, error: `Message trop long (max ${MAX_MESSAGE_LENGTH} caractères).` }
  }
  const { banned, word } = containsBannedWord(text)
  if (banned) {
    return { valid: false, error: `Message refusé : contenu inapproprié.` }
  }
  return { valid: true }
}

// ─── Vérification du token JWT ────────────────────────────────────────────────
async function getUserFromToken(req: NextRequest | Request, secret: string): Promise<any | null> {
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

// ─── SSE : connexion en écoute ─────────────────────────────────────────────────
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const userId = searchParams.get('userId')
  const userName = searchParams.get('name') || 'Anonyme'

  if (!userId) {
    return new Response('Missing userId', { status: 400 })
  }

  const nameParts = decodeURIComponent(userName).split(' ')
  const prenom = nameParts[0] || ''
  const nom = nameParts.slice(1).join(' ') || ''

  const stream = new ReadableStream({
    start(controller) {
      const newClient: ClientConnection = {
        id: userId,
        name: decodeURIComponent(userName),
        prenom,
        nom,
        controller,
      }
      activeClients.push(newClient)
      broadcastPresence()

      const interval = setInterval(() => {
        try {
          controller.enqueue(new TextEncoder().encode(': keepalive\n\n'))
        } catch {
          clearInterval(interval)
        }
      }, 15000)

      req.signal.addEventListener('abort', () => {
        clearInterval(interval)
        activeClients = activeClients.filter((c) => c.id !== userId)
        broadcastPresence()
      })
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keepalive',
    },
  })
}

// ─── POST : envoi d'un message ────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const payload = await getPayload({ config: configPromise })

  try {
    const body = await req.json()
    const { type, text } = body

    // ── Vérification authentification pour msg-public et msg-prive ────────────
    if (type === 'msg-public' || type === 'msg-prive') {
      const user = await getUserFromToken(req, payload.secret)

      if (!user) {
        return NextResponse.json(
          { error: 'Vous devez être connecté pour envoyer un message.' },
          { status: 401 }
        )
      }

      // ── Validation du contenu ────────────────────────────────────────────────
      const validation = validateMessage(text)
      if (!validation.valid) {
        return NextResponse.json(
          { error: validation.error },
          { status: 400 }
        )
      }

      // ── Vérification cohérence : l'expéditeur doit correspondre au token ────
      if (type === 'msg-prive') {
        if (String(body.from) !== String(user.id)) {
          return NextResponse.json(
            { error: 'Expéditeur invalide.' },
            { status: 403 }
          )
        }
      }

      if (type === 'msg-public') {
        if (body.from && String(body.from) !== String(user.id)) {
          return NextResponse.json(
            { error: 'Expéditeur invalide.' },
            { status: 403 }
          )
        }
      }
    }

    // ── Sauvegarde BDD pour les messages publics ──────────────────────────────
    if (type === 'msg-public') {
      try {
        await (payload.create as any)({
          collection: 'public-messages',
          data: {
            user: body.user,
            text: body.text,
            time: body.time,
            from: body.from || undefined,
          },
        })
      } catch (dbErr) {
        console.error('[SSE] Erreur écriture message public:', dbErr)
      }
    }

    // ── Distribution SSE ──────────────────────────────────────────────────────
    const encodedData = new TextEncoder().encode(`data: ${JSON.stringify(body)}\n\n`)

    activeClients.forEach((client) => {
      try {
        if (type === 'msg-prive') {
          if (client.id === body.to || client.id === body.from) {
            client.controller.enqueue(encodedData)
          }
        } else {
          client.controller.enqueue(encodedData)
        }
      } catch {
        // Client déconnecté silencieusement
      }
    })

    return NextResponse.json({ success: true })

  } catch (err: any) {
    console.error('[SSE] Erreur POST:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

function broadcastPresence() {
  const users = activeClients.map((c) => ({
    id: c.id,
    name: c.name,
    prenom: c.prenom,
    nom: c.nom,
  }))
  broadcast({ type: 'presence-full', users })
}

function broadcast(data: any) {
  const encodedData = new TextEncoder().encode(`data: ${JSON.stringify(data)}\n\n`)
  activeClients.forEach((client) => {
    try {
      client.controller.enqueue(encodedData)
    } catch {}
  })
}