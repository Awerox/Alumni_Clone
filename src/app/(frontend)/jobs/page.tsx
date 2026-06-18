// src/app/(frontend)/jobs/page.tsx
import React from 'react'
import Link from 'next/link'
import { getAuthUser } from '@/lib/auth'
import OffresPageClient from './OffresPageClient'

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

function toOffre(o: any, userId?: string) {
  const recruteurId = typeof o.recruteur === 'object' ? o.recruteur?.id : o.recruteur
  return {
    id: String(o.id),
    poste: o.poste || '',
    entreprise: o.entreprise || '',
    typeContrat: o.typeContrat || '',
    secteur: o.secteur || '',
    secteurLabel: SECT_LABELS[o.secteur] || o.secteur || '',
    localisation: o.localisation || '',
    remuneration: o.remuneration || '',
    remunerationLabel: REM_LABELS[o.remuneration] || o.remuneration || '',
    experience: o.experience || '',
    experienceLabel: EXP_LABELS[o.experience] || o.experience || '',
    description: o.description || '',
    dateDebut: o.dateDebut || null,
    dateLimite: o.dateLimite || null,
    statut: o.statut || 'publie',
    logoUrl: typeof o.logo === 'object' ? o.logo?.url || null : null,
    documentJointUrl: typeof o.documentJoint === 'object' ? o.documentJoint?.url || null : null,
    isRecruteur: !!userId && String(recruteurId) === String(userId),
    recruteurNom: typeof o.recruteur === 'object'
      ? `${o.recruteur?.prenom || ''} ${o.recruteur?.nom || ''}`.trim() || null
      : null,
    restreindreDiplomes: Array.isArray(o.restreindreDiplomes) ? o.restreindreDiplomes : [],
    restreindreCampus: Array.isArray(o.restreindreCampus) ? o.restreindreCampus : [],
    restreindrePromotions: Array.isArray(o.restreindrePromotions) ? o.restreindrePromotions : [],
    createdAt: o.createdAt || '',
  }
}

export default async function JobsPage() {
  const { user, payload } = await getAuthUser()

  if (!user || !payload) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 font-sans">
        <div className="text-center p-8 bg-white border border-gray-200 rounded-3xl shadow-sm max-w-sm">
          <div className="text-3xl mb-3">🔒</div>
          <p className="text-sm font-black text-gray-700">Accès réservé aux membres</p>
          <p className="text-xs text-gray-400 mt-1 mb-4">Connectez-vous pour accéder aux offres d'emploi et de stages.</p>
          <Link href="/login?redirect=/jobs"
            className="inline-block w-full text-center py-2.5 bg-[#800020] hover:bg-[#600018] text-white text-xs font-black uppercase rounded-xl transition-colors shadow-sm">
            Se connecter
          </Link>
        </div>
      </div>
    )
  }

  const nowISO = new Date().toISOString()

  const [activesRaw, expireesRaw, brouillonsRaw] = await Promise.all([
    payload.find({
      collection: 'offres',
      where: {
        and: [
          { statut: { equals: 'publie' } },
          { or: [{ dateLimite: { exists: false } }, { dateLimite: { greater_than_equal: nowISO } }] },
        ],
      },
      sort: '-createdAt', depth: 1, limit: 100,
    }),
    payload.find({
      collection: 'offres',
      where: { and: [{ statut: { equals: 'publie' } }, { dateLimite: { less_than: nowISO } }] },
      sort: '-dateLimite', depth: 1, limit: 100,
    }),
    payload.find({
      collection: 'offres',
      where: { and: [{ statut: { equals: 'brouillon' } }, { recruteur: { equals: user.id } }] },
      sort: '-createdAt', depth: 1, limit: 100,
    }),
  ])

  return (
    <OffresPageClient
      actives={(activesRaw?.docs || []).map((o: any) => toOffre(o, String(user.id)))}
      expirees={(expireesRaw?.docs || []).map((o: any) => toOffre(o, String(user.id)))}
      brouillons={(brouillonsRaw?.docs || []).map((o: any) => toOffre(o, String(user.id)))}
      currentUserId={String(user.id)}
    />
  )
}
