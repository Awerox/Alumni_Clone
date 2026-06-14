// app/api/alumni/me/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { verify } from 'jsonwebtoken'

export async function GET(req: NextRequest) {
  try {
    const payload = await getPayload({ config: configPromise })
    const secret = payload.secret

    const token =
      req.cookies.get('payload-alumni-token')?.value ||
      req.cookies.get('payload-token')?.value

    if (!token) {
      return NextResponse.json({ user: null, message: 'No token' }, { status: 401 })
    }

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

    // ✅ FIX PERF : UPDATE SQL direct, ne touche QUE la colonne last_seen.
    // On NE passe PAS par payload.update() qui reconstruit toutes les sous-tables
    // (experiences, formations…) et créait des timeouts + saturation du pool.
    // On await pour ne pas laisser de transaction orpheline sur Vercel serverless.
    try {
      await payload.db.drizzle.execute(
        `UPDATE alumni SET last_seen = NOW() WHERE id = ${Number(decoded.id)}`
      )
    } catch (e) {
      console.error('[lastSeen me]', e)
      // On n'échoue jamais la requête pour un simple lastSeen
    }

    return NextResponse.json({ user })
  } catch (err) {
    console.error('[/api/alumni/me]', err)
    return NextResponse.json({ user: null, message: 'Server error' }, { status: 500 })
  }
}