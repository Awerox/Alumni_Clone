'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'

const DirectoryMap = dynamic(() => import('@/components/DirectoryMap'), {
  ssr: false,
  loading: () => (
    <div className="h-[600px] w-full bg-white border border-gray-200 rounded-3xl animate-pulse flex flex-col items-center justify-center text-sm font-semibold text-gray-400">
      <span className="text-xl mb-1">🗺️</span>
      Chargement de la carte interactive...
    </div>
  ),
})

interface Alumnus {
  id: string
  prenom: string
  nom: string
  statut: 'etudiant' | 'alumni'
  bio?: string | null
  telephone?: string | null
  ville?: string | null
  latitude?: string | null
  longitude?: string | null
  diplome?: string | null
  promotion?: number | null
  poste?: string | null
  entreprise?: string | null
  secteur?: string | null
  searchOpportunities?: string | null
  campus?: string | null
  isMentor?: boolean | null
  lastSeen?: string | null
  photo?: any
}

const DIPLOME_LABELS: Record<string, string> = {
  bts_sio_slam: 'BTS SIO (SLAM)', bts_sio_sisr: 'BTS SIO (SISR)',
  bts_assurance: 'BTS Assurance', bts_cg: 'BTS CG',
  bts_communication: 'BTS Communication', bts_ci: 'BTS Commerce International',
  bts_gpme: 'BTS GPME', bts_mco: 'BTS MCO', bts_ndrc: 'BTS NDRC',
  bts_sam: 'BTS SAM', bts_tourisme: 'BTS Tourisme', dcg: 'DCG',
}

function formatLastSeen(dateStr?: string | null): { label: string; online: boolean } {
  if (!dateStr) return { label: 'Jamais connecté', online: false }
  const diff = Date.now() - new Date(dateStr).getTime()
  const min = Math.floor(diff / 60000)
  const h = Math.floor(diff / 3600000)
  const d = Math.floor(diff / 86400000)
  if (min < 2) return { label: 'En ligne', online: true }
  if (min < 60) return { label: `${min}min`, online: false }
  if (h < 24) return { label: `${h}h`, online: false }
  if (d === 1) return { label: 'Hier', online: false }
  if (d < 7) return { label: `${d}j`, online: false }
  return { label: `${Math.floor(d / 7)}sem`, online: false }
}

