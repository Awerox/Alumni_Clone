// app/api/articles/[id]/route.ts
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

// DELETE /api/articles/[id] — supprimer un article (auteur uniquement)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const payload = await getPayload({ config: configPromise })
  const user = await getUserFromToken(req, payload.secret)
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  try {
    // Vérifier que l'article appartient bien à cet utilisateur
    const existing = await payload.db.drizzle.execute(
      `SELECT id, auteur_id FROM articles WHERE id = ${Number(id)} LIMIT 1`
    ) as any
    const row = existing.rows?.[0] ?? existing[0]

    if (!row) return NextResponse.json({ error: 'Article introuvable' }, { status: 404 })
    if (String(row.auteur_id) !== String(user.id)) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    await payload.db.drizzle.execute(`DELETE FROM articles WHERE id = ${Number(id)}`)
    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('[DELETE /api/articles/[id]]', err)
    return NextResponse.json({ error: err.message || 'Erreur serveur' }, { status: 500 })
  }
}

// PATCH /api/articles/[id] — modifier un brouillon (auteur uniquement)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const payload = await getPayload({ config: configPromise })
  const user = await getUserFromToken(req, payload.secret)
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  try {
    const existing = await payload.db.drizzle.execute(
      `SELECT id, auteur_id, statut FROM articles WHERE id = ${Number(id)} LIMIT 1`
    ) as any
    const row = existing.rows?.[0] ?? existing[0]

    if (!row) return NextResponse.json({ error: 'Article introuvable' }, { status: 404 })
    if (String(row.auteur_id) !== String(user.id)) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }
    if (row.statut === 'publie') {
      return NextResponse.json({ error: 'Un article publié ne peut pas être modifié.' }, { status: 400 })
    }

    const body = await req.json()

    const setClauses: string[] = []
    if (body.titre)       setClauses.push(`titre = '${body.titre.trim().replace(/'/g, "''")}'`)
    if (body.slug)        setClauses.push(`slug = '${body.slug.trim().replace(/'/g, "''")}'`)
    if (body.description) setClauses.push(`description = '${body.description.trim().replace(/'/g, "''")}'`)
    if (body.contenu)     setClauses.push(`contenu = '${body.contenu.replace(/'/g, "''")}'`)
    if (body.categorie)   setClauses.push(`categorie = '${body.categorie}'`)
    if (body.statut)      setClauses.push(`statut = '${body.statut}'`)
    if (body.couverture)  setClauses.push(`couverture_id = ${Number(body.couverture)}`)
    if (body.pieceJointe) setClauses.push(`piece_jointe_id = ${Number(body.pieceJointe)}`)
    if (body.datePublication) setClauses.push(`date_publication = '${body.datePublication}'`)

    setClauses.push(`updated_at = NOW()`)

    if (setClauses.length === 1) {
      return NextResponse.json({ error: 'Aucun champ à modifier' }, { status: 400 })
    }

    await payload.db.drizzle.execute(
      `UPDATE articles SET ${setClauses.join(', ')} WHERE id = ${Number(id)}`
    )

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('[PATCH /api/articles/[id]]', err)
    return NextResponse.json({ error: err.message || 'Erreur serveur' }, { status: 500 })
  }
}