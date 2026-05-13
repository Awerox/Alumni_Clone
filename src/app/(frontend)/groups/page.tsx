import React from 'react'
import { getPayload } from 'payload'
import configPromise from '@payload-config'

export default async function GroupsPage() {
  const payload = await getPayload({ config: configPromise })
  const groups = await payload.find({ collection: 'groups' })

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold mb-8 text-gray-900 underline decoration-enc">Vos <span className="text-enc">Groupes</span></h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {groups.docs.map((group) => (
          <div key={group.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:border-enc transition-colors">
            <div className="h-40 bg-gray-200 relative">
               {/* Ici on affichera la miniature plus tard */}
               <div className="absolute inset-0 flex items-center justify-center text-gray-400">Image du groupe</div>
            </div>
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900">{group.titre}</h2>
              <p className="text-sm text-gray-500 mt-2 line-clamp-2">{group.description}</p>
              <div className="mt-6 flex justify-between items-center">
                <span className="text-xs font-medium text-gray-400 uppercase tracking-widest">
                  {group.membres?.length || 0} Membres
                </span>
                <button className="bg-enc text-white px-6 py-2 rounded-full text-xs font-bold uppercase tracking-wider hover:bg-orange_bessieres transition-colors">
                  Rejoindre
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}