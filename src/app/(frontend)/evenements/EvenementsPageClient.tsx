'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface Evenement {
  id: string
  nom: string
  slug: string
  categorie: string
  catLabel: string
  typeLocalisation: 'presentiel' | 'enligne'
  dateDebut: string
  dateFin: string
  statut: string
  coverUrl: string | null
  organisateurNom: string | null
  participantsCount: number
  isOrganisateur: boolean
  isParticipant: boolean
}

interface Props {
  initialTab: string
  initialQ: string
  initialLocalisation: string
  initialCategorie: string
  aVenir: Evenement[]
  enCours: Evenement[]
  passes: Evenement[]
  participations: Evenement[]
  brouillons: Evenement[]
  currentUserId: string
}

const CAT_COLORS: Record<string, string> = {
  conference: 'bg-blue-100 text-blue-700',
  reseau: 'bg-purple-100 text-purple-700',
  formation: 'bg-indigo-100 text-indigo-700',
  ceremonie: 'bg-yellow-100 text-yellow-700',
  gala: 'bg-pink-100 text-pink-700',
  atelier: 'bg-amber-100 text-amber-700',
  table_ronde: 'bg-teal-100 text-teal-700',
  webinaire: 'bg-cyan-100 text-cyan-700',
  reunion: 'bg-gray-100 text-gray-700',
  jpo: 'bg-emerald-100 text-emerald-700',
  salon: 'bg-orange-100 text-orange-700',
}

