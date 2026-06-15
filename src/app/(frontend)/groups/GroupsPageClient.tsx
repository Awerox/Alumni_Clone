'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import DeleteGroupButton from './DeleteGroupButton'

interface GroupData {
  id: string
  titre: string
  slug: string
  categorie: string | null
  catLabel: string | null
  catColor: string | null
  description: string | null
  miniatureUrl: string | null
  isPublic: boolean
  membresCount: number
  isCreator: boolean
  isOwner: boolean
  isMember: boolean
  hasPendingRequest: boolean
}

interface Props {
  initialTab: string
  initialQ: string
  initialCategorie: string
  allGroups: GroupData[]
  mesGroupes: GroupData[]
  attenteGroupes: GroupData[]
}

const CATEGORIE_OPTIONS = [
  { value: '', label: 'Toutes les catégories' },
  { value: 'academique', label: 'Académique' },
  { value: 'culturel', label: 'Culturel' },
  { value: 'artistique', label: 'Artistique' },
  { value: 'sportif', label: 'Sportif' },
  { value: 'environnement', label: 'Environnement' },
  { value: 'solidarite', label: 'Solidarité' },
  { value: 'professionnel', label: 'Professionnel' },
  { value: 'loisir', label: 'Loisir' },
  { value: 'autre', label: 'Autre' },
]

