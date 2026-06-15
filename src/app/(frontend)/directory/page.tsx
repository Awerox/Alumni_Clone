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
  if (min < 2) return { label: 'En ligne maintenant', online: true }
  if (min < 60) return { label: `Vu il y a ${min} min`, online: false }
  if (h < 24) return { label: `Vu il y a ${h}h`, online: false }
  if (d === 1) return { label: 'Vu hier', online: false }
  if (d < 7) return { label: `Vu il y a ${d} jours`, online: false }
  if (d < 30) return { label: `Vu il y a ${Math.floor(d / 7)} sem.`, online: false }
  return { label: `Vu le ${new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}`, online: false }
}

function AlumnusCard({ alumnus, index, onMessage }: { alumnus: Alumnus; index: number; onMessage: () => void }) {
  const [visible, setVisible] = useState(false)
  const photoUrl = alumnus.photo && typeof alumnus.photo === 'object' ? alumnus.photo.url : null
  const { label: lastSeenLabel, online } = formatLastSeen(alumnus.lastSeen)
  const diplomeLabel = alumnus.diplome ? (DIPLOME_LABELS[alumnus.diplome] || alumnus.diplome.replace(/_/g, ' ')) : null

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), index * 55)
    return () => clearTimeout(t)
  }, [index])

  return (
    <div
      className="group flex flex-col sm:flex-row items-stretch bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(18px)',
        transition: 'opacity 0.4s ease, transform 0.4s ease, box-shadow 0.2s, border-color 0.2s',
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 28px rgba(128,0,32,0.10)'; (e.currentTarget as HTMLElement).style.borderColor = '#fca5a5' }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = ''; (e.currentTarget as HTMLElement).style.borderColor = '#e5e7eb' }}
    >
      {/* Photo / Bannière */}
      <div className="relative w-full sm:w-44 h-40 sm:h-auto flex-shrink-0 bg-[#800020] overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff15_1px,transparent_1px)] [background-size:14px_14px]" />
        <div className="absolute inset-0 bg-gradient-to-br from-[#800020] via-[#900025] to-[#600018]" />

        {/* Photo centrée */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-20 h-20 rounded-2xl border-4 border-white/30 shadow-xl overflow-hidden bg-white/10 flex-shrink-0">
            {photoUrl ? (
              <img src={photoUrl} alt="" className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white font-black text-lg">
                {alumnus.prenom?.[0]}{alumnus.nom?.[0]}
              </div>
            )}
          </div>
        </div>

        {/* Badges sur l'image */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${alumnus.statut === 'alumni' ? 'bg-amber-400/90 text-gray-900' : 'bg-blue-500/90 text-white'}`}>
            {alumnus.statut === 'alumni' ? 'Alumni' : 'Étudiant'}
          </span>
          {alumnus.isMentor && (
            <span className="text-[9px] font-black text-white bg-purple-500/90 px-2 py-0.5 rounded-full">★ Mentor</span>
          )}
        </div>

        {/* Indicateur en ligne */}
        <div className="absolute bottom-2 right-2">
          <div className="flex items-center gap-1 bg-black/40 backdrop-blur-sm px-2 py-0.5 rounded-full">
            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${online ? 'bg-emerald-400 animate-pulse' : 'bg-gray-400'}`} />
            <span className="text-[9px] text-white font-semibold">{lastSeenLabel}</span>
          </div>
        </div>
      </div>

      {/* Contenu */}
      <div className="flex-1 px-5 py-4 flex flex-col justify-between min-w-0 gap-3">
        <div className="min-w-0 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h2 className="text-sm font-black text-gray-900 uppercase tracking-tight truncate group-hover:text-[#800020] transition-colors">
                {alumnus.prenom} {alumnus.nom}
              </h2>
              <p className="text-xs text-gray-500 font-medium mt-0.5 truncate">
                {alumnus.poste || 'Étudiant'}
                {alumnus.entreprise && <span className="text-gray-400"> · {alumnus.entreprise}</span>}
              </p>
            </div>
            {alumnus.promotion && (
              <span className="text-[9px] font-black text-[#800020] bg-red-50 border border-red-100 px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0">
                Promo {alumnus.promotion}
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5">
            {diplomeLabel && (
              <span className="text-[9px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full truncate max-w-[160px]">
                🎓 {diplomeLabel}
              </span>
            )}
            {alumnus.ville && (
              <span className="text-[9px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                📍 {alumnus.ville}
              </span>
            )}
            {alumnus.searchOpportunities === 'searching' && (
              <span className="text-[9px] font-black text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">
                🔍 En recherche
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
          <button
            onClick={onMessage}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wide border border-[#800020]/20 bg-[#800020]/5 text-[#800020] hover:bg-[#800020]/10 hover:border-[#800020]/30 transition-all cursor-pointer"
          >
            <i className="fa-solid fa-paper-plane text-[10px]" />
            Message
          </button>
          <Link
            href={`/profile/${alumnus.id}`}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wide bg-gray-900 hover:bg-[#800020] text-white transition-all"
          >
            Voir le profil →
          </Link>
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

  const searchRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    fetch('/api/alumni?limit=100&sort=nom')
      .then(r => r.json())
      .then(data => { if (data?.docs) { setAlumni(data.docs); setFilteredAlumni(data.docs) } })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    let result = alumni
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(a =>
        a.prenom?.toLowerCase().includes(q) || a.nom?.toLowerCase().includes(q) ||
        a.poste?.toLowerCase().includes(q) || a.entreprise?.toLowerCase().includes(q) ||
        a.ville?.toLowerCase().includes(q)
      )
    }
    if (selectedDiplome !== 'all') result = result.filter(a => a.diplome === selectedDiplome)
    if (selectedPromo !== 'all') result = result.filter(a => a.promotion?.toString() === selectedPromo)
    if (selectedStatut !== 'all') result = result.filter(a => a.statut === selectedStatut)
    if (selectedSecteur !== 'all') result = result.filter(a => a.secteur === selectedSecteur)
    if (selectedOpportunities !== 'all') result = result.filter(a => a.searchOpportunities === selectedOpportunities)
    if (selectedCampus !== 'all') result = result.filter(a => a.campus === selectedCampus)
    setFilteredAlumni(result)
  }, [searchQuery, selectedDiplome, selectedPromo, selectedStatut, selectedSecteur, selectedOpportunities, selectedCampus, alumni])

  const hasActiveFilters = searchQuery || selectedDiplome !== 'all' || selectedPromo !== 'all' ||
    selectedStatut !== 'all' || selectedSecteur !== 'all' || selectedOpportunities !== 'all' || selectedCampus !== 'all'

  const handleResetFilters = () => {
    setSearchQuery(''); setSelectedDiplome('all'); setSelectedPromo('all')
    setSelectedStatut('all'); setSelectedSecteur('all'); setSelectedOpportunities('all'); setSelectedCampus('all')
  }

  const handleOpenMessage = (alumnus: Alumnus) => {
    router.push(`/messages?userId=${alumnus.id}&prenom=${encodeURIComponent(alumnus.prenom)}&nom=${encodeURIComponent(alumnus.nom)}`)
  }

  return (
    <>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
        .anim-fade-up { animation: fadeUp 0.45s ease both; }
        .anim-fade-in { animation: fadeIn 0.3s ease both; }
        .d1 { animation-delay:0.05s; } .d2 { animation-delay:0.1s; } .d3 { animation-delay:0.15s; }
      `}</style>

      <div className="bg-gray-50 min-h-screen py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto space-y-6">

          {/* Header */}
          <div className="anim-fade-up flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black text-gray-900">Annuaire</h1>
              <p className="text-sm text-gray-500 mt-0.5">
                {loading ? '...' : `${alumni.length} membre${alumni.length !== 1 ? 's' : ''} dans la communauté ENC`}
              </p>
            </div>
            {/* Vue switcher */}
            <div className="flex bg-white border border-gray-200 rounded-xl p-1 gap-1 shadow-xs">
              <button onClick={() => setViewMode('grid')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wide transition-all cursor-pointer ${viewMode === 'grid' ? 'bg-[#800020] text-white shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}>
                <i className="fa-solid fa-table-cells-large text-xs" /> Annuaire
              </button>
              <button onClick={() => setViewMode('map')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wide transition-all cursor-pointer ${viewMode === 'map' ? 'bg-[#800020] text-white shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}>
                <i className="fa-regular fa-map text-xs" /> Carte
              </button>
            </div>
          </div>

          {/* Barre de recherche principale */}
          <div className="anim-fade-up d1 flex gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Rechercher un membre..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-800 outline-none focus:border-[#800020]/40 transition-colors placeholder-gray-400 shadow-xs"
              />
              <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer">✕</button>
              )}
            </div>
            <button
              onClick={() => setFiltersOpen(!filtersOpen)}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-xs font-black uppercase tracking-wide transition-all cursor-pointer ${filtersOpen || hasActiveFilters ? 'bg-[#800020] text-white border-[#800020]' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'}`}
            >
              <i className="fa-solid fa-sliders text-xs" />
              Filtres
              {hasActiveFilters && !filtersOpen && (
                <span className="w-2 h-2 bg-amber-400 rounded-full" />
              )}
            </button>
          </div>

          {/* Filtres avancés (accordéon) */}
          {filtersOpen && (
            <div className="anim-fade-in bg-white border border-gray-200 rounded-2xl p-5 shadow-xs space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {[
                  { value: selectedDiplome, setter: setSelectedDiplome, label: 'Diplôme', options: [
                    ['all','Diplôme (Tous)'],['bts_sio_slam','BTS SIO (SLAM)'],['bts_sio_sisr','BTS SIO (SISR)'],
                    ['bts_assurance','BTS Assurance'],['bts_cg','BTS CG'],['bts_communication','BTS Communication'],
                    ['bts_ci','BTS Commerce International'],['bts_gpme','BTS GPME'],['bts_mco','BTS MCO'],
                    ['bts_ndrc','BTS NDRC'],['bts_sam','BTS SAM'],['bts_tourisme','BTS Tourisme'],['dcg','DCG'],
                  ]},
                  { value: selectedPromo, setter: setSelectedPromo, label: 'Promotion', options: [
                    ['all','Promotion (Toutes)'],['2026','2026'],['2025','2025'],['2024','2024'],['2023','2023'],['2022','2022'],
                  ]},
                  { value: selectedStatut, setter: setSelectedStatut, label: 'Statut', options: [
                    ['all','Statut (Tous)'],['etudiant','Étudiant'],['alumni','Alumni'],
                  ]},
                  { value: selectedSecteur, setter: setSelectedSecteur, label: 'Secteur', options: [
                    ['all','Secteur (Tous)'],['it','Informatique / Tech'],['finance','Finance / Gestion'],
                    ['commerce','Commerce / Vente'],['assurance','Assurance / Banque'],['tourisme','Tourisme / Voyage'],
                  ]},
                  { value: selectedOpportunities, setter: setSelectedOpportunities, label: 'Emploi', options: [
                    ['all','Recherche emploi'],['not_looking','En poste / Non dispo'],['searching','En recherche active'],['listening','À l\'écoute'],
                  ]},
                  { value: selectedCampus, setter: setSelectedCampus, label: 'Campus', options: [
                    ['all','Campus (Tous)'],['bessieres','Bessières (ENC)'],['autre','Autre campus'],
                  ]},
                ].map(({ value, setter, label, options }) => (
                  <select key={label} value={value} onChange={e => setter(e.target.value)}
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 outline-none cursor-pointer focus:border-[#800020]/40 transition-colors">
                    {options.map(([val, lbl]) => <option key={val} value={val}>{lbl}</option>)}
                  </select>
                ))}
              </div>
              <div className="flex justify-end">
                <button
                  onClick={handleResetFilters}
                  disabled={!hasActiveFilters}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-xs font-black uppercase tracking-wide text-gray-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                >
                  <i className="fa-solid fa-trash-can text-xs" /> Effacer les filtres
                </button>
              </div>
            </div>
          )}

          {/* Résultats */}
          {viewMode === 'map' ? (
            <div className="anim-fade-in">
              <DirectoryMap alumni={filteredAlumni} />
            </div>
          ) : loading ? (
            <div className="space-y-3">
              {[1,2,3,4].map(n => (
                <div key={n} className="h-40 bg-white rounded-2xl border border-gray-100 animate-pulse" />
              ))}
            </div>
          ) : filteredAlumni.length === 0 ? (
            <div className="anim-fade-in text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
              <div className="text-3xl mb-3">🔍</div>
              <p className="text-sm font-black text-gray-700">Aucun membre trouvé</p>
              <p className="text-xs text-gray-400 mt-1">Modifiez vos critères ou effacez les filtres</p>
              {hasActiveFilters && (
                <button onClick={handleResetFilters}
                  className="mt-4 px-4 py-2 bg-[#800020] text-white rounded-xl text-xs font-black uppercase tracking-wide hover:bg-[#600018] transition-colors cursor-pointer">
                  Effacer les filtres
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-gray-400 font-bold">
                {filteredAlumni.length} résultat{filteredAlumni.length !== 1 ? 's' : ''}
                {hasActiveFilters && ' · filtré'}
              </p>
              {filteredAlumni.map((alumnus, i) => (
                <AlumnusCard
                  key={alumnus.id}
                  alumnus={alumnus}
                  index={i}
                  onMessage={() => handleOpenMessage(alumnus)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
