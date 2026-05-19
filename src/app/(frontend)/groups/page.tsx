import React from 'react'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import Link from 'next/link'

export default async function GroupsPage() {
  const payload = await getPayload({ config: configPromise })

  // Récupération de tous les groupes
  const groupsList = await payload.find({
    collection: 'groups',
    sort: '-createdAt',
  })

  return (
    <div className="bg-gray-50/50 min-h-screen py-10 px-4 sm:px-6 lg:px-8 text-left font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* 🟢 BARRE DE NAVIGATION EN-TÊTE CONFORME MAQUETTE */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-100 pb-4">
          <Link
            href="/groups/new"
            className="bg-emerald-500 text-white px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 hover:bg-emerald-600 transition-colors shadow-sm"
          >
            <span className="text-sm font-black">＋</span> Ajouter un groupe
          </Link>

          <div className="bg-[#FFFDF4] border border-[#FBEFCD] rounded-xl p-1.5 flex items-center gap-1 shadow-xs text-xs font-black uppercase tracking-wide">
            <button className="bg-[#FCD862] text-gray-900 px-4 py-2 rounded-lg shadow-xs">
              Tous les groupes
            </button>
            <button className="text-gray-500 hover:text-gray-800 px-4 py-2 transition-colors">
              Mes groupes
            </button>
            <button className="text-gray-500 hover:text-gray-800 px-4 py-2 transition-colors whitespace-nowrap">
              Groupes en attente de validation
            </button>
          </div>
        </div>

        {/* 📇 CARTES HORIZONTALES MODERNES (STYLE ETUDIANTS DU BTS SIO) */}
        <div className="grid grid-cols-1 gap-6 max-w-4xl">
          {groupsList.docs.length > 0 ? (
            groupsList.docs.map((group: any) => {
              const miniatureUrl =
                group.miniature && typeof group.miniature === 'object' ? group.miniature.url : null

              return (
                <div
                  key={group.id}
                  className="bg-white border border-gray-200/80 rounded-3xl shadow-xs overflow-hidden flex flex-col md:flex-row items-stretch transition-all hover:border-gray-300"
                >
                  {/* Image de couverture gauche */}
                  <div className="w-full md:w-64 bg-gray-100 flex-shrink-0 relative h-48 md:h-auto min-h-[180px]">
                    {miniatureUrl ? (
                      <img src={miniatureUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-300 font-bold text-2xl">
                        📁
                      </div>
                    )}
                  </div>

                  {/* Bloc de contenu textuel */}
                  <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-start gap-4">
                        <h2 className="text-lg font-black text-gray-900 tracking-tight">
                          {group.titre}
                        </h2>
                        {/* Petit icône d'état public/privé */}
                        <span
                          title={group.isPublic ? 'Groupe public' : 'Groupe privé'}
                          className="text-xs"
                        >
                          {group.isPublic ? '🟢' : '🔒'}
                        </span>
                      </div>
                      <p className="text-[11px] font-bold text-gray-400 flex items-center gap-1.5">
                        👥 {group.membres?.length || 0} membres
                      </p>
                      <p className="text-sm font-medium text-gray-600 leading-relaxed line-clamp-3">
                        {group.description}
                      </p>
                    </div>

                    {/* Zone de bouton inférieure droite */}
                    <div className="flex justify-end pt-2">
                      <Link
                        href={`/groups/${group.id}`}
                        className="px-5 py-2 border border-gray-300 rounded-xl text-xs font-black text-gray-700 uppercase tracking-wider hover:bg-gray-50 transition-colors bg-white shadow-xs"
                      >
                        Accéder au groupe
                      </Link>
                    </div>
                  </div>
                </div>
              )
            })
          ) : (
            <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
              <p className="text-sm font-bold text-gray-800">
                Aucun groupe disponible pour le moment.
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Cliquez sur le bouton ci-dessus pour ouvrir la première communauté.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
