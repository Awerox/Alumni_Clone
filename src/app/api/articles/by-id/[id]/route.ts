// app/api/articles/by-id/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { verify } from 'jsonwebtoken'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const payload = await getPayload({ config: configPromise })

  const token =
    req.cookies.get('payload-alumni-token')?.value ||
    req.cookies.get('payload-token')?.value
  if (!token) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  let userId: string
  try {
    const decoded = verify(token, payload.secret) as any
    userId = String(decoded.id)
  } catch {
    return NextResponse.json({ error: 'Token invalide' }, { status: 401 })
  }

  try {
    const result = await payload.db.drizzle.execute(
      `SELECT a.*, 
        c.id as couverture_id, c.url as couverture_url, c.filename as couverture_filename,
        p.id as piece_jointe_id, p.url as piece_jointe_url, p.filename as piece_jointe_filename
       FROM articles a
       LEFT JOIN media c ON c.id = a.couverture_id
       LEFT JOIN media p ON p.id = a.piece_jointe_id
       WHERE a.id = ${Number(id)} LIMIT 1`
    ) as any

    const row = result.rows?.[0] ?? result[0]
    if (!row) return NextResponse.json({ error: 'Article introuvable' }, { status: 404 })

    // Vérification auteur
    if (String(row.auteur_id) !== userId) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    return NextResponse.json({
      doc: {
        id:          row.id,
        titre:       row.titre,
        slug:        row.slug,
        description: row.description,
        contenu:     row.contenu,
        categorie:   row.categorie,
        statut:      row.statut,
        datePublication: row.date_publication,
        couverture: row.couverture_id ? {
          id:       row.couverture_id,
          url:      row.couverture_url,
          filename: row.couverture_filename,
        } : null,
        pieceJointe: row.piece_jointe_id ? {
          id:       row.piece_jointe_id,
          url:      row.piece_jointe_url,
          filename: row.piece_jointe_filename,
        } : null,
      }
    })
  } catch (err: any) {
    console.error('[GET /api/articles/by-id/[id]]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}