// app/api/alumni-profile/[id]/route.ts
// Route frontend uniquement — ne bloque plus les routes natives Payload

import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { verify } from 'jsonwebtoken'

async function getCurrentUserId(req: NextRequest, secret: string): Promise<string | null> {
  const token =
    req.cookies.get('payload-alumni-token')?.value ||
    req.cookies.get('payload-token')?.value
  if (!token) return null
  try {
    const decoded = verify(token, secret) as any
    if (decoded?.collection === 'alumni' && decoded?.id) return String(decoded.id)
    return null
  } catch { return null }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const payload = await getPayload({ config: configPromise })
    const currentUserId = await getCurrentUserId(req, payload.secret)

    if (!currentUserId) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    if (String(currentUserId) !== String(id)) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const body = await req.json()

    const allowedFields = [
      'prenom', 'nom', 'nomNaissance', 'telephone', 'ville',
      'dateNaissance', 'civilite', 'bio', 'poste', 'entreprise',
      'diplome', 'promotion', 'secteur', 'searchOpportunities',
      'profileVisibility', 'interveneEstablishment', 'shareExperience',
      'ambassador', 'jury', 'notifNewsletter', 'notifPlatform',
      'notifWeeklyJobs', 'notifLastPosts', 'notifLastBlogs',
      'notifLastEvents', 'notifMassMessages', 'notifGroupInvites',
      'mentoratRole', 'mentoratActive', 'photo', 'avatar',
      'linkedin', 'instagram', 'socialLinks', 'experiences',
      'formations', 'interets', 'subGoogle', 'subLinkedin',
    ]

    const sanitized: Record<string, any> = {}
    for (const field of allowedFields) {
      if (field in body) sanitized[field] = body[field]
    }

    if (Object.keys(sanitized).length === 0) {
      return NextResponse.json({ error: 'Aucun champ valide' }, { status: 400 })
    }

    const updated = await payload.update({
      collection: 'alumni',
      id,
      overrideAccess: true,
      data: sanitized,
    })

    return NextResponse.json({ doc: updated })
  } catch (err) {
    console.error('[PATCH /api/alumni-profile/[id]]', err)
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
    const user = await payload.findByID({ collection: 'alumni', id, depth: 1 })
    if (!user) return NextResponse.json({ error: 'Introuvable' }, { status: 404 })
    return NextResponse.json(user)
  } catch (err) {
    console.error('[GET /api/alumni-profile/[id]]', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}