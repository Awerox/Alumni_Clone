// app/api/oauth/[provider]/callback/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'

// ─── Types ────────────────────────────────────────────────────────────────────
interface OAuthUserData {
  email: string
  prenom: string
  nom: string
  providerId: string
  avatarUrl: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function normalizeName(given?: string, family?: string, full?: string): { prenom: string; nom: string } {
  const parts = full?.trim().split(' ') ?? []
  return {
    prenom: (given?.trim() || parts[0] || 'Prénom').trim() || 'Prénom',
    nom: (family?.trim() || parts.slice(1).join(' ') || parts[0] || 'Nom').trim() || 'Nom',
  }
}

async function fetchGoogleUser(code: string, baseUrl: string): Promise<OAuthUserData> {
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: `${baseUrl}/api/oauth/google/callback`,
      grant_type: 'authorization_code',
    }),
  })
  const tokenData = await tokenRes.json()
  if (!tokenData.access_token) {
    throw new Error(`Google token failed: ${tokenData.error_description ?? tokenData.error}`)
  }
  const u = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  }).then(r => r.json())
  if (!u.email) throw new Error('Google: email manquant')
  const { prenom, nom } = normalizeName(u.given_name, u.family_name, u.name)
  return { email: u.email, prenom, nom, providerId: u.sub, avatarUrl: u.picture || '' }
}

async function fetchLinkedInUser(code: string, baseUrl: string): Promise<OAuthUserData> {
  const tokenRes = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.LINKEDIN_CLIENT_ID!,
      client_secret: process.env.LINKEDIN_CLIENT_SECRET!,
      redirect_uri: `${baseUrl}/api/oauth/linkedin/callback`,
      grant_type: 'authorization_code',
    }),
  })
  const tokenData = await tokenRes.json()
  if (!tokenData.access_token) {
    throw new Error(`LinkedIn token failed: ${tokenData.error_description ?? tokenData.error}`)
  }
  const u = await fetch('https://api.linkedin.com/v2/userinfo', {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  }).then(r => r.json())
  if (!u.email) throw new Error('LinkedIn: email manquant')
  const { prenom, nom } = normalizeName(u.given_name, u.family_name, u.name)
  return { email: u.email, prenom, nom, providerId: u.sub, avatarUrl: u.picture || '' }
}

async function uploadAvatar(
  payload: Awaited<ReturnType<typeof getPayload>>,
  avatarUrl: string,
  prenom: string,
  nom: string,
  providerId: string,
): Promise<string | null> {
  try {
    const res = await fetch(avatarUrl)
    if (!res.ok) return null
    const buffer = Buffer.from(await res.arrayBuffer())
    const uploaded = await payload.create({
      collection: 'media',
      overrideAccess: true,
      data: { alt: `Photo de profil de ${prenom} ${nom}` },
      file: {
        data: buffer,
        name: `oauth-avatar-${providerId}.jpg`,
        mimetype: 'image/jpeg',
        size: buffer.length,
      },
    })
    return String(uploaded.id)
  } catch {
    return null
  }
}

function buildStablePassword(providerId: string): string {
  const secret = process.env.PAYLOAD_SECRET?.slice(0, 8) ?? 'fallback'
  return `OA-${providerId}-${secret}`
}

// 🎯 Génération JWT directe — compatible Vercel (pas de fetch interne)
// Payload CMS v3 utilise exactement ce format HS256
async function generatePayloadJWT(
  userId: string,
  email: string,
  secret: string,
): Promise<string> {
  const now = Math.floor(Date.now() / 1000)

  // Encodage Base64URL propre pour chaque partie
  const toB64url = (input: Uint8Array): string =>
    btoa(String.fromCharCode(...input))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '')

  const enc = new TextEncoder()

  const headerB64 = toB64url(enc.encode(JSON.stringify({ alg: 'HS256', typ: 'JWT' })))
  const payloadB64 = toB64url(enc.encode(JSON.stringify({
    id: userId,
    collection: 'alumni',
    email,
    iat: now,
    exp: now + 60 * 60 * 24 * 7, // 7 jours
  })))

  const signingInput = `${headerB64}.${payloadB64}`

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, enc.encode(signingInput))
  const sigB64 = toB64url(new Uint8Array(signature))

  return `${signingInput}.${sigB64}`
}

