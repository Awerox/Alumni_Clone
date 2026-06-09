// app/feed/page.tsx
import React from 'react'
import Link from 'next/link'
import { getAuthUser } from '@/lib/auth'
import PublishBox from '@/components/PublishBox'

export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams: Promise<{ q?: string; filterType?: string }>
}

export default async function FeedPage({ searchParams }: PageProps) {
  const { user, payload } = await getAuthUser()

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 font-sans">
        <div className="text-center p-8 bg-white border border-gray-200 rounded-3xl shadow-sm max-w-sm">
          <div className="text-3xl mb-3">🔒</div>
          <p className="text-sm font-bold text-gray-700">Accès restreint</p>
          <p className="text-xs text-gray-400 mt-1 mb-4">Veuillez vous connecter pour accéder au fil d'actualité de l'ENC.</p>
          <Link href="/login?redirect=/feed" className="inline-block w-full text-center py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-black uppercase rounded-xl transition-colors shadow-sm">Se connecter</Link>
        </div>
      </div>
    )
  }

  const resolvedSearchParams = await searchParams
  const filterType = resolvedSearchParams.filterType || 'all'

  const [postsRes, offresRes, articlesRes] = await Promise.all([
    payload.find({ collection: 'posts', limit: 30, sort: '-createdAt' }),
    payload.find({ collection: 'offres', limit: 30, sort: '-createdAt' }),
    payload.find({ collection: 'articles', where: { statut: { equals: 'publie' } }, limit: 30, sort: '-createdAt' }),
  ])

  let itemsFeed: any[] = [
    ...postsRes.docs.map((p: any) => ({ ...p, typeItem: 'post' })),
    ...offresRes.docs.map((o: any) => ({ ...o, typeItem: 'offre' })),
    ...articlesRes.docs.map((a: any) => ({ ...a, typeItem: 'article' })),
  ].sort((x, y) => new Date(y.createdAt).getTime() - new Date(x.createdAt).getTime())

  if (filterType === 'posts') itemsFeed = itemsFeed.filter((i) => i.typeItem === 'post')
  if (filterType === 'offres') itemsFeed = itemsFeed.filter((i) => i.typeItem === 'offre')
  if (filterType === 'blog') itemsFeed = itemsFeed.filter((i) => i.typeItem === 'article')

  const catLabels: any = {
    vie_etablissement: "Vie de l'établissement",
    portraits_anciens: "Portrait d'anciens",
    international: 'International',
    evenements: 'Événements',
  }

  return (
    <div className="bg-gray-50/60 min-h-screen py-6 px-4 sm:px-6 lg:px-8 font-sans text-left">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-gray-200 p-4 rounded-2xl shadow-2xs">
          <div className="text-sm font-black text-gray-800">📋 Fil d'actualité global</div>
          <div className="flex flex-wrap gap-1.5 text-[11px] font-black uppercase tracking-wider">
            {['all', 'posts', 'offres', 'blog'].map((tab) => (
              <Link key={tab} href={`/feed?filterType=${tab}`}
                className={`px-4 py-2 rounded-xl transition-all ${filterType === tab ? 'bg-purple-600 text-white' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}>
                {tab === 'all' ? 'Tout' : tab === 'posts' ? 'Messages' : tab === 'offres' ? "Offres d'emploi" : 'Articles'}
              </Link>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <div className="lg:col-span-2 space-y-5">
            {filterType !== 'offres' && filterType !== 'blog' && (
              <PublishBox userPrenom={user.prenom || ''} userNom={user.nom || ''} />
            )}

            {itemsFeed.length > 0 ? itemsFeed.map((item: any) => {
              const dateText = new Date(item.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })

              if (item.typeItem === 'offre') {
                return (
                  <div key={item.id} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-2xs space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm border border-gray-200">💼</div>
                      <div className="text-[11px] text-gray-500 font-semibold leading-tight">
                        <span className="font-bold text-gray-800">{item.recruteur?.prenom || 'Virginie SABET'}</span> vient de déposer une offre d'emploi :
                      </div>
                    </div>
                    <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 flex items-center gap-4">
                      <div className="p-3 bg-white border border-gray-200 rounded-xl text-gray-400 text-xs shadow-3xs">💼</div>
                      <div>
                        <h4 className="text-xs font-black text-gray-800">poste de {item.poste}</h4>
                        <p className="text-[10px] font-bold text-purple-600 uppercase mt-0.5 tracking-wide">{item.entreprise} • {item.typeContrat} • {item.localisation}</p>
                      </div>
                    </div>
                    <div className="text-[9px] text-gray-400 font-bold">{dateText}</div>
                  </div>
                )
              }

              if (item.typeItem === 'post') {
                return (
                  <div key={item.id} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-2xs space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center text-xs font-black uppercase border border-purple-100">
                        {item.auteur?.prenom?.[0] || 'A'}{item.auteur?.nom?.[0] || 'X'}
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-gray-800">{item.auteur?.prenom || 'Alumni'} {item.auteur?.nom || ''} a publié :</h4>
                        <p className="text-[9px] text-gray-400 font-bold">{dateText}</p>
                      </div>
                    </div>
                    <p className="text-xs font-medium text-gray-600 leading-relaxed whitespace-pre-wrap">{item.contenu}</p>
                  </div>
                )
              }

              const coverUrl = item.couverture && typeof item.couverture === 'object' ? item.couverture.url : null
              return (
                <div key={item.id} className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-2xs flex flex-col sm:flex-row group hover:border-purple-200 transition-all">
                  {coverUrl && (
                    <div className="sm:w-48 h-40 shrink-0 bg-gray-100 relative">
                      <img src={coverUrl} alt="" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="p-5 flex flex-col justify-between space-y-2">
                    <div className="space-y-1">
                      <span className="inline-block bg-amber-400 text-gray-900 font-bold text-[8px] uppercase tracking-wider px-2 py-0.5 rounded">{catLabels[item.categorie] || item.categorie}</span>
                      <h4 className="font-black text-gray-900 text-sm leading-tight tracking-tight pt-1">{item.titre}</h4>
                      <p className="text-xs font-medium text-gray-500 line-clamp-2 leading-normal">{item.description}</p>
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[9px] text-gray-400 font-bold">{dateText}</span>
                      <Link href={`/blog/${item.slug}`} className="text-[10px] font-black text-purple-600 uppercase tracking-wider hover:underline">Consulter l'article →</Link>
                    </div>
                  </div>
                </div>
              )
            }) : (
              <div className="text-center py-12 bg-white border border-gray-200 rounded-2xl text-xs text-gray-400 italic">Aucun contenu ne correspond à ce filtre actuellement.</div>
            )}
          </div>

          <div className="space-y-5">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest pl-1">📰 Derniers Articles du Blog</h3>
            {articlesRes.docs.slice(0, 3).map((article: any) => {
              const coverUrl = article.couverture && typeof article.couverture === 'object' ? article.couverture.url : null
              return (
                <div key={article.id} className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-2xs group flex flex-col justify-between">
                  <div className="p-4 space-y-3">
                    {coverUrl && <div className="h-32 rounded-xl overflow-hidden bg-gray-50 border border-gray-100"><img src={coverUrl} alt="" className="w-full h-full object-cover" /></div>}
                    <div className="space-y-1">
                      <span className="text-[8px] font-black uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded">{catLabels[article.categorie] || article.categorie}</span>
                      <h4 className="font-black text-gray-900 text-xs pt-1 leading-snug line-clamp-2">{article.titre}</h4>
                      <p className="text-[11px] font-medium text-gray-400 line-clamp-2">{article.description}</p>
                    </div>
                  </div>
                  <div className="px-4 pb-4">
                    <Link href={`/blog/${article.slug}`} className="block text-center py-2 bg-gray-50 hover:bg-purple-50 text-gray-600 hover:text-purple-700 font-black text-[10px] uppercase tracking-wider rounded-xl transition-colors">Consulter</Link>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
