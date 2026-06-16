// src/app/api/evenements/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { verify } from 'jsonwebtoken'

async function getUser(req: NextRequest, secret: string) {
  const token =
    req.cookies.get('payload-alumni-token')?.value ||
    req.cookies.get('payload-token')?.value
  if (!token) return null
  try { const d = verify(token, secret) as any; return d?.id ? d : null } catch { return null }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const payload = await getPayload({ config: configPromise })
    const user = await getUser(req, payload.secret)
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const evt = await payload.findByID({ collection: 'evenements', id, depth: 0 }) as any
    if (!evt) return NextResponse.json({ error: 'Introuvable' }, { status: 404 })

    const organisateurId = typeof evt.organisateur === 'object' ? evt.organisateur?.id : evt.organisateur
    const isAdmin = user.collection === 'users'
    if (!isAdmin && String(organisateurId) !== String(user.id))
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })

    await payload.delete({ collection: 'evenements', id, overrideAccess: true })
    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('[delete evenement]', err?.message)
    return NextResponse.json({ error: err?.message }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const payload = await getPayload({ config: configPromise })
    const user = await getUser(req, payload.secret)
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const body = await req.json()
    const evt = await payload.findByID({ collection: 'evenements', id, depth: 0 }) as any
    if (!evt) return NextResponse.json({ error: 'Introuvable' }, { status: 404 })

    const organisateurId = typeof evt.organisateur === 'object' ? evt.organisateur?.id : evt.organisateur
    const isAdmin = user.collection === 'users'
    if (!isAdmin && String(organisateurId) !== String(user.id))
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })

    // Update direct via SQL pour éviter les hooks payload_locked_documents
    // qui peuvent échouer si la table de verrouillage a un schéma désynchronisé
    const fieldMap: Record<string, string> = {
      nom: 'nom',
      typeLocalisation: 'type_localisation',
      dateDebut: 'date_debut',
      dateFin: 'date_fin',
      categorie: 'categorie',
      modeInscription: 'mode_inscription',
      lieuNom: 'lieu_nom',
      lieuAdresse: 'lieu_adresse',
      lienVisio: 'lien_visio',
      lienExterne: 'lien_externe',
      contact: 'contact',
      tags: 'tags',
      statut: 'statut',
      couverture: 'couverture_id',
    }

    const sets: string[] = []
    const values: any[] = []
    let idx = 1

    for (const [key, col] of Object.entries(fieldMap)) {
      if (key in body && body[key] !== undefined) {
        sets.push(`"${col}" = $${idx}`)
        values.push(body[key])
        idx++
      }
    }

    if ('description' in body) {
      sets.push(`"description" = $${idx}::jsonb`)
      values.push(JSON.stringify(body.description))
      idx++
    }

    if (sets.length === 0) {
      return NextResponse.json({ success: true, doc: evt })
    }

    sets.push(`"updated_at" = now()`)
    values.push(Number(id))

    const sql = `UPDATE "evenements" SET ${sets.join(', ')} WHERE "id" = $${idx} RETURNING *`

    const pool = (payload.db as any).pool
    const result = await pool.query(sql, values)

    return NextResponse.json({ success: true, doc: result.rows[0] })
  } catch (err: any) {
    console.error('[patch evenement]', err?.message)
    return NextResponse.json({ error: err?.message }, { status: 500 })
  }
}