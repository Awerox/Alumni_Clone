import React from 'react'
import { getPayload } from 'payload'
import configPromise from '@payload-config'

export default async function DirectoryPage() {
  const payload = await getPayload({ config: configPromise })

  // On récupère tous les alumni triés par nom
  const alumniList = await payload.find({
    collection: 'alumni',
    sort: 'nom',
  })

  return (
    <div className="bg-gray-100 min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* En-tête de la page */}
        <div className="mb-10">
          <h1 className="text-3xl font-extrabold text-gray-900">
            Annuaire des <span className="text-enc">Membres</span>
          </h1>
          <p className="mt-2 text-gray-600">Retrouvez tous les anciens élèves et étudiants de l'ENC Bessières.</p>
        </div>

        {/* Grille des membres */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {alumniList.docs.length > 0 ? (
            alumniList.docs.map((alumnus) => (
              <div key={alumnus.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                <div className="h-32 bg-enc flex items-center justify-center">
                  {/* Placeholder pour la photo si absente */}
                  <div className="h-20 w-20 rounded-full bg-white flex items-center justify-center text-enc text-2xl font-bold border-4 border-white">
                    {alumnus.prenom[0]}{alumnus.nom[0]}
                  </div>
                </div>
                
                <div className="p-5">
                  <div className="flex justify-between items-start">
                    <h2 className="text-lg font-bold text-gray-900">
                      {alumnus.prenom} {alumnus.nom}
                    </h2>
                    {/* Badge Orange pour le statut */}
                    <span className="px-2 py-1 text-xs font-bold rounded bg-orange-100 text-orange-600 uppercase">
                      {alumnus.statut}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-500 mt-1">{alumnus.poste || 'Étudiant'}</p>
                  <p className="text-sm font-medium text-enc mt-2">Promotion {alumnus.promotion}</p>
                  
                  <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
                    <span className="text-xs text-gray-400">{alumnus.ville || 'Paris'}</span>
                    <button className="text-sm font-bold text-enc hover:text-orange-500">
                      Voir le profil →
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-20 bg-white rounded-xl border-2 border-dashed border-gray-300">
              <p className="text-gray-500">Aucun membre trouvé dans l'annuaire.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}