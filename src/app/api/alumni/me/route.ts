// app/api/alumni/me/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { verify } from 'jsonwebtoken'

export async function GET(req: NextRequest) {
  try {
    const payload = await getPayload({ config: configPromise })
    const secret = payload.secret

    // ── Token du cookie OAuth ou login natif ─────────────────────────────
    const token =
      req.cookies.get('payload-alumni-token')?.value ||
      req.cookies.get('payload-token')?.value

    if (!token) {
      return NextResponse.json({ user: null, message: 'No token' }, { status: 401 })
    }

    // Vérifie avec le secret brut — c'est ce que Payload et jsonwebtoken utilisent
    let decoded: any
    try {
      decoded = verify(token, secret)
    } catch {
      return NextResponse.json({ user: null, message: 'Invalid token' }, { status: 401 })
    }

    if (!decoded?.id || decoded?.collection !== 'alumni') {
      return NextResponse.json({ user: null, message: 'Not alumni' }, { status: 401 })
    }

    const user = await payload.findByID({
      collection: 'alumni',
      id: decoded.id,
      depth: 1,
    })

    if (!user) {
      return NextResponse.json({ user: null, message: 'User not found' }, { status: 404 })
    }

    // ✅ Mettre à jour lastSeen en arrière-plan (ne bloque pas la réponse)
    payload.update({
      collection: 'alumni',
      id: decoded.id,
      overrideAccess: true,
      data: { lastSeen: new Date().toISOString() } as any,
    }).catch((e: any) => console.error('[lastSeen update]', e))

    return NextResponse.json({ user })
  } catch (err) {
    console.error('[/api/alumni/me]', err)
    return NextResponse.json({ user: null, message: 'Server error' }, { status: 500 })
  }
}