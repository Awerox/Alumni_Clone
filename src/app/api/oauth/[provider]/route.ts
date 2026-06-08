// app/api/oauth/[provider]/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider } = await params

  // 🎯 ALIGNEMENT STRICT AVEC GOOGLE CLOUD
  // Si on tourne sur Vercel en prod, on force l'URL exacte validée chez Google. Sinon, localhost.
  const baseUrl = process.env.NODE_ENV === 'production'
    ? 'https://alumni-clone.vercel.app'
    : 'http://localhost:3000'

  if (provider === 'google') {
    const authParams = new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      redirect_uri: `${baseUrl}/api/oauth/google/callback`,
      response_type: 'code',
      scope: 'openid email profile',
      access_type: 'offline',
      prompt: 'select_account',
    })
    return NextResponse.redirect(
      `https://accounts.google.com/o/oauth2/v2/auth?${authParams}`
    )
  }

  if (provider === 'linkedin') {
    const authParams = new URLSearchParams({
      response_type: 'code',
      client_id: process.env.LINKEDIN_CLIENT_ID!,
      redirect_uri: `${baseUrl}/api/oauth/linkedin/callback`,
      scope: 'openid profile email',
    })
    return NextResponse.redirect(
      `https://www.linkedin.com/oauth/v2/authorization?${authParams}`
    )
  }

  return NextResponse.redirect(new URL('/login?error=unknown_provider', req.url))
}