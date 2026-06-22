// app/api/mp/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { verify } from 'jsonwebtoken'

async function getUserFromToken(req: NextRequest, secret: string): Promise<any | null> {
  const token =
    req.cookies.get('payload-alumni-token')?.value ||
    req.cookies.get('payload-token')?.value
  if (!token) return null
  try {
    const decoded = verify(token, secret) as any
    if (decoded?.collection === 'alumni' && decoded?.id) return decoded
    return null
  } catch { return null }
}

// GET /api/mp?with=<alumniId>  → historique d'une conversation
// GET /api/mp?all=1             → toutes les conversations (dernier message par contact)
export async function GET(req: NextRequest) {
  const payload = await getPayload({ config: configPromise })
  const user = await getUserFromToken(req, payload.secret)
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const withId = searchParams.get('with')
  const all = searchParams.get('all')
  const myId = Number(user.id)

  // ── GET all=1 : tous les messages impliquant cet utilisateur ──────────
  if (all === '1') {
    try {
      const result = await payload.find({
        collection: 'direct-messages',
        overrideAccess: true,
        where: {
          or: [
            { from: { equals: myId } },
            { to: { equals: myId } },
          ],
        },
        sort: '-createdAt',
        limit: 500,
        depth: 1,
      })
      return NextResponse.json({ docs: result.docs })
    } catch (err: any) {
      return NextResponse.json({ error: err.message }, { status: 500 })
    }
  }

  // ── GET ?with=ID : historique d'une conversation ──────────────────────
  if (!withId) return NextResponse.json({ error: 'Paramètre "with" manquant' }, { status: 400 })

  const otherId = Number(withId)
  try {
    const result = await payload.find({
      collection: 'direct-messages',
      overrideAccess: true,
      where: {
        or: [
          { and: [{ from: { equals: myId } }, { to: { equals: otherId } }] },
          { and: [{ from: { equals: otherId } }, { to: { equals: myId } }] },
        ],
      },
      sort: 'createdAt',
      limit: 100,
      depth: 1,
    })
    return NextResponse.json({ docs: result.docs })
  } catch (err: any) {
    console.error('[GET /api/mp]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// POST /api/mp
export async function POST(req: NextRequest) {
  const payload = await getPayload({ config: configPromise })
  const user = await getUserFromToken(req, payload.secret)
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  try {
    const { to, message, fileId } = await req.json()
    if (!to) return NextResponse.json({ error: 'Destinataire manquant' }, { status: 400 })
    if (!message && !fileId) return NextResponse.json({ error: 'Message ou fichier requis' }, { status: 400 })

    const fromId = Number(user.id)
    const toId = Number(to)

    const toAlumni = await payload.findByID({ collection: 'alumni', id: toId }).catch(() => null)
    if (!toAlumni) return NextResponse.json({ error: 'Destinataire introuvable' }, { status: 400 })

    const savedMsg = await payload.create({
      collection: 'direct-messages',
      overrideAccess: true,
      data: {
        from: fromId,
        to: toId,
        message: message || '',
        ...(fileId ? { file: Number(fileId) } : {}),
      },
    })

    // ✅ Plus besoin de notifier manuellement /api/chat/stream : le flux SSE du
    // destinataire interroge directement la table "direct-messages" en base, ce qui
    // est fiable même quand l'expéditeur et le destinataire sont sur des instances
    // serverless différentes (contrairement à l'ancien push en mémoire).
    return NextResponse.json({ success: true, doc: savedMsg })
  } catch (err: any) {
    console.error('[POST /api/mp]', err)
    return NextResponse.json({ error: err.message, details: err?.data }, { status: 500 })
  }
}