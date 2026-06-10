// app/blog/edit/[id]/page.tsx
'use client'
import React, { useState, useRef, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import dynamic from 'next/dynamic'

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

function toDatetimeLocalValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export default function EditArticlePage() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()
  const coverInputRef = useRef<HTMLInputElement>(null)
  const attachInputRef = useRef<HTMLInputElement>(null)

  const [loadingArticle, setLoadingArticle] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [existingCoverId, setExistingCoverId] = useState<number | null>(null)

  const [attachFile, setAttachFile] = useState<File | null>(null)
  const [attachName, setAttachName] = useState<string | null>(null)

  const [scheduledDate, setScheduledDate] = useState('')

  const [form, setForm] = useState({
    titre: '',
    slug: '',
    description: '',
    contenu: '',
    categorie: 'vie_etablissement',
    statut: 'brouillon',
  })

  // Charger l'article existant
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/articles/by-id/${id}`, { credentials: 'include' })
        if (!res.ok) { setError('Article introuvable ou accès refusé.'); setLoadingArticle(false); return }
        const data = await res.json()
        const a = data.doc
        setForm({
          titre:       a.titre || '',
          slug:        a.slug || '',
          description: a.description || '',
          contenu:     a.contenu || '',
          categorie:   a.categorie || 'vie_etablissement',
          statut:      a.statut || 'brouillon',
        })
        if (a.couverture) {
          const covId = typeof a.couverture === 'object' ? a.couverture.id : a.couverture
          const covUrl = typeof a.couverture === 'object' ? a.couverture.url : null
          setExistingCoverId(Number(covId))
          if (covUrl) setCoverPreview(covUrl)
        }
        if (a.datePublication) {
          setScheduledDate(toDatetimeLocalValue(new Date(a.datePublication)))
        }
      } catch {
        setError('Erreur lors du chargement de l\'article.')
      } finally {
        setLoadingArticle(false)
      }
    }
    load()
  }, [id])

  const uploadFile = async (file: File, alt: string): Promise<number> => {
    const fd = new FormData()
    fd.append('file', file)
    fd.append('alt', alt)
    const res = await fetch('/api/media', { method: 'POST', body: fd, credentials: 'include' })
    const data = await res.json()
    if (!res.ok) throw new Error(data?.error || 'Échec upload')
    return Number(data?.doc?.id)
  }

  const handleSubmit = async (statut: string) => {
    setError('')
    if (!form.titre.trim())       return setError('Le titre est obligatoire.')
    if (!form.description.trim()) return setError('La description est obligatoire.')
    if (!form.contenu || form.contenu === '<p></p>') return setError('Le contenu est obligatoire.')

    setSaving(true)
    try {
      let couvertureId = existingCoverId
      if (coverFile) {
        couvertureId = await uploadFile(coverFile, `Couverture : ${form.titre}`)
      }

      let pieceJointeId: number | null = null
      if (attachFile) {
        pieceJointeId = await uploadFile(attachFile, `PJ : ${form.titre}`)
      }

      const body: any = {
        titre:       form.titre.trim(),
        slug:        form.slug.trim(),
        description: form.description.trim(),
        contenu:     form.contenu,
        categorie:   form.categorie,
        statut,
        couverture:  couvertureId,
      }
      if (pieceJointeId)  body.pieceJointe = pieceJointeId
      if (scheduledDate)  body.datePublication = new Date(scheduledDate).toISOString()

      const res = await fetch(`/api/articles/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (res.ok) {
        setSuccess('Article mis à jour !')
        setTimeout(() => router.push('/blog?tab=' + statut), 1000)
      } else {
        throw new Error(data.error || 'Erreur lors de la mise à jour')
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const minDate = toDatetimeLocalValue(new Date(Date.now() + 5 * 60 * 1000))

  if (loadingArticle) return (
    <div className="min-h-screen flex items-center justify-center font-bold text-xs text-gray-400 uppercase animate-pulse">
      Chargement de l'article...
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50/50 py-10 px-4 font-sans">
      <div className="max-w-3xl mx-auto space-y-6">

        <div className="flex items-center gap-4">
          <Link href="/blog?tab=brouillon" className="text-gray-400 hover:text-gray-700 transition-colors text-sm">← Retour</Link>
          <div>
            <h1 className="text-xl font-black text-gray-900 tracking-tight">Modifier l'article</h1>
            <p className="text-xs text-gray-400 mt-0.5">Les modifications ne sont possibles que sur les articles non publiés</p>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs font-bold text-red-700 flex items-start gap-2">
            <span>⚠️</span><span>{error}</span>
          </div>
        )}
        {success && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs font-bold text-emerald-700 flex items-start gap-2">
            <span>✅</span><span>{success}</span>
          </div>
        )}

        <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm space-y-7">

          <div>
            <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-1.5">Titre *</label>
            <input type="text" value={form.titre}
              onChange={(e) => setForm(prev => ({ ...prev, titre: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none text-sm font-medium text-gray-800 focus:border-amber-400 transition-colors" />
          </div>

          <div>
            <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-1.5">
              URL — <span className="font-normal normal-case text-gray-300">modifiable</span>
            </label>
            <div className="flex items-center gap-2 border border-gray-200 rounded-xl overflow-hidden focus-within:border-amber-400 transition-colors">
              <span className="px-3 text-xs text-gray-400 font-medium bg-gray-50 border-r border-gray-200 py-3 shrink-0">/blog/</span>
              <input type="text" value={form.slug}
                onChange={(e) => setForm(prev => ({ ...prev, slug: e.target.value }))}
                className="flex-1 px-3 py-3 outline-none text-xs font-mono text-gray-500 bg-white" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-1.5">Catégorie *</label>
              <select value={form.categorie}
                onChange={(e) => setForm(prev => ({ ...prev, categorie: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none text-sm font-medium text-gray-700 bg-white focus:border-amber-400 transition-colors">
                {CATEGORIES.map(cat => <option key={cat.value} value={cat.value}>{cat.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-1.5">Description courte *</label>
              <textarea rows={3} value={form.description}
                onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none text-xs font-medium text-gray-800 resize-none focus:border-amber-400 transition-colors" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-1.5">Contenu *</label>
            <RichEditor
              value={form.contenu}
              onChange={(html) => setForm(prev => ({ ...prev, contenu: html }))}
              placeholder="Contenu de l'article..."
            />
          </div>

          {/* Couverture */}
          <div>
            <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-1.5">Photo de couverture</label>
            <input ref={coverInputRef} type="file" accept="image/*" className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (!file) return
                setCoverFile(file)
                setCoverPreview(URL.createObjectURL(file))
              }} />
            {coverPreview ? (
              <div className="relative group">
                <img src={coverPreview} alt="Aperçu" className="w-full h-48 object-cover rounded-2xl border border-gray-200" />
                <div className="absolute inset-0 bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button type="button" onClick={() => coverInputRef.current?.click()}
                    className="px-4 py-2 bg-white text-gray-800 text-xs font-black uppercase rounded-xl">
                    Changer la photo
                  </button>
                </div>
              </div>
            ) : (
              <button type="button" onClick={() => coverInputRef.current?.click()}
                className="w-full h-36 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center gap-2 hover:border-amber-400 hover:bg-amber-50/30 transition-all">
                <span className="text-3xl">🖼️</span>
                <span className="text-xs font-bold text-gray-400">Cliquer pour importer</span>
              </button>
            )}
          </div>

          {/* Pièce jointe */}
          <div>
            <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-1.5">
              Pièce jointe <span className="font-normal normal-case text-gray-300">(optionnel)</span>
            </label>
            <input ref={attachInputRef} type="file" className="hidden"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.png,.jpg,.jpeg,.zip"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (!file) return
                setAttachFile(file)
                setAttachName(file.name)
              }} />
            {attachName ? (
              <div className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-xl">
                <span className="text-xs font-bold text-gray-700">📎 {attachName}</span>
                <button type="button" onClick={() => { setAttachFile(null); setAttachName(null) }}
                  className="text-xs text-red-400 hover:text-red-600 font-bold">✕ Retirer</button>
              </div>
            ) : (
              <button type="button" onClick={() => attachInputRef.current?.click()}
                className="w-full py-3 border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center gap-2 hover:border-gray-400 text-xs font-bold text-gray-400">
                📎 Ajouter une pièce jointe
              </button>
            )}
          </div>

          {/* Publication planifiée */}
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 space-y-3">
            <p className="text-xs font-black text-blue-800 uppercase tracking-wide">🗓️ Publication planifiée</p>
            <input type="datetime-local" value={scheduledDate} min={minDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              className="w-full px-4 py-2.5 border border-blue-200 rounded-xl outline-none text-sm font-medium text-gray-700 bg-white" />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pb-8">
          <button type="button" disabled={saving} onClick={() => handleSubmit('brouillon')}
            className="flex-1 py-3 bg-white border border-gray-200 hover:border-gray-400 text-gray-600 font-black text-xs uppercase rounded-2xl transition-all disabled:opacity-50">
            💾 Enregistrer en brouillon
          </button>
          {scheduledDate ? (
            <button type="button" disabled={saving} onClick={() => handleSubmit('planifie')}
              className="flex-1 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase rounded-2xl transition-all shadow-md disabled:opacity-50">
              🗓️ {saving ? 'Enregistrement...' : 'Planifier la publication'}
            </button>
          ) : (
            <button type="button" disabled={saving} onClick={() => handleSubmit('publie')}
              className="flex-1 py-3.5 bg-amber-500 hover:bg-amber-600 text-white font-black text-xs uppercase rounded-2xl transition-all shadow-md disabled:opacity-50">
              ✓ {saving ? 'Publication...' : 'Publier maintenant'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}