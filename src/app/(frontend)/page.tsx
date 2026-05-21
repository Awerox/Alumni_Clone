import React from 'react'
import Link from 'next/link'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { headers } from 'next/headers'
import HeroSlider from '@/components/HeroSlider'
import PublishBox from '@/components/PublishBox'

// Force Next.js à traiter la page de manière dynamique pour lire la session et les derniers posts
export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams: Promise<{ q?: string; categorie?: string; tab?: string; mineOnly?: string }>
}

export default async function HomePage() {
  const payload = await getPayload({ config: configPromise })

  // 🔐 1. Récupération asynchrone des en-têtes et de la session utilisateur
  const headersList = await headers()
  const { user } = await payload.auth({ headers: headersList as any })

  // 👥 2. Récupération en parallèle de toutes les sources de données (Optimisation des requêtes)
  const [recentAlumni, postsRes, offresRes, articlesRes] = await Promise.all([
    payload.find({ collection: 'alumni', sort: '-createdAt', limit: 3 }),
    payload.find({ collection: 'posts', limit: 10, sort: '-createdAt' }),
    payload.find({ collection: 'offres', limit: 10, sort: '-createdAt' }),
    payload.find({
      collection: 'articles',
      where: { statut: { equals: 'publie' } },
      limit: 10,
      sort: '-createdAt',
    }),
  ])

  // 🔀 3. Unification et tri chronologique décroissant pour le Feed central
  const itemsFeed: any[] = [
    ...postsRes.docs.map((p: any) => ({ ...p, typeItem: 'post' })),
    ...offresRes.docs.map((o: any) => ({ ...o, typeItem: 'offre' })),
    ...articlesRes.docs.map((a: any) => ({ ...a, typeItem: 'article' })),
  ].sort((x, y) => new Date(y.createdAt).getTime() - new Date(x.createdAt).getTime())

  const catLabels: any = {
    vie_etablissement: "Vie de l'établissement",
    portraits_anciens: "Portrait d'anciens",
    international: 'International',
    evenements: 'Événements',
  }

  // ✨ ASTUCE SÉCURITÉ TYPESCRIPT : On crée une référence typée ou "any" pour éteindre le soulignage rouge
  const typedUser = user as any

  return (
    <div className="bg-gray-50/40 min-h-screen font-sans text-left">
      {/* 🟪 SECTION 1 : HERO DYNAMIQUE D'ACCUEIL */}
      <section className="bg-white border-b border-gray-100 py-12">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center gap-12">
          <div className="md:w-1/2 space-y-6">
            <h1 className="text-4xl font-black text-enc leading-tight tracking-tight">Bonjour !</h1>
            <p className="text-gray-600 text-base leading-relaxed font-medium">
              Anciens, étudiants, enseignants, recruteurs, la communauté alumni de l'ENC Bessières
              est ravie de vous (re)voir sur cet outil dédié à votre mise en relation et au partage
              d'opportunités.
            </p>
            <Link
              href="/about"
              className="inline-block bg-enc text-white px-8 py-3 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-opacity-90 transition-all shadow-sm"
            >
              En savoir plus
            </Link>
          </div>
          <HeroSlider />
        </div>
      </section>

      {/* 📰 SECTION 2 : LE MAIN FEED */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* 👈 COLONNE GAUCHE : COMMUNAUTÉ & ARTICLES À LA UNE */}
          <div className="space-y-6">
            {/* Boîte de publication interactive - Plus de rouge ici grâce à typedUser */}
            {typedUser ? (
              <PublishBox userPrenom={typedUser.prenom || ''} userNom={typedUser.nom || ''} />
            ) : (
              <div className="bg-white border border-gray-200 p-5 rounded-3xl text-center text-xs font-bold text-gray-500 shadow-2xs">
                🔑{' '}
                <Link href="/login" className="text-purple-600 underline">
                  Connectez-vous
                </Link>{' '}
                pour publier un message sur le feed.
              </div>
            )}

            {/* Liste filtrée des Articles Officiels */}
            <div className="space-y-6">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest pl-1">
                📰 À la une du blog
              </h3>
              {itemsFeed
                .filter((i) => i.typeItem === 'article')
                .slice(0, 2)
                .map((article: any) => {
                  const coverUrl =
                    article.couverture && typeof article.couverture === 'object'
                      ? article.couverture.url
                      : null
                  return (
                    <div
                      key={article.id}
                      className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-2xs group flex flex-col justify-between"
                    >
                      <div>
                        <div className="h-44 bg-gray-100 relative overflow-hidden border-b border-gray-100">
                          {coverUrl && (
                            <img
                              src={coverUrl}
                              alt=""
                              className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                            />
                          )}
                          <span className="absolute bottom-3 left-3 bg-amber-400 text-gray-900 font-bold text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-md">
                            {catLabels[article.categorie] || article.categorie}
                          </span>
                        </div>
                        <div className="p-5 space-y-2">
                          <h4 className="font-black text-gray-900 text-sm leading-tight tracking-tight line-clamp-2">
                            {article.titre}
                          </h4>
                          <p className="text-xs font-medium text-gray-500 line-clamp-3 leading-relaxed">
                            {article.description}
                          </p>
                        </div>
                      </div>
                      <div className="px-5 pb-5">
                        <Link
                          href={`/blog/${article.slug}`}
                          className="block text-center py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-colors"
                        >
                          Lire la suite...
                        </Link>
                      </div>
                    </div>
                  )
                })}
            </div>
          </div>

          {/* 📦 COLONNE CENTRALE : FLUX CHRONOLOGIQUE */}
          <div className="lg:col-span-1 space-y-5">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest pl-1">
              ⚡ Activité du réseau
            </h3>

            {itemsFeed.filter((i) => i.typeItem === 'post' || i.typeItem === 'offre').length > 0 ? (
              itemsFeed
                .filter((i) => i.typeItem === 'post' || i.typeItem === 'offre')
                .map((item: any) => {
                  const dateText = new Date(item.createdAt).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })

                  if (item.typeItem === 'offre') {
                    return (
                      <div
                        key={item.id}
                        className="bg-white border border-gray-200 rounded-3xl p-5 shadow-2xs space-y-3"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-xs">
                            💼
                          </div>
                          <div className="text-[11px] text-gray-500 font-semibold leading-tight">
                            <span className="font-bold text-gray-800">
                              {item.recruteur?.prenom || 'Un membre'}
                            </span>{' '}
                            vient de déposer une offre :
                          </div>
                        </div>
                        <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 flex items-center gap-4">
                          <div className="p-3 bg-gray-200/50 rounded-xl text-gray-500 text-xs">
                            💼
                          </div>
                          <div>
                            <h4 className="text-xs font-black text-gray-800">
                              poste de {item.poste}
                            </h4>
                            <p className="text-[10px] font-bold text-amber-600 uppercase mt-0.5 tracking-wide">
                              {item.entreprise} • {item.typeContrat} • {item.localisation}
                            </p>
                          </div>
                        </div>
                        <p className="text-[9px] text-gray-400 font-bold">{dateText}</p>
                      </div>
                    )
                  }

                  return (
                    <div
                      key={item.id}
                      className="bg-white border border-gray-200 rounded-3xl p-5 shadow-2xs space-y-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center text-[10px] font-black uppercase">
                          {item.auteur?.prenom?.[0]}
                          {item.auteur?.nom?.[0]}
                        </div>
                        <div>
                          <h4 className="text-xs font-black text-gray-800">
                            {item.auteur?.prenom} {item.auteur?.nom}
                          </h4>
                          <p className="text-[9px] text-gray-400 font-bold">{dateText}</p>
                        </div>
                      </div>
                      <p className="text-xs font-medium text-gray-600 leading-relaxed whitespace-pre-wrap">
                        {item.contenu}
                      </p>
                    </div>
                  )
                })
            ) : (
              <p className="text-center text-xs text-gray-400 italic py-6 bg-white border border-gray-200 rounded-3xl">
                Aucune publication récente.
              </p>
            )}
          </div>

          {/* 👉 COLONNE DROITE : DERNIERS MEMBRES INSCRITS */}
          <div className="space-y-6">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest pl-1">
              ✨ Nouveaux membres
            </h3>

            <div className="space-y-4">
              {recentAlumni.docs.map((alumnus) => (
                <div
                  key={alumnus.id}
                  className="bg-white p-4 rounded-2xl shadow-2xs border border-gray-200 flex items-start gap-3"
                >
                  <div className="h-10 w-10 shrink-0 rounded-full bg-enc/5 flex items-center justify-center text-enc font-black text-xs border border-enc/10">
                    {alumnus.prenom[0]}
                    {alumnus.nom[0]}
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="font-bold text-xs text-gray-800 uppercase leading-none">
                      {alumnus.prenom} {alumnus.nom}
                    </h4>
                    <p className="text-[9px] font-black text-gray-400 uppercase">
                      Promo {alumnus.promotion || 'NC'} • {alumnus.statut}
                    </p>
                    <p className="text-[11px] font-bold text-gray-600 truncate max-w-[180px] pt-0.5">
                      {alumnus.poste || 'Étudiant'}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Bloc de rebond vers les autres articles */}
            {itemsFeed
              .filter((i) => i.typeItem === 'article')
              .slice(2, 4)
              .map((article: any) => (
                <div
                  key={article.id}
                  className="bg-white border border-gray-200 rounded-3xl p-4 shadow-2xs space-y-3"
                >
                  <div className="space-y-1">
                    <span className="text-[9px] font-black uppercase tracking-wider text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md">
                      {catLabels[article.categorie] || article.categorie}
                    </span>
                    <h4 className="font-black text-gray-900 text-xs pt-1 leading-snug">
                      {article.titre}
                    </h4>
                  </div>
                  <Link
                    href={`/blog/${article.slug}`}
                    className="block text-[10px] font-black text-amber-500 uppercase hover:underline"
                  >
                    Consulter l'article →
                  </Link>
                </div>
              ))}
          </div>
        </div>
      </section>

      {/* 🤝 SECTION 3 : PRÉSENTATION DU MENTORAT */}
      <section className="py-16 bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-4 mb-12">
            <div className="h-[1px] bg-enc flex-grow opacity-20"></div>
            <h2 className="text-xl font-black text-gray-800 whitespace-nowrap uppercase tracking-widest">
              Ils transmettent leur <span className="text-enc">expérience</span>
            </h2>
            <div className="h-[1px] bg-enc flex-grow opacity-20"></div>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="md:w-1/3 space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-black text-gray-900">Qu'est-ce que le mentorat ?</h3>
                <p className="text-gray-500 leading-relaxed text-xs font-medium">
                  Le mentorat est une initiative bénévole qui permet à chaque utilisateur de pouvoir
                  transmettre son expérience terrain et d'accompagner un camarade.
                </p>
                <p className="text-gray-500 leading-relaxed text-xs font-medium">
                  Les mentors potentiels sont identifiables grâce à un{' '}
                  <strong className="text-enc">badge MENTOR</strong> et peuvent être sollicités
                  directement depuis l'onglet Mentorat.
                </p>
                <p className="text-gray-500 leading-relaxed text-xs font-medium">
                  Une bonne relation de mentorat nécessite au moins{' '}
                  <strong>une rencontre par mois</strong> et le suivi s'effectue sur une période de{' '}
                  <strong>six mois</strong>.
                </p>
                <p className="text-enc font-black italic pt-2 tracking-wide text-base">
                  À vous de jouer !
                </p>
              </div>

              <Link
                href="/mentorship"
                className="inline-block bg-enc text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-[#6b001a] transition-all shadow-sm"
              >
                Charte du mentorat
              </Link>
            </div>

            <div className="md:w-2/3 w-full">
              <img
                src="https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&q=80&w=1000"
                alt="Illustration Mentorat"
                className="w-full h-64 md:h-80 object-cover rounded-3xl shadow-md transform hover:scale-[1.01] transition-transform duration-500"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
