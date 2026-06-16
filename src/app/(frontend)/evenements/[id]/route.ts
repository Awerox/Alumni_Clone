// src/app/api/evenements/[id]/route.ts  (DELETE)
import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { verify } from 'jsonwebtoken'

async function getUser(req: NextRequest, secret: string) {
  const token =
    req.cookies.get('payload-alumni-token')?.value ||
    req.cookies.get('payload-token')?.value
  if (!token) return null
  try { const d = verify(token, secret) as any; return d?.id ? d : null } catch { return null }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const payload = await getPayload({ config: configPromise })
    const user = await getUser(req, payload.secret)
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const evt = await payload.findByID({ collection: 'evenements', id, depth: 0 }) as any
    if (!evt) return NextResponse.json({ error: 'Introuvable' }, { status: 404 })

    const organisateurId = typeof evt.organisateur === 'object' ? evt.organisateur?.id : evt.organisateur
    const isAdmin = user.collection === 'users'
    if (!isAdmin && String(organisateurId) !== String(user.id))
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })

    await payload.delete({ collection: 'evenements', id, overrideAccess: true })
    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('[delete evenement]', err?.message)
    return NextResponse.json({ error: err?.message }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const payload = await getPayload({ config: configPromise })
    const user = await getUser(req, payload.secret)
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const body = await req.json()
    const evt = await payload.findByID({ collection: 'evenements', id, depth: 0 }) as any
    if (!evt) return NextResponse.json({ error: 'Introuvable' }, { status: 404 })

    const organisateurId = typeof evt.organisateur === 'object' ? evt.organisateur?.id : evt.organisateur
    const isAdmin = user.collection === 'users'
    if (!isAdmin && String(organisateurId) !== String(user.id))
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })

    const updated = await payload.update({ collection: 'evenements', id, overrideAccess: true, data: body })
    return NextResponse.json({ success: true, doc: updated })
  } catch (err: any) {
    console.error('[patch evenement]', err?.message)
    return NextResponse.json({ error: err?.message }, { status: 500 })
  }
}