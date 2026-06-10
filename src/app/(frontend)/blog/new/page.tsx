// app/blog/new/page.tsx
'use client'
import React, { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import dynamic from 'next/dynamic'

// Import dynamique pour éviter SSR issues avec Tiptap
const RichEditor = dynamic(() => import('@/components/RichEditor'), { ssr: false })

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
  return str.toLowerCase().normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
}

// Date locale au format datetime-local input
function toDatetimeLocalValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export default function NewArticlePage() {
  const router = useRouter()
  const coverInputRef = useRef<HTMLInputElement>(null)
  const attachInputRef = useRef<HTMLInputElement>(null)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Couverture
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)

  // Pièce jointe
  const [attachFile, setAttachFile] = useState<File | null>(null)
  const [attachName, setAttachName] = useState<string | null>(null)

  // Publication planifiée
  const [scheduledDate, setScheduledDate] = useState<string>('')

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

  const handleCoverSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 8 * 1024 * 1024) { setError('Image trop lourde (max 8 Mo)'); return }
    setCoverFile(file)
    setCoverPreview(URL.createObjectURL(file))
    setError('')
  }

  const handleAttachSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 20 * 1024 * 1024) { setError('Fichier trop lourd (max 20 Mo)'); return }
    setAttachFile(file)
    setAttachName(file.name)
    setError('')
  }

  const uploadFile = async (file: File, alt: string): Promise<number> => {
    const fd = new FormData()
    fd.append('file', file)
    fd.append('alt', alt)
    const res = await fetch('/api/media', { method: 'POST', body: fd, credentials: 'include' })
    const data = await res.json()
    if (!res.ok) throw new Error(data?.errors?.[0]?.message || 'Échec upload')
    const id = data?.doc?.id
    if (!id) throw new Error('ID fichier introuvable')
    return Number(id)
  }

  const handleSubmit = async (statut: 'publie' | 'brouillon' | 'planifie') => {
    setError('')

    if (!form.titre.trim()) return setError('Le titre est obligatoire.')
    if (!form.description.trim()) return setError('La description est obligatoire.')
    if (!form.contenu || form.contenu === '<p></p>') return setError('Le contenu est obligatoire.')
    if (!coverFile) return setError('La photo de couverture est obligatoire.')
    if (statut === 'planifie' && !scheduledDate) return setError('Choisissez une date de publication.')
    if (statut === 'planifie' && new Date(scheduledDate) <= new Date()) {
      return setError('La date de publication doit être dans le futur.')
    }

    setLoading(true)
    try {
      // Upload couverture
      const couvertureId = await uploadFile(coverFile, `Couverture : ${form.titre}`)

      // Upload pièce jointe (optionnel)
      let pieceJointeId: number | null = null
      if (attachFile) {
        pieceJointeId = await uploadFile(attachFile, `PJ : ${form.titre}`)
      }

      // Créer l'article
      const body: any = {
        titre:       form.titre.trim(),
        slug:        form.slug.trim(),
        description: form.description.trim(),
        contenu:     form.contenu,
        categorie:   form.categorie,
        statut,
        couverture:  couvertureId,
      }
      if (pieceJointeId) body.pieceJointe = pieceJointeId
      if (statut === 'planifie' && scheduledDate) body.datePublication = new Date(scheduledDate).toISOString()

      const res = await fetch('/api/articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
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
    }
  }

  // Date min = maintenant + 5 min
  const minDate = toDatetimeLocalValue(new Date(Date.now() + 5 * 60 * 1000))

  return (
    <div className="min-h-screen bg-gray-50/50 py-10 px-4 font-sans">
      <div className="max-w-3xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/blog" className="text-gray-400 hover:text-gray-700 transition-colors text-sm">
            ← Retour
          </Link>
          <div>
            <h1 className="text-xl font-black text-gray-900 tracking-tight">Nouvel article</h1>
            <p className="text-xs text-gray-400 mt-0.5">Rédigez et publiez un article pour la communauté</p>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs font-bold text-red-700 flex items-start gap-2">
            <span>⚠️</span><span>{error}</span>
          </div>
        )}

        <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm space-y-7">

          {/* Titre */}
          <div>
            <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-1.5">Titre *</label>
            <input type="text" value={form.titre} onChange={handleTitreChange}
              placeholder="Ex : Journée portes ouvertes 2026"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none text-sm font-medium text-gray-800 focus:border-amber-400 transition-colors" />
          </div>

          {/* Slug */}
          <div>
            <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-1.5">
              URL — <span className="font-normal normal-case text-gray-300">généré automatiquement, modifiable</span>
            </label>
            <div className="flex items-center gap-2 border border-gray-200 rounded-xl overflow-hidden focus-within:border-amber-400 transition-colors">
              <span className="px-3 text-xs text-gray-400 font-medium bg-gray-50 border-r border-gray-200 py-3 shrink-0">/blog/</span>
              <input type="text" value={form.slug}
                onChange={(e) => setForm(prev => ({ ...prev, slug: e.target.value }))}
                className="flex-1 px-3 py-3 outline-none text-xs font-mono text-gray-500 bg-white" />
            </div>
          </div>

          {/* Catégorie + Description */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-1.5">Catégorie *</label>
              <select value={form.categorie} onChange={(e) => setForm(prev => ({ ...prev, categorie: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none text-sm font-medium text-gray-700 bg-white focus:border-amber-400 transition-colors">
                {CATEGORIES.map(cat => <option key={cat.value} value={cat.value}>{cat.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-1.5">
                Description courte * <span className="font-normal normal-case text-gray-300">(carte)</span>
              </label>
              <textarea rows={3} value={form.description}
                onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Accroche affichée sur la carte..."
                className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none text-xs font-medium text-gray-800 resize-none focus:border-amber-400 transition-colors" />
            </div>
          </div>

          {/* Éditeur rich text */}
          <div>
            <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-1.5">
              Contenu de l'article *
            </label>
            <RichEditor
              value={form.contenu}
              onChange={(html) => setForm(prev => ({ ...prev, contenu: html }))}
              placeholder="Rédigez le contenu de votre article ici..."
            />
          </div>

          {/* Couverture */}
          <div>
            <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-1.5">Photo de couverture *</label>
            <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverSelect} />
            {coverPreview ? (
              <div className="relative group">
                <img src={coverPreview} alt="Aperçu" className="w-full h-48 object-cover rounded-2xl border border-gray-200" />
                <div className="absolute inset-0 bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button type="button"
                    onClick={() => { setCoverFile(null); setCoverPreview(null); if (coverInputRef.current) coverInputRef.current.value = '' }}
                    className="px-4 py-2 bg-white text-gray-800 text-xs font-black uppercase rounded-xl">
                    Changer la photo
                  </button>
                </div>
              </div>
            ) : (
              <button type="button" onClick={() => coverInputRef.current?.click()}
                className="w-full h-36 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center gap-2 hover:border-amber-400 hover:bg-amber-50/30 transition-all group">
                <span className="text-3xl group-hover:scale-110 transition-transform">🖼️</span>
                <span className="text-xs font-bold text-gray-400 group-hover:text-amber-600">Cliquer pour importer</span>
                <span className="text-[10px] text-gray-300">JPG, PNG, WebP — max 8 Mo</span>
              </button>
            )}
          </div>

          {/* Pièce jointe */}
          <div>
            <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-1.5">
              Pièce jointe <span className="font-normal normal-case text-gray-300">(PDF, Word, image… max 20 Mo — optionnel)</span>
            </label>
            <input ref={attachInputRef} type="file" className="hidden"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.png,.jpg,.jpeg,.zip"
              onChange={handleAttachSelect} />
            {attachName ? (
              <div className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-xl">
                <div className="flex items-center gap-2 text-xs font-bold text-gray-700">
                  <span>📎</span><span className="truncate max-w-xs">{attachName}</span>
                </div>
                <button type="button" onClick={() => { setAttachFile(null); setAttachName(null); if (attachInputRef.current) attachInputRef.current.value = '' }}
                  className="text-xs text-red-400 hover:text-red-600 font-bold">✕ Retirer</button>
              </div>
            ) : (
              <button type="button" onClick={() => attachInputRef.current?.click()}
                className="w-full py-3 border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center gap-2 hover:border-gray-400 hover:bg-gray-50 transition-all text-xs font-bold text-gray-400 hover:text-gray-600">
                📎 Ajouter une pièce jointe
              </button>
            )}
          </div>

          {/* Publication planifiée */}
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">🗓️</span>
              <div>
                <p className="text-xs font-black text-blue-800 uppercase tracking-wide">Publication planifiée</p>
                <p className="text-[10px] text-blue-600 font-medium mt-0.5">
                  Choisissez une date et heure — l'article sera en brouillon jusqu'à cette date
                </p>
              </div>
            </div>
            <input
              type="datetime-local"
              value={scheduledDate}
              min={minDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              className="w-full px-4 py-2.5 border border-blue-200 rounded-xl outline-none text-sm font-medium text-gray-700 bg-white focus:border-blue-400 transition-colors"
            />
            {scheduledDate && (
              <p className="text-[10px] text-blue-700 font-bold flex items-center gap-1">
                ✅ Publication prévue le {new Date(scheduledDate).toLocaleDateString('fr-FR', {
                  weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
                  hour: '2-digit', minute: '2-digit'
                })}
              </p>
            )}
          </div>
        </div>

        {/* Boutons */}
        <div className="flex flex-col sm:flex-row gap-3 pb-8">
          <button type="button" disabled={loading} onClick={() => handleSubmit('brouillon')}
            className="flex-1 py-3 bg-white border border-gray-200 hover:border-gray-400 text-gray-600 font-black text-xs uppercase rounded-2xl transition-all disabled:opacity-50">
            💾 Brouillon
          </button>
          {scheduledDate ? (
            <button type="button" disabled={loading} onClick={() => handleSubmit('planifie')}
              className="flex-1 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase rounded-2xl transition-all shadow-md disabled:opacity-50">
              🗓️ {loading ? 'Planification...' : 'Planifier la publication'}
            </button>
          ) : (
            <button type="button" disabled={loading} onClick={() => handleSubmit('publie')}
              className="flex-1 py-3.5 bg-amber-500 hover:bg-amber-600 text-white font-black text-xs uppercase rounded-2xl transition-all shadow-md disabled:opacity-50">
              ✓ {loading ? 'Publication...' : 'Publier maintenant'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
