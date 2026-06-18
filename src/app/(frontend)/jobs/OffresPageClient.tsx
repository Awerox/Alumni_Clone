'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface Offre {
  id: string
  poste: string
  entreprise: string
  typeContrat: string
  secteur: string
  secteurLabel: string
  localisation: string
  remuneration: string
  remunerationLabel: string
  experience: string
  experienceLabel: string
  description: string
  dateDebut: string | null
  dateLimite: string | null
  statut: string
  logoUrl: string | null
  documentJointUrl: string | null
  isRecruteur: boolean
  recruteurNom: string | null
  restreindreDiplomes: string[]
  restreindreCampus: string[]
  restreindrePromotions: string[]
  createdAt: string
}

interface Props {
  actives: Offre[]
  expirees: Offre[]
  brouillons: Offre[]
  currentUserId: string
}

const CONTRAT_COLORS: Record<string, string> = {
  CDI: 'bg-emerald-100 text-emerald-700',
  CDD: 'bg-blue-100 text-blue-700',
  Alternance: 'bg-purple-100 text-purple-700',
  Stage: 'bg-amber-100 text-amber-700',
  Independant: 'bg-pink-100 text-pink-700',
}

const CONTRAT_ICONS: Record<string, string> = {
  CDI: '💼', CDD: '📄', Alternance: '🎓', Stage: '🧑‍💻', Independant: '🚀',
}

