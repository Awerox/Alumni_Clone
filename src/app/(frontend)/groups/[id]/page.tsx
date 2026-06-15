'use server'

import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getPayload } from 'payload'
import config from '@payload-config'
import { getAuthUser } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import LeaveGroupButton from './LeaveGroupButton'
import RemoveMemberButton from './RemoveMemberButton'
import RequestAccessButton from './RequestAccessButton'
import GroupPageClient from './GroupPageClient'

// ─── Types ────────────────────────────────────────────────────────────────────

interface AlumniMember {
  id: string | number
  prenom?: string
  nom?: string
  email?: string
  photo?: { url?: string; alt?: string }
  diplome?: string
  promotion?: string
}

interface GroupMedia { url?: string; alt?: string }

interface Group {
  id: string | number
  titre: string
  slug: string
  categorie?: string
  description?: string
  miniature?: GroupMedia
  banniere?: GroupMedia
  isPublic?: boolean
  membres?: AlumniMember[]
  moderateurs?: { membre: AlumniMember | string | number; canManageRequests?: boolean; canManageMembers?: boolean; canEditGroup?: boolean }[]
  createur?: AlumniMember | string | number
  restrictDiplome?: string
  restrictCampus?: string
  restrictCategorie?: string
  restrictPromotion?: string
  createdAt: string
}

// ─── Constantes ───────────────────────────────────────────────────────────────

const CATEGORIE_LABELS: Record<string, string> = {
  academique: 'Académique', culturel: 'Culturel', artistique: 'Artistique',
  sportif: 'Sportif', environnement: 'Environnement', solidarite: 'Solidarité',
  professionnel: 'Professionnel', loisir: 'Loisir', autre: 'Autre',
}

const CATEGORIE_COLORS: Record<string, string> = {
  academique: 'bg-blue-500 text-white', culturel: 'bg-purple-500 text-white',
  artistique: 'bg-pink-500 text-white', sportif: 'bg-emerald-500 text-white',
  environnement: 'bg-green-500 text-white', solidarite: 'bg-orange-500 text-white',
  professionnel: 'bg-amber-400 text-gray-900', loisir: 'bg-cyan-500 text-white',
  autre: 'bg-gray-600 text-white',
}

function getInitials(member: AlumniMember): string {
  return ((member.prenom?.[0] ?? '') + (member.nom?.[0] ?? '')).toUpperCase() || '?'
}

// ─── Server Actions ───────────────────────────────────────────────────────────

async function requestAccessAction(groupId: string) {
  'use server'
  const { user } = await getAuthUser()
  if (!user) throw new Error('Non authentifié')
  const payload = await getPayload({ config })
  const groupIdNum = Number(groupId)
  const userIdNum = Number(user.id)
  const existing = await payload.find({
    collection: 'group-requests' as any,
    where: { and: [{ groupe: { equals: groupIdNum } }, { demandeur: { equals: userIdNum } }, { statut: { equals: 'pending' } }] },
    limit: 1, overrideAccess: true,
  })
  if (existing.docs.length > 0) return
  await payload.create({
    collection: 'group-requests' as any,
    overrideAccess: true,
    data: { groupe: groupIdNum, demandeur: userIdNum, statut: 'pending' } as any,
  })
  revalidatePath(`/groups/${groupId}`)
}

async function cancelRequestAction(groupId: string) {
  'use server'
  const { user } = await getAuthUser()
  if (!user) throw new Error('Non authentifié')
  const payload = await getPayload({ config })
  const groupIdNum = Number(groupId)
  const userIdNum = Number(user.id)
  const existing = await payload.find({
    collection: 'group-requests' as any,
    where: { and: [{ groupe: { equals: groupIdNum } }, { demandeur: { equals: userIdNum } }] },
    limit: 1, sort: '-createdAt', overrideAccess: true,
  })
  if (existing.docs.length > 0 && (existing.docs[0] as any).statut === 'pending') {
    await payload.delete({ collection: 'group-requests' as any, id: (existing.docs[0] as any).id, overrideAccess: true })
  }
  revalidatePath(`/groups/${groupId}`)
}

