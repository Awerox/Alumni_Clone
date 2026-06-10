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
    if (decoded?.id) return decoded
    return null
  } catch { return null }
}

export async function POST(req: NextRequest) {
  const payload = await getPayload({ config: configPromise })
  const userDecoded = await getUserFromToken(req, payload.secret)
  if (!userDecoded) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  // FIX CLÉ : récupérer le doc complet depuis la DB pour que req.user
  // soit un objet Alumni valide reconnu par Payload et ses hooks
  let userDoc: any
  try {
    userDoc = await payload.findByID({
      collection: 'alumni',
      id: String(userDecoded.id),
      overrideAccess: true,
    })
  } catch {
    return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 401 })
  }

  if (!userDoc) return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 401 })

  try {
    const body = await req.json()

    if (!body.titre?.trim())       return NextResponse.json({ error: 'Titre requis' }, { status: 400 })
    if (!body.slug?.trim())        return NextResponse.json({ error: 'Slug requis' }, { status: 400 })
    if (!body.description?.trim()) return NextResponse.json({ error: 'Description requise' }, { status: 400 })
    if (!body.contenu?.trim())     return NextResponse.json({ error: 'Contenu requis' }, { status: 400 })
    if (!body.couverture)          return NextResponse.json({ error: 'Photo de couverture requise' }, { status: 400 })
    if (!body.categorie)           return NextResponse.json({ error: 'Catégorie requise' }, { status: 400 })

    // Vérification slug unique avant création
    const existingSlug = await payload.find({
      collection: 'articles',
      where: { slug: { equals: body.slug.trim() } },
      limit: 1,
      overrideAccess: true,
    })
    if (existingSlug.docs.length > 0) {
      return NextResponse.json({
        error: `Le slug "${body.slug.trim()}" est déjà utilisé. Modifiez légèrement le titre ou l'URL.`
      }, { status: 400 })
    }

    const article = await payload.create({
      collection: 'articles',
      overrideAccess: true,
      // FIX : injecter le user complet dans req pour que le beforeChange hook
      // puisse lire req.user.id et assigner l'auteur correctement
      req: { user: { ...userDoc, collection: 'alumni' } } as any,
      data: {
        titre:       body.titre.trim(),
        slug:        body.slug.trim(),
        description: body.description.trim(),
        contenu:     body.contenu,
        categorie:   body.categorie,
        statut:      body.statut || 'brouillon',
        couverture:  Number(body.couverture),
        auteur:      Number(userDoc.id),
        ...(body.datePublication ? { datePublication: body.datePublication } : {}),
        ...(body.pieceJointe     ? { pieceJointe: Number(body.pieceJointe) } : {}),
      },
    })

    return NextResponse.json({ doc: article }, { status: 201 })

  } catch (err: any) {
    console.error('[POST /api/articles]', err)
    if (err.message?.includes('unique') || err.message?.includes('slug')) {
      return NextResponse.json({
        error: 'Ce slug est déjà utilisé. Modifiez le titre ou l\'URL.'
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