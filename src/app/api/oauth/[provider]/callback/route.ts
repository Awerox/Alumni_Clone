// app/api/oauth/[provider]/callback/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { sign } from 'jsonwebtoken'
import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || '',
  api_key:    process.env.CLOUDINARY_API_KEY || '',
  api_secret: process.env.CLOUDINARY_API_SECRET || '',
})

interface OAuthUserData {
  email: string
  prenom: string
  nom: string
  providerId: string
  avatarUrl: string
}

// ✅ FIX normalizeName : ne jamais retourner nom vide
function normalizeName(given?: string, family?: string, full?: string) {
  const g = given?.trim() || ''
  const f = family?.trim() || ''
  if (g && f) return { prenom: g, nom: f }
  const parts = (full?.trim() || '').split(/\s+/).filter(Boolean)
  if (parts.length >= 2) return { prenom: parts[0], nom: parts.slice(1).join(' ') }
  if (parts.length === 1) return { prenom: parts[0], nom: parts[0] } // doublon plutôt que vide
  return { prenom: 'Prénom', nom: 'Nom' }
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

// ✅ FIX uploadAvatar : utilise Cloudinary + SQL direct comme le reste du projet
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
    const timestamp = Date.now()
    const filename = `oauth-avatar-${providerId}-${timestamp}.jpg`
    const publicId = `media/oauth-avatar-${providerId}-${timestamp}`

    const cloudinaryUrl = await new Promise<string>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { resource_type: 'auto', public_id: publicId, overwrite: false },
        (error, result) => {
          if (error || !result) return reject(error ?? new Error('Cloudinary upload failed'))
          resolve(result.secure_url)
        },
      )
      stream.end(buffer)
    })

    const alt = `Photo de profil de ${prenom} ${nom}`.replace(/'/g, "''")
    const result = await payload.db.drizzle.execute(
      `INSERT INTO media (alt, url, filename, mime_type, filesize, updated_at, created_at)
       VALUES ('${alt}', '${cloudinaryUrl}', '${filename}', 'image/jpeg', ${buffer.length}, NOW(), NOW())
       RETURNING id`
    ) as any
    const row = result.rows?.[0] || result[0]
    return row?.id ? String(row.id) : null
  } catch (e) {
    console.error('[uploadAvatar]', e)
    return null // Ne jamais bloquer le flow OAuth pour une photo
  }
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
      const stablePassword = `OA-${providerId}-${secret.slice(0, 8)}`
      targetUser = await payload.create({
        collection: 'alumni',
        overrideAccess: true,
        data: {
          email,
          prenom,
          nom: nom || prenom, // ✅ jamais vide (required: true dans Alumni.ts)
          password: stablePassword,
          statut: 'etudiant',
          [fieldToMatch]: providerId,
          ...(photoToAssign ? { photo: photoToAssign } : {}),
        },
      })
      console.log(`[OAuth/${provider}] ✅ Nouveau compte créé id=${targetUser.id}`)
    } else {
      targetUser = await payload.update({
        collection: 'alumni',
        id: targetUser!.id,
        overrideAccess: true,
        data: {
          [fieldToMatch]: providerId,
          ...(photoToAssign && !targetUser!.photo ? { photo: photoToAssign } : {}),
        },
      })
      console.log(`[OAuth/${provider}] ✅ Compte existant lié id=${targetUser.id}`)
    }

    // ── 5. JWT ────────────────────────────────────────────────────────────
    const token = sign(
      { id: String(targetUser.id), collection: 'alumni', email: targetUser.email },
      secret,
      { expiresIn: '7d' },
    )

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

    // ✅ Empêcher le cache de rejouer le callback
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate')

    return response

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error(`[OAuth/${provider}] Erreur:`, message)
    return NextResponse.redirect(
      new URL(`/login?error=oauth_error&detail=${encodeURIComponent(message.slice(0, 100))}`, req.url)
    )
  }
}