const CONTRAT_LABELS: Record<string, string> = {
  CDI: 'CDI', CDD: 'CDD', Alternance: 'Alternance', Stage: 'Stage', Independant: 'Indépendant',
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

function OffreCard({ offre, index, onChanged }: {
  offre: Offre
  index: number
  onChanged: () => void
}) {
  const router = useRouter()
  const [visible, setVisible] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [publishError, setPublishError] = useState('')

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), index * 60)
    return () => clearTimeout(t)
  }, [index])

  const now = Date.now()
  const daysLeft = offre.dateLimite ? Math.ceil((new Date(offre.dateLimite).getTime() - now) / 86400000) : null
  const isExpired = daysLeft !== null && daysLeft < 0
  const isUrgent = daysLeft !== null && daysLeft >= 0 && daysLeft <= 3
  const initials = offre.entreprise.slice(0, 2).toUpperCase()

  const handlePublish = async () => {
    if (publishing) return
    setPublishing(true)
    setPublishError('')
    try {
      const res = await fetch(`/api/offres/${offre.id}/publish`, { method: 'POST', credentials: 'include' })
      if (res.ok) { router.refresh(); onChanged() }
      else {
        const j = await res.json().catch(() => ({}))
        setPublishError(j.error || 'Erreur lors de la publication')
      }
    } catch (e: any) { setPublishError(e.message || 'Erreur réseau') }
    finally { setPublishing(false) }
  }

  return (
    <div
      className="group bg-white rounded-2xl border border-gray-100 overflow-hidden flex flex-col"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(20px)',
        transition: 'opacity 0.4s ease, transform 0.4s ease, box-shadow 0.2s, border-color 0.2s',
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      }}
      onMouseEnter={e => Object.assign((e.currentTarget as HTMLElement).style, { boxShadow: '0 12px 32px rgba(128,0,32,0.12)', borderColor: '#fecdd3', transform: 'translateY(-3px)' })}
      onMouseLeave={e => Object.assign((e.currentTarget as HTMLElement).style, { boxShadow: '0 1px 4px rgba(0,0,0,0.06)', borderColor: '#f3f4f6', transform: 'translateY(0)' })}
    >
      {/* Bannière bordeaux avec logo intégré */}
      <div className="h-28 bg-[#800020] relative overflow-hidden flex-shrink-0">
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff12_1px,transparent_1px)] [background-size:12px_12px]" />
        <div className="absolute inset-0 bg-gradient-to-br from-[#800020] via-[#900025] to-[#5a0018]" />

        {/* Badge type de contrat */}
        <div className="absolute top-2.5 left-2.5">
          <span className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full shadow-md ${CONTRAT_COLORS[offre.typeContrat] || 'bg-gray-100 text-gray-700'}`}>
            {CONTRAT_ICONS[offre.typeContrat] || '💼'} {CONTRAT_LABELS[offre.typeContrat] || offre.typeContrat}
          </span>
        </div>

        {/* Badge statut */}
        <div className="absolute top-2.5 right-2.5">
          {offre.statut === 'brouillon' && (
            <span className="text-[9px] font-black uppercase px-2.5 py-1 rounded-full bg-gray-800 text-white shadow-lg ring-2 ring-white/50">✏️ Brouillon</span>
          )}
          {offre.statut === 'publie' && isExpired && (
            <span className="text-[9px] font-black uppercase px-2.5 py-1 rounded-full bg-gray-600 text-white shadow-lg ring-2 ring-white/50">Expirée</span>
          )}
          {offre.statut === 'publie' && isUrgent && (
            <span className="text-[9px] font-black uppercase px-2.5 py-1 rounded-full bg-orange-600 text-white shadow-lg ring-2 ring-white/50">
              ⏳ {daysLeft === 0 ? "Dernier jour" : `Plus que ${daysLeft}j`}
            </span>
          )}
        </div>

        {/* Logo centré, chevauche la bannière */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-16 h-16 rounded-2xl border-4 border-white/30 shadow-xl overflow-hidden bg-white flex-shrink-0">
            {offre.logoUrl ? (
              <img src={offre.logoUrl} alt="" className="w-full h-full object-contain p-1.5 transition-transform duration-500 group-hover:scale-110" />
            ) : (
              <div className="w-full h-full bg-gray-50 flex items-center justify-center text-[#800020] font-black text-lg">
                {initials}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Contenu */}
      <div className="flex-1 flex flex-col p-4 gap-3 text-center">
        <div>
          <h3 className="font-black text-gray-900 text-sm leading-snug line-clamp-2 group-hover:text-[#800020] transition-colors">
            {offre.poste}
          </h3>
          <p className="text-[11px] text-gray-500 font-bold mt-1 truncate">
            {offre.entreprise}
            {offre.localisation && <span className="text-gray-400 font-medium"> · 📍 {offre.localisation}</span>}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-1.5 text-[10px] font-bold">
          <div className="bg-red-50/60 border border-red-100/50 rounded-xl p-2 flex flex-col justify-center">
            <span className="text-gray-400 text-[9px] uppercase">Secteur</span>
            <span className="text-[#800020] font-black truncate">{offre.secteurLabel || '—'}</span>
          </div>
          <div className="bg-gray-50 border border-gray-100 rounded-xl p-2 flex flex-col justify-center">
            <span className="text-gray-400 text-[9px] uppercase">Rémunération</span>
            <span className="text-gray-800 font-black truncate">{offre.remunerationLabel || 'NC'}</span>
          </div>
        </div>

        {offre.dateLimite && offre.statut === 'publie' && !isExpired && (
          <p className="text-[10px] text-gray-400 font-medium">⏳ Candidature avant le <span className="font-black text-gray-600">{formatDate(offre.dateLimite)}</span></p>
        )}

        <div className="flex-1" />

        {/* Actions */}
        <div className="space-y-1.5 pt-2 border-t border-gray-100">
          {publishError && (
            <p className="text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 rounded-lg px-2.5 py-1.5">⚠️ {publishError}</p>
          )}
          {offre.statut === 'brouillon' && offre.isRecruteur && (
            <div className="grid grid-cols-2 gap-1.5">
              <Link href={`/jobs/${offre.id}/edit`}
                className="py-2 rounded-xl text-[10px] font-black uppercase tracking-wide bg-gray-100 hover:bg-gray-200 text-gray-700 transition-all flex items-center justify-center gap-1.5">
                ✏️ Continuer
              </Link>
              <button onClick={handlePublish} disabled={publishing}
                className="py-2 rounded-xl text-[10px] font-black uppercase tracking-wide bg-emerald-600 hover:bg-emerald-700 text-white transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-40">
                {publishing ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : '🚀 Publier'}
              </button>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <Link href={`/jobs/${offre.id}`}
              className="flex-1 block text-center py-2 bg-gray-900 hover:bg-[#800020] text-white font-black text-[10px] uppercase tracking-wider rounded-xl transition-all">
              Voir l'offre
            </Link>
            {offre.statut === 'publie' && offre.isRecruteur && (
              <Link href={`/jobs/${offre.id}/edit`} title="Modifier"
                className="px-3 py-2 bg-[#800020]/5 border border-[#800020]/20 hover:bg-[#800020]/10 text-[#800020] rounded-xl text-[10px] transition-all">
                ✏️
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function OffresPageClient({ actives, expirees, brouillons, currentUserId }: Props) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('actives')
  const [searchQ, setSearchQ] = useState('')
  const [contrat, setContrat] = useState('')
  const [secteur, setSecteur] = useState('')
  const [tabChanging, setTabChanging] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const allData: Record<string, Offre[]> = { actives, expirees, brouillon: brouillons }
  const baseList = allData[activeTab] || []

  const filtered = baseList.filter(o => {
    const q = searchQ.toLowerCase()
    const matchQ = !q || o.poste.toLowerCase().includes(q) || o.entreprise.toLowerCase().includes(q)
    const matchContrat = !contrat || o.typeContrat === contrat
    const matchSecteur = !secteur || o.secteur === secteur
    return matchQ && matchContrat && matchSecteur
  })

  const handleTabChange = (tab: string) => {
    if (tab === activeTab) return
    setTabChanging(true)
    setTimeout(() => { setActiveTab(tab); setTabChanging(false) }, 180)
  }

  const hasFilters = !!(searchQ || contrat || secteur)

  const tabs = [
    { key: 'actives', label: '🟢 Offres actives', count: actives.length },
    { key: 'expirees', label: '⏪ Expirées', count: expirees.length },
    { key: 'brouillon', label: '✏️ Mes brouillons', count: brouillons.length },
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
              <h1 className="text-2xl font-black text-gray-900">Offres d'emploi & stages</h1>
              <p className="text-sm text-gray-500 mt-0.5">Opportunités proposées par la communauté ENC Bessières</p>
            </div>
            <Link
              href="/jobs/new"
              className="inline-flex items-center gap-2 self-start sm:self-auto rounded-xl bg-[#800020] px-4 py-2.5 text-sm font-black text-white shadow-sm hover:bg-[#600018] hover:-translate-y-0.5 transition-all"
            >
              + Publier une offre
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
                placeholder="Rechercher un poste, une entreprise..."
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
              <select value={contrat} onChange={e => setContrat(e.target.value)}
                className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 outline-none cursor-pointer focus:border-[#800020]/30">
                <option value="">Type de contrat (Tous)</option>
                <option value="CDI">💼 CDI</option>
                <option value="CDD">📄 CDD</option>
                <option value="Alternance">🎓 Alternance</option>
                <option value="Stage">🧑‍💻 Stage</option>
                <option value="Independant">🚀 Indépendant</option>
              </select>
              <select value={secteur} onChange={e => setSecteur(e.target.value)}
                className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 outline-none cursor-pointer focus:border-[#800020]/30">
                <option value="">Secteur (Tous)</option>
                <option value="compta">Comptabilité / Gestion</option>
                <option value="rh">Ressources Humaines</option>
                <option value="informatique">Informatique / SLAM / SISR</option>
                <option value="commerce">Commerce / Marketing</option>
                <option value="digital_technologie">Digital / Technologie</option>
                <option value="conseil_audit">Conseil / Audit</option>
                <option value="banque_assurance_finance">Banque / Assurance / Finance</option>
                <option value="autres">Autres</option>
              </select>
              <button onClick={() => { setContrat(''); setSecteur(''); setSearchQ('') }}
                disabled={!hasFilters}
                className="flex items-center gap-1.5 px-3 py-2.5 text-xs font-black uppercase text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl border border-gray-200 hover:border-red-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer">
                <i className="fa-solid fa-trash-can text-xs" /> Effacer
              </button>
            </div>
          )}

          {/* Grille offres */}
          <div
            style={{
              opacity: tabChanging ? 0 : 1,
              transform: tabChanging ? 'translateY(8px)' : 'translateY(0)',
              transition: 'opacity 0.18s ease, transform 0.18s ease',
            }}
          >
            {filtered.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
                <div className="text-4xl mb-3">💼</div>
                <p className="text-sm font-black text-gray-700">
                  {activeTab === 'brouillon' ? 'Aucun brouillon en cours' : 'Aucune offre trouvée'}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {hasFilters ? 'Modifiez vos filtres' : activeTab === 'brouillon' ? 'Vos offres non publiées apparaîtront ici' : 'Aucune offre dans cet onglet'}
                </p>
                {activeTab === 'actives' && (
                  <Link href="/jobs/new"
                    className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-[#800020] text-white rounded-xl text-xs font-black uppercase hover:bg-[#600018] transition-colors">
                    + Publier la première offre
                  </Link>
                )}
              </div>
            ) : (
              <>
                <p className="text-xs text-gray-400 font-bold mb-3">
                  {filtered.length} offre{filtered.length > 1 ? 's' : ''}
                  {hasFilters && ' · filtré'}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filtered.map((offre, i) => (
                    <OffreCard key={`${offre.id}-${refreshKey}`} offre={offre} index={i} onChanged={() => setRefreshKey(k => k + 1)} />
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