async function removeMemberAction(groupId: string, memberId: string, motif?: string) {
  'use server'
  const { user } = await getAuthUser()
  if (!user) throw new Error('Non authentifié')
  const payload = await getPayload({ config })
  const group = await payload.findByID({ collection: 'groups', id: groupId, depth: 0 }) as any
  if (!group) throw new Error('Groupe introuvable')
  const userId = String(user.id)
  const creatorId = typeof group.createur === 'object' ? String(group.createur.id) : String(group.createur ?? '')
  const moderateurs = group.moderateurs ?? []
  const myConfig = moderateurs.find((a: any) => String(typeof a.membre === 'object' ? a.membre.id : a.membre) === userId)
  const isPayloadAdmin = (user as any).collection === 'users'
  const canManageMembers = userId === creatorId || isPayloadAdmin || !!myConfig?.canManageMembers
  if (!canManageMembers) throw new Error('Accès refusé')
  if (memberId === creatorId) throw new Error('Impossible de retirer le créateur')
  const currentMembres = (group.membres ?? []).map((m: any) => typeof m === 'object' ? m.id : m)
  const updatedMembres = currentMembres.filter((id: any) => String(id) !== memberId)
  await payload.update({ collection: 'groups', id: groupId, overrideAccess: true, data: { membres: updatedMembres } })
  revalidatePath(`/groups/${groupId}`)
}

async function joinGroupAction(groupId: string) {
  'use server'
  const { user } = await getAuthUser()
  if (!user) throw new Error('Non authentifié')
  const payload = await getPayload({ config })
  const group = await payload.findByID({ collection: 'groups', id: groupId, depth: 0 }) as any
  if (!group) throw new Error('Groupe introuvable')
  if (!group.isPublic) throw new Error('Ce groupe est privé')
  const userIdNum = Number(user.id)
  const currentMembres = (group.membres ?? []).map((m: any) => typeof m === 'object' ? m.id : m)
  if (!currentMembres.map(String).includes(String(userIdNum))) {
    await payload.update({ collection: 'groups', id: groupId, overrideAccess: true, data: { membres: [...currentMembres, userIdNum] } })
  }
  revalidatePath(`/groups/${groupId}`)
}

async function leaveGroupAction(groupId: string) {
  'use server'
  const { user } = await getAuthUser()
  if (!user) throw new Error('Non authentifié')
  const payload = await getPayload({ config })
  const group = await payload.findByID({ collection: 'groups', id: groupId, depth: 0 }) as any
  if (!group) throw new Error('Groupe introuvable')
  const userId = String(user.id)
  const creatorId = typeof group.createur === 'object' ? String(group.createur.id) : String(group.createur ?? '')
  if (userId === creatorId) throw new Error('Le créateur ne peut pas quitter son propre groupe')
  const currentMembres = (group.membres ?? []).map((m: any) => typeof m === 'object' ? m.id : m)
  const updatedMembres = currentMembres.filter((id: any) => String(id) !== userId)
  const currentAdmins = group.moderateurs ?? []
  const updatedAdmins = currentAdmins.filter((a: any) => {
    const mId = typeof a.membre === 'object' ? a.membre.id : a.membre
    return String(mId) !== userId
  })
  await payload.update({ collection: 'groups', id: groupId, overrideAccess: true, data: { membres: updatedMembres, moderateurs: updatedAdmins } as any })
  revalidatePath(`/groups/${groupId}`)
}

// ─── Page principale ──────────────────────────────────────────────────────────

