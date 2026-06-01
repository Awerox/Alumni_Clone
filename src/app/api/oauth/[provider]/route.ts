import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider } = await params
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')

  if (!code) {
    return NextResponse.redirect(new URL('/login?error=auth_failed', req.url))
  }

  const payload = await getPayload({ config: configPromise })

  try {
    let email = ''
    let prenom = ''
    let nom = ''
    let providerId = ''
    let avatarExternalUrl = ''

    // ─── CANAL 1 : EXPÉDITION ET REQUÊTE VERS GOOGLE ───
    if (provider === 'google') {
      const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: process.env.GOOGLE_CLIENT_ID!,
          client_secret: process.env.GOOGLE_CLIENT_SECRET!,
          redirect_uri: `${process.env.NEXT_PUBLIC_SERVER_URL}/api/oauth/google/callback`,
          grant_type: 'authorization_code',
        }),
      })
      const tokenData = await tokenRes.json()

      const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      })
      const userData = await userRes.json()
      
      email = userData.email
      prenom = userData.given_name || ''
      nom = userData.family_name || ''
      providerId = userData.sub
      avatarExternalUrl = userData.picture || ''
    } 
    // ─── CANAL 2 : EXPÉDITION ET REQUÊTE VERS LINKEDIN ───
    else if (provider === 'linkedin') {
      const tokenRes = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: process.env.LINKEDIN_CLIENT_ID!,
          client_secret: process.env.LINKEDIN_CLIENT_SECRET!,
          redirect_uri: `${process.env.NEXT_PUBLIC_SERVER_URL}/api/oauth/linkedin/callback`,
          grant_type: 'authorization_code',
        }),
      })
      const tokenData = await tokenRes.json()

      const userRes = await fetch('https://api.linkedin.com/v2/userinfo', {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      })
      const userData = await userRes.json()

      email = userData.email
      prenom = userData.given_name || ''
      nom = userData.family_name || ''
      providerId = userData.sub
      avatarExternalUrl = userData.picture || ''
    }

    if (!email) throw new Error("Impossible de récupérer l'adresse email de l'utilisateur")

    const fieldToMatch = provider === 'google' ? 'subGoogle' : 'subLinkedin'
    
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

    let targetUser = userQuery.docs[0]
    let savedMediaId: any = null

    // 📸 TÉLÉCHARGEMENT ET ENREGISTREMENT EN BASE DE LA PHOTO DE PROFIL EXTERNE
    if (avatarExternalUrl && (!targetUser || !targetUser.photo)) {
      try {
        const imageFetch = await fetch(avatarExternalUrl)
        const imageBlob = await imageFetch.blob()
        const imageBuffer = Buffer.from(await imageBlob.arrayBuffer())

        const uploadedMedia = await payload.create({
          collection: 'media',
          data: {
            alt: `Avatar de ${prenom} ${nom}`,
          },
          file: {
            data: imageBuffer,
            name: `${providerId}-avatar.jpg`,
            mimetype: 'image/jpeg',
            size: imageBuffer.length,
          },
        })
        savedMediaId = uploadedMedia.id
      } catch (imgErr) {
        console.error("Échec du téléchargement de l'avatar social:", imgErr)
      }
    }

    const photoToAssign = targetUser?.photo
      ? (typeof targetUser.photo === 'object' ? targetUser.photo.id : targetUser.photo)
      : (savedMediaId || null)

    // Étape C : Si l'utilisateur n'existe pas, création automatique du compte
    if (!targetUser) {
      targetUser = await payload.create({
        collection: 'alumni',
        data: {
          email,
          prenom,
          nom,
          statut: 'etudiant',
          [fieldToMatch]: providerId,
          photo: savedMediaId || null,
        },
      })
    } else {
      // Si le compte existe, mise à jour
      targetUser = await payload.update({
        collection: 'alumni',
        id: targetUser.id,
        data: { 
          [fieldToMatch]: providerId,
          photo: photoToAssign,
        },
      })
    }

    // 🔐 RE-GÉNÉRATION DU TOKEN COMPATIBLE AVEC LE COOKIE DE PAYLOAD CMS
    // En v3, Payload lit simplement un JWT standard contenant l'ID utilisateur, l'email et la collection.
    // Nous le générons ici via une signature encodée bas niveau compatible avec l'environnement Next.js Edge.
    const secretKey = new TextEncoder().encode(payload.secret)
    const header = b64(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
    
    const payloadData = b64(JSON.stringify({
      id: targetUser.id,
      collection: 'alumni',
      email: targetUser.email,
      exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 7) // 7 jours d'expiration
    }))

    // Signature HMAC-SHA256 native sans aucun module ou package instable à installer
    const cryptoKey = await crypto.subtle.importKey(
      'raw', 
      secretKey, 
      { name: 'HMAC', hash: 'SHA-256' }, 
      false, 
      ['sign']
    )
    const signatureBuffer = await crypto.subtle.sign(
      'HMAC', 
      cryptoKey, 
      new TextEncoder().encode(`${header}.${payloadData}`)
    )
    const signature = b64url(signatureBuffer)
    const token = `${header}.${payloadData}.${signature}`

    const response = NextResponse.redirect(new URL('/', req.url))
    
    // Dépôt du cookie d'authentification crypté
    response.cookies.set(`payload-token`, token, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // Actif 7 jours
    })

    return response

  } catch (err) {
    console.error('Crash lors du callback OAuth:', err)
    return NextResponse.redirect(new URL('/login?error=oauth_error', req.url))
  }
}

// Utilitaires de conversion Base64Url natifs requis pour la signature cryptographique conforme
function b64(str: string) {
  return btoa(unescape(encodeURIComponent(str))).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
}

function b64url(buf: ArrayBuffer) {
  const binary = String.fromCharCode(...new Uint8Array(buf))
  return btoa(binary).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
}