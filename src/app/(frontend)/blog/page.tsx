import React from 'react'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import Link from 'next/link'
import { headers } from 'next/headers'
import MineOnlyFilter from '@/components/MineOnlyFilter'

// Force Next.js à traiter la page de manière dynamique à chaque requête
export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams: Promise<{ q?: string; categorie?: string; tab?: string; mineOnly?: string }>
}

export default async function ActualitesPage({ searchParams }: PageProps) {
  const payload = await getPayload({ config: configPromise })

  // 🔐 1. Récupération asynchrone des en-têtes et session
  const headersList = await headers()
  const { user } = await payload.auth({ headers: headersList as any })

  // 🛡️ SÉCURITÉ : Bloque l'accès si l'utilisateur n'est pas connecté
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 font-sans">
        <div className="text-center p-8 bg-white border border-gray-200 rounded-3xl shadow-sm max-w-sm">
          <div className="text-3xl mb-3">🔒</div>
          <p className="text-sm font-bold text-gray-700">Accès réservé</p>
          <p className="text-xs text-gray-400 mt-1 mb-4">
            Veuillez vous connecter pour accéder au fil d'actualités de la communauté.
          </p>
          <Link
            href="/login?redirect=/blog"
            className="inline-block w-full text-center py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-black uppercase rounded-xl transition-colors shadow-sm"
          >
            Se connecter
          </Link>
        </div>
      </div>
    )
  }

  // 🎂 2. Récupération asynchrone des paramètres d'URL
  const resolvedSearchParams = await searchParams

  const currentTab = resolvedSearchParams.tab || 'publie'
  const isMineOnly = resolvedSearchParams.mineOnly === 'true'

  // 🔍 Construction des requêtes de filtrage pour Payload
  const queryConstraints: any = {
    statut: { equals: currentTab },
  }

  if (resolvedSearchParams.categorie) {
    queryConstraints.categorie = { equals: resolvedSearchParams.categorie }
  }

  if (resolvedSearchParams.q) {
    queryConstraints.or = [
      { titre: { like: resolvedSearchParams.q } },
      { description: { like: resolvedSearchParams.q } },
    ]
  }

  if (isMineOnly) {
    queryConstraints.auteur = { equals: user.id }
  }

  // Appel vers la collection "articles"
  const articlesList = await payload.find({
    collection: 'articles',
    where: queryConstraints,
    sort: '-createdAt',
  })

  const catLabels: any = {
    vie_etablissement: "Vie de l'établissement",
    portraits_anciens: "Portraits d'anciens",
    international: 'International',
    evenements: 'Événements',
  }

  return (
    <div className="bg-gray-50/50 min-h-screen py-10 px-4 sm:px-6 lg:px-8 text-left font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* 🟨 BANDEAU ALERTE NEWSLETTER */}
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

        {/* 🔍 BARRE DE RECHERCHE & FILTRES */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
          <form
            method="GET"
            action="/blog"
            className="flex flex-wrap items-center gap-3 w-full md:w-auto text-xs"
          >
            <input
              type="text"
              name="q"
              defaultValue={resolvedSearchParams.q || ''}
              placeholder="Mots-clés"
              className="px-3 py-2 bg-white border border-gray-200 rounded-lg outline-none font-medium text-gray-800 focus:border-amber-500 w-56"
            />
            <select
              name="categorie"
              defaultValue={resolvedSearchParams.categorie || ''}
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
              className="bg-amber-400 text-gray-900 px-4 py-2 rounded-lg font-black uppercase tracking-wider shadow-2xs cursor-pointer"
            >
              Filtrer
            </button>
            <Link href="/blog" className="text-gray-400 hover:text-gray-600 ml-2">
              Effacer les filtres
            </Link>
          </form>
        </div>

        {/* 🟢 BARRE D'ACTION & ONGLETS DE TRI */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <Link
            href="/blog/new"
            className="bg-emerald-500 text-white px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 hover:bg-emerald-600 transition-all shadow-sm"
          >
            <span className="text-sm font-black">＋</span> Ajouter un article
          </Link>

          <div className="bg-amber-50/40 border border-amber-200/60 rounded-2xl p-1.5 flex items-center gap-1 shadow-sm text-xs font-black uppercase overflow-x-auto max-w-full">
            <Link
              href={`/blog?tab=publie`}
              className={`px-4 py-2 rounded-xl transition-all ${currentTab === 'publie' ? 'bg-amber-400 text-gray-900 shadow-2xs' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Articles publiés
            </Link>
            <Link
              href={`/blog?tab=brouillon`}
              className={`px-4 py-2 rounded-xl transition-all ${currentTab === 'brouillon' ? 'bg-amber-400 text-gray-900 shadow-2xs' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Mes articles en brouillon
            </Link>
            <Link
              href={`/blog?tab=attente`}
              className={`px-4 py-2 rounded-xl transition-all ${currentTab === 'attente' ? 'bg-amber-400 text-gray-900 shadow-2xs' : 'text-gray-500 hover:text-gray-700'}`}
            >
              En attente de validation
            </Link>
          </div>
        </div>

        {/* 👥 Checkbox interactive Client */}
        <MineOnlyFilter currentTab={currentTab} isMineOnly={isMineOnly} />

        <div className="text-sm font-black text-gray-700">
          {articlesList.docs.length} Articles répertoriés
        </div>

        {/* 📇 CARTES GRILLE D'ACTUALITÉS */}
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
                    <span className="absolute bottom-3 left-3 bg-amber-400 text-gray-900 font-bold text-[9px] uppercase tracking-wider px-2.5 py-1 rounded-md shadow-xs">
                      {catLabels[article.categorie] || article.categorie}
                    </span>
                  </div>

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
