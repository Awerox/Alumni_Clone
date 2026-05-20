import React from 'react'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import Link from 'next/link'
import { headers } from 'next/headers'

export const dynamic = 'force-dynamic'

export default async function ActualitesPage({
  searchParams,
}: {
  searchParams: { q?: string; categorie?: string; tab?: string; mineOnly?: string }
}) {
  const payload = await getPayload({ config: configPromise })

  // 🔐 Authentification de l'utilisateur
  const headersList = headers()
  const { user } = await payload.auth({ headers: headersList as any })

  const currentTab = searchParams.tab || 'publie'
  const isMineOnly = searchParams.mineOnly === 'true'

  // 🔍 Construction des contraintes de filtrage
  const queryConstraints: any = {
    statut: { equals: currentTab },
  }

  if (searchParams.categorie) {
    queryConstraints.categorie = { equals: searchParams.categorie }
  }

  if (searchParams.q) {
    queryConstraints.or = [
      { titre: { like: searchParams.q } },
      { description: { like: searchParams.q } },
    ]
  }

  if (isMineOnly && user) {
    queryConstraints.auteur = { equals: user.id }
  }

  const articlesList = await payload.find({
    collection: 'articles',
    where: queryConstraints,
    sort: '-createdAt',
  })

  // Permet de mapper proprement les labels des catégories sur les cards
  const catLabels: any = {
    vie_etablissement: "Vie de l'établissement",
    portraits_anciens: "Portraits d'anciens",
    international: 'International',
    evenements: 'Événements',
  }

  return (
    <div className="bg-gray-50/50 min-h-screen py-10 px-4 sm:px-6 lg:px-8 text-left font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* 🟨 BANDEAU ALERTE MAQUETTE */}
        <div className="bg-[#FEF3C7] border border-[#FDE68A] text-[#92400E] p-4 rounded-xl text-xs font-bold shadow-xs flex justify-between items-center">
          <p>
            Vous n'êtes pas encore abonné à la newsletter de ENC Bessières. Vous pouvez activer
            cette fonctionnalité par{' '}
            <Link
              href="/profile"
              className="underline font-black text-[#92400E] hover:text-amber-950"
            >
              ici
            </Link>
          </p>
          <button className="text-sm">✕</button>
        </div>

        {/* 🔍 ACCORDÉON DE RECHERCHE & FILTRES DE CATÉGORIES */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
          <form
            method="GET"
            action="/blog"
            className="flex flex-wrap items-center gap-3 w-full md:w-auto text-xs"
          >
            <input
              type="text"
              name="q"
              defaultValue={searchParams.q || ''}
              placeholder="Mots-clés"
              className="px-3 py-2 bg-white border border-gray-200 rounded-lg outline-none font-medium text-gray-800 focus:border-amber-500 w-56"
            />
            <select
              name="categorie"
              defaultValue={searchParams.categorie || ''}
              className="px-3 py-2 bg-white border border-gray-200 rounded-lg outline-none font-medium text-gray-700"
            >
              <option value="">Catégorie</option>
              <option value="vie_etablissement">Vie de l'établissement</option>
              <option value="portraits_anciens">Portraits d'anciens</option>
              <option value="international">International</option>
              <option value="evenements">Événements</option>
            </select>
            <button
              type="submit"
              className="bg-amber-400 text-gray-900 px-4 py-2 rounded-lg font-black uppercase tracking-wider"
            >
              Filtrer
            </button>
            <Link href="/blog" className="text-gray-400 hover:text-gray-600 ml-2">
              Effacer les filtres
            </Link>
          </form>
        </div>

        {/* 🟢 COMPOSANT DE NAVIGATION ET STRATÉGIE DE CRÉATION D'ARTICLE */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <Link
            href="/blog/new"
            className="bg-emerald-500 text-white px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 hover:bg-emerald-600 transition-all shadow-sm"
          >
            <span className="text-sm font-black">＋</span> Ajouter un article
          </Link>

          {/* Système d'onglets synchronisé par URL */}
          <div className="bg-amber-50/40 border border-amber-200/60 rounded-2xl p-1.5 flex items-center gap-1 shadow-sm text-xs font-black uppercase overflow-x-auto max-w-full">
            <Link
              href={`/blog?tab=publie`}
              className={`px-4 py-2 rounded-xl transition-all ${currentTab === 'publie' ? 'bg-amber-400 text-gray-900' : 'text-gray-500'}`}
            >
              Articles publiés
            </Link>
            <Link
              href={`/blog?tab=brouillon`}
              className={`px-4 py-2 rounded-xl transition-all ${currentTab === 'brouillon' ? 'bg-amber-400 text-gray-900' : 'text-gray-500'}`}
            >
              Mes articles en brouillon
            </Link>
            <Link
              href={`/blog?tab=attente`}
              className={`px-4 py-2 rounded-xl transition-all ${currentTab === 'attente' ? 'bg-amber-400 text-gray-900' : 'text-gray-500'}`}
            >
              En attente de validation
            </Link>
          </div>
        </div>

        {/* Switch d'isolation utilisateur */}
        {user && (
          <div className="flex items-center gap-2 text-xs font-bold text-gray-600 pt-2">
            <input
              type="checkbox"
              id="mineOnly"
              checked={isMineOnly}
              onChange={(e) => {
                window.location.href = `/blog?tab=${currentTab}&mineOnly=${e.target.checked}`
              }}
              className="rounded text-amber-500 focus:ring-amber-400 w-4 h-4 cursor-pointer"
            />
            <label htmlFor="mineOnly" className="cursor-pointer">
              Voir mes articles uniquement
            </label>
          </div>
        )}

        <div className="text-sm font-black text-gray-700">
          {articlesList.docs.length} Articles répertoriés
        </div>

        {/* 📇 CONSTRUIRE LA GRILLE DE CARDS DU BLOG */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {articlesList.docs.map((article: any) => {
            const coverUrl =
              article.couverture && typeof article.couverture === 'object'
                ? article.couverture.url
                : null
            const cleanDate = new Date(article.createdAt).toLocaleDateString('fr-FR')

            return (
              <div
                key={article.id}
                className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between group"
              >
                <div>
                  {/* Conteneur Image */}
                  <div className="h-48 w-full bg-gray-100 relative overflow-hidden border-b border-gray-100">
                    {coverUrl ? (
                      <img
                        src={coverUrl}
                        alt=""
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300 text-3xl">
                        📰
                      </div>
                    )}
                    {/* Badge Catégorie flottant */}
                    <span className="absolute bottom-3 left-3 bg-amber-400 text-gray-900 font-bold text-[9px] uppercase tracking-wider px-2.5 py-1 rounded-md shadow-xs">
                      {catLabels[article.categorie] || article.categorie}
                    </span>
                  </div>

                  {/* Zone textuelle */}
                  <div className="p-5 space-y-2">
                    <p className="text-[10px] font-bold text-gray-400">{cleanDate}</p>
                    <h3 className="font-black text-gray-900 text-sm tracking-tight leading-snug line-clamp-2 group-hover:text-amber-600 transition-colors">
                      {article.titre}
                    </h3>
                    <p className="text-xs font-medium text-gray-500 leading-relaxed line-clamp-3">
                      {article.description}
                    </p>
                  </div>
                </div>

                {/* Footer de la card avec redirection */}
                <div className="px-5 pb-5 pt-2">
                  <Link
                    href={`/blog/${article.slug}`}
                    className="block text-center py-2.5 bg-amber-500 text-white font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-amber-600 transition-colors shadow-xs"
                  >
                    Lire la suite...
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
