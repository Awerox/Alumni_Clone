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

/** Normalise les champs nom/prénom avec fallbacks robustes */
function normalizeName(given?: string, family?: string, full?: string): { prenom: string; nom: string } {
  const parts = full?.trim().split(' ') ?? []
  const prenom = (given?.trim() || parts[0] || 'Prénom').trim()
  const nom = (family?.trim() || parts.slice(1).join(' ') || parts[0] || 'Nom').trim()
  return {
    prenom: prenom || 'Prénom',
    nom: nom || 'Nom',
  }
}

/** Échange le code OAuth Google contre les infos utilisateur */
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

/** Échange le code OAuth LinkedIn contre les infos utilisateur */
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

/** Télécharge et enregistre un avatar distant dans la collection media */
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

/** Construit un mot de passe stable et déterministe pour ce compte OAuth */
function buildStablePassword(providerId: string): string {
  const secret = process.env.PAYLOAD_SECRET?.slice(0, 8) ?? 'fallback'
  return `OA-${providerId}-${secret}`
}

/** Construit la réponse HTML finale avec le cookie Payload recopié */
function buildAuthResponse(rawSetCookie: string | null, token: string, redirectTo: string): NextResponse {
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body><script>window.location.replace('${redirectTo}');</script></body></html>`

  const response = new NextResponse(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })

  if (rawSetCookie) {
    // Recopier exactement le cookie posé par Payload (contient le sid de session)
    response.headers.append('set-cookie', rawSetCookie)
  } else {
    // Fallback : poser le token manuellement
    response.cookies.set('payload-alumni-token', token, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
    })
  }

  return response
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
  const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL!

  // Annulation ou erreur côté fournisseur
  if (oauthError || !code) {
    return NextResponse.redirect(new URL('/login?error=auth_cancelled', req.url))
  }

  const payload = await getPayload({ config: configPromise })

  try {
    // ── 1. Récupération des données utilisateur depuis le fournisseur ─────────
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

    // Fallback par email (compte créé manuellement avec le même email)
    if (userQuery.docs.length === 0) {
      userQuery = await payload.find({
        collection: 'alumni',
        where: { email: { equals: email } },
        limit: 1,
      })
    }

    let targetUser = userQuery.docs[0]
    const isNewUser = !targetUser

    // ── 3. Avatar ─────────────────────────────────────────────────────────────
    let savedMediaId: string | null = null
    if (avatarUrl && (!targetUser || !targetUser.photo)) {
      savedMediaId = await uploadAvatar(payload, avatarUrl, prenom, nom, providerId)
    }

    const photoToAssign = targetUser?.photo
      ? (typeof targetUser.photo === 'object' ? String(targetUser.photo.id) : String(targetUser.photo))
      : (savedMediaId ?? null)

    // ── 4. Création ou mise à jour du compte ──────────────────────────────────
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
  data: {
    [fieldToMatch]: providerId,
    photo: photoToAssign ? Number(photoToAssign) : null,
    password: stablePassword,
  },
})
    }

    // ── 5. Login REST pour obtenir le cookie officiel Payload (avec sid) ──────
    const loginRes = await fetch(`${baseUrl}/api/alumni/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: stablePassword }),
    })

    if (!loginRes.ok) {
      throw new Error(`Login REST échoué (${loginRes.status})`)
    }

    const loginData = await loginRes.json()
    const token: string = loginData.token
    const rawSetCookie = loginRes.headers.get('set-cookie')

    // ── 6. Redirection ────────────────────────────────────────────────────────
    // Nouveau compte → page d'onboarding pour compléter le profil (statut, promo, diplôme)
    // Compte existant → accueil directement
    const redirectTo = isNewUser ? '/onboarding' : '/'

    return buildAuthResponse(rawSetCookie, token, redirectTo)

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error(`[OAuth/${provider}] Erreur:`, message)
    return NextResponse.redirect(new URL('/login?error=oauth_error', req.url))
  }
}