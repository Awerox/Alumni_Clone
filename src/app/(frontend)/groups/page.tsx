import React from 'react'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import Link from 'next/link'
import { getAuthUser } from '@/lib/auth'
import GroupsFilters from './GroupsFilters'
import DeleteGroupButton from './DeleteGroupButton'

// ─── Types ────────────────────────────────────────────────────────────────────

interface AlumniMember {
  id: string | number
  prenom?: string
  nom?: string
}

interface GroupMedia {
  url?: string
  alt?: string
}

interface Group {
  id: string | number
  titre: string
  slug: string
  categorie?: string
  description?: string
  miniature?: GroupMedia
  isPublic?: boolean
  membres?: (AlumniMember | string | number)[]
  createur?: AlumniMember | string | number
  createdAt: string
}

// ─── Constantes ───────────────────────────────────────────────────────────────

const CATEGORIE_LABELS: Record<string, string> = {
  academique:    'Académique',
  culturel:      'Culturel',
  artistique:    'Artistique',
  sportif:       'Sportif',
  environnement: 'Environnement',
  solidarite:    'Solidarité',
  professionnel: 'Professionnel',
  loisir:        'Loisir',
  autre:         'Autre',
}

const CATEGORIE_COLORS: Record<string, string> = {
  academique:    'bg-blue-100 text-blue-700',
  culturel:      'bg-purple-100 text-purple-700',
  artistique:    'bg-pink-100 text-pink-700',
  sportif:       'bg-green-100 text-green-700',
  environnement: 'bg-emerald-100 text-emerald-700',
  solidarite:    'bg-orange-100 text-orange-700',
  professionnel: 'bg-indigo-100 text-indigo-700',
  loisir:        'bg-amber-100 text-amber-700',
  autre:         'bg-gray-100 text-gray-600',
}


// ─── Sous-composants ──────────────────────────────────────────────────────────

function EmptyState({ tab }: { tab: string }) {
  const messages: Record<string, { title: string; sub: string; cta?: string }> = {
    tous: {
      title: "Aucun groupe pour l'instant",
      sub: 'Soyez le premier à créer une communauté.',
      cta: 'Créer un groupe',
    },
    mes_groupes: {
      title: "Vous n'avez pas encore de groupe",
      sub: 'Rejoignez un groupe existant ou créez le vôtre.',
      cta: 'Créer un groupe',
    },
    attente: {
      title: 'Aucun groupe en attente',
      sub: 'Tous les groupes ont été traités.',
    },
  }
  const m = messages[tab] ?? messages.tous

  return (
    <div className="flex flex-col items-center justify-center py-20 text-center rounded-2xl border-2 border-dashed border-gray-200 bg-white">
      <div className="h-14 w-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
        <svg className="h-7 w-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
        </svg>
      </div>
      <p className="text-sm font-semibold text-gray-800 mb-1">{m.title}</p>
      <p className="text-xs text-gray-400 mb-5 max-w-xs">{m.sub}</p>
      {m.cta && (
        <Link
          href="/groups/new"
          className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors shadow-sm"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          {m.cta}
        </Link>
      )}
    </div>
  )
}

// ─── Page principale ──────────────────────────────────────────────────────────

