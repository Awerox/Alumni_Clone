// src/app/(frontend)/evenements/[slug]/edit/page.tsx
import { notFound, redirect } from 'next/navigation'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { getAuthUser } from '@/lib/auth'
import EditEventClient from './EditEventClient'

export const dynamic = 'force-dynamic'

function extractText(desc: any): string {
  if (!desc) return ''
  if (typeof desc === 'string') return desc
  try {
    return (desc?.root?.children || [])
      .map((n: any) => (n.children || []).map((c: any) => c.text || '').join(''))
      .join('\n\n')
  } catch { return '' }
}

function extractDate(dateStr: string) {
  if (!dateStr) return { date: '', time: '09:00' }
  const d = new Date(dateStr)
  const date = d.toISOString().slice(0, 10)
  const time = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  return { date, time }
}

export default async function EditEventPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const { user } = await getAuthUser()
  if (!user) redirect(`/login?redirect=/evenements/${slug}/edit`)

  const payload = await getPayload({ config: configPromise })

  const result = await payload.find({
    collection: 'evenements',
    where: { slug: { equals: slug } },
    depth: 1,
    limit: 1,
  })

  const evt = result.docs[0] as any
  if (!evt) notFound()

  // Vérifier droits
  const organisateurId = typeof evt.organisateur === 'object' ? evt.organisateur?.id : evt.organisateur
  const isAdmin = (user as any).collection === 'users'
  if (!isAdmin && String(organisateurId) !== String(user.id)) {
    redirect('/evenements')
  }

  const debutParsed = extractDate(evt.dateDebut)
  const finParsed = extractDate(evt.dateFin)

  const initialData = {
    nom: evt.nom || '',
    slug: evt.slug || '',
    typeLocalisation: evt.typeLocalisation || 'presentiel',
    lieuNom: evt.lieuNom || '',
    lieuAdresse: evt.lieuAdresse || '',
    lienVisio: evt.lienVisio || '',
    dateDebut: debutParsed.date,
    dateFin: finParsed.date,
    heureDebut: debutParsed.time,
    heureFin: finParsed.time,
    categorie: evt.categorie || 'conference',
    description: extractText(evt.description),
    modeInscription: evt.modeInscription || 'plateforme',
    lienExterne: evt.lienExterne || '',
    capaciteMax: evt.capaciteMax?.toString() || '',
    prixEntree: evt.prixEntree?.toString() || '',
    contact: evt.contact || '',
    tags: evt.tags || '',
    statut: evt.statut || 'brouillon',
    existingCoverUrl: typeof evt.couverture === 'object' ? evt.couverture?.url || null : null,
  }

  return <EditEventClient eventId={String(evt.id)} initialData={initialData} />
}
