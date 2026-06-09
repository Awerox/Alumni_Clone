// app/blog/page.tsx
import React from 'react'
import Link from 'next/link'
import { getAuthUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams: Promise<{ q?: string; categorie?: string; tab?: string }>
}

// ─── Labels catégories ─────────────────────────────────────────────────────
// ✅ Quand tu ajoutes une catégorie dans Articles.ts, ajoute-la ici aussi
const CAT_LABELS: Record<string, string> = {
  vie_etablissement:  "Vie de l'établissement",
  portraits_anciens:  "Portraits d'anciens",
  international:      'International',
  evenements:         'Événements',
  insertion_pro:      'Insertion professionnelle',
  orientation:        'Orientation',
  boite_outils:       'Boîte à outils',
  bons_plans:         'Bons plans',
}

// Couleurs par catégorie
const CAT_COLORS: Record<string, string> = {
  vie_etablissement: 'bg-amber-400 text-gray-900',
  portraits_anciens: 'bg-purple-500 text-white',
  international:     'bg-blue-500 text-white',
  evenements:        'bg-emerald-500 text-white',
  insertion_pro:     'bg-orange-500 text-white',
  orientation:       'bg-cyan-500 text-white',
  boite_outils:      'bg-gray-600 text-white',
  bons_plans:        'bg-pink-500 text-white',
}

