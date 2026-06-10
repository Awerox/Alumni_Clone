'use server'

import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { cookies } from 'next/headers'
import { getPayload } from 'payload'
import config from '@payload-config'
import { revalidatePath } from 'next/cache'

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

interface GroupMedia {
  url?: string
  alt?: string
}

interface Group {
  id: string
  titre: string
  slug: string
  categorie?: string
  description?: string
  miniature?: GroupMedia
  banniere?: GroupMedia
  isPublic?: boolean
  membres?: AlumniMember[]
  createur?: AlumniMember | string
  restrictDiplome?: string
  restrictCampus?: string
  restrictCategorie?: string
  restrictPromotion?: string
  createdAt: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const CATEGORIE_LABELS: Record<string, string> = {
  etudiant: 'Étudiants',
  alumni: 'Alumni',
  enseignant: 'Enseignants',
  administratif: 'Administratif',
  club: 'Club',
  projet: 'Projet',
  promo: 'Promotion',
  autre: 'Autre',
}

const CATEGORIE_COLORS: Record<string, string> = {
  etudiant: 'bg-blue-100 text-blue-800',
  alumni: 'bg-purple-100 text-purple-800',
  enseignant: 'bg-amber-100 text-amber-800',
  administratif: 'bg-slate-100 text-slate-700',
  club: 'bg-green-100 text-green-800',
  projet: 'bg-orange-100 text-orange-800',
  promo: 'bg-pink-100 text-pink-800',
  autre: 'bg-gray-100 text-gray-700',
}

function formatRestriction(value?: string): string[] {
  if (!value) return []
  return value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

function getInitials(member: AlumniMember): string {
  const p = member.prenom?.[0] ?? ''
  const n = member.nom?.[0] ?? ''
  return (p + n).toUpperCase() || '?'
}

function isOwner(group: Group, currentUserId?: string): boolean {
  if (!currentUserId) return false
  const creatorId =
    typeof group.createur === 'string'
      ? group.createur
      : String(group.createur?.id ?? '')
  return creatorId === currentUserId
}

// ─── Server Actions ───────────────────────────────────────────────────────────

async function deleteGroupAction(groupId: string) {
  'use server'
  const payload = await getPayload({ config })

  // Récupère la session via cookie
  const cookieStore = await cookies()
  const token = cookieStore.get('payload-token')?.value

  if (!token) throw new Error('Non authentifié')

  // Vérifie l'utilisateur courant
  const { user } = await payload.auth({ headers: new Headers({ Authorization: `JWT ${token}` }) })
  if (!user) throw new Error('Non authentifié')

  const group = await payload.findByID({ collection: 'groups', id: groupId })
  if (!group) throw new Error('Groupe introuvable')

  const creatorId =
    typeof group.createur === 'string'
      ? group.createur
      : String((group.createur as AlumniMember)?.id ?? '')

  const isAdmin = (user as { collection?: string }).collection === 'users'
  const isCreator = creatorId === String(user.id)

  if (!isAdmin && !isCreator) throw new Error('Accès refusé')

  await payload.delete({ collection: 'groups', id: groupId })

  revalidatePath('/groups')
  redirect('/groups')
}

// ─── Sous-composants ─────────────────────────────────────────────────────────

function RestrictBadges({ label, values }: { label: string; values: string[] }) {
  if (!values.length) return null
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {values.map((v) => (
          <span
            key={v}
            className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700 ring-1 ring-inset ring-gray-200"
          >
            {v}
          </span>
        ))}
      </div>
    </div>
  )
}

function MemberAvatar({ member }: { member: AlumniMember }) {
  const initials = getInitials(member)
  const fullName = [member.prenom, member.nom].filter(Boolean).join(' ') || 'Membre'

  return (
    <div className="flex items-center gap-3 rounded-xl p-2.5 hover:bg-gray-50 transition-colors group">
      {member.photo?.url ? (
        <img
          src={member.photo.url}
          alt={member.photo.alt ?? fullName}
          className="h-10 w-10 rounded-full object-cover ring-2 ring-white shadow-sm flex-shrink-0"
        />
      ) : (
        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0 shadow-sm">
          {initials}
        </div>
      )}
      <div className="min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{fullName}</p>
        {member.diplome && (
          <p className="text-xs text-gray-500 truncate">
            {member.diplome}
            {member.promotion ? ` · Promo ${member.promotion}` : ''}
          </p>
        )}
      </div>
    </div>
  )
}

// ─── Page principale ──────────────────────────────────────────────────────────

export default async function GroupDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const payload = await getPayload({ config })

