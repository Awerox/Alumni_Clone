// app/api/forum/route.ts
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

export async function POST(req: NextRequest) {
  const payload = await getPayload({ config: configPromise })
  const user = await getUserFromToken(req, payload.secret)

  if (!user) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  try {
    const { discussionId, message } = await req.json()
    if (!discussionId || !message || !String(message).trim()) {
      return NextResponse.json({ error: 'Message manquant' }, { status: 400 })
    }

    const discussion = await payload.findByID({ collection: 'discussions', id: discussionId, depth: 0 }).catch(() => null)
    if (!discussion) return NextResponse.json({ error: 'Discussion introuvable' }, { status: 404 })

    const pool = (payload.db as any).pool
    const parentId = Number(discussionId)
    const authorId = Number(user.id)
    const text = String(message).trim()

    // ✅ INSERT direct dans la table enfant du champ array "commentaires", au lieu de
    // payload.update() qui relisait puis réécrivait TOUT le tableau (perte de commentaires
    // possible en cas d'écritures concurrentes + coût croissant avec la taille du fil).
    const result = await pool.query(
      `INSERT INTO "discussions_commentaires" ("_order", "_parent_id", "auteur_id", "message", "created_at")
       VALUES ((SELECT COALESCE(MAX("_order"), -1) + 1 FROM "discussions_commentaires" WHERE "_parent_id" = $1), $1, $2, $3, now())
       RETURNING *`,
      [parentId, authorId, text]
    )

    const auteur = await payload.findByID({ collection: 'alumni', id: authorId, depth: 0 }).catch(() => null) as any

    return NextResponse.json({
      success: true,
      comment: {
        id: String(result.rows[0].id),
        message: text,
        createdAt: result.rows[0].created_at,
        auteur: auteur ? { id: String(auteur.id), prenom: auteur.prenom, nom: auteur.nom } : { id: String(authorId), prenom: '?', nom: '' },
      },
    })
  } catch (err: any) {
    console.error('[POST /api/forum]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
