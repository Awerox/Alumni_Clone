// app/api/oauth/[provider]/callback/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import jwt from 'jsonwebtoken' // 🎯 INDISPENSABLE : C'est le format natif que Payload attend

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider } = await params
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  const oauthError = searchParams.get('error')

  if (oauthError || !code) {
    return NextResponse.redirect(new URL('/login?error=auth_cancelled', req.url))
  }

  const payload = await getPayload({ config: configPromise })

  try {
    let email = ''
    let prenom = ''
    let nom = ''
    let providerId = ''
    let avatarExternalUrl = ''

    // ─── RÉCUPÉRATION DES DONNÉES OAUTH (GOOGLE / LINKEDIN) ───────────────
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
      if (!tokenData.access_token) throw new Error('Token Google invalide')
      
      const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      })
      const userData = await userRes.json()
      email = userData.email || ''
      prenom = userData.given_name || ''
      nom = userData.family_name || ''
      providerId = userData.sub || ''
      avatarExternalUrl = userData.picture || ''
    } else if (provider === 'linkedin') {
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
      if (!tokenData.access_token) throw new Error('Token LinkedIn invalide')
      
      const userRes = await fetch('https://api.linkedin.com/v2/userinfo', {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      })
      const userData = await userRes.json()
      email = userData.email || ''
      prenom = userData.given_name || ''
      nom = userData.family_name || ''
      providerId = userData.sub || ''
      avatarExternalUrl = userData.picture || ''
    }

    if (!email) throw new Error('Email introuvable via OAuth')

    console.log(`[OAuth Debug] Début du traitement pour : ${email}`)
    const fieldToMatch = provider === 'google' ? 'subGoogle' : 'subLinkedin'

    // ─── 1. RECHERCHE DU COMPTE EXISTANT (ID Réseau PUIS Email) ───────────
    let userQuery = await payload.find({
      collection: 'alumni',
      where: { [fieldToMatch]: { equals: providerId } },
      limit: 1,
    })

    if (userQuery.docs.length === 0) {
      console.log(`[OAuth Debug] Recherche de liaison par email pour : ${email}`)
      userQuery = await payload.find({
        collection: 'alumni',
        where: { email: { equals: email } },
        limit: 1,
      })
    }

    let targetUser = userQuery.docs[0]
    let savedMediaId: any = null

    // ─── 2. TÉLÉCHARGEMENT DE L'AVATAR ────────────────────────────────────
    if (avatarExternalUrl && (!targetUser || !targetUser.photo)) {
      try {
        const imageFetch = await fetch(avatarExternalUrl)
        const imageBuffer = Buffer.from(await (await imageFetch.blob()).arrayBuffer())
        const uploaded = await payload.create({
          collection: 'media',
          overrideAccess: true,
          data: { alt: `Avatar ${prenom} ${nom}` },
          file: { data: imageBuffer, name: `oauth-${providerId}.jpg`, mimetype: 'image/jpeg', size: imageBuffer.length },
        })
        savedMediaId = uploaded.id
      } catch (e) { console.error('[OAuth] Échec upload avatar:', e) }
    }

    const photoToAssign = targetUser?.photo
      ? (typeof targetUser.photo === 'object' ? targetUser.photo.id : targetUser.photo)
      : (savedMediaId || null)

    const randomPassword = `OAuthSystemSecurePass123!-${providerId.slice(0, 5)}`

    // ─── 3. CRÉATION OU MISE À JOUR DU COMPTE ─────────────────────────────
    if (!targetUser) {
      console.log(`[OAuth Debug] Création d'un nouveau compte...`)
      targetUser = await payload.create({
        collection: 'alumni',
        overrideAccess: true,
        data: {
          email,
          prenom,
          nom,
          password: randomPassword,
          statut: 'etudiant',
          [fieldToMatch]: providerId,
          photo: savedMediaId || null,
        },
      })
    } else {
      console.log(`[OAuth Debug] Utilisateur existant (ID: ${targetUser.id}). Mise à jour et liaison...`)
      targetUser = await payload.update({
        collection: 'alumni',
        id: targetUser.id,
        overrideAccess: true,
        data: { 
          [fieldToMatch]: providerId,
          photo: photoToAssign,
        },
      })
    }


    // ─── 4. MIGRATION VERS L'AUTHENTIFICATION OFFICIELLE PAYLOAD V3 ───────
    console.log(`[OAuth Debug] Demande de jeton natif à Payload pour l'ID ${targetUser.id}...`)

    // On utilise la méthode de connexion officielle de Payload.
    // Comme le mot de passe est connu par notre passerelle, Payload va valider
    // l'authentification et fabriquer lui-même le jeton cryptographique exact.
    const loginResult = await payload.login({
      collection: 'alumni',
      overrideAccess: true,
      data: {
        email: targetUser.email,
        password: randomPassword,
      },
    })

    if (!loginResult.token) {
      throw new Error("Le moteur Payload a refusé de générer le jeton de session.")
    }

    // ─── 5. REDIRECTION ET INJECTION DU COOKIE HOMOLOGUÉ ──────────────────
    // On utilise un rendu HTML brut scripté pour forcer le navigateur à casser son cache
    const response = new NextResponse(
      `
      <script>
        // On force un rechargement complet de l'accueil pour rafraîchir la Navbar
        window.location.replace("/?refresh=${Date.now()}");
      </script>
      `,
      { headers: { 'Content-Type': 'text/html' } }
    )
    
    // On dépose le cookie officiel avec le nom configuré dans ton payload.config.ts
    response.cookies.set('payload-alumni-token', loginResult.token, {
      path: '/',
      httpOnly: true,
      secure: false, // Indispensable pour le HTTP local (localhost)
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 jours
    })

    console.log(`[OAuth Debug] Session finalisée de manière native. Redirection.`);
    return response

  } catch (err) {
    console.error(`[OAuth Debug] Erreur capturée dans le bloc global:`, err)
    return NextResponse.redirect(new URL('/login?error=oauth_error', req.url))
  }
}