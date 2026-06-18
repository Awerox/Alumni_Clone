// src/app/(frontend)/jobs/[id]/page.tsx
import React from 'react'
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { getAuthUser } from '@/lib/auth'
import OffreDetailClient from './OffreDetailClient'

export const dynamic = 'force-dynamic'

const SECT_LABELS: Record<string, string> = {
  autres: 'Autres', compta: 'Comptabilité / Gestion', rh: 'Ressources Humaines',
  informatique: 'Informatique / SLAM / SISR', commerce: 'Commerce / Marketing',
  agro_alimentaire: 'Agro-alimentaire', architecture: 'Architecture',
  association_non_lucrative: 'Association non lucrative', banque_assurance_finance: 'Banque / Assurance / Finance',
  conseil_audit: 'Conseil / Audit', culture_media_divertissement: 'Culture / Média / Divertissement',
  digital_technologie: 'Digital / Technologie', grande_distribution_ventes: 'Grande distribution / Ventes',
  droit_ecogestion_science_politique: 'Droit / Éco-gestion / Science Politique',
  enseignement_formation_recrutement: 'Enseignement / Formation / Recrutement',
  entrepreneuriat_startup: 'Entrepreneuriat / Start-up', travaux_publics: 'Travaux Publics',
  industrie: 'Industrie', publicite_marketing_communication: 'Publicité / Marketing / Communication',
  mode_luxe_beaute: 'Mode / Luxe / Beauté', environnement_sante_social: 'Environnement / Santé / Social',
  sciences_recherche: 'Sciences / Recherche', secteur_public_administration: 'Secteur public et administration',
  automobile: 'Automobile', organisation_internationale: 'Organisation internationale',
  tourisme_hotellerie_restauration: 'Tourisme / Hôtellerie / Restauration',
}

const REM_LABELS: Record<string, string> = {
  non_renseigne: 'Non renseigné', stage_non_indemnise: 'Stage non-indemnisé',
  stage_indemnise: 'Stage indemnisé', moins_15k: '< 15K €',
  '20_225k': '20-22,5K €', '25_275k': '25-27,5K €', '30_325k': '30-32,5K €',
  '35_375k': '35-37,5K €', '40_45k': '40-45K €', '45_50k': '45-50K €',
  '50_55k': '50-55K €', '60_65k': '60-65K €', '70_75k': '70-75K €',
}

const EXP_LABELS: Record<string, string> = {
  non_renseigne: 'Non renseigné', '0_2_ans': '0-2 ans', '2_4_ans': '2-4 ans',
  '4_7_ans': '4-7 ans', '7_10_ans': '7-10 ans', plus_10_ans: '+ 10 ans',
}

const DIPLOME_LABELS: Record<string, string> = { bts: 'BTS', dcg3: 'DCG3', prepa: 'Prépa' }
const CAMPUS_LABELS: Record<string, string> = { enc_bessieres: 'ENC Bessières', enc_bessieres_apprentissage: 'ENC Bessières Apprentissage' }

const CONTRAT_LABELS: Record<string, string> = {
  CDI: 'CDI', CDD: 'CDD', Alternance: 'Alternance', Stage: 'Stage', Independant: 'Indépendant',
}
const CONTRAT_ICONS: Record<string, string> = {
  CDI: '💼', CDD: '📄', Alternance: '🎓', Stage: '🧑‍💻', Independant: '🚀',
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Paris' })
}

export default async function OffreDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const payload = await getPayload({ config: configPromise })
  const { user } = await getAuthUser()

  let offre: any = null
  try {
    offre = await payload.findByID({ collection: 'offres', id, depth: 2 })
  } catch {
    notFound()
  }
  if (!offre) notFound()

  const recruteur = typeof offre.recruteur === 'object' ? offre.recruteur : null
  const recruteurId = recruteur ? recruteur.id : offre.recruteur
  const isRecruteur = !!user && String(recruteurId) === String(user.id)
  const isAdmin = !!user && (user as any).collection === 'users'

  // Un brouillon n'est visible que par son recruteur (ou un admin)
  if (offre.statut === 'brouillon' && !isRecruteur && !isAdmin) notFound()

  const now = Date.now()
  const isExpired = offre.dateLimite ? new Date(offre.dateLimite).getTime() < now : false

  const offreData = {
    id: String(offre.id),
    poste: offre.poste || '',
    entreprise: offre.entreprise || '',
    typeContrat: offre.typeContrat || '',
    contratLabel: CONTRAT_LABELS[offre.typeContrat] || offre.typeContrat || '',
    contratIcon: CONTRAT_ICONS[offre.typeContrat] || '💼',
    secteur: offre.secteur || '',
    secteurLabel: SECT_LABELS[offre.secteur] || offre.secteur || '',
    localisation: offre.localisation || '',
    remuneration: offre.remuneration || '',
    remunerationLabel: REM_LABELS[offre.remuneration] || offre.remuneration || '',
    experience: offre.experience || '',
    experienceLabel: EXP_LABELS[offre.experience] || offre.experience || 'Non renseigné',
    description: offre.description || '',
    dateDebut: offre.dateDebut || null,
    dateLimite: offre.dateLimite || null,
    dateDebutFormatted: offre.dateDebut ? formatDate(offre.dateDebut) : null,
    dateLimiteFormatted: offre.dateLimite ? formatDate(offre.dateLimite) : null,
    statut: offre.statut || 'publie',
    isExpired,
    logoUrl: typeof offre.logo === 'object' ? offre.logo?.url || null : null,
    documentJointUrl: typeof offre.documentJoint === 'object' ? offre.documentJoint?.url || null : null,
    documentJointName: typeof offre.documentJoint === 'object' ? offre.documentJoint?.filename || 'Document' : null,
    restreindreDiplomesLabels: (offre.restreindreDiplomes || []).map((v: string) => DIPLOME_LABELS[v] || v),
    restreindreCampusLabels: (offre.restreindreCampus || []).map((v: string) => CAMPUS_LABELS[v] || v),
    restreindrePromotions: offre.restreindrePromotions || [],
    isRecruteur,
    currentUserId: user ? String(user.id) : null,
    recruteur: recruteur ? {
      id: String(recruteur.id),
      prenom: recruteur.prenom || '',
      nom: recruteur.nom || '',
      poste: recruteur.poste || null,
      photoUrl: typeof recruteur.photo === 'object' ? recruteur.photo?.url || null : null,
    } : null,
  }

  return <OffreDetailClient offre={offreData} />
}
