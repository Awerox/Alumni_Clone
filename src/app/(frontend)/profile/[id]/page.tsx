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


  const animStyles = `
    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(20px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes fadeIn {
      from { opacity: 0; }
      to   { opacity: 1; }
    }
    @keyframes scaleIn {
      from { opacity: 0; transform: scale(0.95); }
      to   { opacity: 1; transform: scale(1); }
    }
    .anim-fade-up  { animation: fadeUp  0.5s ease both; }
    .anim-fade-in  { animation: fadeIn  0.4s ease both; }
    .anim-scale-in { animation: scaleIn 0.4s ease both; }
    .d1 { animation-delay: 0.05s; }
    .d2 { animation-delay: 0.12s; }
    .d3 { animation-delay: 0.20s; }
    .d4 { animation-delay: 0.28s; }
    .d5 { animation-delay: 0.36s; }
    .d6 { animation-delay: 0.44s; }
    .card-hover { transition: box-shadow 0.25s, transform 0.25s; }
    .card-hover:hover { box-shadow: 0 8px 32px rgba(128,0,32,0.10); transform: translateY(-2px); }
  `

  return (
    <>
      <style>{animStyles}</style>
      <div className="min-h-screen bg-[#F6F6FA] py-12 px-4 text-gray-800 antialiased selection:bg-gray-200 text-left font-sans">
      <div className="max-w-5xl mx-auto space-y-8">

        {/* Retour */}
        <Link href="/directory" className="text-xs font-black uppercase text-gray-400 hover:text-[#800020] transition-colors flex items-center gap-1 tracking-wider">
          ➔ Retour à l'annuaire
        </Link>

        {/* ── HEADER ── */}
        <div className="anim-scale-in bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
          {/* Bannière bordeaux — assez haute pour contenir la photo */}
          <div className="h-52 bg-[#800020] relative flex items-center px-8 gap-6">
            <div className="absolute inset-0 bg-[radial-gradient(#ffffff15_1px,transparent_1px)] [background-size:16px_16px] opacity-40" />
            <div className="absolute inset-0 bg-gradient-to-br from-[#800020] via-[#900025] to-[#600018]" />

            {/* Photo entièrement dans la bannière */}
            <div className="relative z-10 flex-shrink-0">
              <div className="anim-scale-in d1 w-32 h-32 rounded-2xl border-4 border-white/30 shadow-2xl overflow-hidden">
                <img src={avatarSrc} alt="" className="w-full h-full object-cover object-center" />
              </div>
              {/* Indicateur en ligne */}
              <span className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-[#800020] ${isOnline ? 'bg-emerald-400' : 'bg-gray-400'}`} />
            </div>

            {/* Infos identité */}
            <div className="anim-fade-up d1 relative z-10 flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  {targetUser.prenom} {targetUser.nom}
                </h1>
                {targetUser.isMentor && (
                  <span className="inline-flex items-center gap-1 bg-amber-400 text-white font-black uppercase text-[9px] px-2.5 py-1 rounded-full tracking-wider">
                    <i className="fa-solid fa-star text-[8px]" /> Mentor
                  </span>
                )}
              </div>
              <p className="text-white/70 text-sm font-semibold mb-2">
                {targetUser.poste && targetUser.entreprise
                  ? `${targetUser.poste} · ${targetUser.entreprise}`
                  : 'École Nationale de Commerce · ENC Bessières'}
              </p>
              <div className="flex flex-wrap items-center gap-3">
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

            {/* ✅ Bouton MP */}
            <div className="anim-fade-in d2 relative z-10 flex-shrink-0">
              <Link
                href={`/messages?userId=${targetUser.id}&prenom=${encodeURIComponent(targetUser.prenom)}&nom=${encodeURIComponent(targetUser.nom)}`}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-[#800020] font-black rounded-xl text-xs uppercase tracking-wider hover:bg-gray-50 transition-all shadow-lg"
              >
                <i className="fa-regular fa-comment-dots" />
                Contacter l'alumni
              </Link>
            </div>
          </div>
        </div>

        {/* Bandeau mentor */}
        {targetUser.isMentor && (
          <div className="anim-fade-up d2 p-4 bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200/60 rounded-2xl flex items-start gap-4 shadow-2xs">
            <div className="w-10 h-10 rounded-xl bg-amber-400 flex items-center justify-center flex-shrink-0 shadow-sm">
              <i className="fa-solid fa-star text-white text-sm" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-black text-amber-800 uppercase tracking-wider mb-0.5">Membre Mentor</p>
              <p className="text-xs text-amber-700/80 font-medium leading-relaxed">
                {targetUser.prenom} est disponible pour transmettre son expérience terrain et accompagner un camarade.
              </p>
            </div>
          </div>
        )}

        {/* ── GRILLE ── */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">

          {/* COLONNE GAUCHE */}
          <div className="md:col-span-4 space-y-8">

            <div className="anim-fade-up d3 card-hover bg-white p-6 rounded-3xl shadow-xl shadow-gray-200/40 border border-gray-100/80">
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                <i className="fa-solid fa-link text-[#800020] text-xs" /> Réseaux & Portfolio
              </h3>
              {targetUser.socialLinks?.length > 0 ? (
                <div className="space-y-2 pt-2">
                  {targetUser.socialLinks.map((link: any, i: number) => (
                    <a key={i} href={link.url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-100/80 rounded-xl border border-gray-100 transition-colors group">
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

            {/* Infos */}
            <div className="anim-fade-up d4 card-hover bg-white p-6 rounded-3xl shadow-xl shadow-gray-200/40 border border-gray-100/80">
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                <i className="fa-solid fa-circle-info text-[#800020] text-xs" /> Informations
              </h3>
              <div className="space-y-4">
                {[
                  { label: 'Email', value: targetUser.email },
                  { label: 'Localisation', value: targetUser.ville || 'Non renseigné' },
                  { label: 'Dernière connexion', value: lastSeenLabel },
                ].map(({ label, value }) => (
                  <div key={label} className="p-3 bg-gray-50 rounded-xl">
                    <p className="text-[9px] font-black text-gray-400 uppercase mb-0.5">{label}</p>
                    <p className="text-xs font-bold text-gray-800 truncate">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* COLONNE DROITE */}
          <div className="md:col-span-8 space-y-8">

            <section className="anim-fade-up d3 card-hover bg-white p-6 rounded-3xl shadow-xl shadow-gray-200/40 border border-gray-100/80">
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 mb-4">
                <i className="fa-solid fa-user text-[#800020]" /> À propos de moi
              </h3>
              {targetUser.bio ? (
                <div className="text-sm text-gray-600 leading-relaxed bg-gray-50 p-5 rounded-2xl border border-gray-100 min-h-[60px] prose prose-sm max-w-none break-words"
                  dangerouslySetInnerHTML={{ __html: targetUser.bio }} />
              ) : (
                <p className="text-xs text-gray-400 italic py-2">Ce membre n'a pas encore rédigé de résumé de profil.</p>
              )}
            </section>

            <section className="anim-fade-up d4 card-hover bg-white p-6 rounded-3xl shadow-xl shadow-gray-200/40 border border-gray-100/80">
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 mb-6">
                <i className="fa-solid fa-briefcase text-[#800020]" /> Parcours Professionnel
              </h3>
              {targetUser.experiences?.length > 0 ? (
                <div className="space-y-4">
                  {targetUser.experiences.map((exp: any, i: number) => (
                    <div key={i} className="flex justify-between items-start p-4 bg-gray-50/50 rounded-2xl border border-gray-100">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-black text-gray-900 uppercase text-xs tracking-tight">{exp.poste}</p>
                          {exp.typeContrat && <span className="bg-gray-200/80 text-gray-700 font-black text-[8px] px-1.5 py-0.5 rounded uppercase">{exp.typeContrat}</span>}
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

            <section className="anim-fade-up d5 card-hover bg-white p-6 rounded-3xl shadow-xl shadow-gray-200/40 border border-gray-100/80">
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 mb-6">
                <i className="fa-solid fa-graduation-cap text-[#800020]" /> Formations & Cursus
              </h3>
              {targetUser.formations?.length > 0 ? (
                <div className="space-y-4">
                  {targetUser.formations.map((form: any, i: number) => (
                    <div key={i} className="flex justify-between items-start p-4 bg-gray-50/50 rounded-2xl border border-gray-100">
                      <div className="flex gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-base shadow-inner ${form.isENC ? 'bg-[#800020] text-white' : 'bg-zinc-100 text-[#800020]'}`}>
                          <i className={form.isENC ? 'fa-solid fa-award' : 'fa-solid fa-landmark'} />
                        </div>
                        <div>
                          <p className="font-black text-gray-900 text-xs uppercase tracking-tight">{form.nom}</p>
                          <p className="text-xs font-bold text-gray-400 uppercase">{form.etablissement}{form.campus ? ` • ${form.campus}` : ''}</p>
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

            <section className="anim-fade-up d6 card-hover bg-white p-6 rounded-3xl shadow-xl shadow-gray-200/40 border border-gray-100/80">
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 mb-4">
                <i className="fa-solid fa-heart text-[#800020]" /> Centres d'intérêt
              </h3>
              <div className="flex flex-wrap gap-2.5">
                {targetUser.interets?.length > 0 ? (
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
    </>
  )
}
