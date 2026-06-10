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
  const user = await getUserFromToken(req, payload.secret)
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const auteurId = Number(user.id)
  if (isNaN(auteurId) || auteurId <= 0) {
    return NextResponse.json({ error: 'Identifiant utilisateur invalide' }, { status: 401 })
  }

  try {
    const body = await req.json()

    if (!body.titre?.trim())       return NextResponse.json({ error: 'Titre requis' }, { status: 400 })
    if (!body.slug?.trim())        return NextResponse.json({ error: 'Slug requis' }, { status: 400 })
    if (!body.description?.trim()) return NextResponse.json({ error: 'Description requise' }, { status: 400 })
    if (!body.contenu?.trim())     return NextResponse.json({ error: 'Contenu requis' }, { status: 400 })
    if (!body.couverture)          return NextResponse.json({ error: 'Photo de couverture requise' }, { status: 400 })
    if (!body.categorie)           return NextResponse.json({ error: 'Catégorie requise' }, { status: 400 })

    const slug = body.slug.trim()

    // Vérification slug unique via SQL direct — pas de risque d'access control
    const existing = await payload.db.drizzle.execute(
      `SELECT id FROM articles WHERE slug = '${slug.replace(/'/g, "''")}' LIMIT 1`
    ) as any
    const existingRows = existing.rows ?? existing
    if (existingRows.length > 0) {
      return NextResponse.json({
        error: `Le slug "${slug}" est déjà utilisé. Modifiez légèrement le titre ou l'URL.`
      }, { status: 400 })
    }

    const titre       = body.titre.trim().replace(/'/g, "''")
    const description = body.description.trim().replace(/'/g, "''")
    const contenu     = body.contenu.replace(/'/g, "''")
    const categorie   = body.categorie
    const statut      = body.statut || 'brouillon'
    const couverture  = Number(body.couverture)
    const pieceJointe = body.pieceJointe ? Number(body.pieceJointe) : null
    const datePublication = body.datePublication
      ? `'${body.datePublication}'`
      : 'NULL'

    // FIX CLÉ : INSERT SQL direct, bypass total de Payload et ses access controls
    // Même pattern que /api/media — fiable sur Vercel + Neon
    const result = await payload.db.drizzle.execute(`
      INSERT INTO articles (
        titre, slug, description, contenu, categorie, statut,
        couverture_id, piece_jointe_id, auteur_id,
        date_publication, updated_at, created_at
      ) VALUES (
        '${titre}',
        '${slug.replace(/'/g, "''")}',
        '${description}',
        '${contenu}',
        '${categorie}',
        '${statut}',
        ${couverture},
        ${pieceJointe ?? 'NULL'},
        ${auteurId},
        ${datePublication},
        NOW(),
        NOW()
      )
      RETURNING id, titre, slug, statut, created_at
    `) as any

    const row = result.rows?.[0] ?? result[0]
    if (!row) throw new Error('Insertion échouée — aucune ligne retournée')

    return NextResponse.json({ doc: row }, { status: 201 })

  } catch (err: any) {
    console.error('[POST /api/articles]', err)
    if (err.message?.includes('unique') || err.message?.includes('slug')) {
      return NextResponse.json({
        error: 'Ce slug est déjà utilisé. Modifiez le titre ou l\'URL.'
      }, { status: 400 })
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