function GroupCard({ group, index }: { group: GroupData; index: number }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), index * 60)
    return () => clearTimeout(timer)
  }, [index])

  return (
    <div
      className="group flex flex-col sm:flex-row items-stretch bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(20px)',
        transition: 'opacity 0.4s ease, transform 0.4s ease, box-shadow 0.2s ease, border-color 0.2s ease',
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLElement
        el.style.boxShadow = '0 8px 24px rgba(0,0,0,0.10)'
        el.style.borderColor = '#c7d2fe'
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLElement
        el.style.boxShadow = ''
        el.style.borderColor = '#e5e7eb'
      }}
    >
      {/* Miniature */}
      <div className="relative w-full sm:w-44 h-40 sm:h-auto flex-shrink-0 bg-gray-100 overflow-hidden">
        {group.miniatureUrl ? (
          <img
            src={group.miniatureUrl}
            alt={group.titre}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
            <span className="text-3xl font-black text-indigo-300">{group.titre[0]?.toUpperCase()}</span>
          </div>
        )}
        {/* Badge visibilité */}
        <div className="absolute top-2 left-2">
          <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full backdrop-blur-sm ${group.isPublic ? 'bg-emerald-500/90 text-white' : 'bg-red-500/90 text-white'}`}>
            {group.isPublic ? '🌐 Public' : '🔒 Privé'}
          </span>
        </div>
      </div>

      {/* Contenu */}
      <div className="flex-1 px-5 py-4 flex flex-col justify-between min-w-0 gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5 mb-2">
            {group.catLabel && (
              <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${group.catColor}`}>
                {group.catLabel}
              </span>
            )}
            <span className="text-xs text-gray-400 flex items-center gap-1">
              👥 {group.membresCount} membre{group.membresCount !== 1 ? 's' : ''}
            </span>
            {group.isMember && !group.isCreator && (
              <span className="text-[10px] font-black text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full">
                ✓ Vous êtes membre
              </span>
            )}
            {group.hasPendingRequest && (
              <span className="text-[10px] font-black text-amber-700 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full">
                ⏳ Demande en approbation
              </span>
            )}
          </div>
          <h2 className="text-sm font-black text-gray-900 group-hover:text-indigo-700 transition-colors truncate">
            {group.titre}
          </h2>
          {group.description && (
            <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">
              {group.description.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 pt-3 border-t border-gray-100">
          <div className="flex items-center gap-1.5">
            {group.isOwner ? (
              <>
                <Link
                  href={`/groups/${group.id}/edit`}
                  className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-bold text-gray-600 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 transition-colors"
                >
                  ✏️ Modifier
                </Link>
                <DeleteGroupButton groupId={group.id} groupTitre={group.titre} />
              </>
            ) : (
              <span className="text-xs text-gray-400 italic">Membre du réseau</span>
            )}
          </div>
          <Link
            href={`/groups/${group.id}`}
            className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-black text-white hover:bg-indigo-700 transition-all hover:-translate-y-0.5 shadow-sm"
          >
            Accéder →
          </Link>
        </div>
      </div>
    </div>
  )
}

function EmptyState({ tab }: { tab: string }) {
  return (
    <div
      className="flex flex-col items-center justify-center py-20 text-center rounded-2xl border-2 border-dashed border-gray-200 bg-white"
      style={{ animation: 'fadeIn 0.4s ease' }}
    >
      <div className="h-14 w-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-4 text-3xl">
        {tab === 'attente' ? '⏳' : '👥'}
      </div>
      <p className="text-sm font-bold text-gray-800 mb-1">
        {tab === 'mes_groupes' ? "Vous n'avez pas encore de groupe" :
         tab === 'attente' ? 'Aucun groupe en attente' :
         "Aucun groupe pour l'instant"}
      </p>
      <p className="text-xs text-gray-400 mb-5 max-w-xs">
        {tab === 'mes_groupes' ? 'Rejoignez un groupe existant ou créez le vôtre.' :
         tab === 'attente' ? 'Tous les groupes ont été traités.' :
         'Soyez le premier à créer une communauté.'}
      </p>
      {tab !== 'attente' && (
        <Link href="/groups/new"
          className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white hover:bg-indigo-700 transition-colors shadow-sm">
          + Créer un groupe
        </Link>
      )}
    </div>
  )
}

export default function GroupsPageClient({ initialTab, initialQ, initialCategorie, allGroups, mesGroupes, attenteGroupes }: Props) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState(initialTab)
  const [searchQ, setSearchQ] = useState(initialQ)
  const [categorie, setCategorie] = useState(initialCategorie)
  const [tabChanging, setTabChanging] = useState(false)
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  // Groupes selon l'onglet actif
  const baseGroups = activeTab === 'mes_groupes' ? mesGroupes :
                     activeTab === 'attente' ? attenteGroupes : allGroups

  // Filtrage côté client
  const filtered = baseGroups.filter(g => {
    const matchQ = !searchQ || g.titre.toLowerCase().includes(searchQ.toLowerCase()) || (g.description || '').toLowerCase().includes(searchQ.toLowerCase())
    const matchCat = !categorie || g.categorie === categorie
    return matchQ && matchCat
  })

  const handleTabChange = (tab: string) => {
    if (tab === activeTab) return
    setTabChanging(true)
    setTimeout(() => {
      setActiveTab(tab)
      setTabChanging(false)
      router.push(`/groups?tab=${tab}`, { scroll: false })
    }, 180)
  }

  const handleSearch = (val: string) => {
    setSearchQ(val)
    clearTimeout(searchTimeout.current)
    searchTimeout.current = setTimeout(() => {
      const params = new URLSearchParams()
      params.set('tab', activeTab)
      if (val) params.set('q', val)
      if (categorie) params.set('categorie', categorie)
      router.push(`/groups?${params.toString()}`, { scroll: false })
    }, 400)
  }

  const handleCategorie = (val: string) => {
    setCategorie(val)
    const params = new URLSearchParams()
    params.set('tab', activeTab)
    if (searchQ) params.set('q', searchQ)
    if (val) params.set('categorie', val)
    router.push(`/groups?${params.toString()}`, { scroll: false })
  }

  const tabs = [
    { key: 'tous', label: 'Tous les groupes', count: allGroups.length },
    { key: 'mes_groupes', label: 'Mes groupes', count: mesGroupes.length },
    { key: 'attente', label: 'En attente', count: attenteGroupes.length },
  ]

  return (
    <>
      <style>{`
        @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        @keyframes slideDown { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }
        .anim-fade-up { animation: fadeUp 0.45s ease both; }
        .anim-slide-down { animation: slideDown 0.3s ease both; }
      `}</style>

      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">

          {/* Header */}
          <div className="anim-fade-up flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black text-gray-900">Groupes</h1>
              <p className="text-sm text-gray-500 mt-0.5">Communautés d'étudiants, alumni et enseignants</p>
            </div>
            <Link href="/groups/new"
              className="inline-flex items-center gap-2 self-start sm:self-auto rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-black text-white shadow-sm hover:bg-indigo-700 hover:-translate-y-0.5 transition-all">
              + Créer un groupe
            </Link>
          </div>

          {/* Onglets */}
          <div className="anim-fade-up flex items-center gap-1 border-b border-gray-200" style={{ animationDelay: '0.05s' }}>
            {tabs.map(({ key, label, count }) => (
              <button
                key={key}
                onClick={() => handleTabChange(key)}
                className="relative px-4 py-3 text-sm font-bold transition-all duration-200 whitespace-nowrap cursor-pointer"
                style={{
                  color: activeTab === key ? '#4f46e5' : '#6b7280',
                  borderBottom: activeTab === key ? '2px solid #4f46e5' : '2px solid transparent',
                  marginBottom: '-1px',
                }}
              >
                {label}
                {count > 0 && (
                  <span className={`ml-1.5 text-[10px] font-black px-1.5 py-0.5 rounded-full ${activeTab === key ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-500'}`}>
                    {count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Filtres */}
          <div className="anim-fade-up flex gap-3 flex-col sm:flex-row" style={{ animationDelay: '0.1s' }}>
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Rechercher un groupe..."
                value={searchQ}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-800 outline-none focus:border-indigo-400 transition-colors placeholder-gray-400 shadow-xs"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">🔍</span>
              {searchQ && (
                <button onClick={() => handleSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer">✕</button>
              )}
            </div>
            <select
              value={categorie}
              onChange={(e) => handleCategorie(e.target.value)}
              className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 outline-none focus:border-indigo-400 transition-colors cursor-pointer shadow-xs"
            >
              {CATEGORIE_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Liste */}
          <div
            style={{
              opacity: tabChanging ? 0 : 1,
              transform: tabChanging ? 'translateY(8px)' : 'translateY(0)',
              transition: 'opacity 0.18s ease, transform 0.18s ease',
            }}
          >
            {filtered.length === 0 ? (
              <EmptyState tab={activeTab} />
            ) : (
              <div className="space-y-3">
                {filtered.map((group, i) => (
                  <GroupCard key={group.id} group={group} index={i} />
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </>
  )
}
