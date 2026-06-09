// app/api/alumni/unlock/route.ts
// Permet à Payload Admin de déverrouiller un compte alumni

import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'

export async function POST(req: NextRequest) {
  try {
    const payload = await getPayload({ config: configPromise })
    const body = await req.json()
    const { email } = body

    if (!email) {
      return NextResponse.json({ error: 'Email requis' }, { status: 400 })
    }

    // Trouver l'utilisateur
    const result = await payload.find({
      collection: 'alumni',
      where: { email: { equals: email } },
      limit: 1,
      overrideAccess: true,
    })

    if (!result.docs.length) {
      return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 })
    }

    const user = result.docs[0]

    // Réinitialiser le verrou en mettant lockUntil à null
    await payload.update({
      collection: 'alumni',
      id: user.id,
      overrideAccess: true,
      data: {
        lockUntil: null,
        loginAttempts: 0,
      } as any,
    })

    return NextResponse.json({ message: 'Compte déverrouillé avec succès' })
  } catch (err) {
    console.error('[POST /api/alumni/unlock]', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}