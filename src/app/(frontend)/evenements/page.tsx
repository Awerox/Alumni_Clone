// src/app/(frontend)/evenements/page.tsx
import React from 'react'
import Link from 'next/link'
import { getAuthUser } from '@/lib/auth'
import EvenementsPageClient from './EvenementsPageClient'

export const dynamic = 'force-dynamic'

// ── Publication automatique des événements programmés ────────────────────────
// Vercel Hobby n'a pas de cron — on déclenche au chargement de la page
async function autoPublishScheduled(payload: any) {
  try {
    const now = new Date().toISOString()
    const scheduled = await payload.find({
      collection: 'evenements',
      where: {
        and: [
          { statut: { equals: 'programme' } },
          { dateDebut: { less_than_equal: now } },
        ],
      },
      limit: 20,
      overrideAccess: true,
    })
    for (const evt of scheduled.docs) {
      await payload.update({
        collection: 'evenements',
        id: evt.id,
        overrideAccess: true,
        data: { statut: 'publie' } as any,
      })
    }
  } catch (e) {
    console.error('[autoPublish evenements]', e)
  }
}

const CAT_LABELS: Record<string, string> = {
  conference: 'Conférence', reseau: 'Réseautage', formation: 'Formation',
  ceremonie: 'Remise des diplômes', gala: 'Gala', atelier: 'Atelier',
  table_ronde: 'Table ronde', webinaire: 'Webinaire', reunion: 'Réunion annuelle',
  jpo: 'Journée portes ouvertes', salon: 'Salon',
}

interface PageProps {
  searchParams: Promise<{ q?: string; tab?: string; localisation?: string; categorie?: string }>
}

export default async function EvenementsPage({ searchParams }: PageProps) {
  const { user, payload } = await getAuthUser()

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 font-sans">
        <div className="text-center p-8 bg-white border border-gray-200 rounded-3xl shadow-sm max-w-sm">
          <div className="text-3xl mb-3">🔒</div>
          <p className="text-sm font-black text-gray-700">Accès réservé aux membres</p>
          <p className="text-xs text-gray-400 mt-1 mb-4">Connectez-vous pour accéder aux événements.</p>
          <Link href="/login?redirect=/evenements"
            className="inline-block w-full text-center py-2.5 bg-[#800020] hover:bg-[#600018] text-white text-xs font-black uppercase rounded-xl transition-colors shadow-sm">
            Se connecter
          </Link>
        </div>
      </div>
    )
  }

  // Déclencher la publication automatique à chaque visite
  autoPublishScheduled(payload).catch(() => {})

  const sp = await searchParams
  const currentTab = sp.tab || 'venir'
  const now = new Date(); now.setHours(0, 0, 0, 0)
  const nowISO = now.toISOString()

  const toEvt = (evt: any) => ({
    id: String(evt.id),
    nom: evt.nom || '',
    slug: evt.slug || '',
    categorie: evt.categorie || '',
    catLabel: CAT_LABELS[evt.categorie] || evt.categorie || '',
    typeLocalisation: evt.typeLocalisation || 'presentiel',
    dateDebut: evt.dateDebut || '',
    dateFin: evt.dateFin || '',
    statut: evt.statut || '',
    coverUrl: typeof evt.couverture === 'object' ? evt.couverture?.url || null : null,
    organisateurNom: typeof evt.organisateur === 'object'
      ? `${evt.organisateur?.prenom || ''} ${evt.organisateur?.nom || ''}`.trim() || null
      : null,
    participantsCount: Array.isArray(evt.participants) ? evt.participants.length : 0,
    isOrganisateur: typeof evt.organisateur === 'object'
      ? String(evt.organisateur?.id) === String(user.id)
      : String(evt.organisateur) === String(user.id),
    isParticipant: Array.isArray(evt.participants)
      ? evt.participants.some((p: any) => String(typeof p === 'object' ? p.id : p) === String(user.id))
      : false,
  })

  // Charger tous les événements en parallèle
  const [aVenirRaw, passesRaw, participationsRaw, brouillonsRaw] = await Promise.all([
    payload.find({ collection: 'evenements', where: { and: [{ statut: { equals: 'publie' } }, { dateFin: { greater_than_equal: nowISO } }] }, sort: 'dateDebut', depth: 1, limit: 100 }),
    payload.find({ collection: 'evenements', where: { and: [{ statut: { equals: 'publie' } }, { dateFin: { less_than: nowISO } }] }, sort: '-dateDebut', depth: 1, limit: 50 }),
    payload.find({ collection: 'evenements', where: { participants: { contains: user.id } }, sort: 'dateDebut', depth: 1, limit: 100 }),
    payload.find({ collection: 'evenements', where: { and: [{ statut: { in: ['brouillon', 'programme'] } }, { organisateur: { equals: user.id } }] }, sort: 'dateDebut', depth: 1, limit: 50 }),
  ])

  return (
    <EvenementsPageClient
      initialTab={currentTab}
      initialQ={sp.q || ''}
      initialLocalisation={sp.localisation || ''}
      initialCategorie={sp.categorie || ''}
      aVenir={aVenirRaw.docs.map(toEvt)}
      passes={passesRaw.docs.map(toEvt)}
      participations={participationsRaw.docs.map(toEvt)}
      brouillons={brouillonsRaw.docs.map(toEvt)}
      currentUserId={String(user.id)}
    />
  )
}
