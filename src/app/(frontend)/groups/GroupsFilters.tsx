'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useTransition } from 'react'
import Link from 'next/link'

const CATEGORIES_SELECT = [
  { value: '', label: 'Toutes les catégories' },
  { value: 'etudiant', label: 'Étudiants' },
  { value: 'alumni', label: 'Alumni' },
  { value: 'enseignant', label: 'Enseignants' },
  { value: 'administratif', label: 'Administratif' },
  { value: 'club', label: 'Club' },
  { value: 'projet', label: 'Projet' },
  { value: 'promo', label: 'Promotion' },
  { value: 'autre', label: 'Autre' },
]

export default function GroupsFilters({
  tab,
  initialQ,
  initialCategorie,
}: {
  tab: string
  initialQ: string
  initialCategorie: string
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const navigate = useCallback(
    (q: string, categorie: string) => {
      const params = new URLSearchParams()
      params.set('tab', tab)
      if (q) params.set('q', q)
      if (categorie) params.set('categorie', categorie)
      startTransition(() => router.push(`/groups?${params.toString()}`))
    },
    [tab, router],
  )

  const hasActiveFilters = initialQ !== '' || initialCategorie !== ''

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      {/* Recherche */}
      <div className="relative flex-1">
        <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
          <svg
            className={`h-4 w-4 transition-colors ${isPending ? 'text-indigo-400' : 'text-gray-400'}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
        </div>
        <input
          type="search"
          defaultValue={initialQ}
          placeholder="Rechercher un groupe…"
          onChange={(e) => navigate(e.target.value, initialCategorie)}
          className="w-full rounded-xl border border-gray-200 bg-white pl-9 pr-4 py-2.5 text-sm shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-colors"
        />
      </div>

      {/* Filtre catégorie */}
      <select
        defaultValue={initialCategorie}
        onChange={(e) => navigate(initialQ, e.target.value)}
        className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-colors text-gray-700"
      >
        {CATEGORIES_SELECT.map((c) => (
          <option key={c.value} value={c.value}>{c.label}</option>
        ))}
      </select>

      {/* Effacer les filtres */}
      {hasActiveFilters && (
        <Link
          href={`/groups?tab=${tab}`}
          className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-600 hover:bg-gray-50 shadow-sm transition-colors whitespace-nowrap"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
          Effacer les filtres
        </Link>
      )}
    </div>
  )
}
