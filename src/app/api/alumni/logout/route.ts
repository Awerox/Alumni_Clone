// src/app/api/alumni/logout/route.ts
import { NextResponse } from 'next/server'

export async function POST() {
  const response = NextResponse.json({ success: true })

  // Supprime le cookie OAuth custom
  response.cookies.set('payload-alumni-token', '', {
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
  })

  // Supprime aussi le cookie natif Payload copié par le middleware
  response.cookies.set('payload-token', '', {
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
  })

  return response
}