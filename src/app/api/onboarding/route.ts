// app/api/onboarding/route.ts
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

export async function POST(req: NextRequest) {
  try {
    const payload = await getPayload({ config: configPromise })
    const userId = await getCurrentUserId(req, payload.secret)

    if (!userId) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const body = await req.json()

    const allowedFields = [
      'prenom', 'nom', 'civilite', 'dateNaissance',
      'statut', 'diplome', 'promotion', 'formations',
      'poste', 'entreprise', 'secteur', 'ville',
      'searchOpportunities', 'mentoratActive', 'mentoratRole',
    ]

    const data: Record<string, any> = {}
    for (const field of allowedFields) {
      if (field in body && body[field] !== undefined && body[field] !== '') {
        data[field] = body[field]
      }
    }

    // Mise à jour du profil
    await payload.update({
      collection: 'alumni',
      id: userId,
      overrideAccess: true,
      data,
    })

    // Mise à jour du mot de passe séparément si fourni
    // Payload gère le hachage via sa méthode dédiée
    if (body.password && typeof body.password === 'string' && body.password.length >= 8) {
      await payload.update({
        collection: 'alumni',
        id: userId,
        overrideAccess: true,
        data: { password: body.password },
      })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('[POST /api/onboarding]', err)
    return NextResponse.json({ error: err.message || 'Erreur serveur' }, { status: 500 })
  }
}