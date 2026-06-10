// app/blog/[slug]/page.tsx
import React from 'react'
import Link from 'next/link'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

const CAT_LABELS: Record<string, string> = {
  vie_etablissement: "Vie de l'établissement",
  portraits_anciens: "Portraits d'anciens",
  international:     'International',
  evenements:        'Événements',
  insertion_pro:     'Insertion professionnelle',
  orientation:       'Orientation',
  boite_outils:      'Boîte à outils',
  bons_plans:        'Bons plans',
}

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

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const payload = await getPayload({ config: configPromise })

  const result = await payload.find({
    collection: 'articles',
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 1,
  })

  const article = result.docs[0] as any
  if (!article || article.statut !== 'publie') notFound()

  const coverUrl = article.couverture && typeof article.couverture === 'object'
    ? (article.couverture as any).url : null
  const auteur = article.auteur && typeof article.auteur === 'object' ? article.auteur as any : null
  const pieceJointe = article.pieceJointe && typeof article.pieceJointe === 'object' ? article.pieceJointe as any : null
  const catColor = CAT_COLORS[article.categorie] || 'bg-gray-200 text-gray-700'
  const catLabel = CAT_LABELS[article.categorie] || article.categorie

  return (
    <div className="min-h-screen bg-gray-50/40 font-sans">

      {/* Couverture hero */}
      {coverUrl && (
        <div className="w-full h-64 md:h-80 relative overflow-hidden">
          <img src={coverUrl} alt={article.titre} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-6 left-6 right-6">
            <span className={`inline-block text-[9px] font-black uppercase px-2 py-0.5 rounded-full mb-2 ${catColor}`}>
              {catLabel}
            </span>
            <h1 className="text-2xl md:text-3xl font-black text-white leading-tight">
              {article.titre}
            </h1>
          </div>
        </div>
      )}

      <div className="max-w-3xl mx-auto px-4 py-10 space-y-8">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-gray-400 font-medium">
          <Link href="/blog" className="hover:text-amber-600 transition-colors">Actualités</Link>
          <span>›</span>
          <span className="text-gray-600 truncate">{article.titre}</span>
        </div>

        {/* Titre si pas de couverture */}
        {!coverUrl && (
          <div className="space-y-2">
            <span className={`inline-block text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${catColor}`}>
              {catLabel}
            </span>
            <h1 className="text-2xl md:text-3xl font-black text-gray-900 leading-tight">{article.titre}</h1>
          </div>
        )}

        {/* Meta */}
        <div className="flex items-center gap-4 text-xs text-gray-400 font-medium border-b border-gray-100 pb-6">
          {auteur && (
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-enc/10 text-enc font-black flex items-center justify-center text-[10px] uppercase">
                {auteur.prenom?.[0]}{auteur.nom?.[0]}
              </div>
              <span className="font-bold text-gray-600">{auteur.prenom} {auteur.nom}</span>
            </div>
          )}
          <span>
            {new Date(article.createdAt).toLocaleDateString('fr-FR', {
              day: 'numeric', month: 'long', year: 'numeric'
            })}
          </span>
        </div>

        {/* Description */}
        <p className="text-base text-gray-600 leading-relaxed font-medium italic border-l-4 border-amber-400 pl-4">
          {article.description}
        </p>

        {/* Contenu HTML */}
        <div
          className="prose prose-sm max-w-none text-gray-700 leading-relaxed
            prose-headings:font-black prose-headings:text-gray-900
            prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg
            prose-p:my-3 prose-li:my-1
            prose-strong:font-black prose-strong:text-gray-900
            prose-a:text-blue-600 prose-a:underline
            prose-blockquote:border-l-4 prose-blockquote:border-amber-400 prose-blockquote:pl-4 prose-blockquote:italic"
          dangerouslySetInnerHTML={{ __html: String(article.contenu || '') }}
        />

        {/* Pièce jointe */}
        {pieceJointe && (
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📎</span>
              <div>
                <p className="text-xs font-black text-blue-900 uppercase tracking-wide">Pièce jointe</p>
                <p className="text-xs text-blue-600 font-medium mt-0.5">{pieceJointe.filename || 'Document'}</p>
              </div>
            </div>
            <a href={pieceJointe.url} target="_blank" rel="noreferrer" download
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black uppercase rounded-xl transition-colors shadow-sm">
              Télécharger
            </a>
          </div>
        )}

        {/* Retour */}
        <div className="pt-6 border-t border-gray-100">
          <Link href="/blog"
            className="inline-flex items-center gap-2 text-xs font-black text-gray-500 hover:text-amber-600 uppercase tracking-wide transition-colors">
            ← Retour aux actualités
          </Link>
        </div>
      </div>
    </div>
  )
}
