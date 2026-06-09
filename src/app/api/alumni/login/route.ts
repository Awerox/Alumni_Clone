// app/api/alumni/login/route.ts
// Redirige vers la route native Payload pour le login email/mdp

import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'

export async function POST(req: NextRequest) {
  try {
    const payload = await getPayload({ config: configPromise })
    const body = await req.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { errors: [{ message: 'Email et mot de passe requis' }] },
        { status: 400 }
      )
    }

    // Login via Payload local — pas de fetch interne
    const result = await payload.login({
      collection: 'alumni',
      data: { email, password },
    })

    if (!result.token) {
      return NextResponse.json(
        { errors: [{ message: 'Identifiants incorrects' }] },
        { status: 401 }
      )
    }

    const response = NextResponse.json({
      token: result.token,
      user: result.user,
    })

    // Pose le cookie de session
    response.cookies.set('payload-alumni-token', result.token, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
    })

    return response
  } catch (err: any) {
    console.error('[POST /api/alumni/login]', err)
    return NextResponse.json(
      { errors: [{ message: 'Identifiants incorrects' }] },
      { status: 401 }
    )
  }
}