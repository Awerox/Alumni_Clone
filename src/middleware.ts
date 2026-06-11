// middleware.ts
import { NextRequest, NextResponse } from 'next/server'

// Routes qui nécessitent une connexion
const PROTECTED_PATTERNS = [
  /^\/groups\/new$/,
  /^\/groups\/[^\/]+\/edit$/,
]

export function middleware(req: NextRequest) {
  // ✅ Ne pas interférer avec les uploads multipart
  const contentType = req.headers.get('content-type') || ''
  if (contentType.includes('multipart/form-data')) {
    return NextResponse.next()
  }

  const { pathname } = req.nextUrl
  const alumniToken = req.cookies.get('payload-alumni-token')?.value
  const nativeToken = req.cookies.get('payload-token')?.value
  const isAuthenticated = !!(alumniToken || nativeToken)

  // 🔒 Redirection vers /login si route protégée et non connecté
  if (PROTECTED_PATTERNS.some((p) => p.test(pathname)) && !isAuthenticated) {
    const loginUrl = req.nextUrl.clone()
    loginUrl.pathname = '/login'
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  const response = NextResponse.next()

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
  matcher: [
    // ✅ FIX : exclure les callbacks OAuth du middleware
    // Sans ça, le middleware peut déclencher une 2e requête sur le callback
    // ce qui consomme le code Google une 2e fois → invalid_grant
    '/api/((?!oauth/google/callback|oauth/linkedin/callback).*)',
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}