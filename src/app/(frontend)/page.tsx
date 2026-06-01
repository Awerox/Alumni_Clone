import React from 'react'
import Link from 'next/link'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { headers } from 'next/headers'
import HeroSlider from '@/components/HeroSlider'
import PublishBox from '@/components/PublishBox'

// Force Next.js à traiter la page de manière dynamique pour lire la session et les derniers posts
export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const payload = await getPayload({ config: configPromise })

  // 🔐 1. Récupération asynchrone des en-têtes et de la session utilisateur
  const headersList = await headers()
  const { user } = await payload.auth({ headers: headersList as any })

  // 👥 2. Récupération en parallèle de toutes les sources de données
  const [recentAlumni, postsRes, offresRes, articlesRes] = await Promise.all([
    payload.find({ collection: 'alumni', sort: '-createdAt', limit: 3 }),
    payload.find({ collection: 'posts', limit: 10, sort: '-createdAt' }),
    payload.find({
      collection: 'offres',
      where: { statut: { equals: 'publie' } },
      limit: 3,
      sort: '-createdAt',
    }), // Vitrine d'accueil limitée à 3 offres
    payload.find({
      collection: 'articles',
      where: { statut: { equals: 'publie' } },
      limit: 10,
      sort: '-createdAt',
    }),
  ])

  // 🔀 3. Le flux central (Feed) ne conserve plus que les posts et articles pour éviter les doublons
  const itemsFeed: any[] = [
    ...postsRes.docs.map((p: any) => ({ ...p, typeItem: 'post' })),
    ...articlesRes.docs.map((a: any) => ({ ...a, typeItem: 'article' })),
  ].sort((x, y) => new Date(y.createdAt).getTime() - new Date(x.createdAt).getTime())

  const catLabels: any = {
    vie_etablissement: "Vie de l'établissement",
    portraits_anciens: "Portrait d'anciens",
    international: 'International',
    evenements: 'Événements',
  }

  // 🌟 AJOUT : Mappers globaux requis pour éviter les erreurs d'affichage
  const remLabels: any = {
    non_renseigne: 'Non renseigné',
    stage_non_indemnise: 'Stage non-indemnisé',
    stage_indemnise: 'Stage indemnisé',
    moins_15k: '< 15k €',
    '20_225k': '20-22,5K €',
    '25_275k': '25-27,5K €',
    '30_325k': '30-32,5K €',
    '35-37,5K €': '35-37,5K €',
    '40_45k': '40-45K €',
    '45_50k': '45-50K €',
    '50_55k': '50-55K €',
    '60_65k': '60-65K €',
    '70_75k': '70-75K €',
  }

  const expLabels: any = {
    non_renseigne: 'Non renseigné',
    '0_2_ans': '0-2 ans',
    '2_4_ans': '2-4 ans',
    '4_7_ans': '4-7 ans',
    '7_10_ans': '7-10 ans',
    plus_10_ans: '+ 10 ans',
  }

  const sectLabels: any = {
    autres: 'Autres',
    compta: 'Comptabilité / Gestion',
    rh: 'Ressources Humaines',
    informatique: 'Informatique / SLAM / SISR',
    commerce: 'Commerce / Marketing',
    agro_alimentaire: 'Agro-alimentaire',
    architecture: 'Architecture',
    association_non_lucrative: 'Association non lucrative',
    banque_assurance_finance: 'Banque / Assurance / Finance',
    conseil_audit: 'Conseil / Audit',
    culture_media_divertissement: 'Culture / Média / Divertissement',
    digital_technologie: 'Digital / Technologie',
    grande_distribution_ventes: 'Grande distribution / Ventes',
    droit_ecogestion_science_politique: 'Droit / Éco-gestion / Science Politique',
    enseignement_formation_recrutement: 'Enseignement / Formation / Recrutement',
    entrepreneuriat_startup: 'Entrepreneuriat / Start-up',
    travaux_publics: 'Travaux Publics',
    industrie: 'Industrie',
    publicite_marketing_communication: 'Publicité / Marketing / Communication',
    mode_luxe_beaute: 'Mode / Luxe / Beauté',
    environnement_sante_social: 'Environnement / Santé / Social',
    sciences_recherche: 'Sciences / Recherche',
    secteur_public_administration: 'Secteur public et administration',
    automobile: 'Automobile',
    organisation_internationale: 'Organisation internationale',
    tourisme_hotellerie_restauration: 'Tourisme / Hôtellerie / Restauration',
  }

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

          {/* 📦 COLONNE CENTRALE : FLUX ACTIVITÉ RÉSEAU (POSTS) */}
          <div className="lg:col-span-1 space-y-5">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest pl-1">
              ⚡ Activité du réseau
            </h3>

            {itemsFeed.filter((i) => i.typeItem === 'post').length > 0 ? (
              itemsFeed
                .filter((i) => i.typeItem === 'post')
                .map((item: any) => {
                  const dateText = new Date(item.createdAt).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })

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
          </div>
        </div>
      </section>

      {/* 💼 SECTION 3 : VITRINE EXTRAITE - ILS RECRUTENT DANS LA COMMUNAUTÉ */}
      <section className="bg-gray-50 border-t border-b border-gray-100 py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-xl font-black text-gray-800 uppercase tracking-widest relative inline-block after:content-[''] after:block after:w-16 after:h-[3px] after:bg-emerald-500 after:mx-auto after:mt-2">
              Ils recrutent dans la communauté
            </h2>
          </div>

          <div className="flex flex-col lg:flex-row items-center gap-12">
            {/* Côté Gauche : Illustration & Boutons */}
            <div className="lg:w-2/5 flex flex-col items-center text-center space-y-6">
              <div className="w-full max-w-sm">
                <img
                  src="https://www.prepad1.fr/wp-content/uploads/2020/04/logo-ENC-Bessi%C3%A8res-scaled-e1586368642978.jpg"
                  alt="Illustration Recrutement"
                  className="w-full h-auto rounded-3xl object-cover shadow-2xs"
                />
              </div>
              <div className="flex flex-col sm:flex-row lg:flex-col gap-3 w-full max-w-xs font-black uppercase text-[10px] tracking-widest">
                <Link
                  href="/jobs"
                  className="w-full text-center py-3 bg-[#4c0519] hover:bg-[#3b0413] text-white rounded-xl shadow-xs transition-colors"
                >
                  Toutes les offres d'emploi
                </Link>
                <Link
                  href="/jobs/new"
                  className="w-full text-center py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1"
                >
                  <span className="text-xs">＋</span> Poster une offre
                </Link>
              </div>
            </div>

            {/* Côté Droit : Liste des cartes d'offres horizontales */}
            <div className="lg:w-3/5 w-full space-y-4">
              {offresRes.docs.length > 0 ? (
                offresRes.docs.map((offre: any) => {
                  const cleanDate = new Date(offre.createdAt).toLocaleDateString('fr-FR')
                  const dateLimiteText = offre.dateLimite
                    ? new Date(offre.dateLimite).toLocaleDateString('fr-FR')
                    : '-'
                  const dateDebutText = offre.dateDebut
                    ? new Date(offre.dateDebut).toLocaleDateString('fr-FR')
                    : 'Dès que possible'
                  const logoUrl =
                    offre.logo && typeof offre.logo === 'object' ? offre.logo.url : null

                  return (
                    <div
                      key={offre.id}
                      className="bg-white border border-gray-200 rounded-2xl p-5 shadow-2xs hover:shadow-xs hover:border-gray-300 transition-all flex flex-col justify-between relative group"
                    >
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex items-center gap-4">
                          {/* 🔄 AJOUT & CORRECTION : Logo agrandi à w-16 h-16 pour une meilleure lisibilité */}
                          {logoUrl ? (
                            <img
                              src={logoUrl}
                              alt=""
                              className="w-16 h-16 rounded-2xl border border-gray-100 object-contain bg-white p-1 shadow-3xs"
                            />
                          ) : (
                            <div className="w-16 h-16 bg-gray-50 border border-gray-100 text-gray-400 rounded-2xl flex items-center justify-center text-2xl shadow-3xs">
                              🏢
                            </div>
                          )}
                          <div>
                            <h3 className="font-black text-gray-900 text-sm group-hover:text-emerald-600 transition-colors leading-tight">
                              {offre.poste}
                            </h3>
                            <p className="text-[10px] font-bold text-gray-400 uppercase mt-0.5">
                              <span className="text-gray-700 font-black">{offre.entreprise}</span> •
                              📍 {offre.localisation}
                            </p>
                          </div>
                        </div>
                        <span className="text-[9px] font-black text-gray-400 tracking-wide">
                          {cleanDate}
                        </span>
                      </div>

                      {/* Corps central de la carte conforme à la maquette */}
                      <div className="mt-4 flex items-center justify-between bg-gray-50/50 border border-gray-100 rounded-xl p-3 text-[11px] font-medium text-gray-500">
                        <div className="space-y-0.5">
                          <p>
                            Contrat :{' '}
                            <span className="text-emerald-600 font-black uppercase">
                              {offre.typeContrat}
                            </span>
                          </p>
                          <p>
                            Date de début :{' '}
                            <span className="text-gray-700 font-bold">{dateDebutText}</span>
                          </p>
                          <p>
                            Expérience :{' '}
                            <span className="text-gray-700 font-bold">
                              {expLabels[offre.experience] || 'Non renseigné'}
                            </span>
                          </p>
                          <p>
                            Date limite de candidature :{' '}
                            <span className="text-gray-700 font-bold">{dateLimiteText}</span>
                          </p>
                        </div>
                        <div className="w-9 h-9 bg-white border border-gray-100 rounded-xl flex items-center justify-center text-base shadow-3xs text-gray-400">
                          💼
                        </div>
                      </div>

                      {/* Footer de l'offre */}
                      <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between items-center text-[9px] font-black uppercase tracking-widest">
                        <span className="text-gray-400">
                          Rémunération :{' '}
                          <span className="text-gray-600">
                            {remLabels[offre.remuneration] || offre.remuneration || 'NC'}
                          </span>
                        </span>
                        <Link
                          href={`/jobs/${offre.id}`}
                          className="text-emerald-500 hover:text-emerald-600 font-black flex items-center gap-0.5"
                        >
                          Voir la fiche ➔
                        </Link>
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="text-center py-10 bg-white border border-gray-200 rounded-2xl text-xs font-bold text-gray-400 italic">
                  Aucune offre d'emploi ou de stage publiée pour le moment.
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 🤝 SECTION 4 : PRÉSENTATION DU MENTORAT */}
      <section className="py-16 bg-white">
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
                href="/mentoring"
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
