import React from 'react'
import Link from 'next/link'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import HeroSlider from '@/components/HeroSlider' // Assure-toi que le fichier HeroSlider.tsx existe

export default async function HomePage() {
  const payload = await getPayload({ config: configPromise })

  // Récupération dynamique des 3 derniers inscrits
  const recentAlumni = await payload.find({
    collection: 'alumni',
    sort: '-createdAt',
    limit: 3,
  })

  return (
    <div className="bg-white">
      {/* SECTION 1 : HERO DYNAMIQUE */}
      <section className="max-w-7xl mx-auto px-4 py-12 flex flex-col md:flex-row items-center gap-12">
        <div className="md:w-1/2 space-y-6">
          <h1 className="text-4xl font-bold text-enc leading-tight">Bonjour !</h1>
          <p className="text-gray-600 text-lg leading-relaxed">
            Anciens, étudiants, enseignants, recruteurs, la communauté alumni de l'ENC Bessières 
            est ravie de vous (re)voir sur cet outil dédié à votre mise en relation.
          </p>
          <Link 
            href="/about" 
            className="inline-block bg-enc text-white px-8 py-3 rounded font-bold hover:bg-opacity-90 transition-all shadow-md"
          >
            En savoir plus
          </Link>
        </div>
        
        {/* Intégration du composant Slider fonctionnel */}
        <HeroSlider />
      </section>

      {/* SECTION 2 : DERNIERS INSCRITS (DYNAMIQUE) */}
      <section className="py-16 bg-gray-50/50 border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-4 mb-12">
            <div className="h-[1px] bg-enc flex-grow opacity-30"></div>
            <h2 className="text-2xl font-bold text-gray-800 whitespace-nowrap uppercase tracking-wider">
              Ils ont récemment rejoint le réseau
            </h2>
            <div className="h-[1px] bg-enc flex-grow opacity-30"></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {recentAlumni.docs.length > 0 ? (
              recentAlumni.docs.map((alumnus) => (
                <div key={alumnus.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all">
                  <div className="flex gap-4">
                    <div className="h-20 w-20 rounded-full bg-enc/10 flex items-center justify-center text-enc font-bold text-xl border border-enc/20 overflow-hidden">
                      {alumnus.prenom[0]}{alumnus.nom[0]}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg leading-tight uppercase">{alumnus.prenom} {alumnus.nom}</h3>
                      <span className="inline-block bg-orange-500 text-white text-[10px] px-2 py-0.5 rounded mt-1 font-bold uppercase">
                        {alumnus.statut}
                      </span>
                    </div>
                  </div>
                  <div className="mt-4 space-y-1">
                    {alumnus.isMentor && (
                      <span className="inline-block bg-enc text-white text-[10px] px-2 py-0.5 rounded font-bold mr-2">MENTOR</span>
                    )}
                    <p className="text-xs text-gray-400 mt-2 italic">Promotion {alumnus.promotion || 'NC'}</p>
                    <p className="text-sm font-bold text-gray-700">{alumnus.poste || 'Étudiant'}</p>
                    <p className="text-[10px] text-gray-400">📍 {alumnus.ville || 'Paris'}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="col-span-full text-center text-gray-400 italic py-10">
                Aucun membre n'est encore inscrit.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* SECTION 3 : MENTORAT (Texte mis à jour) */}
      <section className="py-20 max-w-7xl mx-auto px-4">
        <div className="flex items-center gap-4 mb-16">
          <div className="h-[1px] bg-enc flex-grow opacity-30"></div>
          <h2 className="text-2xl font-bold text-gray-800 whitespace-nowrap uppercase tracking-widest">
            Ils transmettent leur <span className="text-enc">expérience</span>
          </h2>
          <div className="h-[1px] bg-enc flex-grow opacity-30"></div>
        </div>
        
        <div className="flex flex-col md:flex-row items-center gap-16">
          <div className="md:w-1/3 space-y-6">
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-gray-900">Qu'est-ce que le mentorat ?</h3>
              <p className="text-gray-500 leading-relaxed text-sm">
                Le mentorat est une initiative bénévole qui permet à chaque utilisateur de pouvoir transmettre son expérience.
              </p>
              <p className="text-gray-500 leading-relaxed text-sm">
                Les mentors potentiels sont identifiables grâce à un <strong>badge</strong> et peuvent être sollicités par n'importe quel utilisateur, via l'onglet Mentorat.
              </p>
              <p className="text-gray-500 leading-relaxed text-sm">
                Une bonne relation de mentorat nécessite au moins <strong>une rencontre par mois</strong> et le suivi s'effectue sur <strong>six mois</strong>.
              </p>
              <p className="text-enc font-black italic pt-2 tracking-wide text-lg">À vous de jouer !</p>
            </div>

            <Link 
              href="/mentorship" 
              className="inline-block bg-enc text-white px-6 py-3 rounded text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-orange_bessieres transition-all shadow-md"
            >
              Charte du mentorat
            </Link>
          </div>

          <div className="md:w-2/3 relative">
            <div className="absolute -inset-4 bg-gray-50 rounded-full -z-10 scale-95 opacity-50"></div>
            <img 
              src="https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&q=80&w=1000" 
              alt="Illustration Mentorat" 
              className="w-full h-auto rounded-2xl shadow-2xl transform hover:scale-[1.02] transition-transform duration-500" 
            />
          </div>
        </div>
      </section>
    </div>
  )
}