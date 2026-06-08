// src/app/api/alumni/me/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { verify } from 'jsonwebtoken'

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('payload-alumni-token')?.value

    if (!token) {
      return NextResponse.json({ user: null }, { status: 401 })
    }

    const payload = await getPayload({ config: configPromise })

    // Vérifie et décode le JWT
    const decoded = verify(token, payload.secret) as {
      id: string
      collection: string
      email: string
    }

    if (decoded.collection !== 'alumni') {
      return NextResponse.json({ user: null }, { status: 401 })
    }

    // Récupère les données complètes de l'utilisateur
    const user = await payload.findByID({
      collection: 'alumni',
      id: decoded.id,
      depth: 1, // Pour récupérer la photo (objet avec url)
    })

    if (!user) {
      return NextResponse.json({ user: null }, { status: 404 })
    }

    return NextResponse.json({ user })

  } catch (err) {
    // Token expiré ou invalide
    return NextResponse.json({ user: null }, { status: 401 })
  }
}