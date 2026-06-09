// app/evenements/page.tsx
import React from 'react'
import Link from 'next/link'
import { getAuthUser } from '@/lib/auth'
import EvenementFilter from '@/components/EvenementFilter'

export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams: Promise<{ q?: string; tab?: string; mineOnly?: string; localisation?: string; categorie?: string }>
}

export default async function EvenementsPage({ searchParams }: PageProps) {
  const { user, payload } = await getAuthUser()

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 font-sans">
        <div className="text-center p-8 bg-white border border-gray-200 rounded-3xl shadow-sm max-w-sm">
          <div className="text-3xl mb-3">🔒</div>
          <p className="text-sm font-bold text-gray-700">Accès restreint</p>
          <p className="text-xs text-gray-400 mt-1 mb-4">Veuillez vous connecter pour accéder à l'espace événementiel.</p>
          <Link href="/login?redirect=/evenements" className="inline-block w-full text-center py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-black uppercase rounded-xl transition-colors shadow-sm">Se connecter</Link>
        </div>
      </div>
    )
  }

  const resolvedSearchParams = await searchParams
  const currentTab = resolvedSearchParams.tab || 'venir'
  const isMineOnly = resolvedSearchParams.mineOnly === 'true'

  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)
  const nowISO = startOfToday.toISOString()

  let queryConstraints: any = {}

  if (currentTab === 'venir') { queryConstraints.statut = { equals: 'publie' }; queryConstraints.dateFin = { greater_than_equal: nowISO } }
  else if (currentTab === 'passes') { queryConstraints.statut = { equals: 'publie' }; queryConstraints.dateFin = { less_than: nowISO } }
  else if (currentTab === 'participations') { queryConstraints.participants = { contains: user.id } }
  else if (currentTab === 'brouillon') { queryConstraints.statut = { equals: 'brouillon' }; queryConstraints.organisateur = { equals: user.id } }
  else if (currentTab === 'attente') { queryConstraints.statut = { equals: 'attente' }; queryConstraints.organisateur = { equals: user.id } }

  if (resolvedSearchParams.q) queryConstraints.nom = { like: resolvedSearchParams.q }
  if (resolvedSearchParams.localisation) queryConstraints.typeLocalisation = { equals: resolvedSearchParams.localisation }
  if (resolvedSearchParams.categorie) queryConstraints.categorie = { equals: resolvedSearchParams.categorie }
  if (isMineOnly && currentTab !== 'brouillon' && currentTab !== 'attente') queryConstraints.organisateur = { equals: user.id }

  const evenementsList = await payload.find({ collection: 'evenements', where: queryConstraints, sort: 'dateDebut' })

  const catLabels: any = { conference: 'Conférence', reseau: 'Réseautage / Anciens', atelier: 'Atelier Métier', jpo: 'JPO / Salon' }

  return (
    <div className="bg-gray-50/50 min-h-screen py-10 px-4 sm:px-6 lg:px-8 text-left font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        <h1 className="text-xl font-black text-gray-900 uppercase tracking-tight">Tous les événements</h1>

        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs">
          <form method="GET" action="/evenements" className="flex flex-wrap items-center gap-3 text-xs font-bold text-gray-500">
            <input type="hidden" name="tab" value={currentTab} />
            {isMineOnly && <input type="hidden" name="mineOnly" value="true" />}
            <input type="text" name="q" defaultValue={resolvedSearchParams.q || ''} placeholder="Mots-clés" className="px-3 py-2 bg-white border border-gray-200 rounded-lg outline-none text-gray-800 focus:border-emerald-500 w-52 font-medium" />
            <select name="localisation" defaultValue={resolvedSearchParams.localisation || ''} className="px-3 py-2 bg-white border border-gray-200 rounded-lg outline-none text-gray-700 font-medium focus:border-emerald-500 cursor-pointer">
              <option value="">Localisation</option>
              <option value="presentiel">📍 En présentiel</option>
              <option value="enligne">💻 En ligne</option>
            </select>
            <select name="categorie" defaultValue={resolvedSearchParams.categorie || ''} className="px-3 py-2 bg-white border border-gray-200 rounded-lg outline-none text-gray-700 font-medium focus:border-emerald-500 cursor-pointer">
              <option value="">Catégorie</option>
              <option value="conference">Conférence</option>
              <option value="reseau">Réseautage / Anciens</option>
              <option value="atelier">Atelier Métier</option>
              <option value="jpo">JPO / Salon</option>
            </select>
            <button type="submit" className="bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2 rounded-lg font-black uppercase transition-colors shadow-2xs cursor-pointer">Filtrer</button>
            <Link href={`/evenements?tab=${currentTab}`} className="text-gray-400 hover:text-gray-600 font-black uppercase text-[11px] ml-1">✕ Effacer</Link>
          </form>
        </div>

        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
          <Link href="/evenements/new" className="bg-emerald-500 text-white px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 hover:bg-emerald-600 transition-all shadow-sm">
            <span className="text-sm font-black">＋</span> Ajouter un événement
          </Link>
          <div className="bg-amber-50/40 border border-amber-200/60 rounded-2xl p-1.5 flex items-center gap-1 shadow-sm text-[10px] font-black uppercase overflow-x-auto max-w-full">
            {['passes', 'venir', 'participations', 'brouillon', 'attente'].map((t) => (
              <Link key={t} href={`/evenements?tab=${t}`}
                className={`px-3 py-2 rounded-xl transition-all whitespace-nowrap ${currentTab === t ? 'bg-amber-400 text-gray-900 shadow-2xs' : 'text-gray-500 hover:text-gray-700'}`}>
                {t === 'passes' ? 'Passés' : t === 'venir' ? 'À venir' : t === 'participations' ? 'Mes participations' : t === 'brouillon' ? 'En brouillon' : 'En attente'}
              </Link>
            ))}
          </div>
        </div>

        <EvenementFilter currentTab={currentTab} isMineOnly={isMineOnly} />
        <div className="text-sm font-black text-gray-700 pt-1">{evenementsList.docs.length} événement(s)</div>

        {evenementsList.docs.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {evenementsList.docs.map((evt: any) => {
              const coverUrl = evt.couverture && typeof evt.couverture === 'object' ? evt.couverture.url : null
              return (
                <div key={evt.id} className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-2xs hover:shadow-md transition-all flex flex-col justify-between group">
                  <div className="h-44 bg-gray-100 relative overflow-hidden border-b border-gray-100">
                    {coverUrl && <img src={coverUrl} alt="" className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300" />}
                    <div className="absolute bottom-3 left-3 flex gap-1">
                      <span className="bg-emerald-500 text-white font-bold text-[8px] uppercase px-2 py-0.5 rounded shadow-sm">{evt.typeLocalisation === 'presentiel' ? '📍 Présentiel' : '💻 En ligne'}</span>
                      <span className="bg-purple-600 text-white font-bold text-[8px] uppercase px-2 py-0.5 rounded shadow-sm">{catLabels[evt.categorie] || evt.categorie}</span>
                    </div>
                  </div>
                  <div className="p-5 space-y-2 flex-grow">
                    <p className="text-[10px] font-bold text-gray-400">📅 {new Date(evt.dateDebut).toLocaleDateString('fr-FR')}</p>
                    <h3 className="font-black text-gray-900 text-sm tracking-tight leading-snug line-clamp-2 group-hover:text-emerald-600 transition-colors">{evt.nom}</h3>
                  </div>
                  <div className="px-5 pb-5">
                    <Link href={`/evenements/${evt.slug}`} className="block text-center py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-colors shadow-2xs">Voir les détails</Link>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-20 bg-white border border-gray-200 rounded-3xl space-y-3 shadow-3xs">
            <div className="text-4xl text-gray-400">📅</div>
            <p className="text-xs font-black text-gray-700">Aucun événement ne correspond à vos critères</p>
          </div>
        )}
      </div>
    </div>
  )
}
