'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface ParticipantData {
  id: string
  prenom: string
  nom: string
  photoUrl: string | null
}

interface EvtData {
  id: string
  nom: string
  slug: string
  categorie: string
  catLabel: string
  catColor: string
  catIcon: string
  typeLocalisation: string
  lieuNom: string | null
  lieuAdresse: string | null
  lienVisio: string | null
  dateDebut: string
  dateFin: string
  statut: string
  coverUrl: string | null
  description: string
  modeInscription: string
  lienExterne: string | null
  participantsCount: number
  capaciteMax: number | null
  prixEntree: number | null
  contact: string | null
  tags: string | null
  isPast: boolean
  isOrganisateur: boolean
  isParticipant: boolean
  currentUserId: string | null
  organisateur: { id: string; prenom: string; nom: string; photoUrl: string | null; poste: string | null } | null
  participantsList: ParticipantData[]
  formatDateDebut: string
  formatDateFin: string
  formatTimeDebut: string
  formatTimeFin: string
}

export default function EventDetailClient({ evt }: { evt: EvtData }) {
  const router = useRouter()
  const [participating, setParticipating] = useState(evt.isParticipant)
  const [count, setCount] = useState(evt.participantsCount)
  const [loading, setLoading] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [deleting, setDeleting] = useState(false)

  const handleParticipate = async () => {
    if (!evt.currentUserId) { router.push(`/login?redirect=/evenements/${evt.slug}`); return }
    if (loading) return
    setLoading(true)
    try {
      const res = await fetch(`/api/evenements/${evt.id}/participate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ join: !participating }),
      })
      if (res.ok) {
        setParticipating(!participating)
        setCount(c => participating ? c - 1 : c + 1)
      }
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const handleDelete = async () => {
    if (deleteConfirm !== evt.nom || deleting) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/evenements/${evt.id}`, { method: 'DELETE', credentials: 'include' })
      if (res.ok) router.push('/evenements')
    } catch (e) { console.error(e) }
    finally { setDeleting(false) }
  }

  const sameDay = evt.dateDebut.slice(0, 10) === evt.dateFin.slice(0, 10)
  const isLive = new Date(evt.dateDebut) <= new Date() && new Date(evt.dateFin) >= new Date()
  const isFuture = new Date(evt.dateDebut) > new Date()
  const minutesLeft = isLive ? Math.round((new Date(evt.dateFin).getTime() - Date.now()) / 60000) : null
  const endingSoon = minutesLeft !== null && minutesLeft <= 30 && minutesLeft > 0
  const minutesUntilStart = isFuture ? Math.round((new Date(evt.dateDebut).getTime() - Date.now()) / 60000) : null
  const startingSoon = minutesUntilStart !== null && minutesUntilStart <= 30 && minutesUntilStart > 0

  const formatTimeLeft = (min: number) => {
    if (min < 60) return `${min} min`
    const h = Math.floor(min / 60)
    const m = min % 60
    return `${h}h${m > 0 ? m.toString().padStart(2, '0') : ''}`
  }

  return (
    <>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
        .anim-fade-up { animation: fadeUp 0.45s ease both; }
        .anim-fade-in { animation: fadeIn 0.3s ease both; }
        .d1{animation-delay:.06s} .d2{animation-delay:.12s} .d3{animation-delay:.18s} .d4{animation-delay:.24s}
        .card-hover { transition: box-shadow 0.2s, transform 0.2s; }
        .card-hover:hover { box-shadow: 0 8px 24px rgba(0,0,0,0.08); transform: translateY(-1px); }
      `}</style>

      {/* Modale suppression */}
      {showDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" style={{animation:'fadeIn 0.2s ease'}}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden" style={{animation:'scaleIn 0.2s ease'}}>
            <div className="bg-red-50 border-b border-red-100 px-6 py-5 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center text-lg">🗑️</div>
              <div>
                <h3 className="text-sm font-black text-gray-900">Supprimer l'événement</h3>
                <p className="text-xs text-red-600 font-medium mt-0.5">Action irréversible</p>
              </div>
              <button onClick={() => setShowDelete(false)} className="ml-auto text-gray-400 hover:text-gray-600 cursor-pointer">✕</button>
            </div>
            <div className="px-6 py-5 space-y-3">
              <p className="text-sm text-gray-600">Tapez <span className="font-black text-gray-900">"{evt.nom}"</span> pour confirmer.</p>
              <input type="text" value={deleteConfirm} onChange={e => setDeleteConfirm(e.target.value)}
                placeholder={evt.nom}
                className={`w-full px-4 py-3 bg-gray-50 border rounded-xl text-sm font-medium outline-none transition-colors ${deleteConfirm === evt.nom ? 'border-red-400 bg-red-50' : 'border-gray-200'}`} />
              {deleteConfirm === evt.nom && <p className="text-[10px] text-emerald-600 font-bold">✓ Confirmation valide</p>}
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button onClick={() => setShowDelete(false)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-xs font-black uppercase text-gray-600 hover:bg-gray-50 cursor-pointer">Annuler</button>
              <button onClick={handleDelete} disabled={deleteConfirm !== evt.nom || deleting}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-40 rounded-xl text-xs font-black uppercase text-white cursor-pointer flex items-center justify-center gap-2">
                {deleting ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : '🗑️ Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-gray-50 min-h-screen font-sans">

        {/* ── HERO ── */}
        <div className="relative w-full h-72 md:h-96 overflow-hidden bg-gray-900">
          {evt.coverUrl ? (
            <img src={evt.coverUrl} alt="" className="absolute inset-0 w-full h-full object-cover" loading="eager" />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center text-8xl">
              {evt.catIcon}
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

          {/* Retour */}
          <div className="absolute top-4 left-4">
            <Link href="/evenements"
              className="inline-flex items-center gap-1.5 bg-black/30 backdrop-blur-sm text-white text-xs font-bold uppercase tracking-wide px-3 py-2 rounded-xl border border-white/10 hover:bg-black/50 transition-all">
              ← Événements
            </Link>
          </div>

          {/* Actions organisateur */}
          {evt.isOrganisateur && (
            <div className="absolute top-4 right-4 flex gap-2">
              <Link href={`/evenements/${evt.slug}/edit`}
                className="inline-flex items-center gap-1.5 bg-black/30 backdrop-blur-sm text-white text-xs font-bold uppercase tracking-wide px-3 py-2 rounded-xl border border-white/10 hover:bg-black/50 transition-all">
                ⚙️ Modifier
              </Link>
              <button onClick={() => setShowDelete(true)}
                className="inline-flex items-center gap-1.5 bg-red-600/80 backdrop-blur-sm text-white text-xs font-bold uppercase tracking-wide px-3 py-2 rounded-xl border border-red-400/30 hover:bg-red-600 transition-all cursor-pointer">
                🗑️ Supprimer
              </button>
            </div>
          )}

          {/* Infos en bas du hero */}
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <div className="max-w-4xl mx-auto">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full ${evt.catColor}`}>
                  {evt.catIcon} {evt.catLabel}
                </span>
                <span className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full ${evt.typeLocalisation === 'presentiel' ? 'bg-emerald-500/90 text-white' : 'bg-blue-500/90 text-white'}`}>
                  {evt.typeLocalisation === 'presentiel' ? '📍 Présentiel' : '💻 En ligne'}
                </span>
                {evt.isPast && (
                  <span className="text-[9px] font-black uppercase px-2.5 py-1 rounded-full bg-gray-500/80 text-white">Événement passé</span>
                )}
                {isLive && (
                  <span className="text-[9px] font-black uppercase px-2.5 py-1 rounded-full bg-red-500/90 text-white flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" /> En direct maintenant
                  </span>
                )}
                {evt.prixEntree && Number(evt.prixEntree) > 0 ? (
                  <span className="text-[9px] font-black uppercase px-2.5 py-1 rounded-full bg-amber-500/90 text-white">💶 {evt.prixEntree}€</span>
                ) : (
                  <span className="text-[9px] font-black uppercase px-2.5 py-1 rounded-full bg-white/20 text-white">🎫 Gratuit</span>
                )}
              </div>
              <h1 className="text-2xl sm:text-4xl font-black text-white leading-tight drop-shadow-lg">
                {evt.nom}
              </h1>
              <p className="text-white/70 text-sm font-medium mt-2">
                📅 {evt.formatDateDebut}
                {!sameDay && ` → ${evt.formatDateFin}`}
                <span className="ml-2 text-white/50">· {evt.formatTimeDebut} – {evt.formatTimeFin}</span>
              </p>
            </div>
          </div>
        </div>

        {/* ── CONTENU ── */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── COLONNE PRINCIPALE ── */}
          <div className="lg:col-span-2 space-y-5">

            {/* Description */}
            <section className="anim-fade-up card-hover bg-white border border-gray-100 rounded-2xl p-6 shadow-xs">
              <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <i className="fa-solid fa-align-left text-[#800020] text-xs" /> À propos
              </h2>
              {evt.description ? (
                <div className="prose prose-sm max-w-none text-gray-600 leading-relaxed whitespace-pre-wrap text-sm">
                  {evt.description}
                </div>
              ) : (
                <p className="text-sm text-gray-400 italic">Aucune description disponible.</p>
              )}
            </section>

            {/* Lieu */}
            {(evt.lieuNom || evt.lienVisio) && (
              <section className="anim-fade-up d1 card-hover bg-white border border-gray-100 rounded-2xl p-6 shadow-xs">
                <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  {evt.typeLocalisation === 'presentiel' ? '📍' : '💻'} {evt.typeLocalisation === 'presentiel' ? 'Lieu' : 'Accès en ligne'}
                </h2>
                {evt.typeLocalisation === 'presentiel' ? (
                  <div className="space-y-1">
                    <p className="font-black text-gray-900 text-sm">{evt.lieuNom}</p>
                    {evt.lieuAdresse && <p className="text-xs text-gray-500 font-medium">{evt.lieuAdresse}</p>}
                    {evt.lieuAdresse && (
                      <a href={`https://maps.google.com/?q=${encodeURIComponent(evt.lieuAdresse)}`}
                        target="_blank" rel="noreferrer"
                        className="inline-flex items-center gap-1.5 mt-2 text-[10px] font-black text-[#800020] hover:underline">
                        <i className="fa-solid fa-map-location-dot text-xs" /> Voir sur Google Maps
                      </a>
                    )}
                  </div>
                ) : (
                  <a href={evt.lienVisio!} target="_blank" rel="noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase tracking-wide transition-colors">
                    <i className="fa-solid fa-video text-xs" /> Rejoindre la visio
                  </a>
                )}
              </section>
            )}

            {/* Participants */}
            {count > 0 && (
              <section className="anim-fade-up d2 card-hover bg-white border border-gray-100 rounded-2xl p-6 shadow-xs">
                <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <i className="fa-solid fa-users text-[#800020] text-xs" /> Participants · <span className="text-[#800020]">{count}</span>
                  {evt.capaciteMax && <span className="text-gray-300">/ {evt.capaciteMax}</span>}
                </h2>
                <div className="flex flex-wrap gap-2">
                  {evt.participantsList.map(p => {
                    const initials = `${p.prenom[0] || ''}${p.nom[0] || ''}`.toUpperCase()
                    return (
                      <Link key={p.id} href={`/profile/${p.id}`}
                        className="group flex items-center gap-2 bg-gray-50 hover:bg-[#800020]/5 border border-gray-100 hover:border-[#800020]/20 px-3 py-2 rounded-xl transition-all">
                        <div className="w-7 h-7 rounded-full overflow-hidden bg-[#800020] flex items-center justify-center flex-shrink-0">
                          {p.photoUrl
                            ? <img src={p.photoUrl} alt="" className="w-full h-full object-cover" />
                            : <span className="text-white text-[9px] font-black">{initials}</span>
                          }
                        </div>
                        <span className="text-xs font-bold text-gray-700 group-hover:text-[#800020] transition-colors">
                          {p.prenom} {p.nom}
                        </span>
                      </Link>
                    )
                  })}
                  {count > 12 && (
                    <div className="flex items-center px-3 py-2 bg-gray-50 border border-gray-100 rounded-xl">
                      <span className="text-xs font-black text-gray-400">+{count - 12} autres</span>
                    </div>
                  )}
                </div>
              </section>
            )}
          </div>

          {/* ── SIDEBAR ── */}
          <div className="space-y-4">

            {/* CTA inscription */}
            <div className="anim-fade-in card-hover bg-white border border-gray-100 rounded-2xl p-5 shadow-xs space-y-3 sticky top-6">
              {!evt.isPast && evt.statut === 'publie' && (
                <>
                  {evt.modeInscription === 'libre' ? (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
                      <p className="text-xs font-black text-emerald-700">🚪 Entrée libre</p>
                      <p className="text-[10px] text-emerald-600 mt-0.5">Aucune inscription requise</p>
                    </div>
                  ) : evt.modeInscription === 'externe' && evt.lienExterne ? (
                    <a href={evt.lienExterne} target="_blank" rel="noreferrer"
                      className="block text-center py-3 bg-[#800020] hover:bg-[#600018] text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-sm hover:-translate-y-0.5">
                      🔗 S'inscrire via le lien externe
                    </a>
                  ) : (
                    <>
                      {evt.capaciteMax && (
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-[10px] font-bold text-gray-500">
                            <span>Places disponibles</span>
                            <span className="font-black text-gray-700">{Math.max(0, evt.capaciteMax - count)} / {evt.capaciteMax}</span>
                          </div>
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-[#800020] rounded-full transition-all" style={{ width: `${Math.min(100, (count / evt.capaciteMax) * 100)}%` }} />
                          </div>
                        </div>
                      )}
                      {!evt.currentUserId ? (
                        <Link href={`/login?redirect=/evenements/${evt.slug}`}
                          className="block text-center py-3 bg-[#800020] hover:bg-[#600018] text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-sm hover:-translate-y-0.5">
                          Se connecter pour s'inscrire
                        </Link>
                      ) : (
                        <button onClick={handleParticipate} disabled={loading || (!!evt.capaciteMax && count >= evt.capaciteMax && !participating)}
                          className={`w-full py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 shadow-sm hover:-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed ${
                            participating
                              ? 'bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-red-50 hover:border-red-200 hover:text-red-600'
                              : 'bg-[#800020] text-white hover:bg-[#600018]'
                          }`}>
                          {loading
                            ? <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            : participating ? '✓ Inscrit · Annuler mon inscription' : '+ Participer à cet événement'
                          }
                        </button>
                      )}
                    </>
                  )}
                </>
              )}

              {evt.isPast && (
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl text-center">
                  <p className="text-xs font-black text-gray-500">⏪ Événement terminé</p>
                </div>
              )}

              {endingSoon && (
                <div className="p-3 bg-orange-50 border border-orange-200 rounded-xl text-center" style={{ animation: 'fadeIn 0.3s ease' }}>
                  <p className="text-xs font-black text-orange-700">⏰ Se termine dans {formatTimeLeft(minutesLeft!)}</p>
                </div>
              )}

              {startingSoon && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-center" style={{ animation: 'fadeIn 0.3s ease' }}>
                  <p className="text-xs font-black text-blue-700">🚀 Commence dans {formatTimeLeft(minutesUntilStart!)}</p>
                </div>
              )}
            </div>

            {/* Infos */}
            <div className="anim-fade-up d1 card-hover bg-white border border-gray-100 rounded-2xl p-5 shadow-xs space-y-3">
              <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Informations</h2>
              {[
                { icon: '📅', label: 'Début', val: `${evt.formatDateDebut} à ${evt.formatTimeDebut}` },
                { icon: '🏁', label: 'Fin', val: `${evt.formatDateFin} à ${evt.formatTimeFin}` },
                { icon: evt.typeLocalisation === 'presentiel' ? '📍' : '💻', label: 'Format', val: evt.typeLocalisation === 'presentiel' ? (evt.lieuNom || 'En présentiel') : 'En ligne' },
                { icon: '👥', label: 'Participants', val: `${count}${evt.capaciteMax ? ` / ${evt.capaciteMax}` : ''}` },
                evt.prixEntree && Number(evt.prixEntree) > 0 ? { icon: '💶', label: 'Prix', val: `${evt.prixEntree}€` } : { icon: '🎫', label: 'Prix', val: 'Gratuit' },
              ].filter(Boolean).map(({ icon, label, val }: any) => (
                <div key={label} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0 text-sm">{icon}</div>
                  <div>
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-wider">{label}</p>
                    <p className="text-xs font-bold text-gray-800">{val}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Organisateur */}
            {evt.organisateur && (
              <div className="anim-fade-up d2 card-hover bg-white border border-gray-100 rounded-2xl p-5 shadow-xs">
                <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Organisateur</h2>
                <Link href={`/profile/${evt.organisateur.id}`} className="flex items-center gap-3 group">
                  <div className="w-10 h-10 rounded-xl overflow-hidden bg-[#800020] flex items-center justify-center flex-shrink-0">
                    {evt.organisateur.photoUrl
                      ? <img src={evt.organisateur.photoUrl} alt="" className="w-full h-full object-cover" />
                      : <span className="text-white text-xs font-black">{evt.organisateur.prenom[0]}{evt.organisateur.nom[0]}</span>
                    }
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-black text-gray-900 group-hover:text-[#800020] transition-colors">
                      {evt.organisateur.prenom} {evt.organisateur.nom}
                    </p>
                    {evt.organisateur.poste && <p className="text-[10px] text-gray-400 font-medium truncate">{evt.organisateur.poste}</p>}
                  </div>
                  <i className="fa-solid fa-arrow-right text-[10px] text-gray-300 ml-auto group-hover:text-[#800020] transition-colors" />
                </Link>
                {evt.contact && (
                  <a href={`mailto:${evt.contact}`} className="mt-3 flex items-center gap-1.5 text-[10px] font-bold text-gray-500 hover:text-[#800020] transition-colors">
                    <i className="fa-regular fa-envelope text-xs" /> {evt.contact}
                  </a>
                )}
              </div>
            )}

            {/* Tags */}
            {evt.tags && (
              <div className="anim-fade-up d3 bg-white border border-gray-100 rounded-2xl p-5 shadow-xs">
                <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Tags</h2>
                <div className="flex flex-wrap gap-1.5">
                  {evt.tags.split(',').map(t => t.trim()).filter(Boolean).map(tag => (
                    <span key={tag} className="text-[10px] font-bold text-gray-600 bg-gray-100 px-2.5 py-1 rounded-full">#{tag}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