  // Charge le groupe avec ses relations
  let group: Group | null = null
  try {
    const result = await payload.findByID({
      collection: 'groups',
      id: params.id,
      depth: 2,
    })
    group = result as unknown as Group
  } catch {
    notFound()
  }

  if (!group) notFound()

  // Récupère l'utilisateur courant (optionnel)
  const cookieStore = await cookies()
  const token = cookieStore.get('payload-token')?.value
  let currentUserId: string | undefined

  if (token) {
    try {
      const { user } = await payload.auth({
        headers: new Headers({ Authorization: `JWT ${token}` }),
      })
      if (user) currentUserId = String(user.id)
    } catch {
      // non connecté, on continue
    }
  }

  const owner = isOwner(group, currentUserId)
  const members = (group.membres ?? []) as AlumniMember[]
  const creatorObj = typeof group.createur === 'object' ? group.createur : null

  const restrictDiplomes = formatRestriction(group.restrictDiplome)
  const restrictCampus = formatRestriction(group.restrictCampus)
  const restrictCategories = formatRestriction(group.restrictCategorie)
  const restrictPromotions = formatRestriction(group.restrictPromotion)

  const hasRestrictions =
    restrictDiplomes.length > 0 ||
    restrictCampus.length > 0 ||
    restrictCategories.length > 0 ||
    restrictPromotions.length > 0

  const catLabel = group.categorie ? (CATEGORIE_LABELS[group.categorie] ?? group.categorie) : null
  const catColor = group.categorie ? (CATEGORIE_COLORS[group.categorie] ?? 'bg-gray-100 text-gray-700') : null

