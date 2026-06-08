import { NextRequest, NextResponse } from 'next/server'

export function middleware(req: NextRequest) {
  const response = NextResponse.next()

  const alumniToken = req.cookies.get('payload-alumni-token')?.value
  const nativeToken = req.cookies.get('payload-token')?.value

  // Copie le token OAuth vers le cookie natif Payload si absent
  if (alumniToken && !nativeToken) {
    response.cookies.set('payload-token', alumniToken, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    })
  }

  return response
}

export const config = {
  matcher: ['/api/:path*', '/((?!_next/static|_next/image|favicon.ico).*)'],
}