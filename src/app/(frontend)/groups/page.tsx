import React from 'react'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import Link from 'next/link'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'

export default async function GroupsPage({ searchParams }: { searchParams: { tab?: string } }) {
  const payload = await getPayload({ config: configPromise })

  // 🔐 Identification sécurisée de l'utilisateur connecté
  const headersList = headers()
  const { user } = await payload.auth({ headers: headersList as any })

  const currentTab = searchParams.tab || 'tous'

  // Récupération de tous les groupes
  const groupsList = await payload.find({
    collection: 'groups',
    sort: '-createdAt',
  })

  // 🗂️ Logique de filtrage dynamique selon l'onglet actif
  let displayedGroups = groupsList.docs

  if (currentTab === 'mes_groupes' && user) {
    displayedGroups = displayedGroups.filter((group: any) => {
      const creatorId = typeof group.createur === 'object' ? group.createur?.id : group.createur
      const isMember = group.membres?.some(
        (m: any) => (typeof m === 'object' ? m.id : m)?.toString() === user.id?.toString(),
      )

      // ✨ COMPARAISON SÉCURISÉE : Conversion en chaîne brute (.toString())
      const isCreator = creatorId && user.id && creatorId.toString() === user.id.toString()
      return isCreator || isMember
    })
  } else if (currentTab === 'attente') {
    // Si tu as configuré un champ de validation par un administrateur, filtre ici
    displayedGroups = []
  }

  // 🗑️ Action Serveur Sécurisée pour supprimer un groupe
  async function deleteGroupAction(formData: FormData) {
    'use server'
    const id = formData.get('groupId') as string
    const p = await getPayload({ config: configPromise })

    try {
      await p.delete({
        collection: 'groups',
        id: id,
      })
      revalidatePath('/groups')
    } catch (err) {
      console.error('Échec de la suppression :', err)
    }
  }

  return (
    <div className="bg-gray-50 min-h-screen py-10 px-4 sm:px-6 lg:px-8 text-left font-sans">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* 🟢 BARRE DE NAVIGATION EN-TÊTE FLUIDE ET INTERACTIVE */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-200/60 pb-5">
          <Link
            href="/groups/new"
            className="bg-emerald-500 text-white px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 hover:bg-emerald-600 transition-all shadow-sm hover:shadow-md active:scale-95"
          >
            <span className="text-sm font-black">＋</span> Ajouter un groupe
          </Link>

          {/* Onglets de navigation par URL */}
          <div className="bg-amber-50/40 border border-amber-200/60 rounded-2xl p-1.5 flex items-center gap-1 shadow-sm text-xs font-black uppercase tracking-wide overflow-x-auto max-w-full">
            <Link
              href="/groups?tab=tous"
              className={`px-4 py-2 rounded-xl transition-all ${
                currentTab === 'tous'
                  ? 'bg-amber-400 text-gray-900 shadow-xs'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              Tous les groupes
            </Link>
            <Link
              href="/groups?tab=mes_groupes"
              className={`px-4 py-2 rounded-xl transition-all ${
                currentTab === 'mes_groupes'
                  ? 'bg-amber-400 text-gray-900 shadow-xs'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              Mes groupes
            </Link>
            <Link
              href="/groups?tab=attente"
              className={`px-4 py-2 rounded-xl transition-all ${
                currentTab === 'attente'
                  ? 'bg-amber-400 text-gray-900 shadow-xs'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              Groupes en attente de validation
            </Link>
          </div>
        </div>

        {/* 📇 CARTES HORIZONTALES SURÉLEVÉES */}
        <div className="space-y-5">
          {displayedGroups.length > 0 ? (
            displayedGroups.map((group: any) => {
              const miniatureUrl =
                group.miniature && typeof group.miniature === 'object' ? group.miniature.url : null

              // 🔐 Extraction de l'ID du créateur pour la vérification
              const creatorId =
                typeof group.createur === 'object' ? group.createur?.id : group.createur

              // ✨ Vérification robuste convertie en chaînes de caractères
              const isCreator = creatorId && user?.id && creatorId.toString() === user.id.toString()
              const isAdmin = user?.collection === 'users'
              const isOwner = isCreator || isAdmin

              return (
                <div
                  key={group.id}
                  className="bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col md:flex-row items-stretch group"
                >
                  {/* Miniature gauche */}
                  <div className="w-full md:w-56 bg-gray-50 flex-shrink-0 relative h-44 md:h-auto min-h-[160px] border-b md:border-b-0 md:border-r border-gray-100">
                    {miniatureUrl ? (
                      <img
                        src={miniatureUrl}
                        alt=""
                        className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300 font-bold text-3xl">
                        📁
                      </div>
                    )}
                  </div>

                  {/* Contenu textuel et actions */}
                  <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-start gap-4">
                        <h2 className="text-base font-black text-gray-900 tracking-tight transition-colors group-hover:text-purple-700">
                          {group.titre}
                        </h2>
                        {/* Badge de visibilité */}
                        <span
                          className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                            group.isPublic
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                              : 'bg-purple-50 border-purple-200 text-purple-700'
                          }`}
                        >
                          {group.isPublic ? '🌐 Public' : '🔒 Privé'}
                        </span>
                      </div>
                      <p className="text-[10px] font-bold text-gray-400 flex items-center gap-1">
                        👥 {group.membres?.length || 0} membres
                      </p>
                      <p className="text-xs font-medium text-gray-500 leading-relaxed line-clamp-2">
                        {group.description}
                      </p>
                    </div>

                    {/* Barre d'actions inférieure */}
                    <div className="flex items-center justify-between pt-2 border-t border-gray-50 text-[10px] font-black uppercase tracking-wider">
                      {/* Outils d'édition réservés uniquement au créateur légitime */}
                      <div className="flex items-center gap-1.5">
                        {isOwner ? (
                          <>
                            <Link
                              href={`/groups/${group.id}/edit`}
                              className="px-3 py-1.5 bg-purple-50 border border-purple-200 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors"
                            >
                              ⚙️ Modifier
                            </Link>
                            <form
                              action={deleteGroupAction}
                              onSubmit={(e) =>
                                !confirm('Voulez-vous vraiment supprimer ce groupe ?') &&
                                e.preventDefault()
                              }
                            >
                              <input type="hidden" name="groupId" value={group.id} />
                              <button
                                type="submit"
                                className="px-3 py-1.5 bg-red-50 border border-red-200 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                              >
                                🗑️ Supprimer
                              </button>
                            </form>
                          </>
                        ) : (
                          <span className="text-[9px] text-gray-400 italic font-normal normal-case">
                            Membre du réseau
                          </span>
                        )}
                      </div>

                      {/* Accès général */}
                      <Link
                        href={`/groups/${group.id}`}
                        className="px-4 py-1.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors bg-white shadow-xs"
                      >
                        Accéder au groupe
                      </Link>
                    </div>
                  </div>
                </div>
              )
            })
          ) : (
            /* Rendu d'état vide */
            <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-300/80 p-8">
              <p className="text-xs font-bold text-gray-700">
                {currentTab === 'mes_groupes'
                  ? "Vous n'avez pas encore créé ou rejoint de communauté."
                  : currentTab === 'attente'
                    ? "Aucun groupe n'est actuellement en attente de validation."
                    : 'Aucun cercle ne correspond à cette sélection actuellement.'}
              </p>
              <p className="text-[11px] text-gray-400 font-medium mt-1">
                {currentTab === 'mes_groupes'
                  ? "Basculez sur l'onglet 'Tous les groupes' pour explorer le catalogue de l'école."
                  : "Prenez les devants et inaugurez le premier espace d'échange !"}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
