// src/app/api/evenements/[id]/participate/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { verify } from 'jsonwebtoken'

async function getUser(req: NextRequest, secret: string) {
  const token = req.cookies.get('payload-alumni-token')?.value || req.cookies.get('payload-token')?.value
  if (!token) return null
  try { const d = verify(token, secret) as any; return d?.id ? d : null } catch { return null }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const payload = await getPayload({ config: configPromise })
    const user = await getUser(req, payload.secret)
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const { join } = await req.json()
    const evt = await payload.findByID({ collection: 'evenements', id, depth: 0 }) as any
    if (!evt) return NextResponse.json({ error: 'Événement introuvable' }, { status: 404 })

    const current = (evt.participants || []).map((p: any) => typeof p === 'object' ? p.id : p)
    const userId = Number(user.id)

    const pool = (payload.db as any).pool

    if (join) {
      if (!current.map(String).includes(String(userId))) {
        // Insertion directe dans la table de relation hasMany
        await pool.query(
          `INSERT INTO "evenements_rels" ("parent_id", "path", "alumni_id", "order")
           VALUES ($1, 'participants', $2, (SELECT COALESCE(MAX("order"), 0) + 1 FROM "evenements_rels" WHERE "parent_id" = $1 AND "path" = 'participants'))`,
          [Number(id), userId]
        )
      }
    } else {
      await pool.query(
        `DELETE FROM "evenements_rels" WHERE "parent_id" = $1 AND "path" = 'participants' AND "alumni_id" = $2`,
        [Number(id), userId]
      )
    }

    return NextResponse.json({ success: true, participating: join })
  } catch (err: any) {
    console.error('[participate route]', err?.message)
    return NextResponse.json({ error: err?.message }, { status: 500 })
  }
}
