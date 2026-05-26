import React from 'react'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{
    id: string
  }>
}

export default async function PublicProfilePage({ params }: PageProps) {
  const { id } = await params
  const payload = await getPayload({ config: configPromise })

  let targetUser: any = null

  // 1. Récupération des données du membre sélectionné
  try {
    targetUser = await payload.findByID({
      collection: 'alumni',
      id: id,
      depth: 1,
    })
  } catch (error) {
    console.error("Membre introuvable ou ID invalide:", error)
    notFound()
  }

  if (!targetUser) {
    notFound()
  }

  // Configuration des dictionnaires de correspondance (Mappers)
  const remLabels: any = {
    non_renseigne: 'Non renseigné',
    stage_non_indemnise: 'Stage non-indemnisé',
    stage_indemnise: 'Stage indemnisé',
    moins_15k: '< 15k €',
    '20_225k': '20-22,5K €',
    '25_275k': '25-27,5K €',
    '30_325k': '30-32,5K €',
    '35-37,5K €': '35-37,5K €',
    '40_45k': '40-45K €',
    '45_50k': '45-50K €',
    '50_55k': '50-55K €',
    '60_65k': '60-65K €',
    '70_75k': '70-75K €',
  }

  const expLabels: any = {
    non_renseigne: 'Non renseigné',
    '0_2_ans': '0-2 ans',
    '2_4_ans': '2-4 ans',
    '4_7_ans': '4-7 ans',
    '7_10_ans': '7-10 ans',
    plus_10_ans: '+ 10 ans',
  }

  const formatDiplome = (code?: string | null) => {
    if (!code) return 'Cursus non spécifié'
    const mapping: { [key: string]: string } = {
      bts_sio_slam: 'BTS SIO (SLAM)',
      bts_sio_sisr: 'BTS SIO (SISR)',
      bts_assurance: 'BTS Assurance',
      bts_cg: 'BTS CG',
      bts_communication: 'BTS Communication',
      bts_ci: 'BTS Commerce International',
      bts_gpme: 'BTS GPME',
      bts_mco: 'BTS MCO',
      bts_ndrc: 'BTS NDRC',
      bts_sam: 'BTS SAM',
      bts_tourisme: 'BTS Tourisme',
      dcg: 'DCG',
    }
    return mapping[code] || code.replace(/_/g, ' ')
  }

  const avatarSrc =
    (typeof targetUser.photo === 'object' ? targetUser.photo?.url : null) ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(targetUser.prenom || '')}+${encodeURIComponent(targetUser.nom || '')}&size=150&background=800020&color=fff`

  return (
    <div className="min-h-screen bg-[#F6F6FA] py-12 px-4 text-gray-800 antialiased selection:bg-gray-200 text-left font-sans">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Bouton Retour à l'annuaire */}
        <div className="mb-2">
          <Link href="/directory" className="text-xs font-black uppercase text-gray-400 hover:text-[#800020] transition-colors flex items-center gap-1 tracking-wider">
            ➔ Retour à l'annuaire
          </Link>
        </div>

        {/* ── HEADER DU PROFIL PUBLIC RE-STYLISÉ SANS CHEVAUCHEMENT ── */}
        <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
          <div className="h-44 bg-[#800020] relative">
            <div className="absolute inset-0 bg-[radial-gradient(#ffffff15_1px,transparent_1px)] [background-size:16px_16px] opacity-40" />
          </div>
          
          {/* Ajustement de l'alignement vertical sur sm:items-center pour repousser le texte vers le bas */}
          <div className="px-8 pb-8 flex flex-col sm:flex-row items-center sm:items-center -mt-16 sm:-mt-20 gap-6 relative z-10">
            
            {/* Photo de profil sans distorsion */}
            <div className="w-[140px] h-[140px] rounded-3xl border-4 border-white shadow-2xl overflow-hidden bg-white flex-shrink-0 z-20 relative">
              <img
                src={avatarSrc}
                className="w-full h-full absolute inset-0 object-cover object-center"
                alt=""
              />
            </div>

            {/* Zone Identité ajustée avec espacement interne (pt-4) pour éviter le débordement */}
            <div className="flex-1 text-center sm:text-left pt-4 sm:pt-6 min-w-0 space-y-2">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-gray-900 leading-tight">
                  {targetUser.prenom} {targetUser.nom}
                </h1>
                
                {/* Alignement des badges d'états à côté du nom sans rupture */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="inline-block bg-gray-100 text-gray-700 font-black uppercase text-[9px] px-2.5 py-1 rounded-md tracking-wider">
                    {targetUser.statut === 'alumni' ? 'Alumni' : 'Étudiant'} · Promo {targetUser.promotion || 'NC'}
                  </span>
                  {targetUser.isMentor && (
                    <span className="inline-flex items-center gap-1 bg-gradient-to-r from-amber-400 to-amber-500 text-white font-black uppercase text-[9px] px-2.5 py-1 rounded-md tracking-wider shadow-sm border border-amber-300/40">
                      <i className="fa-solid fa-star text-[8px]" />
                      Mentor
                    </span>
                  )}
                </div>
              </div>
              
              <p className="text-sm text-gray-500 font-semibold leading-none">
                {targetUser.poste && targetUser.entreprise
                  ? `${targetUser.poste} @ ${targetUser.entreprise}`
                  : 'École Nationale de Commerce · ENC Bessières'}
              </p>
              
              {targetUser.ville && (
                <p className="text-xs text-gray-400 font-medium flex items-center justify-center sm:justify-start gap-1">
                  <i className="fa-solid fa-location-dot text-[#800020] text-[11px]" />
                  {targetUser.ville}
                </p>
              )}
            </div>

            {/* Bouton de contact direct ré-aligné au centre du conteneur flex */}
            <div className="pt-2 sm:pt-6 self-center sm:self-center">
              <a
                href={`mailto:${targetUser.email}`}
                className="px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-colors shadow-sm flex items-center gap-2"
              >
                <i className="fa-regular fa-envelope" />
                Contacter l'alumni
              </a>
            </div>
          </div>
        </div>

        {/* Bandeau d'information Mentor */}
        {targetUser.isMentor && (
          <div className="p-4 bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200/60 rounded-2xl flex items-start gap-4 shadow-2xs">
            <div className="w-10 h-10 rounded-xl bg-amber-400 flex items-center justify-center flex-shrink-0 shadow-sm">
              <i className="fa-solid fa-star text-white text-sm" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-black text-amber-800 uppercase tracking-wider mb-0.5">
                Membre Mentor
              </p>
              <p className="text-xs text-amber-700/80 font-medium leading-relaxed">
                {targetUser.prenom} est disponible pour transmettre son expérience terrain et accompagner un camarade.
              </p>
            </div>
          </div>
        )}

        {/* ── GRILLE CONTENU DU PROFIL ── */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          
          {/* COLONNE GAUCHE : LIENS & RÉSEAUX */}
          <div className="md:col-span-4 space-y-8">
            <div className="bg-white p-6 rounded-3xl shadow-xl shadow-gray-200/40 border border-gray-100/80">
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                <i className="fa-solid fa-link text-[#800020] text-xs" /> Réseaux & Portfolio
              </h3>
              {targetUser.socialLinks && targetUser.socialLinks.length > 0 ? (
                <div className="space-y-2 pt-2">
                  {targetUser.socialLinks.map((link: any, i: number) => (
                    <a
                      key={i}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-100/80 rounded-xl border border-gray-100 transition-colors group"
                    >
                      <div className="w-7 h-7 bg-white border border-gray-200 text-gray-700 rounded-lg flex items-center justify-center text-sm group-hover:text-[#800020]">
                        <i className={link.icon} />
                      </div>
                      <span className="text-xs font-bold text-gray-700 truncate">{link.label}</span>
                    </a>
                  ))}
                </div>
              ) : (
                <p className="text-center text-xs text-gray-400 italic py-4">Aucun lien public partagé.</p>
              )}
            </div>
          </div>

          {/* COLONNE DROITE : BIO, EXPÉRIENCES & FORMATIONS */}
          <div className="md:col-span-8 space-y-8">
            
            {/* Résumé / Biographie */}
            <section className="bg-white p-6 rounded-3xl shadow-xl shadow-gray-200/40 border border-gray-100/80">
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 mb-4">
                <i className="fa-solid fa-user text-[#800020]" /> À propos de moi
              </h3>
              {targetUser.bio ? (
                <div
                  className="text-sm text-gray-600 leading-relaxed bg-gray-50 p-5 rounded-2xl border border-gray-100 min-h-[60px] prose prose-sm max-w-none break-words"
                  dangerouslySetInnerHTML={{ __html: targetUser.bio }}
                />
              ) : (
                <p className="text-xs text-gray-400 italic py-2">Ce membre n'a pas encore rédigé de résumé de profil.</p>
              )}
            </section>

            {/* Parcours Professionnel */}
            <section className="bg-white p-6 rounded-3xl shadow-xl shadow-gray-200/40 border border-gray-100/80">
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 mb-6">
                <i className="fa-solid fa-briefcase text-[#800020]" /> Parcours Professionnel
              </h3>
              {targetUser.experiences && targetUser.experiences.length > 0 ? (
                <div className="space-y-4">
                  {targetUser.experiences.map((exp: any, i: number) => (
                    <div key={i} className="flex justify-between items-start p-4 bg-gray-50/50 rounded-2xl border border-gray-100">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-black text-gray-900 uppercase text-xs tracking-tight">{exp.poste}</p>
                          {exp.typeContrat && <span className="bg-gray-200/80 text-gray-700 font-black text-[8px] px-1.5 py-0.5 rounded uppercase tracking-wide">{exp.typeContrat}</span>}
                          {exp.isCurrent && <span className="bg-emerald-100 text-emerald-800 font-bold text-[8px] px-1.5 py-0.5 rounded uppercase">Actuel</span>}
                        </div>
                        <p className="text-xs text-gray-600 font-bold">{exp.entreprise} {exp.localite && <span className="text-gray-400 font-medium ml-1">📍 {exp.localite}</span>}</p>
                        <p className="text-[9px] text-gray-400 font-black uppercase tracking-wider">
                          <i className="fa-regular fa-calendar-days mr-1" /> {exp.dateDebut} — {exp.isCurrent ? 'Présent' : exp.dateFin || '---'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400 italic bg-gray-50 p-4 rounded-xl text-center">Aucune expérience professionnelle renseignée.</p>
              )}
            </section>

            {/* Formations & Cursus */}
            <section className="bg-white p-6 rounded-3xl shadow-xl shadow-gray-200/40 border border-gray-100/80">
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 mb-6">
                <i className="fa-solid fa-graduation-cap text-[#800020]" /> Formations & Cursus
              </h3>
              {targetUser.formations && targetUser.formations.length > 0 ? (
                <div className="space-y-4">
                  {targetUser.formations.map((form: any, i: number) => (
                    <div key={i} className="flex justify-between items-start p-4 bg-gray-50/50 rounded-2xl border border-gray-100">
                      <div className="flex gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-base shadow-inner ${form.isENC ? 'bg-[#800020] text-white' : 'bg-zinc-100 text-[#800020]'}`}>
                          <i className={form.isENC ? 'fa-solid fa-award' : 'fa-solid fa-landmark'} />
                        </div>
                        <div>
                          <p className="font-black text-gray-900 text-xs uppercase tracking-tight">{form.nom}</p>
                          <p className="text-xs font-bold text-gray-400 uppercase">{form.etablissement} {form.campus ? ` • ${form.campus}` : form.localiteEtablissement ? ` • ${form.localiteEtablissement}` : ''}</p>
                          <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider">Promotion : {form.annee}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400 italic bg-gray-50 p-4 rounded-xl text-center">Aucun cursus scolaire partagé.</p>
              )}
            </section>

            {/* Centres d'intérêt */}
            <section className="bg-white p-6 rounded-3xl shadow-xl shadow-gray-200/40 border border-gray-100/80">
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 mb-4">
                <i className="fa-solid fa-heart text-[#800020]" /> Centres d'intérêt
              </h3>
              <div className="flex flex-wrap gap-2.5">
                {targetUser.interets && targetUser.interets.length > 0 ? (
                  targetUser.interets.map((int: any, i: number) => (
                    <div key={i} className="px-3 py-1.5 bg-gray-50 text-gray-800 border border-gray-100 rounded-xl font-bold text-[9px] uppercase">
                      {int.nom}
                    </div>
                  ))
                ) : (
                  <p className="text-gray-400 text-xs italic">Aucun centre d'intérêt renseigné.</p>
                )}
              </div>
            </section>

          </div>
        </div>
      </div>
    </div>
  )
}