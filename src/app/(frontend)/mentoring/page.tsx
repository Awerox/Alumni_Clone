// app/mentoring/page.tsx
import React from 'react'
import Link from 'next/link'
import { getAuthUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function MentoringPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; diplome?: string; promotion?: string; campus?: string; type?: string }>
}) {
  const { user, payload } = await getAuthUser()
  const params = await searchParams

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 font-sans">
        <div className="text-center p-8 bg-white border border-gray-200 rounded-3xl shadow-sm max-w-sm">
          <div className="text-3xl mb-3">🔒</div>
          <p className="text-sm font-bold text-gray-700">Votre session n'est pas reconnue.</p>
          <p className="text-xs text-gray-400 mt-1 mb-4">
            Veuillez vous authentifier sur la plateforme pour accéder à l'espace d'entraide.
          </p>
          <Link
            href="/login?redirect=/mentoring"
            className="inline-block w-full text-center py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-black uppercase rounded-xl transition-colors shadow-sm"
          >
            Se connecter
          </Link>
        </div>
      </div>
    )
  }

  // Profil alumni de l'utilisateur connecté
  let currentAlumnus: any = null
  try {
    currentAlumnus = await payload.findByID({
      collection: 'alumni',
      id: user.id,
    })
  } catch (err) {
    console.error("Impossible de charger le profil de l'utilisateur connecté")
  }

  const isCurrentMentor = currentAlumnus?.isMentor === true

  // Filtres
  const queryConstraints: any = {
    isMentor: { equals: true },
    id: { not_equals: user.id },
  }
  if (params.diplome) queryConstraints.diplome = { like: params.diplome }
  if (params.campus) queryConstraints.campus = { equals: params.campus }
  if (params.promotion) queryConstraints.promotion = { equals: Number(params.promotion) }
  if (params.type) queryConstraints.typeMentorat = { equals: params.type }
  if (params.q) {
    queryConstraints.or = [
      { prenom: { like: params.q } },
      { nom: { like: params.q } },
      { poste: { like: params.q } },
    ]
  }

  const mentorsList = await payload.find({
    collection: 'alumni',
    where: queryConstraints,
    limit: 50,
  })

  return (
    <div className="bg-gray-50 min-h-screen py-10 px-4 sm:px-6 lg:px-8 text-left font-sans">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="bg-[#7C3AED] text-white p-4 rounded-2xl shadow-sm flex items-start justify-between text-xs font-semibold leading-relaxed">
          <div className="flex gap-2.5 items-start">
            <span className="text-sm">💡</span>
            <p>
              Sur cette page, retrouvez tous les membres de votre communauté s'étant portés
              volontaires pour mentorer et ainsi partager leur expérience et expertise avec d'autres
              membres du réseau. Vous pouvez les solliciter en vous rendant sur leur profil.
            </p>
          </div>
        </div>

        {!isCurrentMentor && (
          <div className="bg-[#FEF3C7] border border-[#FDE68A] text-[#92400E] p-4 rounded-2xl text-center text-xs font-bold shadow-xs">
            <p>Vous n'êtes pas encore <span className="font-black">Mentor</span> 😕</p>
            <p className="mt-1 font-medium text-[#B45309]">
              Vous pouvez le devenir en activant cette fonctionnalité par{' '}
              <Link href="/profile" className="underline font-black text-[#92400E] hover:text-amber-950 transition-colors">
                ici
              </Link>
            </p>
          </div>
        )}

        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs">
          <form method="GET" action="/mentoring" className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs font-bold text-gray-500">
              <input type="text" name="q" defaultValue={params.q || ''} placeholder="🔍 Mots-clés (Nom, poste...)"
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg outline-none font-medium text-gray-800 focus:border-purple-500" />
              <select name="diplome" defaultValue={params.diplome || ''} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg outline-none font-medium text-gray-700">
                <option value="">Diplôme</option>
                <option value="SLAM">BTS SIO (SLAM)</option>
                <option value="SISR">BTS SIO (SISR)</option>
              </select>
              <select name="promotion" defaultValue={params.promotion || ''} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg outline-none font-medium text-gray-700">
                <option value="">Promotion</option>
                <option value="2026">2026</option>
                <option value="2025">2025</option>
                <option value="2024">2024</option>
              </select>
              <select name="type" defaultValue={params.type || ''} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg outline-none font-medium text-gray-700">
                <option value="">Type de mentorat</option>
                <option value="cours">Aide aux devoirs</option>
                <option value="recherche">Recherche de stage</option>
                <option value="technique">Projets techniques</option>
              </select>
            </div>
            <div className="flex justify-between items-center pt-3 border-t border-gray-100 text-[11px] font-black uppercase">
              <Link href="/mentoring" className="text-gray-400 hover:text-gray-600">🔀 Effacer les filtres</Link>
              <button type="submit" className="bg-[#7C3AED] text-white px-5 py-2 rounded-xl hover:bg-purple-700 transition-colors">
                Filtrer les mentors
              </button>
            </div>
          </form>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs">
          {mentorsList.docs.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {mentorsList.docs.map((mentor: any) => (
                <div key={mentor.id} className="border border-gray-100 rounded-xl p-4 flex flex-col justify-between space-y-4 hover:border-purple-200 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-purple-50 text-purple-600 font-black flex items-center justify-center uppercase text-xs">
                      {mentor.prenom?.[0]}{mentor.nom?.[0]}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-sm">{mentor.prenom} {mentor.nom}</h3>
                      <p className="text-[9px] font-black text-gray-400 uppercase">Promo {mentor.promotion}</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 line-clamp-2 font-medium">
                    {mentor.bio || 'Aucune description disponible.'}
                  </p>
                  <Link href={`/directory/${mentor.id}`}
                    className="block text-center py-2 bg-gray-50 hover:bg-purple-50 text-gray-600 hover:text-purple-700 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all">
                    Voir le profil
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 space-y-2">
              <div className="text-3xl">🦲</div>
              <p className="text-xs font-black text-gray-700">Aucun utilisateur ne correspond à vos critères</p>
              <p className="text-[11px] text-gray-400 max-w-xs mx-auto font-medium">
                Modifiez vos sélections ou écrivez un mot-clé différent.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
