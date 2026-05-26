import React from 'react'
import Link from 'next/link'

export default function AboutPage() {
  return (
    <div className="bg-white min-h-screen">
      {/* HEADER : Titre avec fond bordeaux */}
      <div className="bg-enc py-20 text-center text-white">
        <h1 className="text-4xl md:text-5xl font-black uppercase tracking-[0.2em]">
          Notre <span className="text-orange_bessieres">Histoire</span>
        </h1>
        <div className="h-1 w-24 bg-orange_bessieres mx-auto mt-6"></div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-20">
        
        {/* SECTION 1 : HISTOIRE & IMAGE */}
        <div className="flex flex-col md:flex-row items-center gap-16 mb-24">
          <div className="md:w-1/2 space-y-6">
            <div className="inline-block px-4 py-1 bg-enc/10 text-enc font-bold text-xs rounded-full uppercase tracking-widest">
              Depuis 1957
            </div>
            <h2 className="text-3xl font-bold text-gray-900 leading-tight">
              Un établissement de <span className="text-enc">référence</span>
            </h2>
            <p className="text-gray-600 leading-relaxed text-lg font-light">
              Fondée en <strong>1957</strong>, notre lycée s’est imposé comme un établissement de référence dans l’enseignement supérieur. 
              Depuis plus de 60 ans, nous formons des générations d’étudiants en leur offrant un cadre d’excellence, 
              alliant savoir théorique et compétences pratiques adaptées aux évolutions du monde professionnel.
            </p>
          </div>
          <div className="md:w-1/2">
            <div className="rounded-3xl overflow-hidden shadow-2xl border-[12px] border-gray-50 transform rotate-2 hover:rotate-0 transition-transform duration-500">
              <img 
                src="https://www.enc-bessieres.org/wp-content/uploads/2021/01/accueilhaut-e1676789443337.jpg" 
                alt="Façade ENC Bessières" 
                className="w-full h-auto object-cover"
              />
            </div>
          </div>
        </div>

        {/* SECTION 2 : APPRENTISSAGE (Fond Gris) */}
        <div className="bg-gray-50 rounded-[3rem] p-10 md:p-16 mb-24 flex flex-col md:flex-row-reverse items-center gap-12 border border-gray-100">
          <div className="md:w-full space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">L'essor de l'alternance</h2>
            <p className="text-gray-600 leading-relaxed">
              En <strong>2004</strong>, notre engagement envers l’insertion professionnelle s’est renforcé avec la création de 
              <span className="text-enc font-bold"> l'ENC BESSIERES Apprentissage</span>. Cet ajout a permis de développer une offre en alternance 
              allant du post-bac jusqu’au master dans le domaine de la comptabilité/gestion, favorisant une immersion directe 
              dans le monde de l’entreprise et renforçant les liens avec notre réseau de partenaires.
            </p>
          </div>
        </div>

        {/* SECTION 3 : LA COMMUNAUTÉ ALUMNI */}
        <div className="text-center space-y-12">
          <div className="space-y-4">
            <h2 className="text-3xl font-bold text-gray-900">Le Réseau Alumni</h2>
            <p className="text-gray-500 max-w-2xl mx-auto italic">
              "Une communauté dynamique accompagnée et enrichie par un réseau d’Alumni présents dans divers secteurs."
            </p>
          </div>

          {/* GRILLE DES MISSIONS (Les ✅ du texte) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
            {[
              { title: "Rester connecté", desc: "Avec votre école et vos anciens camarades de promotion.", icon: "🌐" },
              { title: "Échanger", desc: "Opportunités professionnelles, offres exclusives et précieux conseils.", icon: "🤝" },
              { title: "Participer", desc: "Aux événements, JPO et aux rencontres physiques du réseau.", icon: "📅" },
              { title: "Valoriser", desc: "Votre parcours pour inspirer les futures générations de l'ENC.", icon: "⭐" }
            ].map((item, index) => (
              <div key={index} className="flex gap-6 p-6 rounded-2xl border border-gray-100 hover:border-enc/30 hover:bg-gray-50 transition-all group">
                <div className="h-12 w-12 rounded-xl bg-enc/5 flex items-center justify-center text-2xl group-hover:bg-enc group-hover:text-white transition-colors">
                  {item.icon}
                </div>
                <div>
                  <h4 className="font-bold text-gray-900">{item.title}</h4>
                  <p className="text-sm text-gray-500">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-10">
            <p className="text-xl font-medium text-gray-800 mb-8">
              Rejoignez-nous et faites vivre l’esprit de notre école ! 🚀
            </p>
            <Link href="/new" className="inline-block bg-enc text-white px-12 py-4 rounded-full font-bold uppercase tracking-widest shadow-xl hover:bg-orange_bessieres transition-all transform hover:-translate-y-1">
                Devenir Membre
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}