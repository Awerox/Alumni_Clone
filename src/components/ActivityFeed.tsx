// components/ActivityFeed.tsx
'use client'
import React, { useState } from 'react'

const INITIAL_COUNT = 3
const LOAD_MORE_COUNT = 3

export default function ActivityFeed({ items }: { items: any[] }) {
  const [visibleCount, setVisibleCount] = useState(INITIAL_COUNT)

  const visibleItems = items.slice(0, visibleCount)
  const hasMore = visibleCount < items.length

  if (items.length === 0) {
    return (
      <p className="text-center text-xs text-gray-400 italic py-6 bg-white border border-gray-200 rounded-3xl">
        Aucune publication récente.
      </p>
    )
  }

  return (
    <div className="space-y-4">
      {visibleItems.map((item: any) => {
        const dateText = new Date(item.createdAt).toLocaleDateString('fr-FR', {
          day: 'numeric', month: 'short', year: 'numeric',
        })
        const postImageUrl = item.image && typeof item.image === 'object' ? item.image.url : null

        return (
          <div key={item.id} className="bg-white border border-gray-200 rounded-3xl p-5 shadow-2xs space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center text-[10px] font-black uppercase">
                {item.auteur?.prenom?.[0]}{item.auteur?.nom?.[0]}
              </div>
              <div>
                <h4 className="text-xs font-black text-gray-800">
                  {item.auteur?.prenom} {item.auteur?.nom}
                </h4>
                <p className="text-[9px] text-gray-400 font-bold">{dateText}</p>
              </div>
            </div>
            {item.contenu && (
              <p className="text-xs font-medium text-gray-600 leading-relaxed whitespace-pre-wrap line-clamp-3">
                {item.contenu}
              </p>
            )}
            {postImageUrl && (
              <div className="rounded-xl overflow-hidden border border-gray-100 relative group">
                <img src={postImageUrl} alt="" className="w-full h-40 object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                  <a href={postImageUrl} target="_blank" rel="noreferrer"
                    className="px-3 py-1.5 bg-white text-gray-800 text-[10px] font-black uppercase rounded-xl shadow-md">
                    🔍 Voir
                  </a>
                  <a href={`/api/download?url=${encodeURIComponent(postImageUrl)}&name=post.jpg`} download
                    className="px-3 py-1.5 bg-purple-600 text-white text-[10px] font-black uppercase rounded-xl shadow-md">
                    ⬇️ Télécharger
                  </a>
                </div>
              </div>
            )}
          </div>
        )
      })}

      {/* Bouton voir plus / voir moins */}
      <div className="flex gap-2">
        {hasMore && (
          <button
            onClick={() => setVisibleCount((c) => c + LOAD_MORE_COUNT)}
            className="flex-1 py-2.5 bg-white border border-gray-200 hover:border-purple-300 text-gray-500 hover:text-purple-600 text-[10px] font-black uppercase rounded-2xl transition-all shadow-2xs"
          >
            Voir plus ({items.length - visibleCount} restants)
          </button>
        )}
        {visibleCount > INITIAL_COUNT && (
          <button
            onClick={() => setVisibleCount(INITIAL_COUNT)}
            className="px-4 py-2.5 bg-white border border-gray-200 hover:border-red-200 text-gray-400 hover:text-red-400 text-[10px] font-black uppercase rounded-2xl transition-all shadow-2xs"
          >
            Réduire
          </button>
        )}
      </div>

      {/* Lien vers le feed complet */}
      <a href="/feed"
        className="block text-center py-2 text-[10px] font-black uppercase tracking-wider text-purple-600 hover:text-purple-800 transition-colors">
        Voir toute l'activité →
      </a>
    </div>
  )
}