export default async function GroupDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const payload = await getPayload({ config })
  const { user } = await getAuthUser()
  const currentUserId = user ? String(user.id) : undefined

  let group: Group | null = null
  try {
    group = await payload.findByID({ collection: 'groups', id, depth: 2 }) as unknown as Group
  } catch { notFound() }
  if (!group) notFound()

  const members = (group.membres ?? []) as AlumniMember[]
  const moderateurs = group.moderateurs ?? []
  const creatorId = typeof group.createur === 'object' && group.createur !== null
    ? String((group.createur as AlumniMember).id) : String(group.createur ?? '')
  const creatorObj = typeof group.createur === 'object' && group.createur !== null
    ? (group.createur as AlumniMember) : null

  const isPayloadAdmin = (user as any)?.collection === 'users'
  const isCreator = !!currentUserId && creatorId === currentUserId
  const myAdminConfig = currentUserId
    ? moderateurs.find((a) => String(typeof a.membre === 'object' ? (a.membre as AlumniMember).id : a.membre) === currentUserId)
    : undefined
  const isGroupAdmin = !!myAdminConfig
  const canManageRequests = isCreator || isPayloadAdmin || !!myAdminConfig?.canManageRequests
  const canManageMembers = isCreator || isPayloadAdmin || !!myAdminConfig?.canManageMembers
  const canEditGroup = isCreator || isPayloadAdmin || !!myAdminConfig?.canEditGroup
  const isMember = !!currentUserId && members.some((m) => String(m.id) === currentUserId)
  const canManage = canManageRequests || canManageMembers || canEditGroup
  const hasAccess = group.isPublic || isCreator || isMember || isGroupAdmin || isPayloadAdmin

  let requestStatus: 'none' | 'pending' | 'rejected' | 'removed' = 'none'
  let requestMotif: string | undefined
  if (!hasAccess && currentUserId) {
    const existingReq = await payload.find({
      collection: 'group-requests' as any,
      where: { and: [{ groupe: { equals: Number(group.id) } }, { demandeur: { equals: Number(currentUserId) } }] },
      limit: 1, sort: '-createdAt', overrideAccess: true,
    })
    if (existingReq.docs.length > 0) {
      const doc = existingReq.docs[0] as any
      const s = doc.statut
      if (s === 'pending') requestStatus = 'pending'
      else if (s === 'rejected') requestStatus = 'rejected'
      else if (s === 'removed') requestStatus = 'removed'
      requestMotif = doc.motif || undefined
    }
  }

  let pendingCount = 0
  if (canManageRequests) {
    const pending = await payload.find({
      collection: 'group-requests' as any,
      where: { and: [{ groupe: { equals: Number(group.id) } }, { statut: { equals: 'pending' } }] },
      limit: 0, overrideAccess: true,
    })
    pendingCount = pending.totalDocs
  }

  const catLabel = group.categorie ? (CATEGORIE_LABELS[group.categorie] ?? group.categorie) : null
  const catColor = group.categorie ? (CATEGORIE_COLORS[group.categorie] ?? 'bg-gray-600 text-white') : null
  const requestAccessWithId = requestAccessAction.bind(null, String(group.id))
  const cancelRequestWithId = cancelRequestAction.bind(null, String(group.id))
  const joinGroupWithId = joinGroupAction.bind(null, String(group.id))
  const leaveGroupWithId = leaveGroupAction.bind(null, String(group.id))
  const banniereUrl = group.banniere?.url
  const miniatureUrl = group.miniature?.url

  // Sérialiser les membres pour le composant client
  const membersData = members.map((m) => {
    const isThisCreator = String(m.id) === creatorId
    const thisModConfig = moderateurs.find((a: any) =>
      String(typeof a.membre === 'object' ? a.membre.id : a.membre) === String(m.id))
    return {
      id: String(m.id),
      prenom: m.prenom || '',
      nom: m.nom || '',
      photoUrl: m.photo?.url || null,
      diplome: m.diplome || null,
      promotion: m.promotion || null,
      isCreator: isThisCreator,
      isModerator: !!thisModConfig && !isThisCreator,
      canBeRemoved: canManageMembers && !isThisCreator,
    }
  })

  return (
    <div className="min-h-screen bg-gray-50/50 font-sans">

      {/* ── HERO BANNIÈRE ── */}
      <div className="relative w-full h-64 md:h-96 overflow-hidden bg-gray-900">
        {banniereUrl ? (
          <>
            <img src={banniereUrl} alt="" className="absolute inset-0 w-full h-full object-cover blur-xl scale-110 opacity-60" />
            <div className="absolute inset-0 overflow-hidden">
              <img src={banniereUrl} alt="" className="w-full h-full object-cover scale-100" />
            </div>
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-amber-400 via-orange-500 to-red-600 opacity-90" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/50 to-black/10" />

        <div className="absolute top-4 left-4 z-10">
          <Link href="/groups"
            className="inline-flex items-center gap-1.5 bg-black/30 hover:bg-black/50 backdrop-blur-sm text-white text-xs font-bold uppercase tracking-wider px-3 py-2 rounded-xl transition-all duration-200 border border-white/10">
            ← Retour aux groupes
          </Link>
        </div>

        {canManage && (
          <div className="absolute top-4 right-4 z-10 flex gap-2">
            {canManageRequests && pendingCount > 0 && (
              <Link href={`/groups/${group.id}/requests`}
                className="inline-flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-gray-900 text-xs font-black uppercase tracking-wider px-3 py-2 rounded-xl transition-all duration-200 shadow-lg">
                🔔 {pendingCount} demande{pendingCount > 1 ? 's' : ''}
              </Link>
            )}
            {canEditGroup && (
              <Link href={`/groups/${group.id}/edit`}
                className="inline-flex items-center gap-1.5 bg-black/30 hover:bg-black/50 backdrop-blur-sm text-white text-xs font-bold uppercase tracking-wider px-3 py-2 rounded-xl transition-all duration-200 border border-white/10">
                ⚙️ Modifier
              </Link>
            )}
          </div>
        )}

        <div className="absolute bottom-0 left-0 right-0 p-6 flex items-end gap-4">
          <div className="flex-shrink-0 h-28 w-28 md:h-36 md:w-36 rounded-2xl ring-4 ring-white/30 shadow-2xl overflow-hidden bg-gray-800 relative z-10">
            {miniatureUrl ? (
              <img src={miniatureUrl} alt={group.titre} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center text-4xl font-black text-white">
                {group.titre[0]?.toUpperCase()}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0 pb-1">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              {catLabel && (
                <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${catColor}`}>{catLabel}</span>
              )}
              <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${group.isPublic ? 'bg-emerald-400/20 text-emerald-300 border border-emerald-400/30' : 'bg-red-400/20 text-red-300 border border-red-400/30'}`}>
                {group.isPublic ? '🌐 Public' : '🔒 Privé'}
              </span>
            </div>
            <h1 className="text-xl md:text-3xl font-black text-white leading-tight tracking-tight truncate drop-shadow-lg">
              {group.titre}
            </h1>
            <p className="text-xs text-white/60 font-medium mt-0.5">
              {members.length} membre{members.length !== 1 ? 's' : ''}
              {creatorObj && <> · par <span className="text-white/80">{[creatorObj.prenom, creatorObj.nom].filter(Boolean).join(' ')}</span></>}
            </p>
          </div>
        </div>
      </div>

      {/* ── CONTENU ── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-12">
        {!hasAccess ? (
          /* ── GROUPE PRIVÉ SANS ACCÈS ── */
          <div className="space-y-6">
            <div className="grid grid-cols-3 divide-x divide-gray-200 bg-white border border-gray-200 rounded-2xl shadow-xs overflow-hidden">
              {[
                { val: members.length, label: `Membre${members.length !== 1 ? 's' : ''}` },
                { val: catLabel ?? '—', label: 'Catégorie' },
                { val: new Date(group.createdAt).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' }), label: 'Créé en' },
              ].map(({ val, label }) => (
                <div key={label} className="px-4 py-4 text-center">
                  <p className="text-xl font-black text-gray-900">{val}</p>
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-0.5">{label}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4 relative">
                <div className="pointer-events-none select-none filter blur-sm opacity-60 space-y-4">
                  {[1, 2].map((n) => (
                    <div key={n} className="bg-white border border-gray-200 rounded-2xl p-6 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-gray-200 flex-shrink-0" />
                        <div className="space-y-1.5 flex-1">
                          <div className="h-2.5 bg-gray-200 rounded-full w-1/3" />
                          <div className="h-2 bg-gray-100 rounded-full w-1/4" />
                        </div>
                      </div>
                      <div className="h-2.5 bg-gray-100 rounded-full w-full" />
                      <div className="h-2.5 bg-gray-100 rounded-full w-5/6" />
                      {n === 1 && <div className="h-32 bg-gray-100 rounded-xl w-full" />}
                    </div>
                  ))}
                </div>
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-gray-50/60 to-gray-50 pointer-events-none" />
              </div>

              <div className="lg:col-span-1">
                <div className="bg-white border border-gray-200 rounded-3xl shadow-sm overflow-hidden sticky top-6">
                  <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-8 text-center">
                    <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl">🔒</span>
                    </div>
                    <h2 className="text-lg font-black text-white uppercase tracking-tight">Groupe privé</h2>
                    <p className="text-xs text-gray-400 mt-1 font-medium">Ce contenu est réservé aux membres</p>
                  </div>
                  <div className="p-8 text-center space-y-5">
                    <p className="text-sm text-gray-600 leading-relaxed">
                      Pour accéder aux publications et discussions de ce groupe, vous devez être accepté par le créateur.
                    </p>
                    {!currentUserId ? (
                      <Link href={`/login?redirect=/groups/${group.id}`}
                        className="inline-flex items-center gap-2 w-full justify-center py-3 bg-amber-500 hover:bg-amber-400 text-gray-900 text-xs font-black uppercase tracking-widest rounded-xl transition-all duration-200 shadow-sm hover:-translate-y-0.5">
                        Se connecter pour demander l'accès
                      </Link>
                    ) : requestStatus === 'pending' ? (
                      <div className="space-y-3">
                        <div className="flex items-center justify-center gap-2 py-3 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-black uppercase tracking-wider rounded-xl">
                          ⏳ Demande en attente
                        </div>
                        <RequestAccessButton key="cancel" action={cancelRequestWithId} label="✕ Retirer ma demande" variant="secondary" doneLabel="✕ Demande retirée" doneVariant="danger" persistDone={false} />
                      </div>
                    ) : requestStatus === 'rejected' ? (
                      <div className="space-y-3">
                        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-left">
                          <p className="text-xs font-black uppercase tracking-wider mb-1">✕ Demande refusée</p>
                          {requestMotif && <p className="text-xs text-red-600/80 italic">"{requestMotif}"</p>}
                        </div>
                        <RequestAccessButton key="resend" action={requestAccessWithId} label="Renvoyer une demande" />
                      </div>
                    ) : requestStatus === 'removed' ? (
                      <div className="space-y-3">
                        <div className="bg-orange-50 border border-orange-200 text-orange-700 rounded-xl px-4 py-3 text-left">
                          <p className="text-xs font-black uppercase tracking-wider mb-1">⚠ Retiré du groupe</p>
                          {requestMotif && <p className="text-xs text-orange-600/80 italic mt-1">Motif : "{requestMotif}"</p>}
                        </div>
                        <RequestAccessButton key="resend" action={requestAccessWithId} label="Renvoyer une demande" />
                      </div>
                    ) : (
                      <RequestAccessButton key="request" action={requestAccessWithId} />
                    )}
                    <Link href="/groups" className="block text-xs text-gray-400 hover:text-gray-600 font-bold transition-colors">
                      ← Voir les autres groupes
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* ── CONTENU COMPLET AVEC ONGLETS ── */
          <GroupPageClient
            groupId={String(group.id)}
            groupDescription={group.description || null}
            currentUserId={currentUserId || null}
            isMember={isMember}
            isCreator={isCreator}
            canManageMembers={canManageMembers}
            canManageRequests={canManageRequests}
            canEditGroup={canEditGroup}
            pendingCount={pendingCount}
            membersData={membersData}
            creatorObj={creatorObj ? {
              id: String(creatorObj.id),
              prenom: creatorObj.prenom || '',
              nom: creatorObj.nom || '',
              photoUrl: creatorObj.photo?.url || null,
              diplome: creatorObj.diplome || null,
              promotion: creatorObj.promotion || null,
            } : null}
            catLabel={catLabel}
            groupInfo={{
              isPublic: !!group.isPublic,
              createdAt: group.createdAt,
              memberCount: members.length,
            }}
            leaveGroupAction={leaveGroupWithId}
            joinGroupAction={joinGroupWithId}
            removeMemberActionBase={(memberId: string) => removeMemberAction(String(group.id), memberId)}
          />
        )}
      </div>
    </div>
  )
}
