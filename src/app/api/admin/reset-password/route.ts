// app/api/admin/reset-password/route.ts
// Route d'urgence pour réinitialiser un mot de passe via PAYLOAD_SECRET

import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'

export async function POST(req: NextRequest) {
  try {
    const payload = await getPayload({ config: configPromise })
    const body = await req.json()
    const { email, newPassword, adminKey } = body

    // Vérification clé admin — utilise PAYLOAD_SECRET comme clé de sécurité
    if (adminKey !== process.env.PAYLOAD_SECRET) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    if (!email || !newPassword) {
      return NextResponse.json({ error: 'Email et nouveau mot de passe requis' }, { status: 400 })
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

    // Forcer la mise à jour du mot de passe
    await payload.update({
      collection: 'alumni',
      id: user.id,
      overrideAccess: true,
      data: {
        password: newPassword,
      } as any,
    })

    return NextResponse.json({ 
      success: true, 
      message: `Mot de passe réinitialisé pour ${email}` 
    })
  } catch (err: any) {
    console.error('[POST /api/admin/reset-password]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}