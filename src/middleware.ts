import { NextRequest, NextResponse } from 'next/server'

export function middleware(req: NextRequest) {
  // ⚠️ Ne pas interférer avec les uploads multipart
  const contentType = req.headers.get('content-type') || ''
  if (contentType.includes('multipart/form-data')) {
    return NextResponse.next()
  }

  const response = NextResponse.next()
  const alumniToken = req.cookies.get('payload-alumni-token')?.value
  const nativeToken = req.cookies.get('payload-token')?.value

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