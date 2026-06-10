import React from 'react'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function PublicProfilePage({ params }: PageProps) {
  const { id } = await params
  const payload = await getPayload({ config: configPromise })

  let targetUser: any = null
  try {
    targetUser = await payload.findByID({ collection: 'alumni', id, depth: 1 })
  } catch {
    notFound()
  }
  if (!targetUser) notFound()

  const formatDiplome = (code?: string | null) => {
    if (!code) return 'Cursus non spécifié'
    const mapping: Record<string, string> = {
      bts_sio_slam: 'BTS SIO (SLAM)', bts_sio_sisr: 'BTS SIO (SISR)',
      bts_assurance: 'BTS Assurance', bts_cg: 'BTS CG',
      bts_communication: 'BTS Communication', bts_ci: 'BTS Commerce International',
      bts_gpme: 'BTS GPME', bts_mco: 'BTS MCO', bts_ndrc: 'BTS NDRC',
      bts_sam: 'BTS SAM', bts_tourisme: 'BTS Tourisme', dcg: 'DCG',
    }
    return mapping[code] || code.replace(/_/g, ' ')
  }

  const avatarSrc =
    (typeof targetUser.photo === 'object' ? targetUser.photo?.url : null) ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(targetUser.prenom || '')}+${encodeURIComponent(targetUser.nom || '')}&size=200&background=800020&color=fff`

  const formatLastSeen = (dateStr?: string | null): string => {
    if (!dateStr) return 'Jamais connecté'
    const date = new Date(dateStr)
    const diffMs = Date.now() - date.getTime()
    const diffMin = Math.floor(diffMs / 60000)
    const diffH = Math.floor(diffMs / 3600000)
    const diffD = Math.floor(diffMs / 86400000)
    if (diffMin < 2) return 'En ligne maintenant'
    if (diffMin < 60) return `Vu il y a ${diffMin} min`
    if (diffH < 24) return `Vu il y a ${diffH}h`
    if (diffD === 1) return 'Vu hier'
    if (diffD < 7) return `Vu il y a ${diffD} jours`
    if (diffD < 30) return `Vu il y a ${Math.floor(diffD / 7)} sem.`
    return `Vu le ${date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}`
  }

  const lastSeenLabel = formatLastSeen(targetUser.lastSeen)
  const isOnline = targetUser.lastSeen &&
    (Date.now() - new Date(targetUser.lastSeen).getTime()) < 5 * 60 * 1000

  return (
    <>
      {/* ── Animations CSS globales ── */}
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.92); }
          to   { opacity: 1; transform: scale(1); }
        }
        .anim-fade-up   { animation: fadeUp  0.5s ease both; }
        .anim-fade-in   { animation: fadeIn  0.4s ease both; }
        .anim-scale-in  { animation: scaleIn 0.4s ease both; }
        .delay-1 { animation-delay: 0.05s; }
        .delay-2 { animation-delay: 0.12s; }
        .delay-3 { animation-delay: 0.20s; }
        .delay-4 { animation-delay: 0.28s; }
        .delay-5 { animation-delay: 0.36s; }
        .delay-6 { animation-delay: 0.44s; }
        .card-hover { transition: box-shadow 0.2s, transform 0.2s; }
        .card-hover:hover { box-shadow: 0 8px 32px rgba(128,0,32,0.08); transform: translateY(-2px); }
      `}</style>

      <div className="min-h-screen bg-[#F4F4F8] text-gray-800 antialiased text-left font-sans">

        {/* ── HERO HEADER ── */}
        <div className="relative bg-[#800020]">
          <div className="absolute inset-0 bg-[radial-gradient(#ffffff12_1px,transparent_1px)] [background-size:20px_20px]" />
          <div className="absolute inset-0 bg-gradient-to-br from-[#800020] via-[#900025] to-[#600018]" />

          <div className="relative max-w-5xl mx-auto px-6 pt-8 pb-10">
            {/* Retour */}
            <Link href="/directory"
              className="anim-fade-in inline-flex items-center gap-2 text-white/60 hover:text-white text-xs font-bold uppercase tracking-widest transition-colors mb-8">
              <i className="fa-solid fa-arrow-left text-[10px]" /> Annuaire
            </Link>

            {/* Contenu hero — tout reste DANS le hero, pas de débordement */}
            <div className="flex flex-col sm:flex-row items-center gap-6">
              {/* Avatar entièrement dans le hero */}
              <div className="anim-scale-in flex-shrink-0 relative">
                <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl border-4 border-white/30 shadow-2xl overflow-hidden">
                  <img src={avatarSrc} alt="" className="w-full h-full object-cover object-center" />
                </div>
                <span className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-[#800020] ${isOnline ? 'bg-emerald-400' : 'bg-gray-400'}`} />
              </div>

              {/* Infos */}
              <div className="anim-fade-up delay-1 flex-1 min-w-0 text-center sm:text-left">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-2">
                  <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                    {targetUser.prenom} {targetUser.nom}
                  </h1>
                  {targetUser.isMentor && (
                    <span className="inline-flex items-center gap-1 bg-amber-400 text-white font-black uppercase text-[9px] px-2.5 py-1 rounded-full tracking-wider shadow-sm">
                      <i className="fa-solid fa-star text-[8px]" /> Mentor
                    </span>
                  )}
                </div>
                <p className="text-white/70 text-sm font-semibold mb-3">
                  {targetUser.poste && targetUser.entreprise
                    ? `${targetUser.poste} · ${targetUser.entreprise}`
                    : 'École Nationale de Commerce · ENC Bessières'}
                </p>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
                  <span className="bg-white/15 text-white/90 font-black uppercase text-[9px] px-2.5 py-1 rounded-full tracking-wider backdrop-blur-sm">
                    {targetUser.statut === 'alumni' ? 'Alumni' : 'Étudiant'}
                    {targetUser.promotion ? ` · Promo ${targetUser.promotion}` : ''}
                  </span>
                  {targetUser.ville && (
                    <span className="flex items-center gap-1 text-white/60 text-[11px] font-semibold">
                      <i className="fa-solid fa-location-dot text-white/40 text-[10px]" />
                      {targetUser.ville}
                    </span>
                  )}
                  <span className="flex items-center gap-1.5 text-[11px] font-semibold text-white/60">
                    <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-white/30'}`} />
                    {lastSeenLabel}
                  </span>
                </div>
              </div>

              {/* ✅ Bouton MP — redirige vers la conversation privée */}
              <div className="anim-fade-up delay-2 flex-shrink-0">
                <Link
                  href={`/messages?userId=${targetUser.id}&prenom=${encodeURIComponent(targetUser.prenom)}&nom=${encodeURIComponent(targetUser.nom)}`}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-[#800020] font-black rounded-xl text-xs uppercase tracking-wider hover:bg-gray-50 transition-all shadow-lg"
                >
                  <i className="fa-regular fa-comment-dots" />
                  Contacter
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Petit espace après le hero */}
        <div className="h-6" />

        {/* ── CONTENU ── */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-16 space-y-6">

          {/* Bandeau mentor */}
          {targetUser.isMentor && (
            <div className="anim-fade-up delay-2 p-4 bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200/60 rounded-2xl flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-amber-400 flex items-center justify-center flex-shrink-0">
                <i className="fa-solid fa-star text-white" />
              </div>
              <div>
                <p className="text-xs font-black text-amber-800 uppercase tracking-wider">Membre Mentor</p>
                <p className="text-xs text-amber-700/80 font-medium mt-0.5">
                  {targetUser.prenom} est disponible pour accompagner les étudiants et jeunes alumni.
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

            {/* ── COLONNE GAUCHE ── */}
            <div className="md:col-span-4 space-y-6">

              {/* Réseaux & Portfolio */}
              <div className="anim-fade-up delay-3 card-hover bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                  <i className="fa-solid fa-link text-[#800020] text-xs" /> Réseaux & Portfolio
                </h3>
                {targetUser.socialLinks?.length > 0 ? (
                  <div className="space-y-2">
                    {targetUser.socialLinks.map((link: any, i: number) => (
                      <a key={i} href={link.url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-3 p-3 bg-gray-50 hover:bg-[#800020]/5 rounded-xl border border-gray-100 transition-colors group">
                        <div className="w-7 h-7 bg-white border border-gray-200 text-gray-500 rounded-lg flex items-center justify-center text-sm group-hover:text-[#800020] group-hover:border-[#800020]/20 transition-colors">
                          <i className={link.icon} />
                        </div>
                        <span className="text-xs font-bold text-gray-600 truncate group-hover:text-gray-900 transition-colors">{link.label}</span>
                        <i className="fa-solid fa-arrow-up-right-from-square text-[9px] text-gray-300 ml-auto group-hover:text-[#800020] transition-colors" />
                      </a>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-xs text-gray-400 italic py-4">Aucun lien public partagé.</p>
                )}
              </div>

              {/* Infos rapides */}
              {(targetUser.diplome || targetUser.promotion || targetUser.ville) && (
                <div className="anim-fade-up delay-4 card-hover bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                  <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                    <i className="fa-solid fa-circle-info text-[#800020] text-xs" /> Informations
                  </h3>
                  <div className="space-y-3">
                    {targetUser.diplome && (
                      <div className="flex items-start gap-3">
                        <div className="w-7 h-7 bg-[#800020]/8 rounded-lg flex items-center justify-center flex-shrink-0">
                          <i className="fa-solid fa-graduation-cap text-[#800020] text-[10px]" />
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-gray-400 uppercase tracking-wide">Diplôme</p>
                          <p className="text-xs font-bold text-gray-700">{formatDiplome(targetUser.diplome)}</p>
                        </div>
                      </div>
                    )}
                    {targetUser.ville && (
                      <div className="flex items-start gap-3">
                        <div className="w-7 h-7 bg-[#800020]/8 rounded-lg flex items-center justify-center flex-shrink-0">
                          <i className="fa-solid fa-location-dot text-[#800020] text-[10px]" />
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-gray-400 uppercase tracking-wide">Localisation</p>
                          <p className="text-xs font-bold text-gray-700">{targetUser.ville}</p>
                        </div>
                      </div>
                    )}
                    <div className="flex items-start gap-3">
                      <div className="w-7 h-7 bg-[#800020]/8 rounded-lg flex items-center justify-center flex-shrink-0">
                        <i className="fa-solid fa-clock text-[#800020] text-[10px]" />
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-wide">Dernière connexion</p>
                        <p className="text-xs font-bold text-gray-700">{lastSeenLabel}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ── COLONNE DROITE ── */}
            <div className="md:col-span-8 space-y-6">

              {/* Bio */}
              <section className="anim-fade-up delay-3 card-hover bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 mb-4">
                  <i className="fa-solid fa-user text-[#800020]" /> À propos
                </h3>
                {targetUser.bio ? (
                  <div
                    className="text-sm text-gray-600 leading-relaxed bg-gray-50 p-5 rounded-2xl border border-gray-100 prose prose-sm max-w-none break-words"
                    dangerouslySetInnerHTML={{ __html: targetUser.bio }}
                  />
                ) : (
                  <p className="text-xs text-gray-400 italic py-2">Ce membre n'a pas encore rédigé de présentation.</p>
                )}
              </section>

              {/* Expériences */}
              <section className="anim-fade-up delay-4 card-hover bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 mb-5">
                  <i className="fa-solid fa-briefcase text-[#800020]" /> Parcours professionnel
                </h3>
                {targetUser.experiences?.length > 0 ? (
                  <div className="space-y-3">
                    {targetUser.experiences.map((exp: any, i: number) => (
                      <div key={i} className="flex gap-4 p-4 bg-gray-50/60 rounded-2xl border border-gray-100 hover:border-[#800020]/15 transition-colors">
                        <div className="w-10 h-10 rounded-xl bg-[#800020]/8 flex items-center justify-center flex-shrink-0">
                          <i className="fa-solid fa-building text-[#800020] text-sm" />
                        </div>
                        <div className="flex-1 min-w-0 space-y-0.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-black text-gray-900 uppercase text-xs tracking-tight">{exp.poste}</p>
                            {exp.typeContrat && (
                              <span className="bg-gray-200/80 text-gray-600 font-black text-[8px] px-1.5 py-0.5 rounded uppercase">{exp.typeContrat}</span>
                            )}
                            {exp.isCurrent && (
                              <span className="bg-emerald-100 text-emerald-700 font-black text-[8px] px-1.5 py-0.5 rounded uppercase">Actuel</span>
                            )}
                          </div>
                          <p className="text-xs font-semibold text-gray-600">
                            {exp.entreprise}
                            {exp.localite && <span className="text-gray-400 ml-1.5">· {exp.localite}</span>}
                          </p>
                          <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wide">
                            {exp.dateDebut} → {exp.isCurrent ? 'Présent' : exp.dateFin || '—'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 italic text-center py-4">Aucune expérience renseignée.</p>
                )}
              </section>

              {/* Formations */}
              <section className="anim-fade-up delay-5 card-hover bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 mb-5">
                  <i className="fa-solid fa-graduation-cap text-[#800020]" /> Formations & Cursus
                </h3>
                {targetUser.formations?.length > 0 ? (
                  <div className="space-y-3">
                    {targetUser.formations.map((form: any, i: number) => (
                      <div key={i} className="flex gap-4 p-4 bg-gray-50/60 rounded-2xl border border-gray-100 hover:border-[#800020]/15 transition-colors">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${form.isENC ? 'bg-[#800020] text-white' : 'bg-gray-100 text-[#800020]'}`}>
                          <i className={form.isENC ? 'fa-solid fa-award' : 'fa-solid fa-landmark'} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-black text-gray-900 text-xs uppercase tracking-tight">{form.nom}</p>
                          <p className="text-xs font-semibold text-gray-400 uppercase mt-0.5">
                            {form.etablissement}
                            {form.campus ? ` · ${form.campus}` : ''}
                          </p>
                          <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider">Promo {form.annee}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 italic text-center py-4">Aucun cursus partagé.</p>
                )}
              </section>

              {/* Centres d'intérêt */}
              {targetUser.interets?.length > 0 && (
                <section className="anim-fade-up delay-6 card-hover bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                  <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 mb-4">
                    <i className="fa-solid fa-heart text-[#800020]" /> Centres d'intérêt
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {targetUser.interets.map((int: any, i: number) => (
                      <span key={i} className="px-3 py-1.5 bg-[#800020]/6 text-[#800020] border border-[#800020]/12 rounded-xl font-black text-[9px] uppercase tracking-wider hover:bg-[#800020]/10 transition-colors cursor-default">
                        {int.nom}
                      </span>
                    ))}
                  </div>
                </section>
              )}

            </div>
          </div>
        </div>
      </div>
    </>
  )
}
