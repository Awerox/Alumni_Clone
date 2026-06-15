// src/app/api/evenements/[id]/participate/route.ts
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

  const { join } = await req.json()
  const evt = await payload.findByID({ collection: 'evenements', id, depth: 0 }) as any
  if (!evt) return NextResponse.json({ error: 'Événement introuvable' }, { status: 404 })

  const current = (evt.participants || []).map((p: any) => typeof p === 'object' ? p.id : p)
  const userId = Number(user.id)

  const updated = join
    ? [...new Set([...current, userId])]
    : current.filter((pid: any) => String(pid) !== String(userId))

  await payload.update({ collection: 'evenements', id, overrideAccess: true, data: { participants: updated } as any })
  return NextResponse.json({ success: true, participating: join })
}