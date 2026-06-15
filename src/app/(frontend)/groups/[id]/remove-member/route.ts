// src/app/api/groups/[id]/remove-member/route.ts
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
  const { memberId } = await req.json()
  if (!memberId) return NextResponse.json({ error: 'memberId requis' }, { status: 400 })
  const group = await payload.findByID({ collection: 'groups', id, depth: 0 }) as any
  if (!group) return NextResponse.json({ error: 'Groupe introuvable' }, { status: 404 })
  const userId = String(user.id)
  const creatorId = typeof group.createur === 'object' ? String(group.createur.id) : String(group.createur ?? '')
  const admins = group.moderateurs ?? []
  const myConfig = admins.find((a: any) => String(typeof a.membre === 'object' ? a.membre.id : a.membre) === userId)
  const isAdmin = (user as any).collection === 'users'
  if (userId !== creatorId && !isAdmin && !myConfig?.canManageMembers) {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
  }
  if (memberId === creatorId) return NextResponse.json({ error: 'Impossible de retirer le créateur' }, { status: 403 })
  const current = (group.membres ?? []).map((m: any) => typeof m === 'object' ? m.id : m)
  const updated = current.filter((mid: any) => String(mid) !== memberId)
  await payload.update({ collection: 'groups', id, overrideAccess: true, data: { membres: updated } })
  return NextResponse.json({ success: true })
}
