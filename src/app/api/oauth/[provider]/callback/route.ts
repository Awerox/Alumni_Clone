// app/api/oauth/[provider]/callback/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { sign } from 'jsonwebtoken'

interface OAuthUserData {
  email: string
  prenom: string
  nom: string
  providerId: string
  avatarUrl: string
}

function normalizeName(given?: string, family?: string, full?: string) {
  // Nettoyage des valeurs
  const g = given?.trim() || ''
  const f = family?.trim() || ''
  
  // Cas idéal : given_name ET family_name fournis par le provider
  if (g && f) return { prenom: g, nom: f }
  
  // Fallback sur le nom complet
  const parts = (full?.trim() || '').split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    return {
      prenom: parts[0],
      nom: parts.slice(1).join(' '),  // Tout ce qui suit = nom de famille
    }
  }
  if (parts.length === 1) {
    // Un seul mot → prénom uniquement, nom vide plutôt que doublon
    return { prenom: parts[0], nom: '' }
  }
  
  // Fallback ultime
  return { prenom: g || 'Prénom', nom: f || '' }
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
  if (!tokenData.access_token) throw new Error(`Google token failed: ${tokenData.error}`)
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
  if (!tokenData.access_token) throw new Error(`LinkedIn token failed: ${tokenData.error}`)
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
      file: { data: buffer, name: `oauth-avatar-${providerId}.jpg`, mimetype: 'image/jpeg', size: buffer.length },
    })
    return String(uploaded.id)
  } catch { return null }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider } = await params
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  const oauthError = searchParams.get('error')
  const baseUrl = (process.env.NEXT_PUBLIC_SERVER_URL || new URL(req.url).origin).replace(/\/$/, '')

  if (oauthError || !code) {
    return NextResponse.redirect(new URL('/login?error=auth_cancelled', req.url))
  }

  const payload = await getPayload({ config: configPromise })
  // 🎯 Secret brut — utilisé partout de façon cohérente
  const secret = payload.secret

  try {
    // ── 1. Données fournisseur ────────────────────────────────────────────
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

    // ── 2. Recherche du compte ────────────────────────────────────────────
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

    // ── 3. Avatar ─────────────────────────────────────────────────────────
    let savedMediaId: string | null = null
    if (avatarUrl && (!targetUser || !targetUser.photo)) {
      savedMediaId = await uploadAvatar(payload, avatarUrl, prenom, nom, providerId)
    }

    const photoToAssign = targetUser?.photo
      ? (typeof targetUser.photo === 'object'
        ? Number((targetUser.photo as any).id)
        : Number(targetUser.photo))
      : (savedMediaId ? Number(savedMediaId) : null)

    // ── 4. Création ou mise à jour ────────────────────────────────────────
    if (isNewUser) {
      // Nouveau compte OAuth — on crée avec un mot de passe stable
      const stablePassword = `OA-${providerId}-${secret.slice(0, 8)}`
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
      console.log(`[OAuth/${provider}] ✅ Nouveau compte créé id=${targetUser.id}`)
    } else {
      // Compte existant — on lie le provider SANS toucher au mot de passe
      // Cela préserve le mot de passe original de l'utilisateur
      targetUser = await payload.update({
        collection: 'alumni',
        id: targetUser!.id,
        overrideAccess: true,
        data: {
          [fieldToMatch]: providerId,
          // Pas de password ici — on ne l'écrase jamais sur un compte existant
          ...(photoToAssign && !targetUser!.photo ? { photo: photoToAssign } : {}),
        },
      })
      console.log(`[OAuth/${provider}] ✅ Compte existant lié id=${targetUser.id}`)
    }

    // ── 5. Génération JWT avec secret brut ────────────────────────────────
    // On utilise le secret brut directement — cohérent avec /api/alumni/me
    const token = sign(
      {
        id: String(targetUser.id),
        collection: 'alumni',
        email: targetUser.email,
      },
      secret,
      { expiresIn: '7d' },
    )

    console.log(`[OAuth/${provider}] ✅ Token signé pour id=${targetUser.id}`)

    // ── 6. Cookie + redirection ───────────────────────────────────────────
    const redirectTo = isNewUser ? '/onboarding' : '/'
    const response = NextResponse.redirect(new URL(redirectTo, baseUrl))

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