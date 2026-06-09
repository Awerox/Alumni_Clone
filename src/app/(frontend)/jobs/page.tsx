// app/jobs/page.tsx
import React from 'react'
import Link from 'next/link'
import { getAuthUser } from '@/lib/auth'
import JobFilter from '@/components/JobFilter'

export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams: Promise<{
    q?: string
    tab?: string
    mineOnly?: string
    secteur?: string
    contrat?: string
    loc?: string
    remuneration?: string
    experience?: string
  }>
}

export default async function JobsPage({ searchParams }: PageProps) {
  const { user, payload } = await getAuthUser()

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 font-sans">
        <div className="text-center p-8 bg-white border border-gray-200 rounded-3xl shadow-sm max-w-sm">
          <div className="text-3xl mb-3">🔒</div>
          <p className="text-sm font-bold text-gray-700">Accès restreint</p>
          <p className="text-xs text-gray-400 mt-1 mb-4">
            Veuillez vous connecter pour accéder aux offres d'emplois et de stages.
          </p>
          <Link href="/login?redirect=/jobs"
            className="inline-block w-full text-center py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-black uppercase rounded-xl shadow-sm transition-colors">
            Se connecter
          </Link>
        </div>
      </div>
    )
  }

  const resolvedSearchParams = await searchParams
  const currentTab = resolvedSearchParams.tab || 'actives'
  const isMineOnly = resolvedSearchParams.mineOnly === 'true'

  const andConditions: any[] = []

  if (currentTab === 'actives') andConditions.push({ statut: { equals: 'publie' } })
  else if (currentTab === 'attente') andConditions.push({ statut: { equals: 'attente' } })
  else if (currentTab === 'brouillon') andConditions.push({ statut: { equals: 'brouillon' } })

  if (resolvedSearchParams.q) {
    andConditions.push({ or: [{ poste: { like: resolvedSearchParams.q } }, { entreprise: { like: resolvedSearchParams.q } }] })
  }
  if (resolvedSearchParams.loc) andConditions.push({ localisation: { like: resolvedSearchParams.loc } })
  if (resolvedSearchParams.secteur) andConditions.push({ secteur: { equals: resolvedSearchParams.secteur } })
  if (resolvedSearchParams.contrat) andConditions.push({ typeContrat: { equals: resolvedSearchParams.contrat } })
  if (resolvedSearchParams.remuneration) andConditions.push({ remuneration: { equals: resolvedSearchParams.remuneration } })
  if (resolvedSearchParams.experience) andConditions.push({ experience: { equals: resolvedSearchParams.experience } })
  if (isMineOnly || currentTab === 'attente' || currentTab === 'brouillon') {
    andConditions.push({ recruteur: { equals: user.id } })
  }

  let offresDocs: any[] = []
  let schemaConflictDetected = false

  try {
    const offresList = await payload.find({
      collection: 'offres',
      where: andConditions.length > 0 ? { and: andConditions } : undefined,
      sort: '-createdAt',
    })
    offresDocs = offresList.docs
  } catch (error) {
    console.error('Erreur requête offres:', error)
    schemaConflictDetected = true
  }

  const remLabels: any = {
    non_renseigne: 'Non renseigné', stage_non_indemnise: 'Stage non-indemnisé',
    stage_indemnise: 'Stage indemnisé', moins_15k: '< 15k €',
    '20_225k': '20-22,5K €', '25_275k': '25-27,5K €', '30_325k': '30-32,5K €',
    '35-37,5K €': '35-37,5K €', '40_45k': '40-45K €', '45_50k': '45-50K €',
    '50_55k': '50-55K €', '60_65k': '60-65K €', '70_75k': '70-75K €',
  }

  const expLabels: any = {
    non_renseigne: 'Non renseigné', '0_2_ans': '0-2 ans', '2_4_ans': '2-4 ans',
    '4_7_ans': '4-7 ans', '7_10_ans': '7-10 ans', plus_10_ans: '+ 10 ans',
  }

  const sectLabels: any = {
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

  const tabLabels: any = {
    actives: 'Offres actives',
    attente: 'Mes offres en attente de validation',
    brouillon: 'Mes candidatures / brouillons',
  }

  return (
    <div className="bg-gray-50/50 min-h-screen py-10 px-4 sm:px-6 lg:px-8 text-left font-sans">
      <div className="max-w-6xl mx-auto space-y-6">

        {schemaConflictDetected && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-xs font-bold shadow-xs">
            ⚠️ <span className="uppercase">Erreur de base de données :</span> Exécutez{' '}
            <code className="bg-red-100 px-1 py-0.5 rounded text-red-800">npx payload migrate:create</code>{' '}
            dans votre terminal pour corriger le problème.
          </div>
        )}

        <div className="bg-[#FEF3C7] border border-[#FDE68A] text-[#92400E] p-4 rounded-xl text-xs font-bold flex justify-between items-center shadow-2xs">
          <p>
            Vous n'avez pas encore activé la notification hebdomadaire des offres d'emploi.{' '}
            <Link href="/profile" className="underline font-black">Activer ici</Link>
          </p>
          <button className="text-sm cursor-pointer">✕</button>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs">
          <form method="GET" action="/jobs" className="flex flex-wrap items-center gap-3 text-xs font-bold text-gray-400">
            <input type="hidden" name="tab" value={currentTab} />
            {isMineOnly && <input type="hidden" name="mineOnly" value="true" />}
            <input type="text" name="q" defaultValue={resolvedSearchParams.q || ''} placeholder="Mots-clés"
              className="px-3 py-2 bg-white border border-gray-200 rounded-lg outline-none text-gray-800 focus:border-emerald-500 font-medium w-40" />
            <select name="secteur" defaultValue={resolvedSearchParams.secteur || ''}
              className="px-3 py-2 bg-white border border-gray-200 rounded-lg outline-none text-gray-700 font-medium focus:border-emerald-500 cursor-pointer">
              <option value="">Secteur d'activité</option>
              <option value="compta">Comptabilité / Gestion</option>
              <option value="rh">Ressources Humaines</option>
              <option value="informatique">Informatique / SLAM / SISR</option>
              <option value="commerce">Commerce / Marketing</option>
              <option value="digital_technologie">Digital / Technologie</option>
              <option value="agro_alimentaire">Agro-alimentaire</option>
              <option value="conseil_audit">Conseil / Audit</option>
            </select>
            <select name="contrat" defaultValue={resolvedSearchParams.contrat || ''}
              className="px-3 py-2 bg-white border border-gray-200 rounded-lg outline-none text-gray-700 font-medium focus:border-emerald-500 cursor-pointer">
              <option value="">Type de contrat</option>
              <option value="Stage">Stage</option>
              <option value="Alternance">Alternance</option>
              <option value="CDD">CDD</option>
              <option value="CDI">CDI</option>
            </select>
            <select name="remuneration" defaultValue={resolvedSearchParams.remuneration || ''}
              className="px-3 py-2 bg-white border border-gray-200 rounded-lg outline-none text-gray-700 font-medium focus:border-emerald-500 cursor-pointer">
              <option value="">Rémunération</option>
              <option value="stage_indemnise">Stage indemnisé</option>
              <option value="35-37,5K €">35-37,5K €</option>
              <option value="40_45k">40-45K €</option>
            </select>
            <input type="text" name="loc" defaultValue={resolvedSearchParams.loc || ''} placeholder="Localisation"
              className="px-3 py-2 bg-white border border-gray-200 rounded-lg outline-none text-gray-800 focus:border-emerald-500 font-medium w-32" />
            <button type="submit" className="bg-emerald-500 text-white px-5 py-2 rounded-lg font-black uppercase shadow-2xs cursor-pointer hover:bg-emerald-600 transition-colors">Filtrer</button>
            <Link href="/jobs" className="text-gray-400 hover:text-gray-600 text-[11px] uppercase ml-1">Effacer</Link>
          </form>
        </div>

        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
          <Link href="/jobs/new" className="bg-emerald-500 text-white px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 hover:bg-emerald-600 transition-all shadow-sm">
            <span className="text-sm font-black">＋</span> Poster une offre
          </Link>
          <div className="bg-amber-50/40 border border-amber-200/60 rounded-2xl p-1.5 flex items-center gap-1 shadow-sm text-[10px] font-black uppercase overflow-x-auto max-w-full">
            {[['actives', 'Offres actives'], ['attente', 'Mes offres en attente'], ['brouillon', 'Mes candidatures']].map(([tab, label]) => (
              <Link key={tab} href={`/jobs?tab=${tab}`}
                className={`px-4 py-2 rounded-xl transition-all ${currentTab === tab ? 'bg-amber-400 text-gray-900 shadow-2xs' : 'text-gray-500 hover:text-gray-700'}`}>
                {label}
              </Link>
            ))}
          </div>
        </div>

        <JobFilter currentTab={currentTab} isMineOnly={isMineOnly} />

        <div className="text-sm font-black text-gray-700 pt-1">
          {offresDocs.length} {tabLabels[currentTab] || 'Offres'}
        </div>

        {offresDocs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {offresDocs.map((offre: any) => {
              const cleanDate = new Date(offre.createdAt).toLocaleDateString('fr-FR')
              const dateLimiteText = offre.dateLimite ? new Date(offre.dateLimite).toLocaleDateString('fr-FR') : '-'
              const dateDebutText = offre.dateDebut ? new Date(offre.dateDebut).toLocaleDateString('fr-FR') : 'Dès que possible'
              const logoUrl = offre.logo && typeof offre.logo === 'object' ? offre.logo.url : null

              return (
                <div key={offre.id} className="bg-white border border-gray-100 rounded-3xl p-6 shadow-xs relative flex flex-col justify-between hover:shadow-md transition-all group hover:border-gray-300">
                  <div className="space-y-5">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex items-center gap-4">
                        {logoUrl ? (
                          <img src={logoUrl} alt="" className="w-16 h-16 rounded-2xl border border-gray-100 object-contain bg-white shadow-xs p-1" />
                        ) : (
                          <div className="w-16 h-16 bg-gray-50 border border-gray-100 text-gray-400 rounded-2xl flex items-center justify-center text-2xl shadow-xs">🏢</div>
                        )}
                        <div>
                          <h3 className="font-black text-gray-900 text-sm group-hover:text-emerald-600 transition-colors leading-tight">{offre.poste}</h3>
                          <p className="text-xs font-bold text-gray-400 uppercase mt-1 flex items-center gap-1">
                            <span className="text-gray-700 font-black">{offre.entreprise}</span>
                            <span className="text-gray-300">•</span>
                            <span>📍 {offre.localisation}</span>
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] font-black text-gray-400 bg-gray-100 px-2 py-1 rounded-md whitespace-nowrap">{cleanDate}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] font-bold">
                      <div className="bg-emerald-50/60 border border-emerald-100/50 rounded-xl p-2.5 flex flex-col justify-center">
                        <span className="text-gray-400 text-[10px] uppercase font-bold">Contrat</span>
                        <span className="text-emerald-700 uppercase font-black tracking-wide mt-0.5">{offre.typeContrat || 'Contrat'}</span>
                      </div>
                      <div className="bg-blue-50/60 border border-blue-100/50 rounded-xl p-2.5 flex flex-col justify-center">
                        <span className="text-gray-400 text-[10px] uppercase font-bold">Début</span>
                        <span className="text-blue-700 font-black mt-0.5">📅 {dateDebutText}</span>
                      </div>
                      <div className="bg-gray-50 border border-gray-100 rounded-xl p-2.5 col-span-2 flex justify-between items-center">
                        <div>
                          <span className="text-gray-400 text-[10px] uppercase block">Secteur</span>
                          <span className="text-gray-800 font-semibold truncate max-w-[240px] inline-block mt-0.5">{sectLabels[offre.secteur] || offre.secteur}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-gray-400 text-[10px] uppercase block">Expérience</span>
                          <span className="text-gray-800 font-semibold inline-block mt-0.5">{expLabels[offre.experience] || 'Non renseigné'}</span>
                        </div>
                      </div>
                      {offre.dateLimite && (
                        <div className="bg-amber-50/50 border border-amber-100/40 rounded-xl p-2 col-span-2 text-center text-amber-800 text-[10px]">
                          ⏳ Postuler avant le : <span className="font-black">{dateLimiteText}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t border-gray-100 flex justify-between items-center text-[10px] uppercase font-black tracking-widest">
                    <span className="text-gray-400">
                      Rémunération : <span className="text-gray-700 font-black">{remLabels[offre.remuneration] || offre.remuneration || 'NC'}</span>
                    </span>
                    <Link href={`/jobs/${offre.id}`} className="bg-gray-900 hover:bg-emerald-600 text-white hover:text-white px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 normal-case font-bold shadow-2xs">
                      Voir l'offre ➔
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-20 bg-white border border-gray-200 rounded-3xl space-y-3 shadow-3xs">
            <div className="text-4xl text-gray-300">💼</div>
            <p className="text-xs font-black text-gray-700">Aucune offre disponible</p>
          </div>
        )}
      </div>
    </div>
  )
}
