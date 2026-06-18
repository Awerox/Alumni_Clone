// src/app/(frontend)/jobs/[id]/edit/page.tsx
import { notFound, redirect } from 'next/navigation'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { getAuthUser } from '@/lib/auth'
import EditOffreClient from './EditOffreClient'

export const dynamic = 'force-dynamic'

function toDateInput(dateStr: string | null | undefined) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const parts = new Intl.DateTimeFormat('fr-FR', {
    timeZone: 'Europe/Paris', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(d)
  const get = (type: string) => parts.find(p => p.type === type)?.value ?? ''
  return `${get('year')}-${get('month')}-${get('day')}`
}

export default async function EditOffrePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { user } = await getAuthUser()
  if (!user) redirect(`/login?redirect=/jobs/${id}/edit`)

  const payload = await getPayload({ config: configPromise })

  let offre: any = null
  try {
    offre = await payload.findByID({ collection: 'offres', id, depth: 1 })
  } catch {
    notFound()
  }
  if (!offre) notFound()

  const recruteurId = typeof offre.recruteur === 'object' ? offre.recruteur?.id : offre.recruteur
  const isAdmin = (user as any).collection === 'users'
  if (!isAdmin && String(recruteurId) !== String(user.id)) {
    redirect('/jobs')
  }

  const initialData = {
    poste: offre.poste || '',
    entreprise: offre.entreprise || '',
    typeContrat: offre.typeContrat || 'CDI',
    secteur: offre.secteur || 'digital_technologie',
    localisation: offre.localisation || '',
    remuneration: offre.remuneration || 'non_renseigne',
    experience: offre.experience || 'non_renseigne',
    dateDebut: toDateInput(offre.dateDebut),
    dateLimite: toDateInput(offre.dateLimite),
    description: offre.description || '',
    statut: offre.statut || 'brouillon',
    restreindreDiplomes: Array.isArray(offre.restreindreDiplomes) ? offre.restreindreDiplomes : [],
    restreindreCampus: Array.isArray(offre.restreindreCampus) ? offre.restreindreCampus : [],
    restreindrePromotions: Array.isArray(offre.restreindrePromotions) ? offre.restreindrePromotions : [],
    existingLogoUrl: typeof offre.logo === 'object' ? offre.logo?.url || null : null,
    existingDocUrl: typeof offre.documentJoint === 'object' ? offre.documentJoint?.url || null : null,
    existingDocName: typeof offre.documentJoint === 'object' ? offre.documentJoint?.filename || null : null,
  }

  return <EditOffreClient offreId={String(offre.id)} initialData={initialData} />
}