const CAT_ICONS: Record<string, string> = {
  conference: '🎤', reseau: '🤝', formation: '📚', ceremonie: '🎓',
  gala: '🥂', atelier: '🛠️', table_ronde: '💬', webinaire: '💻',
  reunion: '📋', jpo: '🏫', salon: '🎪',
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

function formatDateShort(dateStr: string) {
  const d = new Date(dateStr)
  return { day: d.getDate(), month: d.toLocaleDateString('fr-FR', { month: 'short' }), year: d.getFullYear() }
}

function EventCard({ evt, index, currentUserId, onParticipate }: {
  evt: Evenement
  index: number
  currentUserId: string
  onParticipate: (id: string, join: boolean) => void
}) {
  const [visible, setVisible] = useState(false)
  const [participating, setParticipating] = useState(evt.isParticipant)
  const [loading, setLoading] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [published, setPublished] = useState(false)
  const [showScheduler, setShowScheduler] = useState(false)
  const [scheduleDate, setScheduleDate] = useState(evt.dateDebut?.slice(0, 10) || '')
  const [scheduleTime, setScheduleTime] = useState(evt.dateDebut ? new Date(evt.dateDebut).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '09:00')
  const [scheduling, setScheduling] = useState(false)
  const dateD = formatDateShort(evt.dateDebut)
  const isPast = new Date(evt.dateFin) < new Date()
  const isLive = new Date(evt.dateDebut) <= new Date() && new Date(evt.dateFin) >= new Date()
  const minutesLeft = isLive ? Math.round((new Date(evt.dateFin).getTime() - Date.now()) / 60000) : null
  const endingSoon = minutesLeft !== null && minutesLeft <= 30 && minutesLeft > 0
  const minutesSinceEnd = isPast ? Math.round((Date.now() - new Date(evt.dateFin).getTime()) / 60000) : null
  const recentlyEnded = minutesSinceEnd !== null && minutesSinceEnd < 24 * 60
  const formatElapsed = (min: number) => {
    if (min < 60) return `${min} min`
    const h = Math.floor(min / 60)
    return `${h}h`
  }

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), index * 60)
    return () => clearTimeout(t)
  }, [index])

  const handleParticipate = async () => {
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
        onParticipate(evt.id, !participating)
      }
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const handlePublish = async () => {
    if (publishing) return
    setPublishing(true)
    try {
      const res = await fetch(`/api/evenements/${evt.id}/publish`, {
        method: 'POST',
        credentials: 'include',
      })
      if (res.ok) setPublished(true)
    } catch (e) { console.error(e) }
    finally { setPublishing(false) }
  }

  const handleSchedule = async () => {
    if (!scheduleDate || scheduling) return
    setScheduling(true)
    try {
      const res = await fetch(`/api/evenements/${evt.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          dateDebut: new Date(`${scheduleDate}T${scheduleTime}:00`).toISOString(),
          statut: 'programme',
        }),
      })
      if (res.ok) { setPublished(true); setShowScheduler(false) }
    } catch (e) { console.error(e) }
    finally { setScheduling(false) }
  }

  if (published) return (
    <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-center">
      <p className="text-xs font-black text-emerald-700">✓ Événement publié avec succès</p>
    </div>
  )

  return (
    <div
      className="group bg-white rounded-2xl border border-gray-100 overflow-hidden flex flex-col"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(20px)',
        transition: 'opacity 0.4s ease, transform 0.4s ease, box-shadow 0.2s, border-color 0.2s',
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      }}
      onMouseEnter={e => Object.assign((e.currentTarget as HTMLElement).style, { boxShadow: '0 12px 32px rgba(0,0,0,0.10)', borderColor: '#e2e8f0', transform: 'translateY(-3px)' })}
      onMouseLeave={e => Object.assign((e.currentTarget as HTMLElement).style, { boxShadow: '0 1px 4px rgba(0,0,0,0.06)', borderColor: '#f3f4f6', transform: 'translateY(0)' })}
    >
      {/* Couverture */}
      <div className="relative h-44 bg-gradient-to-br from-gray-800 to-gray-900 overflow-hidden flex-shrink-0">
        {evt.coverUrl ? (
          <img src={evt.coverUrl} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl">
            {CAT_ICONS[evt.categorie] || '📅'}
          </div>
        )}
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {/* Date badge */}
        <div className="absolute top-3 left-3 bg-white rounded-xl shadow-lg overflow-hidden text-center w-12">
          <div className="bg-[#800020] py-0.5">
            <p className="text-[9px] font-black text-white uppercase">{dateD.month}</p>
          </div>
          <div className="py-1">
            <p className="text-lg font-black text-gray-900 leading-none">{dateD.day}</p>
            <p className="text-[8px] text-gray-400 font-bold">{dateD.year}</p>
          </div>
        </div>

        {/* Badge statut principal — gros, en haut à droite, très visible */}
        <div className="absolute top-3 right-3">
          {isLive && !endingSoon && (
            <span className="flex items-center gap-1.5 text-[10px] font-black uppercase px-3 py-1.5 rounded-full bg-red-600 text-white shadow-lg ring-2 ring-white/50">
              <span className="w-2 h-2 bg-white rounded-full animate-pulse" /> En direct
            </span>
          )}
          {endingSoon && (
            <span className="text-[10px] font-black uppercase px-3 py-1.5 rounded-full bg-orange-600 text-white shadow-lg ring-2 ring-white/50">
              ⏰ Finit dans {minutesLeft} min
            </span>
          )}
          {isPast && recentlyEnded && (
            <span className="text-[10px] font-black uppercase px-3 py-1.5 rounded-full bg-gray-700 text-white shadow-lg ring-2 ring-white/50">
              ✓ Terminé il y a {formatElapsed(minutesSinceEnd!)}
            </span>
          )}
          {isPast && !recentlyEnded && (
            <span className="text-[10px] font-black uppercase px-3 py-1.5 rounded-full bg-gray-600 text-white shadow-lg">Passé</span>
          )}
          {evt.statut === 'programme' && (
            <span className="text-[10px] font-black uppercase px-3 py-1.5 rounded-full bg-amber-600 text-white shadow-lg ring-2 ring-white/50">🕐 Programmé</span>
          )}
          {evt.statut === 'brouillon' && (
            <span className="text-[10px] font-black uppercase px-3 py-1.5 rounded-full bg-gray-800 text-white shadow-lg ring-2 ring-white/50">✏️ Brouillon</span>
          )}
        </div>

        {/* Badge localisation — en haut à gauche, sous la date */}
        <div className="absolute top-16 left-3">
          <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full shadow-md ${evt.typeLocalisation === 'presentiel' ? 'bg-emerald-600 text-white' : 'bg-blue-600 text-white'}`}>
            {evt.typeLocalisation === 'presentiel' ? '📍 Présentiel' : '💻 En ligne'}
          </span>
        </div>

        {/* Catégorie en bas */}
        <div className="absolute bottom-3 left-3">
          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${CAT_COLORS[evt.categorie] || 'bg-gray-100 text-gray-600'}`}>
            {CAT_ICONS[evt.categorie]} {evt.catLabel}
          </span>
        </div>

        {/* Nb participants */}
        {evt.participantsCount > 0 && (
          <div className="absolute bottom-3 right-3">
            <span className="text-[9px] font-bold text-white bg-black/40 backdrop-blur-sm px-2 py-0.5 rounded-full">
              👥 {evt.participantsCount}
            </span>
          </div>
        )}
      </div>

      {/* Contenu */}
      <div className="flex-1 flex flex-col p-4 gap-3">
        <div className="flex-1">
          <h3 className="font-black text-gray-900 text-sm leading-snug line-clamp-2 group-hover:text-[#800020] transition-colors">
            {evt.nom}
          </h3>
          <p className="text-[10px] text-gray-400 font-medium mt-1">
            📅 {formatDate(evt.dateDebut)}
            {evt.organisateurNom && <span className="ml-2">· {evt.organisateurNom}</span>}
          </p>
          {evt.statut === 'programme' && (
            <p className="text-[10px] text-amber-600 font-bold mt-1">⏰ Publication automatique le {formatDate(evt.dateDebut)}</p>
          )}
        </div>

        {/* Actions */}
        <div className="space-y-2 pt-2 border-t border-gray-100">
          {(evt.statut === 'brouillon' || evt.statut === 'programme') && evt.isOrganisateur && (
            <>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={handlePublish}
                  disabled={publishing}
                  className="py-2 rounded-xl text-[10px] font-black uppercase tracking-wide bg-emerald-600 hover:bg-emerald-700 text-white transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-40"
                >
                  {publishing
                    ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    : '🚀 Publier'
                  }
                </button>
                <button
                  onClick={() => setShowScheduler(!showScheduler)}
                  className="py-2 rounded-xl text-[10px] font-black uppercase tracking-wide bg-amber-50 border border-amber-200 hover:bg-amber-100 text-amber-700 transition-all cursor-pointer"
                >
                  🕐 Programmer
                </button>
              </div>

              {showScheduler && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 space-y-2" style={{ animation: 'fadeIn 0.2s ease' }}>
                  <p className="text-[9px] font-black text-amber-700 uppercase tracking-wide">Publication automatique le :</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    <input type="date" value={scheduleDate} onChange={e => setScheduleDate(e.target.value)}
                      className="px-2 py-1.5 bg-white border border-amber-200 rounded-lg text-[10px] font-bold text-gray-700 outline-none" />
                    <input type="time" value={scheduleTime} onChange={e => setScheduleTime(e.target.value)}
                      className="px-2 py-1.5 bg-white border border-amber-200 rounded-lg text-[10px] font-bold text-gray-700 outline-none" />
                  </div>
                  <button onClick={handleSchedule} disabled={!scheduleDate || scheduling}
                    className="w-full py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-white rounded-lg text-[10px] font-black uppercase cursor-pointer flex items-center justify-center gap-1.5">
                    {scheduling ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : '✓ Confirmer la programmation'}
                  </button>
                </div>
              )}
            </>
          )}
          <Link
            href={`/evenements/${evt.slug}`}
            className="block text-center py-2 bg-gray-900 hover:bg-[#800020] text-white font-black text-[10px] uppercase tracking-wider rounded-xl transition-all"
          >
            Voir les détails
          </Link>
          {!isPast && evt.statut === 'publie' && (
            <button
              onClick={handleParticipate}
              disabled={loading}
              className={`w-full py-2 rounded-xl text-[10px] font-black uppercase tracking-wide border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                participating
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-red-50 hover:border-red-200 hover:text-red-600'
                  : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-700'
              }`}
            >
              {loading
                ? <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                : participating ? '✓ Inscrit · Annuler' : '+ Participer'
              }
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default function EvenementsPageClient({
  initialTab, initialQ, initialLocalisation, initialCategorie,
  aVenir, enCours, passes, participations, brouillons, currentUserId,
}: Props) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState(initialTab)
  const [searchQ, setSearchQ] = useState(initialQ)
  const [localisation, setLocalisation] = useState(initialLocalisation)
  const [categorie, setCategorie] = useState(initialCategorie)
  const [tabChanging, setTabChanging] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false)

  const allData: Record<string, Evenement[]> = {
    venir: aVenir, encours: enCours, passes, participations, brouillon: brouillons,
  }

  // Filtrage côté client
  const baseList = allData[activeTab] || []
  const filtered = baseList.filter(e => {
    const q = searchQ.toLowerCase()
    const matchQ = !q || e.nom.toLowerCase().includes(q) || e.catLabel.toLowerCase().includes(q)
    const matchLoc = !localisation || e.typeLocalisation === localisation
    const matchCat = !categorie || e.categorie === categorie
    return matchQ && matchLoc && matchCat
  })

  const handleTabChange = (tab: string) => {
    if (tab === activeTab) return
    setTabChanging(true)
    setTimeout(() => { setActiveTab(tab); setTabChanging(false) }, 180)
    router.push(`/evenements?tab=${tab}`, { scroll: false })
  }

  const hasFilters = !!(searchQ || localisation || categorie)

  const tabs = [
    { key: 'encours', label: '🔴 En cours', count: enCours.length },
    { key: 'venir', label: '📅 À venir', count: aVenir.length },
    { key: 'passes', label: '⏪ Passés', count: passes.length },
    { key: 'participations', label: '✓ Mes inscriptions', count: participations.length },
    { key: 'brouillon', label: '✏️ Brouillons & programmés', count: brouillons.length },
  ]

  return (
    <>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
        .anim-fade-up { animation: fadeUp 0.45s ease both; }
        .anim-fade-in { animation: fadeIn 0.3s ease both; }
        .d1 { animation-delay:.06s; } .d2 { animation-delay:.12s; }
      `}</style>

      <div className="bg-gray-50 min-h-screen py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto space-y-6">

          {/* Header */}
          <div className="anim-fade-up flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black text-gray-900">Événements</h1>
              <p className="text-sm text-gray-500 mt-0.5">Conférences, ateliers et soirées réseau de la communauté ENC</p>
            </div>
            <Link
              href="/evenements/new"
              className="inline-flex items-center gap-2 self-start sm:self-auto rounded-xl bg-[#800020] px-4 py-2.5 text-sm font-black text-white shadow-sm hover:bg-[#600018] hover:-translate-y-0.5 transition-all"
            >
              + Créer un événement
            </Link>
          </div>

          {/* Onglets */}
          <div className="anim-fade-up d1 flex items-center gap-1 border-b border-gray-200 overflow-x-auto">
            {tabs.map(({ key, label, count }) => (
              <button
                key={key}
                onClick={() => handleTabChange(key)}
                className="relative px-4 py-3 text-xs font-black transition-all duration-200 whitespace-nowrap cursor-pointer flex-shrink-0"
                style={{
                  color: activeTab === key ? '#800020' : '#6b7280',
                  borderBottom: activeTab === key ? '2px solid #800020' : '2px solid transparent',
                  marginBottom: '-1px',
                }}
              >
                {label}
                {count > 0 && (
                  <span className={`ml-1.5 text-[9px] font-black px-1.5 py-0.5 rounded-full ${activeTab === key ? 'bg-red-100 text-[#800020]' : 'bg-gray-100 text-gray-500'}`}>
                    {count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Barre recherche + filtres */}
          <div className="anim-fade-up d2 flex gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Rechercher un événement..."
                value={searchQ}
                onChange={e => setSearchQ(e.target.value)}
                className="w-full pl-10 pr-10 py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-800 outline-none focus:border-[#800020]/30 transition-colors placeholder-gray-400 shadow-xs"
              />
              <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
              {searchQ && (
                <button onClick={() => setSearchQ('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 cursor-pointer text-xs">✕</button>
              )}
            </div>
            <button
              onClick={() => setFiltersOpen(!filtersOpen)}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-xs font-black uppercase tracking-wide transition-all cursor-pointer shadow-xs ${filtersOpen || hasFilters ? 'bg-[#800020] text-white border-[#800020]' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'}`}
            >
              <i className="fa-solid fa-sliders text-xs" /> Filtres
              {hasFilters && !filtersOpen && <span className="w-2 h-2 bg-amber-400 rounded-full" />}
            </button>
          </div>

          {/* Filtres accordéon */}
          {filtersOpen && (
            <div className="anim-fade-in bg-white border border-gray-200 rounded-2xl p-5 shadow-xs flex flex-wrap gap-3 items-end">
              <select value={localisation} onChange={e => setLocalisation(e.target.value)}
                className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 outline-none cursor-pointer focus:border-[#800020]/30">
                <option value="">Localisation (Toutes)</option>
                <option value="presentiel">📍 En présentiel</option>
                <option value="enligne">💻 En ligne</option>
              </select>
              <select value={categorie} onChange={e => setCategorie(e.target.value)}
                className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 outline-none cursor-pointer focus:border-[#800020]/30">
                <option value="">Catégorie (Toutes)</option>
                <option value="conference">🎤 Conférence</option>
                <option value="reseau">🤝 Réseautage</option>
                <option value="formation">📚 Formation</option>
                <option value="ceremonie">🎓 Remise des diplômes</option>
                <option value="gala">🥂 Gala</option>
                <option value="atelier">🛠️ Atelier</option>
                <option value="table_ronde">💬 Table ronde</option>
                <option value="webinaire">💻 Webinaire</option>
                <option value="reunion">📋 Réunion annuelle</option>
                <option value="jpo">🏫 Journée portes ouvertes</option>
                <option value="salon">🎪 Salon</option>
              </select>
              <button onClick={() => { setLocalisation(''); setCategorie(''); setSearchQ('') }}
                disabled={!hasFilters}
                className="flex items-center gap-1.5 px-3 py-2.5 text-xs font-black uppercase text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl border border-gray-200 hover:border-red-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer">
                <i className="fa-solid fa-trash-can text-xs" /> Effacer
              </button>
            </div>
          )}

          {/* Grille événements */}
          <div
            style={{
              opacity: tabChanging ? 0 : 1,
              transform: tabChanging ? 'translateY(8px)' : 'translateY(0)',
              transition: 'opacity 0.18s ease, transform 0.18s ease',
            }}
          >
            {filtered.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
                <div className="text-4xl mb-3">📅</div>
                <p className="text-sm font-black text-gray-700">Aucun événement trouvé</p>
                <p className="text-xs text-gray-400 mt-1">
                  {hasFilters ? 'Modifiez vos filtres' : 'Aucun événement dans cet onglet'}
                </p>
                {activeTab === 'venir' && (
                  <Link href="/evenements/new"
                    className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-[#800020] text-white rounded-xl text-xs font-black uppercase hover:bg-[#600018] transition-colors">
                    + Créer le premier événement
                  </Link>
                )}
              </div>
            ) : (
              <>
                <p className="text-xs text-gray-400 font-bold mb-3">
                  {filtered.length} événement{filtered.length > 1 ? 's' : ''}
                  {hasFilters && ' · filtré'}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filtered.map((evt, i) => (
                    <EventCard
                      key={evt.id}
                      evt={evt}
                      index={i}
                      currentUserId={currentUserId}
                      onParticipate={() => {}}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
