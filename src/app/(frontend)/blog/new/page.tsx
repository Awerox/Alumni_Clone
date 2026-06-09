// app/blog/new/page.tsx
'use client'
import React, { useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

// ─── Catégories — copie de Articles.ts pour le frontend ───────────────────
// ✅ Quand tu ajoutes une catégorie dans Articles.ts, ajoute-la ici aussi
const CATEGORIES = [
  { label: "Vie de l'établissement", value: 'vie_etablissement' },
  { label: "Portraits d'anciens",    value: 'portraits_anciens' },
  { label: 'International',          value: 'international' },
  { label: 'Événements',             value: 'evenements' },
  { label: 'Insertion professionnelle', value: 'insertion_pro' },
  { label: 'Orientation',            value: 'orientation' },
  { label: 'Boîte à outils',         value: 'boite_outils' },
  { label: 'Bons plans',             value: 'bons_plans' },
]

function toSlug(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
}

export default function NewArticlePage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)

  const [form, setForm] = useState({
    titre: '',
    slug: '',
    description: '',
    contenu: '',
    categorie: 'vie_etablissement',
  })

  const handleTitreChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const titre = e.target.value
    setForm(prev => ({ ...prev, titre, slug: toSlug(titre) }))
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 8 * 1024 * 1024) { setError('Image trop lourde (max 8 Mo)'); return }
    if (!file.type.startsWith('image/')) { setError('Seules les images sont acceptées'); return }
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
    setError('')
  }

  const handleSubmit = async (statut: 'publie' | 'brouillon' | 'attente') => {
    setError('')

    if (!form.titre.trim()) return setError('Le titre est obligatoire.')
    if (!form.description.trim()) return setError('La description est obligatoire.')
    if (!form.contenu.trim()) return setError('Le contenu est obligatoire.')
    if (!imageFile) return setError('La photo de couverture est obligatoire.')

    setLoading(true)

    try {
      // 1. Upload image
      setUploadingImage(true)
      const mediaForm = new FormData()
      mediaForm.append('file', imageFile)
      mediaForm.append('alt', `Couverture : ${form.titre}`)
      const mediaRes = await fetch('/api/media', { method: 'POST', body: mediaForm, credentials: 'include' })
      const mediaData = await mediaRes.json()
      if (!mediaRes.ok) throw new Error(mediaData?.errors?.[0]?.message || "Échec upload image")
      const couvertureId = mediaData?.doc?.id
      if (!couvertureId) throw new Error("ID image introuvable après upload")
      setUploadingImage(false)

      // 2. Contenu RichText Lexical minimal valide
      const richTextContent = {
        root: {
          type: 'root',
          children: form.contenu.split('\n\n').filter(Boolean).map(para => ({
            type: 'paragraph',
            version: 1,
            children: [{ type: 'text', text: para.trim(), version: 1 }],
          })),
          direction: 'ltr',
          format: '',
          indent: 0,
          version: 1,
        },
      }

      // 3. Créer l'article
      const res = await fetch('/api/articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          titre: form.titre.trim(),
          slug: form.slug.trim(),
          description: form.description.trim(),
          contenu: richTextContent,
          categorie: form.categorie,
          statut,
          couverture: couvertureId,
        }),
      })

      const data = await res.json()
      if (res.ok) {
        router.push('/blog')
      } else {
        throw new Error(data.error || 'Erreur lors de la création')
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
      setUploadingImage(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50/50 py-10 px-4 font-sans">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/blog" className="text-gray-400 hover:text-gray-700 transition-colors">
            ← Retour
          </Link>
          <div>
            <h1 className="text-xl font-black text-gray-900 tracking-tight">Nouvel article</h1>
            <p className="text-xs text-gray-400 mt-0.5">Rédigez et publiez un article pour la communauté</p>
          </div>
        </div>

        {/* Erreur */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs font-bold text-red-700 flex items-start gap-2">
            <span className="shrink-0">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Formulaire */}
        <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm space-y-6">

          {/* Titre */}
          <div>
            <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-1.5">
              Titre de l'article *
            </label>
            <input
              type="text"
              value={form.titre}
              onChange={handleTitreChange}
              placeholder="Ex : Journée portes ouvertes 2026"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none text-sm font-medium text-gray-800 focus:border-amber-400 transition-colors"
            />
          </div>

          {/* Slug */}
          <div>
            <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-1.5">
              URL (slug) — généré automatiquement
            </label>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 font-medium shrink-0">/blog/</span>
              <input
                type="text"
                value={form.slug}
                onChange={(e) => setForm(prev => ({ ...prev, slug: e.target.value }))}
                className="flex-1 px-4 py-3 border border-gray-200 rounded-xl outline-none text-sm font-mono text-gray-500 bg-gray-50 focus:border-amber-400 transition-colors"
              />
            </div>
          </div>

          {/* Catégorie */}
          <div>
            <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-1.5">
              Catégorie *
            </label>
            <select
              value={form.categorie}
              onChange={(e) => setForm(prev => ({ ...prev, categorie: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none text-sm font-medium text-gray-700 bg-white focus:border-amber-400 transition-colors"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-1.5">
              Description courte * <span className="text-gray-300 font-normal normal-case">(affichée sur la carte)</span>
            </label>
            <textarea
              rows={2}
              value={form.description}
              onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Courte accroche visible sur la carte de l'article..."
              className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none text-sm font-medium text-gray-800 resize-none focus:border-amber-400 transition-colors"
            />
          </div>

          {/* Contenu */}
          <div>
            <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-1.5">
              Contenu de l'article * <span className="text-gray-300 font-normal normal-case">(sauter une ligne = nouveau paragraphe)</span>
            </label>
            <textarea
              rows={10}
              value={form.contenu}
              onChange={(e) => setForm(prev => ({ ...prev, contenu: e.target.value }))}
              placeholder="Rédigez le contenu de votre article ici...&#10;&#10;Sautez une ligne pour créer un nouveau paragraphe."
              className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none text-sm font-medium text-gray-800 resize-y focus:border-amber-400 transition-colors leading-relaxed"
            />
          </div>

          {/* Photo de couverture */}
          <div>
            <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-1.5">
              Photo de couverture *
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageSelect}
            />
            {imagePreview ? (
              <div className="relative group">
                <img src={imagePreview} alt="Aperçu" className="w-full h-48 object-cover rounded-2xl border border-gray-200" />
                <div className="absolute inset-0 bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button
                    type="button"
                    onClick={() => { setImageFile(null); setImagePreview(null); if (fileInputRef.current) fileInputRef.current.value = '' }}
                    className="px-4 py-2 bg-white text-gray-800 text-xs font-black uppercase rounded-xl"
                  >
                    Changer la photo
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-40 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center gap-2 hover:border-amber-400 hover:bg-amber-50/30 transition-all group"
              >
                <span className="text-3xl group-hover:scale-110 transition-transform">🖼️</span>
                <span className="text-xs font-bold text-gray-400 group-hover:text-amber-600">Cliquer pour importer une image</span>
                <span className="text-[10px] text-gray-300">JPG, PNG, WebP — max 8 Mo</span>
              </button>
            )}
          </div>
        </div>

        {/* Boutons d'action */}
        <div className="flex flex-col sm:flex-row gap-3 pb-8">
          <button
            type="button"
            disabled={loading}
            onClick={() => handleSubmit('brouillon')}
            className="flex-1 py-3 bg-white border border-gray-200 hover:border-gray-400 text-gray-600 font-black text-xs uppercase rounded-2xl transition-all disabled:opacity-50"
          >
            Enregistrer en brouillon
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={() => handleSubmit('attente')}
            className="flex-1 py-3 bg-blue-50 border border-blue-200 hover:bg-blue-100 text-blue-700 font-black text-xs uppercase rounded-2xl transition-all disabled:opacity-50"
          >
            Soumettre à validation
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={() => handleSubmit('publie')}
            className="flex-1 py-3.5 bg-amber-500 hover:bg-amber-600 text-white font-black text-xs uppercase rounded-2xl transition-all shadow-md disabled:opacity-50"
          >
            {uploadingImage ? 'Upload image...' : loading ? 'Publication...' : '✓ Publier maintenant'}
          </button>
        </div>
      </div>
    </div>
  )
}
