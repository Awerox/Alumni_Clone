// src/app/(frontend)/evenements/[slug]/page.tsx
import React from 'react'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { getAuthUser } from '@/lib/auth'
import EventDetailClient from './EventDetailClient'

export const dynamic = 'force-dynamic'

const CAT_LABELS: Record<string, string> = {
  conference: 'Conférence', reseau: 'Réseautage', formation: 'Formation',
  ceremonie: 'Remise des diplômes', gala: 'Gala', atelier: 'Atelier',
  table_ronde: 'Table ronde', webinaire: 'Webinaire', reunion: 'Réunion annuelle',
  jpo: 'Journée portes ouvertes', salon: 'Salon',
}

const CAT_COLORS: Record<string, string> = {
  conference: 'bg-blue-100 text-blue-700', reseau: 'bg-purple-100 text-purple-700',
  formation: 'bg-indigo-100 text-indigo-700', ceremonie: 'bg-yellow-100 text-yellow-700',
  gala: 'bg-pink-100 text-pink-700', atelier: 'bg-amber-100 text-amber-700',
  table_ronde: 'bg-teal-100 text-teal-700', webinaire: 'bg-cyan-100 text-cyan-700',
  reunion: 'bg-gray-100 text-gray-700', jpo: 'bg-emerald-100 text-emerald-700',
  salon: 'bg-orange-100 text-orange-700',
}

const CAT_ICONS: Record<string, string> = {
  conference: '🎤', reseau: '🤝', formation: '📚', ceremonie: '🎓',
  gala: '🥂', atelier: '🛠️', table_ronde: '💬', webinaire: '💻',
  reunion: '📋', jpo: '🏫', salon: '🎪',
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    timeZone: 'Europe/Paris',
  })
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris' })
}

export default async function EventDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const payload = await getPayload({ config: configPromise })
  const { user } = await getAuthUser()

  const result = await payload.find({
    collection: 'evenements',
    where: { slug: { equals: slug } },
    depth: 2,
    limit: 1,
  })

  const evt = result.docs[0] as any
  if (!evt) notFound()

  const coverUrl = typeof evt.couverture === 'object' ? evt.couverture?.url : null
  const organisateur = typeof evt.organisateur === 'object' ? evt.organisateur : null
  const participants = Array.isArray(evt.participants) ? evt.participants : []

  const isOrganisateur = user && (
    typeof evt.organisateur === 'object'
      ? String(evt.organisateur?.id) === String(user.id)
      : String(evt.organisateur) === String(user.id)
  )

  const isParticipant = user && participants.some((p: any) =>
    String(typeof p === 'object' ? p.id : p) === String(user.id)
  )

  const isPast = new Date(evt.dateFin) < new Date()

  // Extraire le texte de la description richText
  const getDescText = (desc: any): string => {
    if (!desc) return ''
    if (typeof desc === 'string') return desc
    try {
      const nodes = desc?.root?.children || []
      return nodes.map((n: any) =>
        (n.children || []).map((c: any) => c.text || '').join('')
      ).join('\n\n')
    } catch { return '' }
  }

  const descText = getDescText(evt.description)

  const evtData = {
    id: String(evt.id),
    nom: evt.nom || '',
    slug: evt.slug || '',
    categorie: evt.categorie || '',
    catLabel: CAT_LABELS[evt.categorie] || evt.categorie || '',
    catColor: CAT_COLORS[evt.categorie] || 'bg-gray-100 text-gray-700',
    catIcon: CAT_ICONS[evt.categorie] || '📅',
    typeLocalisation: evt.typeLocalisation || 'presentiel',
    lieuNom: evt.lieuNom || null,
    lieuAdresse: evt.lieuAdresse || null,
    lienVisio: evt.lienVisio || null,
    dateDebut: evt.dateDebut || '',
    dateFin: evt.dateFin || '',
    statut: evt.statut || '',
    coverUrl,
    description: descText,
    modeInscription: evt.modeInscription || 'plateforme',
    lienExterne: evt.lienExterne || null,
    participantsCount: participants.length,
    capaciteMax: evt.capaciteMax || null,
    prixEntree: evt.prixEntree || null,
    contact: evt.contact || null,
    tags: evt.tags || null,
    isPast,
    isOrganisateur: !!isOrganisateur,
    isParticipant: !!isParticipant,
    currentUserId: user ? String(user.id) : null,
    organisateur: organisateur ? {
      id: String(organisateur.id),
      prenom: organisateur.prenom || '',
      nom: organisateur.nom || '',
      photoUrl: typeof organisateur.photo === 'object' ? organisateur.photo?.url || null : null,
      poste: organisateur.poste || null,
    } : null,
    participantsList: participants.slice(0, 12).map((p: any) => ({
      id: String(typeof p === 'object' ? p.id : p),
      prenom: p.prenom || '',
      nom: p.nom || '',
      photoUrl: typeof p.photo === 'object' ? p.photo?.url || null : null,
    })),
    formatDateDebut: formatDate(evt.dateDebut),
    formatDateFin: formatDate(evt.dateFin),
    formatTimeDebut: formatTime(evt.dateDebut),
    formatTimeFin: formatTime(evt.dateFin),
  }

  return <EventDetailClient evt={evtData} />
}