function AlumnusCard({ alumnus, index, onMessage }: {
  alumnus: Alumnus
  index: number
  onMessage: () => void
}) {
  const [visible, setVisible] = useState(false)
  const photoUrl = alumnus.photo && typeof alumnus.photo === 'object' ? alumnus.photo.url : null
  const { label: lastSeenLabel, online } = formatLastSeen(alumnus.lastSeen)
  const diplomeLabel = alumnus.diplome ? (DIPLOME_LABELS[alumnus.diplome] || alumnus.diplome.replace(/_/g, ' ')) : null
  const initials = `${alumnus.prenom?.[0] ?? ''}${alumnus.nom?.[0] ?? ''}`.toUpperCase()

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), index * 50)
    return () => clearTimeout(t)
  }, [index])

  return (
    <div
      className="group bg-white rounded-2xl border border-gray-100 overflow-hidden flex flex-col"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0) scale(1)' : 'translateY(16px) scale(0.98)',
        transition: 'opacity 0.4s ease, transform 0.4s ease',
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      }}
      onMouseEnter={e => { Object.assign((e.currentTarget as HTMLElement).style, { boxShadow: '0 12px 32px rgba(128,0,32,0.12)', transform: 'translateY(-3px) scale(1)', borderColor: '#fecdd3' }) }}
      onMouseLeave={e => { Object.assign((e.currentTarget as HTMLElement).style, { boxShadow: '0 1px 4px rgba(0,0,0,0.06)', transform: 'translateY(0) scale(1)', borderColor: '#f3f4f6' }) }}
    >
      {/* Bannière bordeaux */}
      <div className="h-24 bg-[#800020] relative overflow-hidden flex-shrink-0">
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff12_1px,transparent_1px)] [background-size:12px_12px]" />
        <div className="absolute inset-0 bg-gradient-to-br from-[#800020] via-[#900025] to-[#5a0018]" />

        {/* Badge statut */}
        <div className="absolute top-2.5 left-2.5">
          <span className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full backdrop-blur-sm ${alumnus.statut === 'alumni' ? 'bg-amber-400/90 text-gray-900' : 'bg-white/20 text-white border border-white/30'}`}>
            {alumnus.statut === 'alumni' ? 'Alumni' : 'Étudiant'}
          </span>
        </div>

        {/* Badge mentor */}
        {alumnus.isMentor && (
          <div className="absolute top-2.5 right-2.5">
            <span className="text-[8px] font-black text-white bg-amber-500/90 px-2 py-0.5 rounded-full backdrop-blur-sm">★ Mentor</span>
          </div>
        )}

        {/* LastSeen badge */}
        <div className="absolute bottom-2 right-2">
          <div className="flex items-center gap-1 bg-black/40 backdrop-blur-sm px-1.5 py-0.5 rounded-full">
            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${online ? 'bg-emerald-400 animate-pulse' : 'bg-gray-400'}`} />
            <span className="text-[8px] text-white font-bold">{lastSeenLabel}</span>
          </div>
        </div>

        {/* Photo — chevauchement */}
        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2">
          <div className="w-16 h-16 rounded-2xl border-4 border-white shadow-lg overflow-hidden bg-white flex-shrink-0">
            {photoUrl ? (
              <img src={photoUrl} alt="" className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-110" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-[#800020] to-[#5a0018] flex items-center justify-center text-white font-black text-base">
                {initials}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Contenu */}
      <div className="flex-1 flex flex-col px-4 pt-10 pb-4 text-center">
        {/* Nom */}
        <h2 className="text-sm font-black text-gray-900 uppercase tracking-tight leading-tight group-hover:text-[#800020] transition-colors">
          {alumnus.prenom} {alumnus.nom}
        </h2>

        {/* Poste */}
        <p className="text-[11px] text-gray-500 font-medium mt-0.5 truncate">
          {alumnus.poste || 'Étudiant'}
          {alumnus.entreprise && <span className="text-gray-400"> · {alumnus.entreprise}</span>}
        </p>

        {/* Promo + Diplôme */}
        <div className="mt-2 space-y-1">
          {alumnus.promotion && (
            <p className="text-[10px] font-black text-[#800020] uppercase tracking-wide">
              Promo {alumnus.promotion}
            </p>
          )}
          {diplomeLabel && (
            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-tight truncate">
              🎓 {diplomeLabel}
            </p>
          )}
        </div>

        {/* Ville */}
        {alumnus.ville && (
          <p className="text-[10px] text-gray-400 font-medium mt-2 truncate">
            📍 {alumnus.ville}
          </p>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Actions */}
        <div className="mt-4 pt-3 border-t border-gray-100 space-y-2">
          <div className="flex items-center gap-2">
            <Link
              href={`/profile/${alumnus.id}`}
              className="flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-wide bg-gray-900 hover:bg-[#800020] text-white transition-all text-center"
            >
              Voir le profil
            </Link>
          </div>
          <button
            onClick={onMessage}
            className="w-full py-2 rounded-xl text-[10px] font-black uppercase tracking-wide border border-[#800020]/20 bg-[#800020]/5 text-[#800020] hover:bg-[#800020]/10 transition-all cursor-pointer flex items-center justify-center gap-1.5"
          >
            <i className="fa-solid fa-paper-plane text-[10px]" />
            Envoyer un message
          </button>
        </div>
      </div>
    </div>
  )
}