  const deleteWithId = deleteGroupAction.bind(null, group.id)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Bannière ────────────────────────────────────────── */}
      <div className="relative h-52 md:h-72 w-full bg-gradient-to-br from-indigo-900 via-indigo-700 to-purple-700 overflow-hidden">
        {group.banniere?.url && (
          <img
            src={group.banniere.url}
            alt={group.banniere.alt ?? ''}
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}
        {/* overlay dégradé bas pour lisibilité */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

        {/* Bouton retour */}
        <div className="absolute top-4 left-4">
          <Link
            href="/groups"
            className="inline-flex items-center gap-1.5 rounded-lg bg-white/15 px-3 py-1.5 text-sm text-white backdrop-blur-sm hover:bg-white/25 transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Groupes
          </Link>
        </div>

        {/* Actions owner */}
        {owner && (
          <div className="absolute top-4 right-4 flex gap-2">
            <Link
              href={`/groups/${group.id}/edit`}
              className="inline-flex items-center gap-1.5 rounded-lg bg-white/15 px-3 py-1.5 text-sm text-white backdrop-blur-sm hover:bg-white/25 transition-colors"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
              </svg>
              Modifier
            </Link>
            <form action={deleteWithId}>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-lg bg-red-500/80 px-3 py-1.5 text-sm text-white backdrop-blur-sm hover:bg-red-500 transition-colors"
                onClick={(e) => {
                  if (!confirm('Supprimer définitivement ce groupe ?')) e.preventDefault()
                }}
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                </svg>
                Supprimer
              </button>
            </form>
          </div>
        )}
      </div>

      {/* ── Header identité ──────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative -mt-12 mb-6 flex items-end gap-4">
          {/* Miniature */}
          <div className="flex-shrink-0 h-24 w-24 rounded-2xl ring-4 ring-white shadow-lg overflow-hidden bg-white">
            {group.miniature?.url ? (
              <img
                src={group.miniature.url}
                alt={group.miniature.alt ?? group.titre}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <svg className="h-10 w-10 text-white/80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                </svg>
              </div>
            )}
          </div>

          {/* Infos titre */}
          <div className="pb-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              {catLabel && (
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${catColor}`}>
                  {catLabel}
                </span>
              )}
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  group.isPublic
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-red-100 text-red-700'
                }`}
              >
                {group.isPublic ? (
                  <>
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
                    </svg>
                    Public
                  </>
                ) : (
                  <>
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                    </svg>
                    Privé
                  </>
                )}
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight truncate">
              {group.titre}
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {members.length} membre{members.length !== 1 ? 's' : ''}
              {creatorObj && (
                <>
                  {' · '}Créé par{' '}
                  <span className="font-medium text-gray-700">
                    {[creatorObj.prenom, creatorObj.nom].filter(Boolean).join(' ') || 'Inconnu'}
                  </span>
                </>
              )}
            </p>
          </div>
        </div>

        {/* ── Layout deux colonnes ─────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-12">
          {/* Colonne principale */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            {group.description && (
              <div className="rounded-2xl bg-white shadow-sm ring-1 ring-gray-100 p-6">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-3">
                  À propos
                </h2>
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {group.description}
                </p>
              </div>
            )}

            {/* Membres */}
            <div className="rounded-2xl bg-white shadow-sm ring-1 ring-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
                  Membres
                  <span className="ml-2 inline-flex items-center justify-center rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-700">
                    {members.length}
                  </span>
                </h2>
              </div>

              {members.length === 0 ? (
                <div className="py-8 text-center">
                  <div className="mx-auto h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                    <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-500">Aucun membre pour l'instant</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                  {members.map((member) => (
                    <MemberAvatar key={member.id} member={member} />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Colonne latérale */}
          <div className="space-y-6">
            {/* Infos */}
            <div className="rounded-2xl bg-white shadow-sm ring-1 ring-gray-100 p-6 space-y-4">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
                Informations
              </h2>

              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex-shrink-0 h-8 w-8 rounded-lg bg-indigo-50 flex items-center justify-center">
                    <svg className="h-4 w-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-medium">Catégorie</p>
                    <p className="text-sm text-gray-900 font-medium">
                      {catLabel ?? '—'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex-shrink-0 h-8 w-8 rounded-lg bg-indigo-50 flex items-center justify-center">
                    <svg className="h-4 w-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-medium">Membres</p>
                    <p className="text-sm text-gray-900 font-medium">
                      {members.length} membre{members.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex-shrink-0 h-8 w-8 rounded-lg bg-indigo-50 flex items-center justify-center">
                    <svg className="h-4 w-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 9v7.5" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-medium">Créé le</p>
                    <p className="text-sm text-gray-900 font-medium">
                      {new Date(group.createdAt).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex-shrink-0 h-8 w-8 rounded-lg bg-indigo-50 flex items-center justify-center">
                    <svg className="h-4 w-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-medium">Slug</p>
                    <p className="text-sm text-gray-700 font-mono">{group.slug}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Restrictions de visibilité */}
            {hasRestrictions && (
              <div className="rounded-2xl bg-white shadow-sm ring-1 ring-gray-100 p-6 space-y-4">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
                  Visibilité restreinte à
                </h2>
                <div className="space-y-4">
                  <RestrictBadges label="Diplômes" values={restrictDiplomes} />
                  <RestrictBadges label="Campus" values={restrictCampus} />
                  <RestrictBadges label="Catégories" values={restrictCategories} />
                  <RestrictBadges label="Promotions" values={restrictPromotions} />
                </div>
              </div>
            )}

            {/* Créateur */}
            {creatorObj && (
              <div className="rounded-2xl bg-white shadow-sm ring-1 ring-gray-100 p-6">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-4">
                  Créateur
                </h2>
                <MemberAvatar member={creatorObj} />
              </div>
            )}

            {/* CTA owner */}
            {owner && (
              <Link
                href={`/groups/${group.id}/edit`}
                className="flex items-center justify-center gap-2 w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition-colors"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                </svg>
                Modifier le groupe
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
