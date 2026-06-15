import React from 'react'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import Link from 'next/link'
import { getAuthUser } from '@/lib/auth'
import GroupsPageClient from './GroupsPageClient'

const CATEGORIE_LABELS: Record<string, string> = {
  academique: 'Académique', culturel: 'Culturel', artistique: 'Artistique',
  sportif: 'Sportif', environnement: 'Environnement', solidarite: 'Solidarité',
  professionnel: 'Professionnel', loisir: 'Loisir', autre: 'Autre',
}

const CATEGORIE_COLORS: Record<string, string> = {
  academique: 'bg-blue-100 text-blue-700', culturel: 'bg-purple-100 text-purple-700',
  artistique: 'bg-pink-100 text-pink-700', sportif: 'bg-green-100 text-green-700',
  environnement: 'bg-emerald-100 text-emerald-700', solidarite: 'bg-orange-100 text-orange-700',
  professionnel: 'bg-indigo-100 text-indigo-700', loisir: 'bg-amber-100 text-amber-700',
  autre: 'bg-gray-100 text-gray-600',
}

export default async function GroupsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; q?: string; categorie?: string }>
}) {
  const resolvedSearchParams = await searchParams
  const payload = await getPayload({ config: configPromise })
  const { user } = await getAuthUser()

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 bg-white border border-gray-200 rounded-3xl shadow-sm max-w-sm">
          <div className="mx-auto h-14 w-14 rounded-2xl bg-indigo-50 flex items-center justify-center mb-4 text-2xl">🔒</div>
          <p className="text-sm font-black text-gray-800">Accès réservé aux membres</p>
          <p className="text-xs text-gray-400 mt-1 mb-5">Connectez-vous pour accéder aux groupes de la communauté ENC.</p>
          <Link href="/login?redirect=/groups"
            className="inline-flex items-center justify-center w-full gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-black text-white hover:bg-indigo-700 transition-colors shadow-sm">
            Se connecter
          </Link>
        </div>
      </div>
    )
  }

  const currentTab = resolvedSearchParams.tab ?? 'tous'
  const searchQuery = resolvedSearchParams.q?.toLowerCase().trim() ?? ''
  const categorieFilter = resolvedSearchParams.categorie ?? ''

  // Charger tous les groupes
  const groupsList = await payload.find({
    collection: 'groups',
    sort: '-createdAt',
    depth: 1,
    limit: 100,
  })

  // Demandes en attente
  const pendingGroupIds = new Set<string>()
  try {
    const pendingReqs = await payload.find({
      collection: 'group-requests' as any,
      where: { and: [{ demandeur: { equals: Number(user.id) } }, { statut: { equals: 'pending' } }] },
      depth: 0, limit: 100, overrideAccess: true,
    })
    for (const req of pendingReqs.docs as any[]) {
      const gId = typeof req.groupe === 'object' ? req.groupe?.id : req.groupe
      if (gId != null) pendingGroupIds.add(String(gId))
    }
  } catch {}

  // Transformer en données sérialisables pour le client
  const allRaw = groupsList.docs as any[]

  const toGroupData = (group: any) => {
    const creatorId = typeof group.createur === 'object' && group.createur !== null
      ? String(group.createur.id) : String(group.createur ?? '')
    const isCreator = !!creatorId && creatorId === String(user.id)
    const isAdmin = (user as any)?.collection === 'users'
    const isOwner = isCreator || isAdmin
    const isMember = (group.membres ?? []).some((m: any) => {
      const mId = typeof m === 'object' ? String(m.id) : String(m)
      return mId === String(user.id)
    })
    const hasPendingRequest = !isMember && !isCreator && pendingGroupIds.has(String(group.id))
    const miniatureUrl = typeof group.miniature === 'object' ? group.miniature?.url || null : null

    return {
      id: String(group.id),
      titre: group.titre || '',
      slug: group.slug || '',
      categorie: group.categorie || null,
      catLabel: group.categorie ? (CATEGORIE_LABELS[group.categorie] ?? group.categorie) : null,
      catColor: group.categorie ? (CATEGORIE_COLORS[group.categorie] ?? 'bg-gray-100 text-gray-600') : null,
      description: group.description || null,
      miniatureUrl,
      isPublic: !!group.isPublic,
      membresCount: group.membres?.length ?? 0,
      isCreator,
      isOwner,
      isMember,
      hasPendingRequest,
    }
  }

  const allGroups = allRaw.map(toGroupData)

  const mesGroupes = allGroups.filter(g => g.isCreator || g.isMember)

  // Groupes en attente = groupes privés où l'utilisateur a une demande pending
  const attenteGroupes = allGroups.filter(g => g.hasPendingRequest)

  return (
    <GroupsPageClient
      initialTab={currentTab}
      initialQ={searchQuery}
      initialCategorie={categorieFilter}
      allGroups={allGroups}
      mesGroupes={mesGroupes}
      attenteGroupes={attenteGroupes}
    />
  )
}
