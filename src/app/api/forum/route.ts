import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { headers } from 'next/headers'

export async function POST(req: Request) {
  const payload = await getPayload({ config: configPromise })
  const headersList = await headers()
  const { user } = await payload.auth({ headers: headersList as any })

  if (!user) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  try {
    const { discussionId, message } = await req.json()

    // 🎯 CORRECTION : On passe par un typage "any" sur l'appel ou une assertion pour contourner le blocage du générateur d'enums
    const current: any = await (payload.findByID as any)({
      collection: 'discussions',
      id: discussionId,
    })

    if (!current) {
      return NextResponse.json({ error: 'Discussion introuvable' }, { status: 404 })
    }

    const existants = current.commentaires || []

    // 🎯 CORRECTION : Surcharge du type d'appel de mise à jour pour contourner l'erreur de signature de méthode
    const updated = await (payload.update as any)({
      collection: 'discussions',
      id: discussionId,
      data: {
        commentaires: [
          ...existants,
          {
            auteur: user.id,
            message: message,
          },
        ],
      },
    })

    return NextResponse.json({ success: true, discussion: updated })
  } catch (err: any) {
    console.error("Erreur lors de l'ajout du commentaire:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}