export default function DirectoryPage() {
  const router = useRouter()
  const [alumni, setAlumni] = useState<Alumnus[]>([])
  const [filteredAlumni, setFilteredAlumni] = useState<Alumnus[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid')
  const [filtersOpen, setFiltersOpen] = useState(false)

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDiplome, setSelectedDiplome] = useState('all')
  const [selectedPromo, setSelectedPromo] = useState('all')
  const [selectedStatut, setSelectedStatut] = useState('all')
  const [selectedSecteur, setSelectedSecteur] = useState('all')
  const [selectedOpportunities, setSelectedOpportunities] = useState('all')
  const [selectedCampus, setSelectedCampus] = useState('all')

  useEffect(() => {
    fetch('/api/alumni?limit=100&sort=nom')
      .then(r => r.json())
      .then(data => { if (data?.docs) { setAlumni(data.docs); setFilteredAlumni(data.docs) } })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    let result = alumni
    const q = searchQuery.toLowerCase().trim()
    if (q) result = result.filter(a =>
      a.prenom?.toLowerCase().includes(q) || a.nom?.toLowerCase().includes(q) ||
      a.poste?.toLowerCase().includes(q) || a.entreprise?.toLowerCase().includes(q) ||
      a.ville?.toLowerCase().includes(q)
    )
    if (selectedDiplome !== 'all') result = result.filter(a => a.diplome === selectedDiplome)
    if (selectedPromo !== 'all') result = result.filter(a => a.promotion?.toString() === selectedPromo)
    if (selectedStatut !== 'all') result = result.filter(a => a.statut === selectedStatut)
    if (selectedSecteur !== 'all') result = result.filter(a => a.secteur === selectedSecteur)
    if (selectedOpportunities !== 'all') result = result.filter(a => a.searchOpportunities === selectedOpportunities)
    if (selectedCampus !== 'all') result = result.filter(a => a.campus === selectedCampus)
    setFilteredAlumni(result)
  }, [searchQuery, selectedDiplome, selectedPromo, selectedStatut, selectedSecteur, selectedOpportunities, selectedCampus, alumni])

  const hasActiveFilters = !!(searchQuery || selectedDiplome !== 'all' || selectedPromo !== 'all' ||
    selectedStatut !== 'all' || selectedSecteur !== 'all' || selectedOpportunities !== 'all' || selectedCampus !== 'all')

  const handleResetFilters = () => {
    setSearchQuery(''); setSelectedDiplome('all'); setSelectedPromo('all')
    setSelectedStatut('all'); setSelectedSecteur('all'); setSelectedOpportunities('all'); setSelectedCampus('all')
  }

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
        <div className="max-w-7xl mx-auto space-y-6">

          {/* Header */}
          <div className="anim-fade-up flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black text-gray-900">Annuaire</h1>
              <p className="text-sm text-gray-500 mt-0.5">
                {loading ? '...' : `${alumni.length} membre${alumni.length !== 1 ? 's' : ''} dans la communauté ENC`}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {/* Vue */}
              <div className="flex bg-white border border-gray-200 rounded-xl p-1 gap-1 shadow-xs">
                <button onClick={() => setViewMode('grid')}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-black uppercase tracking-wide transition-all cursor-pointer ${viewMode === 'grid' ? 'bg-[#800020] text-white' : 'text-gray-500 hover:text-gray-800'}`}>
                  <i className="fa-solid fa-table-cells-large text-xs" /> Grille
                </button>
                <button onClick={() => setViewMode('map')}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-black uppercase tracking-wide transition-all cursor-pointer ${viewMode === 'map' ? 'bg-[#800020] text-white' : 'text-gray-500 hover:text-gray-800'}`}>
                  <i className="fa-regular fa-map text-xs" /> Carte
                </button>
              </div>
            </div>
          </div>

          {/* Barre recherche + filtres */}
          <div className="anim-fade-up d1 space-y-3">
            <div className="flex gap-3">
              <div className="relative flex-1">
                <input type="text" placeholder="Rechercher un membre..."
                  value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-800 outline-none focus:border-[#800020]/30 transition-colors placeholder-gray-400 shadow-xs"
                />
                <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 cursor-pointer text-xs">✕</button>
                )}
              </div>
              <button onClick={() => setFiltersOpen(!filtersOpen)}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-xs font-black uppercase tracking-wide transition-all cursor-pointer shadow-xs ${filtersOpen || hasActiveFilters ? 'bg-[#800020] text-white border-[#800020]' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                <i className="fa-solid fa-sliders text-xs" /> Filtres
                {hasActiveFilters && !filtersOpen && <span className="w-2 h-2 bg-amber-400 rounded-full" />}
              </button>
            </div>

            {/* Filtres accordéon */}
            {filtersOpen && (
              <div className="anim-fade-in bg-white border border-gray-200 rounded-2xl p-5 shadow-xs">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  {[
                    { val: selectedDiplome, set: setSelectedDiplome, opts: [['all','Diplôme'],['bts_sio_slam','BTS SIO SLAM'],['bts_sio_sisr','BTS SIO SISR'],['bts_assurance','BTS Assurance'],['bts_cg','BTS CG'],['bts_communication','BTS Communication'],['bts_ci','BTS CI'],['bts_gpme','BTS GPME'],['bts_mco','BTS MCO'],['bts_ndrc','BTS NDRC'],['bts_sam','BTS SAM'],['bts_tourisme','BTS Tourisme'],['dcg','DCG']] },
                    { val: selectedPromo, set: setSelectedPromo, opts: [['all','Promo'],['2026','2026'],['2025','2025'],['2024','2024'],['2023','2023'],['2022','2022']] },
                    { val: selectedStatut, set: setSelectedStatut, opts: [['all','Statut'],['etudiant','Étudiant'],['alumni','Alumni']] },
                    { val: selectedSecteur, set: setSelectedSecteur, opts: [['all','Secteur'],['it','IT / Tech'],['finance','Finance'],['commerce','Commerce'],['assurance','Assurance'],['tourisme','Tourisme']] },
                    { val: selectedOpportunities, set: setSelectedOpportunities, opts: [['all','Emploi'],['not_looking','En poste'],['searching','En recherche'],['listening','À l\'écoute']] },
                    { val: selectedCampus, set: setSelectedCampus, opts: [['all','Campus'],['bessieres','Bessières'],['autre','Autre']] },
                  ].map(({ val, set, opts }, i) => (
                    <select key={i} value={val} onChange={e => set(e.target.value)}
                      className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 outline-none cursor-pointer focus:border-[#800020]/30 transition-colors">
                      {opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                  ))}
                </div>
                <div className="mt-3 flex justify-end">
                  <button onClick={handleResetFilters} disabled={!hasActiveFilters}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-black uppercase text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl border border-gray-200 hover:border-red-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer">
                    <i className="fa-solid fa-trash-can text-xs" /> Effacer
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Grille ou carte */}
          {viewMode === 'map' ? (
            <div className="anim-fade-in">
              <DirectoryMap alumni={filteredAlumni} />
            </div>
          ) : loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {[1,2,3,4,5,6,7,8,9,10].map(n => (
                <div key={n} className="h-72 bg-white rounded-2xl border border-gray-100 animate-pulse" />
              ))}
            </div>
          ) : filteredAlumni.length === 0 ? (
            <div className="anim-fade-in text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
              <div className="text-4xl mb-3">🔍</div>
              <p className="text-sm font-black text-gray-700">Aucun membre trouvé</p>
              <p className="text-xs text-gray-400 mt-1 mb-4">Modifiez vos critères ou effacez les filtres</p>
              {hasActiveFilters && (
                <button onClick={handleResetFilters}
                  className="px-4 py-2 bg-[#800020] text-white rounded-xl text-xs font-black uppercase tracking-wide cursor-pointer hover:bg-[#600018] transition-colors">
                  Effacer les filtres
                </button>
              )}
            </div>
          ) : (
            <>
              <p className="text-xs text-gray-400 font-bold -mb-2">
                {filteredAlumni.length} résultat{filteredAlumni.length !== 1 ? 's' : ''}
                {hasActiveFilters && ' · filtré'}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {filteredAlumni.map((alumnus, i) => (
                  <AlumnusCard
                    key={alumnus.id}
                    alumnus={alumnus}
                    index={i}
                    onMessage={() => router.push(`/messages?userId=${alumnus.id}&prenom=${encodeURIComponent(alumnus.prenom)}&nom=${encodeURIComponent(alumnus.nom)}`)}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}