export default async function GroupsPage({
  searchParams,
}: {
  searchParams: { tab?: string; q?: string; categorie?: string }
}) {
  const payload = await getPayload({ config: configPromise })

  // Auth
  const { user } = await getAuthUser()

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 bg-white border border-gray-200 rounded-3xl shadow-sm max-w-sm">
          <div className="mx-auto h-14 w-14 rounded-2xl bg-indigo-50 flex items-center justify-center mb-4">
            <svg className="h-7 w-7 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-gray-800">Accès réservé aux membres</p>
          <p className="text-xs text-gray-400 mt-1 mb-5">
            Connectez-vous pour accéder aux groupes de la communauté ENC.
          </p>
          <Link
            href="/login?redirect=/groups"
            className="inline-flex items-center justify-center w-full gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors shadow-sm"
          >
            Se connecter
          </Link>
        </div>
      </div>
    )
  }

  const currentTab = searchParams.tab ?? 'tous'
  const searchQuery = searchParams.q?.toLowerCase().trim() ?? ''
  const categorieFilter = searchParams.categorie ?? ''

  // Chargement
  const groupsList = await payload.find({
    collection: 'groups',
    sort: '-createdAt',
    depth: 1,
    limit: 100,
  })

  let displayedGroups = groupsList.docs as unknown as Group[]

  // ── Filtrage par onglet ──────────────────────────────────
  if (currentTab === 'mes_groupes' && user) {
    displayedGroups = displayedGroups.filter((group) => {
      const creatorId =
        typeof group.createur === 'object' && group.createur !== null
          ? String((group.createur as AlumniMember).id)
          : String(group.createur ?? '')
      const isCreator = creatorId && creatorId === String(user.id)
      const isMember = group.membres?.some((m) => {
        const mId = typeof m === 'object' ? String((m as AlumniMember).id) : String(m)
        return mId === String(user.id)
      })
      return isCreator || isMember
    })
  } else if (currentTab === 'attente') {
    displayedGroups = []
  }

  // ── Filtrage par catégorie ───────────────────────────────
  if (categorieFilter) {
    displayedGroups = displayedGroups.filter((g) => g.categorie === categorieFilter)
  }

  // ── Filtrage par recherche ───────────────────────────────
  if (searchQuery) {
    displayedGroups = displayedGroups.filter(
      (g) =>
        g.titre?.toLowerCase().includes(searchQuery) ||
        g.description?.toLowerCase().includes(searchQuery),
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">

        {/* ── En-tête ──────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Groupes</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Communautés d'étudiants, alumni et enseignants
            </p>
          </div>
          <Link
            href="/groups/new"
            className="inline-flex items-center gap-2 self-start sm:self-auto rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Créer un groupe
          </Link>
        </div>

        {/* ── Onglets ───────────────────────────────────────── */}
        <div className="flex items-center gap-1 border-b border-gray-200">
          {[
            { key: 'tous', label: 'Tous les groupes' },
            { key: 'mes_groupes', label: 'Mes groupes' },
            { key: 'attente', label: 'En attente' },
          ].map(({ key, label }) => (
            <Link
              key={key}
              href={`/groups?tab=${key}`}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap ${
                currentTab === key
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300'
              }`}
            >
              {label}
            </Link>
          ))}
        </div>

        {/* ── Filtres ───────────────────────────────────────── */}
        <GroupsFilters
          tab={currentTab}
          initialQ={searchQuery}
          initialCategorie={categorieFilter}
        />

        {/* ── Liste des groupes ─────────────────────────────── */}
        {displayedGroups.length === 0 ? (
          <EmptyState tab={currentTab} />
        ) : (
          <div className="space-y-3">
            {displayedGroups.map((group) => {
              const miniatureUrl =
                group.miniature && typeof group.miniature === 'object'
                  ? group.miniature.url
                  : null

              const creatorId =
                typeof group.createur === 'object' && group.createur !== null
                  ? String((group.createur as AlumniMember).id)
                  : String(group.createur ?? '')

              const isCreator = !!user && !!creatorId && creatorId === String(user.id)
              const isAdmin = (user as { collection?: string } | null)?.collection === 'users'
              const isOwner = isCreator || isAdmin

              const membresCount = group.membres?.length ?? 0
              const catLabel = group.categorie
                ? (CATEGORIE_LABELS[group.categorie] ?? group.categorie)
                : null
              const catColor = group.categorie
                ? (CATEGORIE_COLORS[group.categorie] ?? 'bg-gray-100 text-gray-600')
                : null

              return (
                <div
                  key={String(group.id)}
                  className="group flex flex-col sm:flex-row items-stretch bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md hover:border-gray-300 transition-all duration-200 overflow-hidden"
                >
                  {/* Miniature gauche */}
                  <div className="relative w-full sm:w-14 h-32 sm:h-auto flex-shrink-0 bg-gray-100 overflow-hidden">
                    {miniatureUrl ? (
                      <img
                        src={miniatureUrl}
                        alt={group.titre}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
                        <svg className="h-6 w-6 text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Contenu */}
                  <div className="flex-1 px-5 py-4 flex flex-col justify-between min-w-0 gap-3">
                    <div className="flex items-start justify-between gap-3 min-w-0">
                      <div className="min-w-0">
                        {/* Badges */}
                        <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                          {catLabel && (
                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${catColor}`}>
                              {catLabel}
                            </span>
                          )}
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                              group.isPublic
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-red-50 text-red-700'
                            }`}
                          >
                            <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              {group.isPublic ? (
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
                              ) : (
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                              )}
                            </svg>
                            {group.isPublic ? 'Public' : 'Privé'}
                          </span>
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                            </svg>
                            {membresCount} membre{membresCount !== 1 ? 's' : ''}
                          </span>
                        </div>
                        {/* Titre */}
                        <h2 className="text-sm font-bold text-gray-900 group-hover:text-indigo-700 transition-colors truncate">
                          {group.titre}
                        </h2>
                        {/* Description */}
                        {group.description && (
                          <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">
                            {group.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between gap-2 pt-3 border-t border-gray-50">
                      <div className="flex items-center gap-1.5">
                        {isOwner ? (
                          <>
                            <Link
                              href={`/groups/${group.id}/edit`}
                              className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 hover:text-indigo-700 hover:border-indigo-200 transition-colors"
                            >
                              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                              </svg>
                              Modifier
                            </Link>
                            <DeleteGroupButton groupId={String(group.id)} />
                          </>
                        ) : (
                          <span className="text-xs text-gray-400 italic">Membre du réseau</span>
                        )}
                      </div>

                      <Link
                        href={`/groups/${group.id}`}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 transition-colors shadow-sm"
                      >
                        Accéder
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                        </svg>
                      </Link>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
