// app/api/alumni/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { verify } from 'jsonwebtoken'

interface DecodedToken {
  id: string
  collection: string
}

// Vérifie le token alumni OU admin (Users)
async function getAuthContext(req: NextRequest, secret: string): Promise<{
  userId: string | null
  isAdmin: boolean
}> {
  const token =
    req.cookies.get('payload-alumni-token')?.value ||
    req.cookies.get('payload-token')?.value

  if (!token) return { userId: null, isAdmin: false }

  try {
    const decoded = verify(token, secret) as DecodedToken

    // Token alumni (connexion frontend)
    if (decoded?.collection === 'alumni' && decoded?.id) {
      return { userId: String(decoded.id), isAdmin: false }
    }

    // Token admin Payload (connexion /admin)
    if (decoded?.collection === 'users' && decoded?.id) {
      return { userId: String(decoded.id), isAdmin: true }
    }

    return { userId: null, isAdmin: false }
  } catch {
    return { userId: null, isAdmin: false }
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const payload = await getPayload({ config: configPromise })
    const { userId, isAdmin } = await getAuthContext(req, payload.secret)

    if (!userId) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // Un utilisateur ne peut modifier que son propre profil
    // sauf si c'est un admin
    if (!isAdmin && String(userId) !== String(id)) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const body = await req.json()

    // Champs autorisés pour un utilisateur normal
    const userAllowedFields = [
      'prenom', 'nom', 'nomNaissance', 'telephone', 'ville',
      'dateNaissance', 'civilite', 'bio', 'poste', 'entreprise',
      'diplome', 'promotion', 'secteur', 'searchOpportunities',
      'profileVisibility', 'interveneEstablishment', 'shareExperience',
      'ambassador', 'jury', 'notifNewsletter', 'notifPlatform',
      'notifWeeklyJobs', 'notifLastPosts', 'notifLastBlogs',
      'notifLastEvents', 'notifMassMessages', 'notifGroupInvites',
      'mentoratRole', 'mentoratActive', 'photo', 'avatar',
      'linkedin', 'instagram', 'socialLinks', 'experiences',
      'formations', 'interets', 'latitude', 'longitude',
    ]

    // L'admin peut tout modifier (password inclus)
    const adminAllowedFields = [
      ...userAllowedFields,
      'password', 'email', 'statut', 'isMentor',
      'subGoogle', 'subLinkedin',
    ]

    const allowedFields = isAdmin ? adminAllowedFields : userAllowedFields

    const sanitized: Record<string, any> = {}
    for (const field of allowedFields) {
      if (field in body) {
        sanitized[field] = body[field]
      }
    }

    if (Object.keys(sanitized).length === 0) {
      return NextResponse.json({ error: 'Aucun champ valide à mettre à jour' }, { status: 400 })
    }

    const updated = await payload.update({
      collection: 'alumni',
      id,
      overrideAccess: true,
      data: sanitized,
    })

    return NextResponse.json({ doc: updated })
  } catch (err) {
    console.error('[PATCH /api/alumni/[id]]', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const payload = await getPayload({ config: configPromise })

    const user = await payload.findByID({
      collection: 'alumni',
      id,
      depth: 1,
    })

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (err) {
    console.error('[GET /api/alumni/[id]]', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}