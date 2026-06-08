// src/app/api/alumni/logout/route.ts
import { NextResponse } from 'next/server'

export async function POST() {
  const response = NextResponse.json({ success: true })

  const cookieOptions = {
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: 0,
  }

  response.cookies.set('payload-alumni-token', '', cookieOptions)
  response.cookies.set('payload-token', '', cookieOptions)

  return response
}