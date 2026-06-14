// app/api/alumni/login/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'

export async function POST(req: NextRequest) {
  let payload: any
  try {
    payload = await getPayload({ config: configPromise })
    const body = await req.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { errors: [{ message: 'Email et mot de passe requis' }] },
        { status: 400 }
      )
    }

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

    // ✅ FIX PERF : UPDATE SQL direct + await (pas de transaction orpheline).
    // payload.update() reconstruisait les sous-tables et saturait le pool Neon.
    if (result.user?.id) {
      try {
        await payload.db.drizzle.execute(
          `UPDATE alumni SET last_seen = NOW() WHERE id = ${Number(result.user.id)}`
        )
      } catch (e) {
        console.error('[lastSeen login]', e)
      }
    }

    const response = NextResponse.json({
      token: result.token,
      user: result.user,
    })

    response.cookies.set('payload-alumni-token', result.token, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
    })

    return response
  } catch (err: any) {
    // ✅ FIX : distinguer "mauvais identifiants" d'une vraie erreur serveur (timeout DB).
    // Avant, TOUTE erreur (y compris timeout) renvoyait "Identifiants incorrects".
    const msg = String(err?.message || '')
    const isAuthError =
      msg.toLowerCase().includes('invalid') ||
      msg.toLowerCase().includes('incorrect') ||
      msg.toLowerCase().includes('credential') ||
      msg.toLowerCase().includes('email or password') ||
      err?.status === 401

    if (isAuthError) {
      return NextResponse.json(
        { errors: [{ message: 'Identifiants incorrects' }] },
        { status: 401 }
      )
    }

    console.error('[POST /api/alumni/login] Erreur serveur:', err)
    return NextResponse.json(
      { errors: [{ message: 'Erreur serveur, réessayez dans un instant.' }] },
      { status: 500 }
    )
  }
}