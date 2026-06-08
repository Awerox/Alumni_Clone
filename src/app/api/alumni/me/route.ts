// src/app/api/alumni/me/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { verify } from 'jsonwebtoken'
import { createHash } from 'crypto'

export async function GET(req: NextRequest) {
  try {
    const payload = await getPayload({ config: configPromise })
    const derivedSecret = createHash('sha256').update(payload.secret).digest('hex').slice(0, 32)

    // ── Cookie OAuth custom (Google/LinkedIn) ─────────────────────────────
    const oauthToken = req.cookies.get('payload-alumni-token')?.value
    if (oauthToken) {
      try {
        const decoded = verify(oauthToken, derivedSecret) as { id: string; collection: string }
        if (decoded.collection === 'alumni') {
          const user = await payload.findByID({ collection: 'alumni', id: decoded.id, depth: 1 })
          if (user) return NextResponse.json({ user })
        }
      } catch {}
    }

    // ── Cookie natif Payload (login email/password) ───────────────────────
    const nativeToken = req.cookies.get('payload-token')?.value
    if (nativeToken) {
      try {
        const decoded = verify(nativeToken, derivedSecret) as { id: string; collection: string }
        if (decoded.collection === 'alumni') {
          const user = await payload.findByID({ collection: 'alumni', id: decoded.id, depth: 1 })
          if (user) return NextResponse.json({ user })
        }
      } catch {}
    }

    return NextResponse.json({ user: null }, { status: 401 })
  } catch {
    return NextResponse.json({ user: null }, { status: 401 })
  }
}