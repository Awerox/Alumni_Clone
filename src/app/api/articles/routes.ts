// app/api/articles/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { verify } from 'jsonwebtoken'

async function getUserFromToken(req: NextRequest, secret: string): Promise<any | null> {
  const token =
    req.cookies.get('payload-alumni-token')?.value ||
    req.cookies.get('payload-token')?.value
  if (!token) return null
  try {
    const decoded = verify(token, secret) as any
    // FIX : on accepte aussi les tokens sans 'collection' explicite
    // pour compatibilité avec d'anciens tokens émis sans ce champ
    if (decoded?.id) return decoded
    return null
  } catch { return null }
}

export async function POST(req: NextRequest) {
  const payload = await getPayload({ config: configPromise })
  const user = await getUserFromToken(req, payload.secret)
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  try {
    const body = await req.json()

    if (!body.titre?.trim())       return NextResponse.json({ error: 'Titre requis' }, { status: 400 })
    if (!body.slug?.trim())        return NextResponse.json({ error: 'Slug requis' }, { status: 400 })
    if (!body.description?.trim()) return NextResponse.json({ error: 'Description requise' }, { status: 400 })
    if (!body.contenu?.trim())     return NextResponse.json({ error: 'Contenu requis' }, { status: 400 })
    if (!body.couverture)          return NextResponse.json({ error: 'Photo de couverture requise' }, { status: 400 })
    if (!body.categorie)           return NextResponse.json({ error: 'Catégorie requise' }, { status: 400 })

    // FIX : vérifier que le slug est disponible AVANT de tenter la création
    // → message d'erreur clair sans exception Payload
    const existingSlug = await payload.find({
      collection: 'articles',
      where: { slug: { equals: body.slug.trim() } },
      limit: 1,
      overrideAccess: true,
    })
    if (existingSlug.docs.length > 0) {
      return NextResponse.json({
        error: `Le slug "${body.slug.trim()}" est déjà utilisé par un autre article. Modifiez légèrement le titre ou l'URL.`
      }, { status: 400 })
    }

    const auteurId = Number(user.id)
    if (isNaN(auteurId) || auteurId <= 0) {
      return NextResponse.json({ error: 'Identifiant utilisateur invalide' }, { status: 401 })
    }

    const article = await payload.create({
      collection: 'articles',
      overrideAccess: true,
      data: {
        titre:       body.titre.trim(),
        slug:        body.slug.trim(),
        description: body.description.trim(),
        contenu:     body.contenu,
        categorie:   body.categorie,
        statut:      body.statut || 'brouillon',
        couverture:  Number(body.couverture),
        auteur:      auteurId,
        ...(body.datePublication ? { datePublication: body.datePublication } : {}),
        ...(body.pieceJointe     ? { pieceJointe: Number(body.pieceJointe) } : {}),
      },
    })

    return NextResponse.json({ doc: article }, { status: 201 })

  } catch (err: any) {
    console.error('[POST /api/articles]', err)
    // Filet de sécurité si la vérification préalable a raté
    if (err.message?.includes('unique') || err.message?.includes('slug')) {
      return NextResponse.json({
        error: 'Ce slug est déjà utilisé. Modifiez le titre ou l\'URL de l\'article.'
      }, { status: 400 })
    }
    if (err.message?.includes('not allowed') || err.message?.includes('access')) {
      return NextResponse.json({
        error: 'Accès refusé. Reconnectez-vous et réessayez.'
      }, { status: 403 })
    }
    return NextResponse.json({ error: err.message || 'Erreur serveur' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  const payload = await getPayload({ config: configPromise })
  const { searchParams } = new URL(req.url)
  try {
    const articles = await payload.find({
      collection: 'articles',
      limit: Number(searchParams.get('limit') || 30),
      sort: searchParams.get('sort') || '-createdAt',
      depth: 1,
    })
    return NextResponse.json(articles)
  } catch (err: any) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}