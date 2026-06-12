'use server'
import React from 'react'

import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { getPayload } from 'payload'
import config from '@payload-config'
import { getAuthUser } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import RequestActionButtons from './RequestActionButtons'

// ─── Server Actions ───────────────────────────────────────────────────────────

async function handleRequestAction(requestId: string, action: 'accepted' | 'rejected', motif?: string) {
  'use server'
  const { user } = await getAuthUser()
  if (!user) throw new Error('Non authentifié')

  const payload = await getPayload({ config })

  const req = await payload.findByID({
    collection: 'group-requests' as any,
    id: requestId,
    depth: 1,
    overrideAccess: true,
  }) as any

  if (!req) throw new Error('Demande introuvable')

  const groupId = typeof req.groupe === 'object' ? req.groupe.id : req.groupe
  const group = await payload.findByID({ collection: 'groups', id: groupId, depth: 1 }) as any
  if (!group) throw new Error('Groupe introuvable')

  const userId = String(user.id)
  const creatorId = typeof group.createur === 'object' ? String(group.createur.id) : String(group.createur ?? '')
  const moderateurs = group.moderateurs ?? []
  const myConfig = moderateurs.find((a: any) => String(typeof a.membre === 'object' ? a.membre.id : a.membre) === userId)
  const isPayloadAdmin = (user as any).collection === 'users'
  const canManageRequests = userId === creatorId || isPayloadAdmin || !!myConfig?.canManageRequests

  if (!canManageRequests) {
    throw new Error('Accès refusé')
  }

  await payload.update({
    collection: 'group-requests' as any,
    id: requestId,
    overrideAccess: true,
    data: {
      statut: action,
      moderateur: Number(user.id),
      ...(action === 'rejected' ? { motif: motif?.trim() || undefined } : {}),
    } as any,
  })

  revalidatePath(`/groups/${groupId}/requests`)
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function GroupRequestsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const payload = await getPayload({ config })
  const { user } = await getAuthUser()

  if (!user) redirect(`/login?redirect=/groups/${id}/requests`)

  const group = await payload.findByID({ collection: 'groups', id, depth: 1 }).catch(() => null) as any
  if (!group) notFound()

  const userId = String(user.id)
  const creatorId = typeof group.createur === 'object' ? String(group.createur.id) : String(group.createur ?? '')
  const moderateurs = group.moderateurs ?? []
  const myConfig = moderateurs.find((a: any) => String(typeof a.membre === 'object' ? a.membre.id : a.membre) === userId)
  const isPayloadAdmin = (user as any).collection === 'users'
  const canManage = userId === creatorId || isPayloadAdmin || !!myConfig?.canManageRequests

  if (!canManage) redirect(`/groups/${id}`)

  // Charger les demandes
  const [pendingReqs, handledReqs, activityLogsRaw] = await Promise.all([
    payload.find({
      collection: 'group-requests' as any,
      where: { and: [{ groupe: { equals: id } }, { statut: { equals: 'pending' } }] },
      depth: 2,
      overrideAccess: true,
      sort: '-createdAt',
    }),
    payload.find({
      collection: 'group-requests' as any,
      where: { and: [{ groupe: { equals: id } }, { statut: { not_equals: 'pending' } }] },
      depth: 2,
      overrideAccess: true,
      sort: '-updatedAt',
      limit: 100,
    }),
    payload.find({
      collection: 'group-activity-logs' as any,
      where: { groupe: { equals: id } },
      depth: 1,
      overrideAccess: true,
      sort: '-createdAt',
      limit: 50,
    }).catch(() => ({ docs: [] as any[] })),
  ])

  const miniatureUrl = group.miniature && typeof group.miniature === 'object' ? group.miniature.url : null

  // Résoudre les médias référencés dans les logs (format "media:ID")
  const mediaIds = new Set<string>()
  for (const log of activityLogsRaw.docs as any[]) {
    for (const val of [log.ancienneValeur, log.nouvelleValeur]) {
      if (typeof val === 'string' && val.startsWith('media:')) mediaIds.add(val.slice(6))
    }
  }
  const mediaUrlMap = new Map<string, string>()
  if (mediaIds.size > 0) {
    const mediaDocs = await payload.find({
      collection: 'media',
      where: { id: { in: Array.from(mediaIds) } },
      depth: 0,
      overrideAccess: true,
      limit: mediaIds.size,
    }).catch(() => ({ docs: [] as any[] }))
    for (const m of (mediaDocs as any).docs ?? []) {
      if (m?.url) mediaUrlMap.set(String(m.id), m.url)
    }
  }
  const activityLogs = (activityLogsRaw.docs as any[]).map((log) => ({
    ...log,
    ancienneValeurResolved: typeof log.ancienneValeur === 'string' && log.ancienneValeur.startsWith('media:')
      ? mediaUrlMap.get(log.ancienneValeur.slice(6)) ?? null
      : log.ancienneValeur,
    nouvelleValeurResolved: typeof log.nouvelleValeur === 'string' && log.nouvelleValeur.startsWith('media:')
      ? mediaUrlMap.get(log.nouvelleValeur.slice(6)) ?? null
      : log.nouvelleValeur,
    isMedia: (typeof log.ancienneValeur === 'string' && log.ancienneValeur.startsWith('media:'))
      || (typeof log.nouvelleValeur === 'string' && log.nouvelleValeur.startsWith('media:')),
  }))

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">

        {/* En-tête */}
        <div className="flex items-center gap-3 mb-8">
          <Link href={`/groups/${id}`} className="rounded-lg p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
          </Link>
          <div className="flex items-center gap-3 min-w-0">
            {miniatureUrl && (
              <img src={miniatureUrl} alt="" className="h-10 w-10 rounded-xl object-cover flex-shrink-0" />
            )}
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-gray-900 truncate">Demandes d'accès</h1>
              <p className="text-sm text-gray-500 truncate">{group.titre}</p>
            </div>
          </div>
          {pendingReqs.totalDocs > 0 && (
            <span className="ml-auto inline-flex items-center justify-center rounded-full bg-amber-100 px-3 py-1 text-sm font-bold text-amber-700 flex-shrink-0">
              {pendingReqs.totalDocs} en attente
            </span>
          )}
        </div>

        {/* Demandes en attente */}
        <div className="space-y-4 mb-8">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
            En attente ({pendingReqs.totalDocs})
          </h2>

          {pendingReqs.docs.length === 0 ? (
            <div className="rounded-2xl bg-white shadow-sm ring-1 ring-gray-100 p-10 text-center">
              <div className="mx-auto h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <p className="text-sm text-gray-500">Aucune demande en attente</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingReqs.docs.map((req: any) => {
                const demandeur = typeof req.demandeur === 'object' ? req.demandeur : null
                const fullName = demandeur ? [demandeur.prenom, demandeur.nom].filter(Boolean).join(' ') || 'Inconnu' : 'Inconnu'
                const initials = demandeur ? ((demandeur.prenom?.[0] ?? '') + (demandeur.nom?.[0] ?? '')).toUpperCase() || '?' : '?'
                const acceptAction = handleRequestAction.bind(null, String(req.id), 'accepted') as () => Promise<void>
                const rejectAction = handleRequestAction.bind(null, String(req.id), 'rejected') as (motif?: string) => Promise<void>

                return (
                  <div key={String(req.id)} className="rounded-2xl bg-white shadow-sm ring-1 ring-gray-100 p-5 flex items-center gap-4">
                    {demandeur?.photo?.url ? (
                      <img src={demandeur.photo.url} alt={fullName} className="h-12 w-12 rounded-full object-cover flex-shrink-0" />
                    ) : (
                      <div className="h-12 w-12 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-semibold flex-shrink-0">{initials}</div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900">{fullName}</p>
                      {demandeur?.email && <p className="text-xs text-gray-500 truncate">{demandeur.email}</p>}
                      {demandeur?.diplome && (
                        <p className="text-xs text-gray-400">{demandeur.diplome}{demandeur.promotion ? ` · Promo ${demandeur.promotion}` : ''}</p>
                      )}
                      {req.message && (
                        <p className="text-xs text-gray-600 mt-1 italic bg-gray-50 rounded-lg px-2 py-1">"{req.message}"</p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(req.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                        {' à '}
                        {new Date(req.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <RequestActionButtons acceptAction={acceptAction} rejectAction={rejectAction} />
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Historique complet */}
        {handledReqs.docs.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
              Historique ({handledReqs.docs.length})
            </h2>
            <div className="space-y-2">
              {handledReqs.docs.map((req: any) => {
                const demandeur = typeof req.demandeur === 'object' ? req.demandeur : null
                const moderateur = typeof req.moderateur === 'object' ? req.moderateur : null
                const fullName = demandeur ? [demandeur.prenom, demandeur.nom].filter(Boolean).join(' ') || 'Inconnu' : 'Inconnu'
                const moderateurName = moderateur ? [moderateur.prenom, moderateur.nom].filter(Boolean).join(' ') || 'Inconnu' : null
                const initials = demandeur ? ((demandeur.prenom?.[0] ?? '') + (demandeur.nom?.[0] ?? '')).toUpperCase() || '?' : '?'

                const dateStr = new Date(req.updatedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
                const timeStr = new Date(req.updatedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })

                const badgeConfig: Record<string, { label: string; className: string }> = {
                  accepted: { label: 'Acceptée', className: 'bg-emerald-100 text-emerald-700' },
                  rejected: { label: 'Refusée', className: 'bg-red-100 text-red-700' },
                  removed:  { label: 'Membre retiré', className: 'bg-orange-100 text-orange-700' },
                }
                const badge = badgeConfig[req.statut] ?? { label: req.statut, className: 'bg-gray-100 text-gray-600' }

                // Texte d'action selon le statut
                let actionText: React.ReactNode = null
                if (req.statut === 'accepted') {
                  actionText = moderateurName ? <>Acceptée par <span className="font-semibold text-gray-700">{moderateurName}</span></> : 'Acceptée'
                } else if (req.statut === 'rejected') {
                  actionText = moderateurName ? <>Refusée par <span className="font-semibold text-gray-700">{moderateurName}</span></> : 'Refusée'
                } else if (req.statut === 'removed') {
                  actionText = moderateurName ? <>Retiré par <span className="font-semibold text-gray-700">{moderateurName}</span></> : 'Retiré du groupe'
                }

                return (
                  <div key={String(req.id)} className="rounded-xl bg-white shadow-sm ring-1 ring-gray-100 p-4">
                    <div className="flex items-center gap-3">
                      {demandeur?.photo?.url ? (
                        <img src={demandeur.photo.url} alt={fullName} className="h-9 w-9 rounded-full object-cover flex-shrink-0" />
                      ) : (
                        <div className="h-9 w-9 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">{initials}</div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-700">{fullName}</p>
                        <p className="text-xs text-gray-400">
                          {actionText} · {dateStr} à {timeStr}
                        </p>
                      </div>
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium flex-shrink-0 ${badge.className}`}>
                        {badge.label}
                      </span>
                    </div>
                    {req.motif && (
                      <p className="text-xs text-gray-500 italic mt-2 ml-12 bg-gray-50 rounded-lg px-2.5 py-1.5">
                        Motif : "{req.motif}"
                      </p>
                    )}
                    {req.message && (
                      <p className="text-xs text-gray-400 italic mt-2 ml-12">
                        Message du demandeur : "{req.message}"
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Journal d'activité (modifications du groupe) */}
        {activityLogs.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
              Journal d'activité ({activityLogs.length})
            </h2>
            <div className="space-y-2">
              {activityLogs.map((log: any) => {
                const utilisateur = typeof log.utilisateur === 'object' ? log.utilisateur : null
                const userName = utilisateur
                  ? [utilisateur.prenom, utilisateur.nom].filter(Boolean).join(' ') || 'Inconnu'
                  : 'Inconnu'
                const initials = utilisateur
                  ? ((utilisateur.prenom?.[0] ?? '') + (utilisateur.nom?.[0] ?? '')).toUpperCase() || '?'
                  : '?'
                const dateStr = new Date(log.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
                const timeStr = new Date(log.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })

                return (
                  <div key={String(log.id)} className="rounded-xl bg-white shadow-sm ring-1 ring-gray-100 p-4">
                    <div className="flex items-center gap-3">
                      {utilisateur?.photo?.url ? (
                        <img src={utilisateur.photo.url} alt={userName} className="h-9 w-9 rounded-full object-cover flex-shrink-0" />
                      ) : (
                        <div className="h-9 w-9 rounded-full bg-gradient-to-br from-indigo-300 to-purple-400 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">{initials}</div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-700">
                          <span className="font-semibold">{userName}</span> a modifié{' '}
                          <span className="font-semibold text-indigo-600">{log.champ}</span>
                        </p>
                        <p className="text-xs text-gray-400">{dateStr} à {timeStr}</p>
                      </div>
                    </div>

                    {/* Avant / Après */}
                    {log.isMedia ? (
                      <div className="flex items-center gap-3 mt-3 ml-12">
                        <div className="text-center">
                          <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Avant</p>
                          {log.ancienneValeurResolved ? (
                            <img src={log.ancienneValeurResolved} alt="Avant" className="h-16 w-16 rounded-lg object-cover ring-1 ring-gray-200" />
                          ) : (
                            <div className="h-16 w-16 rounded-lg bg-gray-100 flex items-center justify-center text-xs text-gray-400">Aucune</div>
                          )}
                        </div>
                        <svg className="h-4 w-4 text-gray-300 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                        <div className="text-center">
                          <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Après</p>
                          {log.nouvelleValeurResolved ? (
                            <img src={log.nouvelleValeurResolved} alt="Après" className="h-16 w-16 rounded-lg object-cover ring-1 ring-gray-200" />
                          ) : (
                            <div className="h-16 w-16 rounded-lg bg-gray-100 flex items-center justify-center text-xs text-gray-400">Aucune</div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 mt-2 ml-12 text-xs">
                        <span className="bg-red-50 text-red-600 rounded-lg px-2 py-1 line-through max-w-[200px] truncate">
                          {log.ancienneValeur || '(vide)'}
                        </span>
                        <svg className="h-3.5 w-3.5 text-gray-300 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                        <span className="bg-emerald-50 text-emerald-700 rounded-lg px-2 py-1 max-w-[200px] truncate">
                          {log.nouvelleValeur || '(vide)'}
                        </span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