export default async function BlogPage({ searchParams }: PageProps) {
  const { user, payload } = await getAuthUser()

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 font-sans">
        <div className="text-center p-8 bg-white border border-gray-200 rounded-3xl shadow-sm max-w-sm">
          <div className="text-3xl mb-3">🔒</div>
          <p className="text-sm font-bold text-gray-700">Accès réservé</p>
          <p className="text-xs text-gray-400 mt-1 mb-4">Connectez-vous pour accéder aux actualités.</p>
          <Link href="/login?redirect=/blog" className="inline-block w-full text-center py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-black uppercase rounded-xl transition-colors shadow-sm">
            Se connecter
          </Link>
        </div>
      </div>
    )
  }

  const resolvedParams = await searchParams
  const currentTab = resolvedParams.tab || 'publie'
  const currentCat = resolvedParams.categorie || ''
  const currentQ = resolvedParams.q || ''

  // Construction des filtres
  const where: any = { statut: { equals: currentTab } }
  if (currentCat) where.categorie = { equals: currentCat }
  if (currentQ) where.or = [
    { titre: { like: currentQ } },
    { description: { like: currentQ } },
  ]
  // Brouillons/attente : seulement les miens
  if (currentTab === 'brouillon' || currentTab === 'attente') {
    where.auteur = { equals: user.id }
  }

  const articlesList = await payload.find({
    collection: 'articles',
    where,
    sort: '-createdAt',
    depth: 1,
  })

  const tabs = [
    { value: 'publie',    label: 'Publiés' },
    { value: 'brouillon', label: 'Mes brouillons' },
    { value: 'attente',   label: 'En attente' },
  ]

  return (
    <div className="min-h-screen bg-gray-50/50 font-sans text-left">
      <div className="max-w-7xl mx-auto px-4 py-10 space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">Actualités</h1>
            <p className="text-xs text-gray-400 mt-0.5 font-medium">Articles et actualités de la communauté ENC Bessières</p>
          </div>
          <Link href="/blog/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-black uppercase rounded-xl transition-all shadow-sm hover:-translate-y-0.5 duration-200">
            <span className="text-sm">＋</span> Écrire un article
          </Link>
        </div>

        {/* Filtres */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-xs">
          <form method="GET" action="/blog" className="flex flex-wrap items-center gap-3">
            <input type="hidden" name="tab" value={currentTab} />
            <input
              type="text" name="q" defaultValue={currentQ}
              placeholder="🔍 Rechercher..."
              className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none text-xs font-medium text-gray-800 focus:border-amber-400 w-48 transition-colors"
            />
            <select
              name="categorie" defaultValue={currentCat}
              className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none text-xs font-medium text-gray-700 focus:border-amber-400 transition-colors"
            >
              <option value="">Toutes les catégories</option>
              {Object.entries(CAT_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            <button type="submit"
              className="px-4 py-2 bg-amber-400 hover:bg-amber-500 text-gray-900 text-xs font-black uppercase rounded-xl transition-colors shadow-xs">
              Filtrer
            </button>
            {(currentQ || currentCat) && (
              <Link href={`/blog?tab=${currentTab}`} className="text-xs text-gray-400 hover:text-gray-600 font-bold">
                ✕ Effacer
              </Link>
            )}
          </form>
        </div>

        {/* Onglets */}
        <div className="flex items-center gap-1 bg-gray-100/80 p-1 rounded-2xl w-fit">
          {tabs.map((tab) => (
            <Link key={tab.value} href={`/blog?tab=${tab.value}${currentCat ? `&categorie=${currentCat}` : ''}`}
              className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wide transition-all ${
                currentTab === tab.value
                  ? 'bg-white text-amber-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}>
              {tab.label}
            </Link>
          ))}
        </div>

        {/* Compteur */}
        <p className="text-xs font-black text-gray-400 uppercase tracking-widest">
          {articlesList.docs.length} article{articlesList.docs.length > 1 ? 's' : ''}
        </p>

        {/* Grille articles */}
        {articlesList.docs.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {articlesList.docs.map((article: any) => {
              const coverUrl = article.couverture && typeof article.couverture === 'object'
                ? article.couverture.url : null
              const catColor = CAT_COLORS[article.categorie] || 'bg-gray-200 text-gray-700'
              const catLabel = CAT_LABELS[article.categorie] || article.categorie

              return (
                <div key={article.id}
                  className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-xs hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col group">
                  {/* Image */}
                  <div className="h-44 bg-gray-100 relative overflow-hidden">
                    {coverUrl
                      ? <img src={coverUrl} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      : <div className="w-full h-full flex items-center justify-center text-4xl text-gray-200">📰</div>
                    }
                    {/* Badge catégorie */}
                    <span className={`absolute top-3 left-3 text-[9px] font-black uppercase px-2 py-0.5 rounded-full shadow-sm ${catColor}`}>
                      {catLabel}
                    </span>
                    {/* Badge statut si brouillon/attente */}
                    {article.statut !== 'publie' && (
                      <span className="absolute top-3 right-3 text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-black/60 text-white">
                        {article.statut === 'brouillon' ? 'Brouillon' : 'En attente'}
                      </span>
                    )}
                  </div>

                  {/* Contenu */}
                  <div className="p-4 flex flex-col flex-1 space-y-2">
                    <p className="text-[9px] font-black text-gray-300 uppercase tracking-wider">
                      {new Date(article.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                      {article.auteur && ` · ${article.auteur.prenom || ''} ${article.auteur.nom || ''}`}
                    </p>
                    <h3 className="font-black text-gray-900 text-sm leading-snug line-clamp-2 group-hover:text-amber-600 transition-colors flex-1">
                      {article.titre}
                    </h3>
                    <p className="text-[11px] text-gray-400 font-medium line-clamp-2 leading-relaxed">
                      {article.description}
                    </p>
                  </div>

                  {/* CTA */}
                  <div className="px-4 pb-4">
                    <Link href={`/blog/${article.slug}`}
                      className="block text-center py-2 bg-gray-50 hover:bg-amber-500 hover:text-white text-gray-500 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all duration-200 border border-gray-100 hover:border-amber-500">
                      Lire l'article →
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-20 bg-white border border-gray-200 rounded-3xl space-y-3">
            <div className="text-4xl">📝</div>
            <p className="text-sm font-black text-gray-700">Aucun article trouvé</p>
            <p className="text-xs text-gray-400">
              {currentTab === 'publie'
                ? 'Soyez le premier à publier un article !'
                : currentTab === 'brouillon'
                  ? "Vous n'avez pas encore de brouillons."
                  : "Aucun article en attente de validation."}
            </p>
            <Link href="/blog/new"
              className="inline-block mt-2 px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-black uppercase rounded-xl transition-colors shadow-sm">
              Écrire un article
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
