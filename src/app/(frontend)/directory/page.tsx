'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'

// 🌍 Importation dynamique de la carte Leaflet (SSR désactivé pour éviter les crashs Next.js)
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
  photo?: any // Relation upload média
}

export default function DirectoryPage() {
  const [alumni, setAlumni] = useState<Alumnus[]>([])
  const [filteredAlumni, setFilteredAlumni] = useState<Alumnus[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid')

  // États pour la double barre de filtres (Strictement synchronisés avec le formulaire)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDiplome, setSelectedDiplome] = useState('all')
  const [selectedPromo, setSelectedPromo] = useState('all')
  const [selectedStatut, setSelectedStatut] = useState('all')
  const [selectedSecteur, setSelectedSecteur] = useState('all')
  const [selectedOpportunities, setSelectedOpportunities] = useState('all')
  const [selectedCampus, setSelectedCampus] = useState('all')

  // Récupération des données depuis l'API REST de Payload
  useEffect(() => {
    const fetchAlumni = async () => {
      try {
        const res = await fetch('/api/alumni?limit=100&sort=nom')
        const data = await res.json()
        if (data?.docs) {
          setAlumni(data.docs)
          setFilteredAlumni(data.docs)
        }
      } catch (err) {
        console.error('Erreur lors de la récupération des membres', err)
      } finally {
        setLoading(false)
      }
    }
    fetchAlumni()
  }, [])

  // Logique de filtrage globale réactive (Correction complète des correspondances)
  useEffect(() => {
    let result = alumni

    // 1. Recherche par Mots-clés (Nom, Prénom, Poste, Entreprise, Ville)
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (a) =>
          a.prenom?.toLowerCase().includes(query) ||
          a.nom?.toLowerCase().includes(query) ||
          a.poste?.toLowerCase().includes(query) ||
          a.entreprise?.toLowerCase().includes(query) ||
          a.ville?.toLowerCase().includes(query),
      )
    }

    // 2. Filtres de la première ligne
    if (selectedDiplome !== 'all') {
      result = result.filter((a) => a.diplome === selectedDiplome)
    }
    if (selectedPromo !== 'all') {
      result = result.filter((a) => a.promotion?.toString() === selectedPromo)
    }
    if (selectedStatut !== 'all') {
      result = result.filter((a) => a.statut === selectedStatut)
    }

    // 3. Filtres de la deuxième ligne
    if (selectedSecteur !== 'all') {
      result = result.filter((a) => a.secteur === selectedSecteur)
    }
    if (selectedOpportunities !== 'all') {
      result = result.filter((a) => a.searchOpportunities === selectedOpportunities)
    }
    if (selectedCampus !== 'all') {
      result = result.filter((a) => a.campus === selectedCampus)
    }

    setFilteredAlumni(result)
  }, [
    searchQuery,
    selectedDiplome,
    selectedPromo,
    selectedStatut,
    selectedSecteur,
    selectedOpportunities,
    selectedCampus,
    alumni,
  ])

  const hasActiveFilters =
    searchQuery ||
    selectedDiplome !== 'all' ||
    selectedPromo !== 'all' ||
    selectedStatut !== 'all' ||
    selectedSecteur !== 'all' ||
    selectedOpportunities !== 'all' ||
    selectedCampus !== 'all'

  const handleResetFilters = () => {
    setSearchQuery('')
    setSelectedDiplome('all')
    setSelectedPromo('all')
    setSelectedStatut('all')
    setSelectedSecteur('all')
    setSelectedOpportunities('all')
    setSelectedCampus('all')
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

  return (
    <div className="bg-gray-50/50 min-h-screen py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* 🔍 DOUBLE BARRE DE FILTRES HORIZONTAUX SÉCURISÉE */}
        <div className="space-y-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm text-left">
          {/* LIGNE 1 : Mots-clés, Diplôme, Promotion, Catégorie */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Mots-clés"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pr-10 pl-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 outline-none focus:border-gray-300 focus:bg-white transition-all font-medium placeholder-gray-400"
              />
              <i className="fa-solid fa-magnifying-glass absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
            </div>

            <select
              value={selectedDiplome}
              onChange={(e) => setSelectedDiplome(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 outline-none cursor-pointer focus:border-gray-300 focus:bg-white transition-all"
            >
              <option value="all">Diplôme (Tous)</option>
              <option value="bts_sio_slam">BTS SIO (SLAM)</option>
              <option value="bts_sio_sisr">BTS SIO (SISR)</option>
              <option value="bts_assurance">BTS Assurance</option>
              <option value="bts_cg">BTS CG (Comptabilité)</option>
              <option value="bts_communication">BTS Communication</option>
              <option value="bts_ci">BTS Commerce International</option>
              <option value="bts_gpme">BTS GPME</option>
              <option value="bts_mco">BTS MCO</option>
              <option value="bts_ndrc">BTS NDRC</option>
              <option value="bts_sam">BTS SAM</option>
              <option value="bts_tourisme">BTS Tourisme</option>
              <option value="dcg">DCG</option>
            </select>

            <select
              value={selectedPromo}
              onChange={(e) => setSelectedPromo(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 outline-none cursor-pointer focus:border-gray-300 focus:bg-white transition-all"
            >
              <option value="all">Promotion (Toutes)</option>
              <option value="2026">2026</option>
              <option value="2025">2025</option>
              <option value="2024">2024</option>
              <option value="2023">2023</option>
              <option value="2022">2022</option>
            </select>

            <select
              value={selectedStatut}
              onChange={(e) => setSelectedStatut(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 outline-none cursor-pointer focus:border-gray-300 focus:bg-white transition-all"
            >
              <option value="all">Catégorie (Toutes)</option>
              <option value="etudiant">Étudiant</option>
              <option value="alumni">Alumni</option>
            </select>
          </div>

          {/* LIGNE 2 : Secteur d'activité, Recherche d'emploi, Campus, Effacer */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <select
              value={selectedSecteur}
              onChange={(e) => setSelectedSecteur(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 outline-none cursor-pointer focus:border-gray-300 focus:bg-white transition-all"
            >
              <option value="all">Secteur d'activité</option>
              <option value="it">Informatique / Tech</option>
              <option value="finance">Finance / Gestion</option>
              <option value="commerce">Commerce / Vente</option>
              <option value="assurance">Assurance / Banque</option>
              <option value="tourisme">Tourisme / Voyage</option>
            </select>

            <select
              value={selectedOpportunities}
              onChange={(e) => setSelectedOpportunities(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 outline-none cursor-pointer focus:border-gray-300 focus:bg-white transition-all"
            >
              <option value="all">Recherche d'emploi</option>
              <option value="not_looking">En poste / Non dispo</option>
              <option value="searching">En recherche active</option>
              <option value="listening">À l'écoute du marché</option>
            </select>

            <select
              value={selectedCampus}
              onChange={(e) => setSelectedCampus(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 outline-none cursor-pointer focus:border-gray-300 focus:bg-white transition-all"
            >
              <option value="all">Campus (Tous)</option>
              <option value="bessieres">Bessières (ENC)</option>
              <option value="autre">Autre campus</option>
            </select>

            <button
              disabled={!hasActiveFilters}
              onClick={handleResetFilters}
              className={`w-full py-3 px-4 rounded-xl border text-xs font-black uppercase tracking-wide flex items-center justify-center gap-2 transition-all ${
                hasActiveFilters
                  ? 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50 shadow-sm cursor-pointer'
                  : 'border-gray-100 bg-gray-100/50 text-gray-400 cursor-not-allowed'
              }`}
            >
              <i className="fa-solid fa-trash-can text-sm"></i>
              Effacer les filtres
            </button>
          </div>
        </div>

        {/* 🎛️ CONTROLEUR DE VUE INFERIEUR CENTRAL */}
        <div className="flex justify-center">
          <div className="bg-[#FFFDF4] border border-[#FBEFCD] rounded-xl p-1.5 flex items-center gap-1 shadow-sm">
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-black uppercase tracking-wide transition-all cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-[#FCD862] text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              <i className="fa-solid fa-table-cells-large text-sm"></i>
              Vue annuaire
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-black uppercase tracking-wide transition-all cursor-pointer ${
                viewMode === 'map'
                  ? 'bg-[#FCD862] text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              <i className="fa-regular fa-map text-sm"></i>
              Vue carte
            </button>
          </div>
        </div>

        {/* 📇 ZONE D'AFFICHAGE RESTREINTE AU MODE SÉLECTIONNÉ */}
        {viewMode === 'grid' ? (
          loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((n) => (
                <div
                  key={n}
                  className="bg-white h-64 rounded-2xl border border-gray-100 animate-pulse"
                />
              ))}
            </div>
          ) : filteredAlumni.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 text-left">
              {filteredAlumni.map((alumnus) => {
                const photoUrl =
                  alumnus.photo && typeof alumnus.photo === 'object' && alumnus.photo.url
                    ? alumnus.photo.url
                    : null

                return (
                  <div
                    key={alumnus.id}
                    className="bg-white rounded-2xl shadow-sm border border-gray-200/80 hover:shadow-md transition-all flex flex-col justify-between group"
                  >
                    <div>
                      <div className="h-24 bg-enc flex items-center justify-center relative">
                        {alumnus.isMentor && (
                          <div className="absolute top-3 right-3">
                            <span className="bg-white text-enc text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded shadow-xs border border-gray-100">
                              ★ Mentor
                            </span>
                          </div>
                        )}
                        <div className="h-16 w-16 rounded-full bg-gray-50 border-4 border-white shadow-xs overflow-hidden flex items-center justify-center translate-y-6">
                          {photoUrl ? (
                            <img src={photoUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-enc text-sm font-black uppercase">
                              {alumnus.prenom?.[0]}
                              {alumnus.nom?.[0]}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="p-5 pt-8 space-y-3">
                        <div className="flex justify-between items-start gap-2">
                          <h2 className="text-sm font-black text-gray-900 uppercase tracking-tight truncate max-w-[70%] group-hover:text-enc transition-colors">
                            {alumnus.prenom} {alumnus.nom}
                          </h2>
                          <span
                            className={`px-1.5 py-0.5 text-[8px] font-black rounded-xs uppercase tracking-wider ${
                              alumnus.statut === 'alumni'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {alumnus.statut}
                          </span>
                        </div>

                        <div className="bg-gray-50/60 border border-gray-100/70 p-2.5 rounded-xl text-[11px] space-y-0.5">
                          <p className="font-bold text-gray-700 truncate">
                            {alumnus.poste || 'Étudiant'}
                          </p>
                          {alumnus.entreprise && (
                            <p className="text-gray-400 font-semibold truncate">
                              🏢 {alumnus.entreprise}
                            </p>
                          )}
                          <p className="text-enc font-black uppercase tracking-wide pt-1 text-[10px]">
                            Promo {alumnus.promotion || 'NC'}
                          </p>
                          {alumnus.diplome && (
                            <p className="text-gray-400 font-bold tracking-tight truncate uppercase text-[9px]">
                              🎓 {formatDiplome(alumnus.diplome)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="p-5 pt-0">
                      <div className="pt-2.5 border-t border-gray-100 flex justify-between items-center text-[11px] font-bold text-gray-400">
                        <span>📍 {alumnus.ville || 'Paris'}</span>
                        <Link
                          href={`/directory/${alumnus.id}`}
                          className="text-enc hover:text-orange-500 transition-colors"
                        >
                          Profil →
                        </Link>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
              <p className="text-sm font-bold text-gray-800">
                Aucun membre ne correspond à vos critères de filtrage.
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Essayez de modifier vos mots-clés ou de réinitialiser vos sélections.
              </p>
            </div>
          )
        ) : (
          /* VRAIE CONSOLE DE CARTOGRAPHIE RENDUE EN TEMPS RÉEL (Leaflet) */
          <div className="animate-in fade-in duration-300">
            <DirectoryMap alumni={filteredAlumni} />
          </div>
        )}
      </div>
    </div>
  )
}
