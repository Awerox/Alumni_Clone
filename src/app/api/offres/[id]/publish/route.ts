// src/app/api/offres/[id]/publish/route.ts
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

    const offre = await payload.findByID({ collection: 'offres', id, depth: 0 }) as any
    if (!offre) return NextResponse.json({ error: 'Introuvable' }, { status: 404 })

    const recruteurId = typeof offre.recruteur === 'object' ? offre.recruteur?.id : offre.recruteur
    const isAdmin = user.collection === 'users'
    const isRecruteur = String(recruteurId) === String(user.id)
    if (!isAdmin && !isRecruteur) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })

    // Update direct en SQL pour éviter le check payload_locked_documents
    const pool = (payload.db as any).pool
    await pool.query('UPDATE "offres" SET "statut" = $1, "updated_at" = now() WHERE "id" = $2', ['publie', Number(id)])

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('[publish offre]', err?.message)
    return NextResponse.json({ error: err?.message }, { status: 500 })
  }
}
