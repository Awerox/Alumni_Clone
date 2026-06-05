// app/api/oauth/[provider]/callback/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'

interface OAuthUserData {
  email: string
  prenom: string
  nom: string
  providerId: string
  avatarUrl: string
}

function normalizeName(given?: string, family?: string, full?: string): { prenom: string; nom: string } {
  const parts = full?.trim().split(' ') ?? []
  const prenom = (given?.trim() || parts[0] || 'Prénom').trim()
  const nom = (family?.trim() || parts.slice(1).join(' ') || parts[0] || 'Nom').trim()
  return {
    prenom: prenom || 'Prénom',
    nom: nom || 'Nom',
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
    throw new Error(`Google token exchange failed: ${tokenData.error_description ?? tokenData.error}`)
  }

  const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  })

  const u = await userRes.json()
  if (!u.email) throw new Error('Google: email manquant dans userinfo')

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
    throw new Error(`LinkedIn token exchange failed: ${tokenData.error_description ?? tokenData.error}`)
  }

  const userRes = await fetch('https://api.linkedin.com/v2/userinfo', {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  })

  const u = await userRes.json()
  if (!u.email) throw new Error('LinkedIn: email manquant dans userinfo')

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

function buildAuthResponse(token: string, redirectTo: string): NextResponse {
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body><script>window.location.replace('${redirectTo}');</script></body></html>`

  const response = new NextResponse(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })

  // Injection propre du cookie de session pour le client
  response.cookies.set('payload-alumni-token', token, {
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 jours
  })

  return response
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider } = await params
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  const oauthError = searchParams.get('error')
  
  // Utilisation d'une sécurité si NEXT_PUBLIC_SERVER_URL est mal configuré au build
  const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || new URL(req.url).origin

  if (oauthError || !code) {
    return NextResponse.redirect(new URL('/login?error=auth_cancelled', req.url))
  }

  const payload = await getPayload({ config: configPromise })

  try {
    // ── 1. Récupération des données utilisateur ───────────────────────────────
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

    let targetUser = null
    let isLinkingProcess = false

    // ── 2. Reconnaissance de session active ───────────────────────────────────
    const tokenCookie = req.cookies.get('payload-alumni-token')?.value
    if (tokenCookie) {
      try {
        const session = await payload.auth({ headers: req.headers }) as any
        if (session?.user && session.collection === 'alumni') {
          console.log(`[OAuth] Association détectée pour Alumni ID: ${session.user.id}`)
          targetUser = await payload.findByID({ collection: 'alumni', id: session.user.id })
          isLinkingProcess = true
        }
      } catch (e) {
        console.log('[OAuth] Échec décodage session, repli sur login standard:', e)
      }
    }

    // ── 3. Recherche du compte existant ───────────────────────────────────────
    if (!targetUser) {
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
      targetUser = userQuery.docs[0] ?? null
    }

    const isNewUser = !targetUser

    // ── 4. Avatar ─────────────────────────────────────────────────────────────
    let savedMediaId: string | null = null
    if (avatarUrl && (!targetUser || !targetUser.photo)) {
      savedMediaId = await uploadAvatar(payload, avatarUrl, prenom, nom, providerId)
    }

    const photoToAssign = targetUser?.photo
      ? (typeof targetUser.photo === 'object' ? String(targetUser.photo.id) : String(targetUser.photo))
      : (savedMediaId ?? null)

    // ── 5. Création ou mise à jour du compte ──────────────────────────────────
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
        id: targetUser.id,
        overrideAccess: true,
        data: {
          [fieldToMatch]: providerId,
          password: stablePassword,
          photo: photoToAssign ? Number(photoToAssign) : null,
        },
      })
    }

    // ── 6. Login via l'API Interne de Payload (Plus besoin de fetch API !) ───
    const loginResult = await payload.login({
      collection: 'alumni',
      data: {
        email: targetUser.email,
        password: stablePassword,
      },
    })

    if (!loginResult.token) {
      throw new Error("Impossible de générer le token via Payload local login")
    }

    const token = loginResult.token

    // ── 7. Redirection finale ─────────────────────────────────────────────────
    let redirectTo = '/'
    if (isLinkingProcess) {
      redirectTo = '/settings?success=linked'
    } else if (isNewUser) {
      redirectTo = '/onboarding'
    }

    return buildAuthResponse(token, redirectTo)

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error(`[OAuth/${provider}] Erreur fatale:`, message)
    const errorParam = encodeURIComponent(message.slice(0, 100))
    return NextResponse.redirect(new URL(`/login?error=oauth_error&detail=${errorParam}`, req.url))
  }
}