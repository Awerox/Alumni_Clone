'use server'

import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { getPayload } from 'payload'
import config from '@payload-config'
import { getAuthUser } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import RequestActionButtons from './RequestActionButtons'

// ─── Server Actions ───────────────────────────────────────────────────────────

async function handleRequestAction(requestId: string, action: 'accepted' | 'rejected') {
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
    data: { statut: action } as any,
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
  const [pendingReqs, handledReqs] = await Promise.all([
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
      limit: 20,
    }),
  ])

  const miniatureUrl = group.miniature && typeof group.miniature === 'object' ? group.miniature.url : null

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
                const acceptAction = handleRequestAction.bind(null, String(req.id), 'accepted')
                const rejectAction = handleRequestAction.bind(null, String(req.id), 'rejected')

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
                      </p>
                    </div>
                    <RequestActionButtons acceptAction={acceptAction} rejectAction={rejectAction} />
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Demandes traitées */}
        {handledReqs.docs.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
              Traitées récemment
            </h2>
            <div className="space-y-2">
              {handledReqs.docs.map((req: any) => {
                const demandeur = typeof req.demandeur === 'object' ? req.demandeur : null
                const fullName = demandeur ? [demandeur.prenom, demandeur.nom].filter(Boolean).join(' ') || 'Inconnu' : 'Inconnu'
                const initials = demandeur ? ((demandeur.prenom?.[0] ?? '') + (demandeur.nom?.[0] ?? '')).toUpperCase() || '?' : '?'

                return (
                  <div key={String(req.id)} className="rounded-xl bg-white shadow-sm ring-1 ring-gray-100 p-4 flex items-center gap-3 opacity-75">
                    {demandeur?.photo?.url ? (
                      <img src={demandeur.photo.url} alt={fullName} className="h-9 w-9 rounded-full object-cover flex-shrink-0" />
                    ) : (
                      <div className="h-9 w-9 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">{initials}</div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-700">{fullName}</p>
                      <p className="text-xs text-gray-400">{new Date(req.updatedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</p>
                    </div>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      req.statut === 'accepted' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {req.statut === 'accepted' ? 'Accepté' : 'Refusé'}
                    </span>
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
