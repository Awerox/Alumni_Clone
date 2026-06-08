import { NextRequest, NextResponse } from 'next/server'

export function middleware(req: NextRequest) {
  const response = NextResponse.next()

  const alumniToken = req.cookies.get('payload-alumni-token')?.value

  // Si on a notre cookie OAuth mais pas le cookie natif Payload,
  // on le copie sous le nom que Payload attend
  if (alumniToken && !req.cookies.get('payload-token')?.value) {
    // Payload lit le cookie nommé d'après le slug de la collection
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