// ─── Handler principal ────────────────────────────────────────────────────────
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider } = await params
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  const oauthError = searchParams.get('error')

  // Fallback sur l'origin de la requête si NEXT_PUBLIC_SERVER_URL n'est pas défini
  const baseUrl = (process.env.NEXT_PUBLIC_SERVER_URL || new URL(req.url).origin).replace(/\/$/, '')

  if (oauthError || !code) {
    return NextResponse.redirect(new URL('/login?error=auth_cancelled', req.url))
  }

  const payload = await getPayload({ config: configPromise })

  try {
    // ── 1. Données utilisateur depuis le fournisseur ──────────────────────────
    let userData: OAuthUserData
    if (provider === 'google') {
      userData = await fetchGoogleUser(code, baseUrl)
    } else if (provider === 'linkedin') {
      userData = await fetchLinkedInUser(code, baseUrl)
    } else {
      return NextResponse.redirect(new URL('/login?error=unknown_provider', req.url))
    }

    const { email, prenom, nom, providerId, avatarUrl } = userData
    const fieldToMatch = provider === 'google' ? 'subGoogle' : 'subLinkedin'
    const stablePassword = buildStablePassword(providerId)

    // ── 2. Recherche du compte existant ───────────────────────────────────────
    let userQuery = await payload.find({
      collection: 'alumni',
      where: { [fieldToMatch]: { equals: providerId } },
      limit: 1,
    })
    if (userQuery.docs.length === 0) {
      userQuery = await payload.find({
        collection: 'alumni',
        where: { email: { equals: email } },
        limit: 1,
      })
    }

    let targetUser = userQuery.docs[0] ?? null
    const isNewUser = !targetUser

    // ── 3. Avatar ─────────────────────────────────────────────────────────────
    let savedMediaId: string | null = null
    if (avatarUrl && (!targetUser || !targetUser.photo)) {
      savedMediaId = await uploadAvatar(payload, avatarUrl, prenom, nom, providerId)
    }

    const photoToAssign = targetUser?.photo
      ? (typeof targetUser.photo === 'object'
          ? Number((targetUser.photo as any).id)
          : Number(targetUser.photo))
      : (savedMediaId ? Number(savedMediaId) : null)

    // ── 4. Création ou mise à jour ────────────────────────────────────────────
    if (isNewUser) {
      targetUser = await payload.create({
        collection: 'alumni',
        overrideAccess: true,
        data: {
          email, prenom, nom,
          password: stablePassword,
          statut: 'etudiant',
          [fieldToMatch]: providerId,
          photo: savedMediaId ? Number(savedMediaId) : null,
        },
      })
    } else {
      targetUser = await payload.update({
        collection: 'alumni',
        id: targetUser!.id,
        overrideAccess: true,
        data: {
          [fieldToMatch]: providerId,
          password: stablePassword,
          photo: photoToAssign,
        },
      })
    }

    // ── 5. Génération JWT sans fetch interne (Vercel-safe) ────────────────────
    const token = await generatePayloadJWT(
      String(targetUser.id),
      targetUser.email,
      payload.secret,
    )

    // ── 6. Réponse avec cookie ────────────────────────────────────────────────
    const redirectTo = isNewUser ? '/onboarding' : '/'
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body><script>window.location.replace('${redirectTo}');</script></body></html>`

    const response = new NextResponse(html, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })

    response.cookies.set('payload-alumni-token', token, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
    })

    return response

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error(`[OAuth/${provider}] Erreur:`, message)
    return NextResponse.redirect(
      new URL(`/login?error=oauth_error&detail=${encodeURIComponent(message.slice(0, 100))}`, req.url)
    )
  }
}