// app/page.tsx
import React from 'react'
import Link from 'next/link'
import { getAuthUser } from '@/lib/auth'
import HeroSlider from '@/components/HeroSlider'
import PublishBox from '@/components/PublishBox'
import ActivityFeed from '@/components/ActivityFeed'
import {
  FadeUp, FadeLeft, FadeRight,
  StaggerContainer, StaggerItem,
  AnimatedTitle,
} from '@/components/AnimatedSection'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const { user, payload } = await getAuthUser()

  const [recentAlumni, postsRes, offresRes, articlesRes] = await Promise.all([
    payload.find({ collection: 'alumni', sort: '-createdAt', limit: 6, depth: 1 }),
    payload.find({ collection: 'posts', limit: 30, sort: '-createdAt', depth: 1 }),
    payload.find({ collection: 'offres', where: { statut: { equals: 'publie' } }, limit: 3, sort: '-createdAt' }),
    payload.find({ collection: 'articles', where: { statut: { equals: 'publie' } }, limit: 10, sort: '-createdAt' }),
  ])

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

  const remLabels: any = {
    non_renseigne: 'Non renseigné', stage_non_indemnise: 'Stage non-indemnisé',
    stage_indemnise: 'Stage indemnisé', moins_15k: '< 15k €',
    '20_225k': '20-22,5K €', '25_275k': '25-27,5K €', '30_325k': '30-32,5K €',
    '35-37,5K €': '35-37,5K €', '40_45k': '40-45K €', '45_50k': '45-50K €',
    '50_55k': '50-55K €', '60_65k': '60-65K €', '70_75k': '70-75K €',
  }

  const expLabels: any = {
    non_renseigne: 'Non renseigné', '0_2_ans': '0-2 ans', '2_4_ans': '2-4 ans',
    '4_7_ans': '4-7 ans', '7_10_ans': '7-10 ans', plus_10_ans: '+ 10 ans',
  }

  return (
    <div className="bg-gray-50/40 min-h-screen font-sans text-left">

      {/* ── SECTION 1 : HERO ─────────────────────────────────────────────── */}
      <section className="bg-white border-b border-gray-100 py-12 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center gap-12">
          {/* Texte — animé depuis la gauche */}
          <FadeLeft className="md:w-1/2 space-y-6">
            <h1 className="text-4xl font-black text-enc leading-tight tracking-tight">Bonjour !</h1>
            <p className="text-gray-600 text-base leading-relaxed font-medium">
              Anciens, étudiants, enseignants, recruteurs, la communauté alumni de l'ENC Bessières
              est ravie de vous (re)voir sur cet outil dédié à votre mise en relation et au partage d'opportunités.
            </p>
            <Link href="/about"
              className="inline-block bg-enc text-white px-8 py-3 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-opacity-90 transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5 duration-200">
              En savoir plus
            </Link>
          </FadeLeft>
          {/* Slider — PAS de wrapper, il a déjà md:w-1/2 en interne */}
          <HeroSlider />
        </div>
      </section>

            {/* ── SECTION 2 : FEED ─────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

          {/* Colonne gauche : publish + blog — sticky */}
          <div className="space-y-6 lg:sticky lg:top-6">
            <FadeUp delay={0}>
              {user ? (
                <PublishBox userPrenom={user.prenom || ''} userNom={user.nom || ''} />
              ) : (
                <div className="bg-white border border-gray-200 p-5 rounded-3xl text-center text-xs font-bold text-gray-500 shadow-2xs">
                  🔑{' '}
                  <Link href="/login" className="text-purple-600 underline">Connectez-vous</Link>{' '}
                  pour publier un message sur le feed.
                </div>
              )}
            </FadeUp>

            <div className="space-y-4">
              <FadeUp delay={0.05}>
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">📰 À la une du blog</h3>
                  <Link href="/blog" className="text-[10px] font-black text-purple-500 hover:text-purple-700 uppercase tracking-wide transition-colors">Voir tout →</Link>
                </div>
              </FadeUp>

              <StaggerContainer className="space-y-4" staggerDelay={0.1}>
                {itemsFeed.filter((i: any) => i.typeItem === 'article').slice(0, 2).map((article: any) => {
                  const coverUrl = article.couverture && typeof article.couverture === 'object' ? article.couverture.url : null
                  return (
                    <StaggerItem key={article.id}>
                      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-2xs group flex flex-col justify-between hover:border-amber-200 hover:shadow-md transition-all duration-300">
                        <div>
                          <div className="h-36 bg-gray-100 relative overflow-hidden border-b border-gray-100">
                            {coverUrl
                              ? <img src={coverUrl} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                              : <div className="w-full h-full flex items-center justify-center text-3xl text-gray-200">📰</div>
                            }
                            <span className="absolute bottom-2 left-2 bg-amber-400 text-gray-900 font-bold text-[8px] uppercase tracking-wider px-2 py-0.5 rounded-md shadow-sm">
                              {catLabels[article.categorie] || article.categorie}
                            </span>
                          </div>
                          <div className="p-4 space-y-1.5">
                            <h4 className="font-black text-gray-900 text-xs leading-tight tracking-tight line-clamp-2">{article.titre}</h4>
                            <p className="text-[11px] font-medium text-gray-400 line-clamp-2 leading-relaxed">{article.description}</p>
                          </div>
                        </div>
                        <div className="px-4 pb-4">
                          <Link href={`/blog/${article.slug}`}
                            className="block text-center py-2 bg-amber-50 hover:bg-amber-400 hover:text-white text-amber-700 font-black text-[10px] uppercase tracking-widest rounded-xl transition-all border border-amber-200 hover:border-amber-400 duration-200">
                            Lire la suite →
                          </Link>
                        </div>
                      </div>
                    </StaggerItem>
                  )
                })}
              </StaggerContainer>
            </div>
          </div>

          {/* Colonne centrale : activité réseau — scrollable */}
          <FadeUp delay={0.1} className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">⚡ Activité du réseau</h3>
              <Link href="/feed" className="text-[10px] font-black text-purple-500 hover:text-purple-700 uppercase tracking-wide transition-colors">Voir tout →</Link>
            </div>
            <ActivityFeed items={itemsFeed.filter((i: any) => i.typeItem === 'post')} />
          </FadeUp>

          {/* Colonne droite : nouveaux membres — sticky */}
          <div className="space-y-4 lg:sticky lg:top-6">
            <FadeUp delay={0.15}>
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">✨ Nouveaux membres</h3>
                <Link href="/directory" className="text-[10px] font-black text-purple-500 hover:text-purple-700 uppercase tracking-wide transition-colors">Annuaire →</Link>
              </div>
            </FadeUp>

            <StaggerContainer className="space-y-3" staggerDelay={0.07}>
              {recentAlumni.docs.map((alumnus: any) => {
                const photoUrl = alumnus.photo && typeof alumnus.photo === 'object' ? alumnus.photo.url : null
                const avatarFallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(alumnus.prenom)}+${encodeURIComponent(alumnus.nom)}&size=80&background=800020&color=fff`
                return (
                  <StaggerItem key={alumnus.id}>
                    <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-2xs hover:shadow-md hover:border-purple-200 transition-all duration-300 group hover:-translate-y-0.5">
                      <div className="flex items-start gap-3">
                        <div className="w-11 h-11 shrink-0 rounded-xl overflow-hidden border-2 border-white shadow-sm">
                          <img src={photoUrl || avatarFallback} alt={`${alumnus.prenom} ${alumnus.nom}`}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                        </div>
                        <div className="flex-1 min-w-0 space-y-0.5">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h4 className="font-black text-gray-900 text-xs uppercase leading-tight group-hover:text-purple-700 transition-colors truncate">
                              {alumnus.prenom} {alumnus.nom}
                            </h4>
                            {alumnus.isMentor && (
                              <span className="inline-flex items-center gap-0.5 bg-amber-400 text-white text-[7px] font-black uppercase px-1.5 py-0.5 rounded-full shrink-0">
                                ⭐ Mentor
                              </span>
                            )}
                          </div>
                          <p className="text-[9px] font-black text-gray-400 uppercase tracking-wider">
                            Promo {alumnus.promotion || 'NC'} · {alumnus.statut === 'alumni' ? 'Alumni' : 'Étudiant'}
                          </p>
                          {(alumnus.poste || alumnus.entreprise) && (
                            <p className="text-[10px] font-semibold text-gray-600 truncate">
                              {alumnus.poste}{alumnus.entreprise ? ` · ${alumnus.entreprise}` : ''}
                            </p>
                          )}
                          {alumnus.ville && (
                            <p className="text-[9px] text-gray-400 font-medium">
                              <span className="text-enc">📍</span> {alumnus.ville}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-gray-50">
                        <Link href={`/profile/${alumnus.id}`}
                          className="block text-center py-1.5 bg-gray-50 hover:bg-purple-600 hover:text-white text-gray-500 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all duration-200 border border-gray-100 hover:border-purple-600">
                          Voir le profil →
                        </Link>
                      </div>
                    </div>
                  </StaggerItem>
                )
              })}
            </StaggerContainer>

            <FadeUp delay={0.3}>
              <Link href="/directory"
                className="block text-center py-3 bg-white border border-gray-200 hover:border-purple-300 hover:bg-purple-50 text-gray-500 hover:text-purple-700 text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all duration-200 shadow-2xs">
                Voir tous les membres →
              </Link>
            </FadeUp>
          </div>
        </div>
      </section>

      {/* ── SECTION 3 : ILS RECRUTENT ────────────────────────────────────── */}
      <section className="bg-gray-50 border-t border-b border-gray-100 py-16 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4">
          <AnimatedTitle className="text-center mb-10">
            <h2 className="text-xl font-black text-gray-800 uppercase tracking-widest relative inline-block after:content-[''] after:block after:w-16 after:h-[3px] after:bg-emerald-500 after:mx-auto after:mt-2">
              Ils recrutent dans la communauté
            </h2>
          </AnimatedTitle>

          <div className="flex flex-col lg:flex-row items-center gap-12">
            <FadeLeft className="lg:w-2/5 flex flex-col items-center text-center space-y-6" delay={0.05}>
              <div className="w-full max-w-sm">
                <img src="https://www.enc-bessieres.org/wp-content/uploads/2025/01/cropped-enc5122_ico.jpg" alt="ENC Bessières"
                  className="w-full h-auto rounded-3xl object-cover shadow-2xs hover:shadow-lg transition-shadow duration-300" />
              </div>
              <div className="flex flex-col sm:flex-row lg:flex-col gap-3 w-full max-w-xs font-black uppercase text-[10px] tracking-widest">
                <Link href="/jobs" className="w-full text-center py-3 bg-[#4c0519] hover:bg-[#3b0413] text-white rounded-xl shadow-xs transition-all hover:-translate-y-0.5 duration-200">
                  Toutes les offres d'emploi
                </Link>
                <Link href="/jobs/new" className="w-full text-center py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl shadow-xs transition-all hover:-translate-y-0.5 duration-200 flex items-center justify-center gap-1">
                  <span className="text-xs">＋</span> Poster une offre
                </Link>
              </div>
            </FadeLeft>

            <StaggerContainer className="lg:w-3/5 w-full space-y-4" staggerDelay={0.1}>
              {offresRes.docs.length > 0 ? offresRes.docs.map((offre: any) => {
                const cleanDate = new Date(offre.createdAt).toLocaleDateString('fr-FR')
                const dateLimiteText = offre.dateLimite ? new Date(offre.dateLimite).toLocaleDateString('fr-FR') : '-'
                const dateDebutText = offre.dateDebut ? new Date(offre.dateDebut).toLocaleDateString('fr-FR') : 'Dès que possible'
                const logoUrl = offre.logo && typeof offre.logo === 'object' ? offre.logo.url : null
                return (
                  <StaggerItem key={offre.id}>
                    <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-2xs hover:shadow-md hover:border-emerald-200 hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between relative group">
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex items-center gap-4">
                          {logoUrl
                            ? <img src={logoUrl} alt="" className="w-16 h-16 rounded-2xl border border-gray-100 object-contain bg-white p-1 shadow-3xs" />
                            : <div className="w-16 h-16 bg-gray-50 border border-gray-100 text-gray-400 rounded-2xl flex items-center justify-center text-2xl shadow-3xs">🏢</div>
                          }
                          <div>
                            <h3 className="font-black text-gray-900 text-sm group-hover:text-emerald-600 transition-colors leading-tight">{offre.poste}</h3>
                            <p className="text-[10px] font-bold text-gray-400 uppercase mt-0.5">
                              <span className="text-gray-700 font-black">{offre.entreprise}</span> • 📍 {offre.localisation}
                            </p>
                          </div>
                        </div>
                        <span className="text-[9px] font-black text-gray-400 tracking-wide">{cleanDate}</span>
                      </div>
                      <div className="mt-4 flex items-center justify-between bg-gray-50/50 border border-gray-100 rounded-xl p-3 text-[11px] font-medium text-gray-500">
                        <div className="space-y-0.5">
                          <p>Contrat : <span className="text-emerald-600 font-black uppercase">{offre.typeContrat}</span></p>
                          <p>Date de début : <span className="text-gray-700 font-bold">{dateDebutText}</span></p>
                          <p>Expérience : <span className="text-gray-700 font-bold">{expLabels[offre.experience] || 'Non renseigné'}</span></p>
                          <p>Date limite : <span className="text-gray-700 font-bold">{dateLimiteText}</span></p>
                        </div>
                        <div className="w-9 h-9 bg-white border border-gray-100 rounded-xl flex items-center justify-center text-base shadow-3xs text-gray-400">💼</div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between items-center text-[9px] font-black uppercase tracking-widest">
                        <span className="text-gray-400">Rémunération : <span className="text-gray-600">{remLabels[offre.remuneration] || offre.remuneration || 'NC'}</span></span>
                        <Link href={`/jobs/${offre.id}`} className="text-emerald-500 hover:text-emerald-600 font-black flex items-center gap-0.5 transition-colors">Voir la fiche ➔</Link>
                      </div>
                    </div>
                  </StaggerItem>
                )
              }) : (
                <div className="text-center py-10 bg-white border border-gray-200 rounded-2xl text-xs font-bold text-gray-400 italic">Aucune offre publiée pour le moment.</div>
              )}
            </StaggerContainer>
          </div>
        </div>
      </section>

      {/* ── SECTION 4 : MENTORAT ─────────────────────────────────────────── */}
      <section className="py-16 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4">
          <FadeUp className="flex items-center gap-4 mb-12">
            <div className="h-[1px] bg-enc flex-grow opacity-20"></div>
            <h2 className="text-xl font-black text-gray-800 whitespace-nowrap uppercase tracking-widest">
              Ils transmettent leur <span className="text-enc">expérience</span>
            </h2>
            <div className="h-[1px] bg-enc flex-grow opacity-20"></div>
          </FadeUp>

          <div className="flex flex-col md:flex-row items-center gap-12">
            <FadeLeft className="md:w-1/3 space-y-6" delay={0.05}>
              <div className="space-y-4">
                <h3 className="text-lg font-black text-gray-900">Qu'est-ce que le mentorat ?</h3>
                <p className="text-gray-500 leading-relaxed text-xs font-medium">Le mentorat est une initiative bénévole qui permet à chaque utilisateur de transmettre son expérience terrain et d'accompagner un camarade.</p>
                <p className="text-gray-500 leading-relaxed text-xs font-medium">Les mentors sont identifiables grâce au <strong className="text-enc">badge MENTOR</strong> et peuvent être sollicités depuis l'onglet Mentorat.</p>
                <p className="text-gray-500 leading-relaxed text-xs font-medium">Une bonne relation nécessite au moins <strong>une rencontre par mois</strong> sur une période de <strong>six mois</strong>.</p>
                <p className="text-enc font-black italic pt-2 tracking-wide text-base">À vous de jouer !</p>
              </div>
              <Link href="/mentoring"
                className="inline-block bg-enc text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-[#6b001a] transition-all duration-200 shadow-sm hover:shadow-md hover:-translate-y-0.5">
                Charte du mentorat
              </Link>
            </FadeLeft>

            <FadeRight className="md:w-2/3 w-full" delay={0.1}>
              <img src="https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&q=80&w=1000" alt="Mentorat"
                className="w-full h-64 md:h-80 object-cover rounded-3xl shadow-md hover:shadow-xl hover:scale-[1.01] transition-all duration-500" />
            </FadeRight>
          </div>
        </div>
      </section>
    </div>
  )
}
