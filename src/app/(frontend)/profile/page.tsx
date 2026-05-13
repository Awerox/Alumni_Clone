import React from 'react'

export default function ProfilePage() {
  return (
    <div className="max-w-5xl mx-auto py-10 px-4">
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Header du profil */}
        <div className="h-48 bg-enc relative">
          <div className="absolute -bottom-12 left-10">
            <div className="h-32 w-32 rounded-3xl bg-white border-4 border-white shadow-lg flex items-center justify-center text-4xl font-bold text-enc">
              AX
            </div>
          </div>
        </div>
        
        <div className="pt-16 pb-10 px-10">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Alex Xu</h1>
              <p className="text-enc font-medium">Promotion 2026 • BTS SIO SLAM</p>
            </div>
            <button className="px-6 py-2 border-2 border-gray-200 rounded-full font-bold text-sm hover:bg-gray-50">Modifier le profil</button>
          </div>

          <div className="mt-10 grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-6">
              <section>
                <h3 className="font-bold text-lg mb-3">À propos</h3>
                <p className="text-gray-600 leading-relaxed">Étudiant passionné par le développement Fullstack et la cybersécurité. Actuellement en recherche de stage pour l'Alumni Platform.</p>
              </section>
            </div>
            
            <div className="space-y-6">
              <div className="bg-gray-50 p-6 rounded-2xl">
                <h3 className="font-bold text-sm uppercase tracking-wider text-gray-400 mb-4">Infos Contact</h3>
                <p className="text-sm"><strong>Email :</strong> xualex300@gmail.com</p>
                <p className="text-sm mt-2"><strong>Ville :</strong> Ivry-sur-Seine</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}