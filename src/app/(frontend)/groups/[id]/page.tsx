'use server'

import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getPayload } from 'payload'
import config from '@payload-config'
import { getAuthUser } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import LeaveGroupButton from './LeaveGroupButton'
import RemoveMemberButton from './RemoveMemberButton'

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
  academique: 'bg-blue-500 text-white',
  culturel: 'bg-purple-500 text-white',
  artistique: 'bg-pink-500 text-white',
  sportif: 'bg-emerald-500 text-white',
  environnement: 'bg-green-500 text-white',
  solidarite: 'bg-orange-500 text-white',
  professionnel: 'bg-amber-400 text-gray-900',
  loisir: 'bg-cyan-500 text-white',
  autre: 'bg-gray-600 text-white',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(member: AlumniMember): string {
  return ((member.prenom?.[0] ?? '') + (member.nom?.[0] ?? '')).toUpperCase() || '?'
}

// ─── Server Actions ───────────────────────────────────────────────────────────

async function requestAccessAction(groupId: string) {
  'use server'
  const { user } = await getAuthUser()
  if (!user) throw new Error('Non authentifié')
  const payload = await getPayload({ config })

  // ✅ Postgres attend des IDs numériques pour les relations
  const groupIdNum = Number(groupId)
  const userIdNum = Number(user.id)

  const existing = await payload.find({
    collection: 'group-requests' as any,
    where: { and: [{ groupe: { equals: groupIdNum } }, { demandeur: { equals: userIdNum } }, { statut: { equals: 'pending' } }] },
    limit: 1,
    overrideAccess: true,
  })
  if (existing.docs.length > 0) return

  // Si une demande "rejected" existe déjà, on la remet en pending au lieu d'en créer une nouvelle
  const rejectedExisting = await payload.find({
    collection: 'group-requests' as any,
    where: { and: [{ groupe: { equals: groupIdNum } }, { demandeur: { equals: userIdNum } }] },
    limit: 1,
    overrideAccess: true,
  })

  if (rejectedExisting.docs.length > 0) {
    await payload.update({
      collection: 'group-requests' as any,
      id: (rejectedExisting.docs[0] as any).id,
      overrideAccess: true,
      data: { statut: 'pending' } as any,
    })
  } else {
    await payload.create({
      collection: 'group-requests' as any,
      overrideAccess: true,
      data: { groupe: groupIdNum, demandeur: userIdNum, statut: 'pending' } as any,
    })
  }

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
    where: { and: [{ groupe: { equals: groupIdNum } }, { demandeur: { equals: userIdNum } }, { statut: { equals: 'pending' } }] },
    limit: 1,
    overrideAccess: true,
  })

  if (existing.docs.length > 0) {
    await payload.delete({
      collection: 'group-requests' as any,
      id: (existing.docs[0] as any).id,
      overrideAccess: true,
    })
  }

  revalidatePath(`/groups/${groupId}`)
}

