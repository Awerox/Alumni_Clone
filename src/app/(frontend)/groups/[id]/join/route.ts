// src/app/api/groups/[id]/join/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { verify } from 'jsonwebtoken'

async function getUser(req: NextRequest, secret: string) {
  const token = req.cookies.get('payload-alumni-token')?.value || req.cookies.get('payload-token')?.value
  if (!token) return null
  try { const d = verify(token, secret) as any; return d?.collection === 'alumni' ? d : null } catch { return null }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const payload = await getPayload({ config: configPromise })
  const user = await getUser(req, payload.secret)
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  const group = await payload.findByID({ collection: 'groups', id, depth: 0 }) as any
  if (!group?.isPublic) return NextResponse.json({ error: 'Groupe privé' }, { status: 403 })
  const userIdNum = Number(user.id)
  const current = (group.membres ?? []).map((m: any) => typeof m === 'object' ? m.id : m)
  if (!current.map(String).includes(String(userIdNum))) {
    await payload.update({ collection: 'groups', id, overrideAccess: true, data: { membres: [...current, userIdNum] } })
  }
  return NextResponse.json({ success: true })
}