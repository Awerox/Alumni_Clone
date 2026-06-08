// src/app/api/alumni/me/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { verify } from 'jsonwebtoken'

export async function GET(req: NextRequest) {
  try {
    const payload = await getPayload({ config: configPromise })

    // ── 1. Cookie OAuth custom (Google/LinkedIn) ──────────────────────────
    const oauthToken = req.cookies.get('payload-alumni-token')?.value
    if (oauthToken) {
      try {
        const decoded = verify(oauthToken, payload.secret) as {
          id: string
          collection: string
        }
        if (decoded.collection === 'alumni') {
          const user = await payload.findByID({
            collection: 'alumni',
            id: decoded.id,
            depth: 1,
          })
          if (user) return NextResponse.json({ user })
        }
      } catch {
        // Token OAuth invalide/expiré, on essaie le cookie natif
      }
    }

    // ── 2. Cookie natif Payload (login email/password) ────────────────────
    // Payload nomme son cookie : payload-token
    const nativeToken = req.cookies.get('payload-token')?.value
    if (nativeToken) {
      try {
        const decoded = verify(nativeToken, payload.secret) as {
          id: string
          collection: string
        }
        if (decoded.collection === 'alumni') {
          const user = await payload.findByID({
            collection: 'alumni',
            id: decoded.id,
            depth: 1,
          })
          if (user) return NextResponse.json({ user })
        }
      } catch {
        // Token natif invalide/expiré
      }
    }

    return NextResponse.json({ user: null }, { status: 401 })

  } catch (err) {
    return NextResponse.json({ user: null }, { status: 401 })
  }
}