async function removeMemberAction(groupId: string, memberId: string) {
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

  await payload.update({
    collection: 'groups',
    id: groupId,
    overrideAccess: true,
    data: { membres: updatedMembres },
  })

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
    await payload.update({
      collection: 'groups',
      id: groupId,
      overrideAccess: true,
      data: { membres: [...currentMembres, userIdNum] },
    })
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

  // Retire aussi le membre de la liste des modérateurs s'il y était
  const currentAdmins = group.moderateurs ?? []
  const updatedAdmins = currentAdmins.filter((a: any) => {
    const mId = typeof a.membre === 'object' ? a.membre.id : a.membre
    return String(mId) !== userId
  })

  await payload.update({
    collection: 'groups',
    id: groupId,
    overrideAccess: true,
    data: { membres: updatedMembres, moderateurs: updatedAdmins } as any,
  })

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

  // Statut demande d'accès
  let requestStatus: 'none' | 'pending' | 'rejected' = 'none'
  if (!hasAccess && currentUserId) {
    const existingReq = await payload.find({
      collection: 'group-requests' as any,
      where: { and: [{ groupe: { equals: Number(group.id) } }, { demandeur: { equals: Number(currentUserId) } }] },
      limit: 1, overrideAccess: true,
    })
    if (existingReq.docs.length > 0)
      requestStatus = (existingReq.docs[0] as any).statut === 'rejected' ? 'rejected' : 'pending'
  }

  // Demandes en attente
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

  return (
    <div className="min-h-screen bg-gray-50/50 font-sans">

      {/* ── HERO BANNIÈRE ────────────────────────────────────────────── */}
      <div className="relative w-full h-64 md:h-96 overflow-hidden bg-gray-900">
        {banniereUrl ? (
          <>
            {/* Fond flou plein cadre pour combler le dézoom */}
            <img src={banniereUrl} alt="" className="absolute inset-0 w-full h-full object-cover blur-xl scale-110 opacity-60" />
            {/* Image principale légèrement dézoomée */}
            <div className="absolute inset-0 overflow-hidden">
              <img src={banniereUrl} alt="" className="w-full h-full object-cover scale-90" />
            </div>
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-amber-400 via-orange-500 to-red-600 opacity-90" />
        )}
        {/* Overlay dégradé */}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/50 to-black/10" />

        {/* Bouton retour */}
        <div className="absolute top-4 left-4 z-10">
          <Link href="/groups"
            className="inline-flex items-center gap-1.5 bg-black/30 hover:bg-black/50 backdrop-blur-sm text-white text-xs font-bold uppercase tracking-wider px-3 py-2 rounded-xl transition-all duration-200 border border-white/10">
            ← Retour aux groupes
          </Link>
        </div>

        {/* Actions manager */}
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

        {/* Infos groupe en bas de la bannière */}
        <div className="absolute bottom-0 left-0 right-0 p-6 flex items-end gap-4">
          {/* Miniature */}
          <div className="flex-shrink-0 h-28 w-28 md:h-36 md:w-36 rounded-2xl ring-4 ring-white/30 shadow-2xl overflow-hidden bg-gray-800 relative z-10">
            {miniatureUrl ? (
              <img src={miniatureUrl} alt={group.titre} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center text-4xl font-black text-white">
                {group.titre[0]?.toUpperCase()}
              </div>
            )}
          </div>
          {/* Titre */}
          <div className="flex-1 min-w-0 pb-1">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              {catLabel && (
                <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${catColor}`}>
                  {catLabel}
                </span>
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

      {/* ── CONTENU PRINCIPAL ────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-12">

        {/* ── GROUPE PRIVÉ SANS ACCÈS ───────────────────────────────── */}
        {!hasAccess ? (
          <div className="space-y-6">

            {/* Bandeau stats */}
            <div className="grid grid-cols-3 divide-x divide-gray-200 bg-white border border-gray-200 rounded-2xl shadow-xs overflow-hidden">
              <div className="px-4 py-4 text-center">
                <p className="text-xl font-black text-gray-900">{members.length}</p>
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-0.5">Membre{members.length !== 1 ? 's' : ''}</p>
              </div>
              <div className="px-4 py-4 text-center">
                <p className="text-xl font-black text-gray-900">{catLabel ?? '—'}</p>
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-0.5">Catégorie</p>
              </div>
              <div className="px-4 py-4 text-center">
                <p className="text-xl font-black text-gray-900">
                  {new Date(group.createdAt).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })}
                </p>
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-0.5">Créé en</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Teaser flouté à gauche */}
              <div className="lg:col-span-2 space-y-4 relative">
                <div className="pointer-events-none select-none filter blur-sm opacity-60 space-y-4">
                  <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-gray-200 flex-shrink-0" />
                      <div className="space-y-1.5 flex-1">
                        <div className="h-2.5 bg-gray-200 rounded-full w-1/3" />
                        <div className="h-2 bg-gray-100 rounded-full w-1/4" />
                      </div>
                    </div>
                    <div className="h-2.5 bg-gray-100 rounded-full w-full" />
                    <div className="h-2.5 bg-gray-100 rounded-full w-5/6" />
                    <div className="h-32 bg-gray-100 rounded-xl w-full" />
                  </div>
                  <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-gray-200 flex-shrink-0" />
                      <div className="space-y-1.5 flex-1">
                        <div className="h-2.5 bg-gray-200 rounded-full w-1/4" />
                        <div className="h-2 bg-gray-100 rounded-full w-1/5" />
                      </div>
                    </div>
                    <div className="h-2.5 bg-gray-100 rounded-full w-full" />
                    <div className="h-2.5 bg-gray-100 rounded-full w-2/3" />
                  </div>
                </div>
                {/* Overlay gradient pour fondu */}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-gray-50/60 to-gray-50 pointer-events-none" />
              </div>

              {/* Carte demande d'accès */}
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
                          ⏳ Demande en attente d'approbation
                        </div>
                        <form action={cancelRequestWithId}>
                          <button type="submit"
                            className="w-full py-2.5 bg-white border border-gray-200 hover:bg-red-50 hover:border-red-200 hover:text-red-600 text-gray-500 text-xs font-black uppercase tracking-widest rounded-xl transition-all duration-200">
                            ✕ Retirer ma demande
                          </button>
                        </form>
                      </div>
                    ) : requestStatus === 'rejected' ? (
                      <div className="space-y-3">
                        <div className="flex items-center justify-center gap-2 py-3 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-xl">
                          ✕ Demande refusée
                        </div>
                        <form action={requestAccessWithId}>
                          <button type="submit"
                            className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-gray-900 text-xs font-black uppercase tracking-widest rounded-xl transition-all duration-200 shadow-sm hover:-translate-y-0.5">
                            Renvoyer une demande
                          </button>
                        </form>
                      </div>
                    ) : (
                      <form action={requestAccessWithId}>
                        <button type="submit"
                          className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-gray-900 text-xs font-black uppercase tracking-widest rounded-xl transition-all duration-200 shadow-sm hover:-translate-y-0.5 active:scale-[0.98]">
                          ✦ Demander l'accès
                        </button>
                      </form>
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
          /* ── CONTENU COMPLET ────────────────────────────────────── */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Colonne principale */}
            <div className="lg:col-span-2 space-y-5">

              {/* À propos */}
              {group.description && (
                <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs hover:shadow-md transition-shadow duration-300">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-3">À propos</p>
                  <div className="text-sm text-gray-700 leading-relaxed prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: group.description }} />
                </div>
              )}

              {/* Membres */}
              <div className="bg-white border border-gray-200 rounded-2xl shadow-xs hover:shadow-md transition-shadow duration-300 overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 gap-3 flex-wrap">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
                    Membres · <span className="text-amber-500">{members.length}</span>
                  </p>
                  <div className="flex items-center gap-2">
                    {isCreator && (
                      <span className="text-[9px] font-black uppercase tracking-wider text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                        ✦ Créateur
                      </span>
                    )}
                    {isMember && !isCreator && (
                      <>
                        <span className="text-[9px] font-black uppercase tracking-wider text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                          ✓ Vous êtes membre
                        </span>
                        <LeaveGroupButton action={leaveGroupWithId} isPublic={!!group.isPublic} />
                      </>
                    )}
                    {!isMember && !isCreator && currentUserId && group.isPublic && (
                      <form action={joinGroupWithId}>
                        <button type="submit"
                          className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-gray-900 transition-colors shadow-sm hover:-translate-y-0.5 duration-200">
                          ✦ Rejoindre le groupe
                        </button>
                      </form>
                    )}
                    {!currentUserId && group.isPublic && (
                      <Link href={`/login?redirect=/groups/${group.id}`}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-gray-900 transition-colors shadow-sm">
                        Se connecter pour rejoindre
                      </Link>
                    )}
                  </div>
                </div>
                {members.length === 0 ? (
                  <div className="py-12 text-center">
                    <div className="text-3xl mb-2">👥</div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Aucun membre pour l'instant</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x-0">
                    {members.map((m) => {
                      const initials = getInitials(m)
                      const fullName = [m.prenom, m.nom].filter(Boolean).join(' ') || 'Membre'
                      const isThisCreator = String(m.id) === creatorId
                      const removeMemberWithId = removeMemberAction.bind(null, String(group.id), String(m.id))
                      return (
                        <div key={String(m.id)}
                          className="flex items-center gap-3 px-5 py-3.5 hover:bg-amber-50/50 transition-colors duration-200 group">
                          {m.photo?.url ? (
                            <img src={m.photo.url} alt={fullName}
                              className="h-10 w-10 rounded-full object-cover flex-shrink-0 ring-2 ring-gray-100 group-hover:ring-amber-200 transition-all" />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-sm font-black flex-shrink-0">
                              {initials}
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <p className="text-sm font-bold text-gray-900 truncate group-hover:text-amber-700 transition-colors">{fullName}</p>
                              {isThisCreator && <span className="text-[8px] font-black text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full uppercase">créateur</span>}
                            </div>
                            {m.diplome && <p className="text-[10px] text-gray-400 font-medium truncate">{m.diplome}{m.promotion ? ` · ${m.promotion}` : ''}</p>}
                          </div>
                          {canManageMembers && !isThisCreator && (
                            <RemoveMemberButton action={removeMemberWithId} memberName={fullName} />
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-5">

              {/* Infos */}
              <div className="bg-white border border-gray-200 rounded-2xl shadow-xs overflow-hidden">
                <div className="bg-gray-900 px-5 py-4">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Informations</p>
                </div>
                <div className="p-5 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
                      <span className="text-base">🏷️</span>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-wider">Catégorie</p>
                      <p className="text-sm font-bold text-gray-900">{catLabel ?? '—'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
                      <span className="text-base">👥</span>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-wider">Membres</p>
                      <p className="text-sm font-bold text-gray-900">{members.length} membre{members.length !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
                      <span className="text-base">📅</span>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-wider">Créé le</p>
                      <p className="text-sm font-bold text-gray-900">
                        {new Date(group.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
                      <span className="text-base">{group.isPublic ? '🌐' : '🔒'}</span>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-wider">Visibilité</p>
                      <p className="text-sm font-bold text-gray-900">{group.isPublic ? 'Groupe public' : 'Groupe privé'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Créateur */}
              {creatorObj && (
                <div className="bg-white border border-gray-200 rounded-2xl shadow-xs overflow-hidden">
                  <div className="bg-gray-900 px-5 py-4">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Modérateur du groupe</p>
                  </div>
                  <div className="p-4">
                    <div className="flex items-center gap-3">
                      {creatorObj.photo?.url ? (
                        <img src={creatorObj.photo.url} alt=""
                          className="h-12 w-12 rounded-full object-cover ring-2 ring-amber-200 flex-shrink-0" />
                      ) : (
                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-black flex-shrink-0">
                          {getInitials(creatorObj)}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-black text-gray-900 truncate">
                          {[creatorObj.prenom, creatorObj.nom].filter(Boolean).join(' ') || 'Inconnu'}
                        </p>
                        {creatorObj.diplome && (
                          <p className="text-[10px] text-gray-400 font-medium truncate">
                            {creatorObj.diplome}{creatorObj.promotion ? ` · Promo ${creatorObj.promotion}` : ''}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions manager */}
              {canManage && (
                <div className="space-y-2">
                  {canEditGroup && (
                    <Link href={`/groups/${group.id}/edit`}
                      className="flex items-center justify-center gap-2 w-full py-3 bg-gray-900 hover:bg-gray-800 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all duration-200 shadow-sm hover:-translate-y-0.5">
                      ⚙️ Modifier le groupe
                    </Link>
                  )}
                  {canManageRequests && (
                    <Link href={`/groups/${group.id}/requests`}
                      className="flex items-center justify-center gap-2 w-full py-3 bg-white border border-gray-200 hover:bg-amber-50 hover:border-amber-300 text-gray-700 text-xs font-black uppercase tracking-widest rounded-xl transition-all duration-200">
                      🔔 Gérer les demandes
                      {pendingCount > 0 && (
                        <span className="bg-amber-400 text-gray-900 text-[9px] font-black px-1.5 py-0.5 rounded-full">{pendingCount}</span>
                      )}
                    </Link>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
