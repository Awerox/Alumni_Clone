'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Cropper from 'react-easy-crop'

// ─── Types ────────────────────────────────────────────────────────────────────

interface CropArea {
  x: number
  y: number
  width: number
  height: number
}

interface CropState {
  x: number
  y: number
}

interface MediaItem {
  id: string
  url: string
  alt?: string
}

interface GroupData {
  id: string
  titre: string
  slug: string
  categorie?: string
  description?: string
  miniature?: MediaItem
  banniere?: MediaItem
  isPublic?: boolean
  restrictDiplome?: string
  restrictCampus?: string
  restrictCategorie?: string
  restrictPromotion?: string
}

// ─── Constantes ───────────────────────────────────────────────────────────────

const CATEGORIES = [
  { value: 'etudiant', label: 'Étudiants' },
  { value: 'alumni', label: 'Alumni' },
  { value: 'enseignant', label: 'Enseignants' },
  { value: 'administratif', label: 'Administratif' },
  { value: 'club', label: 'Club' },
  { value: 'projet', label: 'Projet' },
  { value: 'promo', label: 'Promotion' },
  { value: 'autre', label: 'Autre' },
]

const DIPLOMES_OPTIONS = {
  BTS: ['BTS ASSURANCE', 'BTS CG', 'BTS CI', 'BTS COMMUNICATION', 'BTS GPME', 'BTS MCO', 'BTS NDRC', 'BTS PIM', 'BTS SIO'],
  DCG3: ['DCG3'],
  Prépa: ['ATS', 'D1', 'D2', 'DCG', 'DCG2', 'DSCG', 'ECG', 'ECT'],
}

const CAMPUS_OPTIONS = ['ENC Bessières', 'ENC Bessières Apprentissage']
const CATEGORIE_RESTRICT_OPTIONS = ['Équipe administrative', 'Étudiant', 'Alumni', 'Enseignant', 'Recruteur', 'Candidat']
const PROMOTION_OPTIONS = ['2031', '2030', '2029', '2028', '2027', '2026']

// ─── Helpers ──────────────────────────────────────────────────────────────────

function slugify(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

async function getCroppedImg(imageSrc: string, pixelCrop: CropArea): Promise<Blob> {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = imageSrc
  })
  const canvas = document.createElement('canvas')
  canvas.width = pixelCrop.width
  canvas.height = pixelCrop.height
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(image, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height, 0, 0, pixelCrop.width, pixelCrop.height)
  return new Promise<Blob>((resolve) => canvas.toBlob((blob) => resolve(blob!), 'image/jpeg', 0.92))
}

// ─── Composant MultiSelect ────────────────────────────────────────────────────

interface MultiSelectOption {
  value: string
  label: string
}

interface MultiSelectGroup {
  group: string
  options: MultiSelectOption[]
}

function MultiSelect({
  label,
  options,
  groups,
  selected,
  onChange,
}: {
  label: string
  options?: MultiSelectOption[]
  groups?: MultiSelectGroup[]
  selected: string[]
  onChange: (values: string[]) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const allOptions: MultiSelectOption[] = groups
    ? groups.flatMap((g) => g.options)
    : (options ?? [])

  const toggle = (v: string) => {
    onChange(selected.includes(v) ? selected.filter((s) => s !== v) : [...selected, v])
  }

  const toggleGroup = (groupOptions: MultiSelectOption[]) => {
    const vals = groupOptions.map((o) => o.value)
    const allIn = vals.every((v) => selected.includes(v))
    if (allIn) {
      onChange(selected.filter((s) => !vals.includes(s)))
    } else {
      onChange([...new Set([...selected, ...vals])])
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-left shadow-sm hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
      >
        <span className="flex items-center gap-2 min-w-0">
          <span className="text-gray-500 font-medium flex-shrink-0">{label}</span>
          {selected.length > 0 && (
            <span className="inline-flex items-center rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-700 flex-shrink-0">
              {selected.length}
            </span>
          )}
        </span>
        <svg
          className={`h-4 w-4 text-gray-400 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-30 mt-1 w-full rounded-xl border border-gray-200 bg-white shadow-lg overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100 bg-gray-50">
            <button
              type="button"
              className="text-xs font-medium text-indigo-600 hover:text-indigo-800"
              onClick={() => onChange(allOptions.map((o) => o.value))}
            >
              Tous
            </button>
            <span className="text-xs text-gray-400">{selected.length}/{allOptions.length}</span>
            <button
              type="button"
              className="text-xs font-medium text-gray-500 hover:text-gray-700"
              onClick={() => onChange([])}
            >
              Aucun
            </button>
          </div>
          <div className="max-h-56 overflow-y-auto py-1">
            {groups
              ? groups.map((g) => {
                  const groupVals = g.options.map((o) => o.value)
                  const allIn = groupVals.every((v) => selected.includes(v))
                  const someIn = groupVals.some((v) => selected.includes(v))
                  return (
                    <div key={g.group}>
                      <button
                        type="button"
                        className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-gray-50 transition-colors"
                        onClick={() => toggleGroup(g.options)}
                      >
                        <div
                          className={`h-4 w-4 rounded flex items-center justify-center flex-shrink-0 border ${
                            allIn
                              ? 'bg-indigo-600 border-indigo-600'
                              : someIn
                              ? 'bg-indigo-200 border-indigo-400'
                              : 'border-gray-300'
                          }`}
                        >
                          {(allIn || someIn) && (
                            <svg className="h-2.5 w-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          )}
                        </div>
                        <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                          {g.group}
                        </span>
                      </button>
                      {g.options.map((opt) => (
                        <label
                          key={opt.value}
                          className="flex items-center gap-2 px-3 py-1.5 pl-8 hover:bg-gray-50 cursor-pointer transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={selected.includes(opt.value)}
                            onChange={() => toggle(opt.value)}
                            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <span className="text-sm text-gray-700">{opt.label}</span>
                        </label>
                      ))}
                    </div>
                  )
                })
              : options?.map((opt) => (
                  <label
                    key={opt.value}
                    className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selected.includes(opt.value)}
                      onChange={() => toggle(opt.value)}
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-700">{opt.label}</span>
                  </label>
                ))}
          </div>
          {selected.length > 0 && (
            <div className="px-3 py-2 border-t border-gray-100 bg-gray-50 flex flex-wrap gap-1">
              {selected.map((v) => (
                <span
                  key={v}
                  className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700"
                >
                  {v}
                  <button
                    type="button"
                    onClick={() => toggle(v)}
                    className="ml-0.5 hover:text-indigo-900"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Modal de recadrage ───────────────────────────────────────────────────────

function CropModal({
  src,
  aspect,
  title,
  onDone,
  onCancel,
}: {
  src: string
  aspect: number
  title: string
  onDone: (blob: Blob) => void
  onCancel: () => void
}) {
  const [crop, setCrop] = useState<CropState>({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [flipH, setFlipH] = useState(false)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<CropArea | null>(null)

  const onCropComplete = useCallback((_: unknown, pixels: CropArea) => {
    setCroppedAreaPixels(pixels)
  }, [])

  const handleDone = async () => {
    if (!croppedAreaPixels) return
    const blob = await getCroppedImg(src, croppedAreaPixels)
    onDone(blob)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">{title}</h3>
          <button onClick={onCancel} className="rounded-lg p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div
          className="relative bg-gray-900"
          style={{ height: 300, transform: flipH ? 'scaleX(-1)' : 'none' }}
        >
          <Cropper
            image={src}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={aspect}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>
        <div className="px-5 py-4 space-y-3 border-t border-gray-100">
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500 w-16 flex-shrink-0">Zoom</span>
            <input type="range" min={1} max={3} step={0.05} value={zoom} onChange={(e) => setZoom(+e.target.value)} className="flex-1 accent-indigo-600" />
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500 w-16 flex-shrink-0">Rotation</span>
            <input type="range" min={-180} max={180} step={1} value={rotation} onChange={(e) => setRotation(+e.target.value)} className="flex-1 accent-indigo-600" />
            <span className="text-xs text-gray-400 w-10 text-right">{rotation}°</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setFlipH((f) => !f)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                flipH ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 3M21 7.5H7.5" />
              </svg>
              Miroir H
            </button>
          </div>
        </div>
        <div className="px-5 pb-5 flex justify-end gap-2">
          <button onClick={onCancel} className="rounded-xl px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors">
            Annuler
          </button>
          <button onClick={handleDone} className="rounded-xl px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors">
            Valider le recadrage
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── ImageUploadField ─────────────────────────────────────────────────────────

function ImageUploadField({
  label,
  hint,
  aspectRatio,
  previewClass,
  currentUrl,
  previewUrl,
  onFileSelected,
  onRemove,
}: {
  label: string
  hint: string
  aspectRatio: number
  previewClass: string
  currentUrl?: string
  previewUrl?: string
  onFileSelected: (file: File) => void
  onRemove: () => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const displayUrl = previewUrl ?? currentUrl

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
        <span className="ml-1.5 text-xs text-gray-400 font-normal">{hint}</span>
      </label>
      <div className={`relative overflow-hidden rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 hover:border-indigo-400 hover:bg-indigo-50/30 transition-colors cursor-pointer ${previewClass}`}
        onClick={() => inputRef.current?.click()}
      >
        {displayUrl ? (
          <>
            <img src={displayUrl} alt="" className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-black/0 hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 hover:opacity-100">
              <span className="text-white text-sm font-medium bg-black/40 rounded-lg px-3 py-1.5 backdrop-blur-sm">
                Changer
              </span>
            </div>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onRemove() }}
              className="absolute top-2 right-2 rounded-full bg-white/90 p-1 shadow-sm hover:bg-red-50 hover:text-red-600 transition-colors"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-gray-400">
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
            <span className="text-xs font-medium">Cliquer pour choisir</span>
          </div>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) onFileSelected(file)
          e.target.value = ''
        }}
      />
    </div>
  )
}

// ─── Page d'édition ───────────────────────────────────────────────────────────

export default function EditGroupPage({ params }: { params: { id: string } }) {
  const router = useRouter()

  // État chargement initial
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  // Champs du formulaire
  const [titre, setTitre] = useState('')
  const [slug, setSlug] = useState('')
  const [categorie, setCategorie] = useState('')
  const [description, setDescription] = useState('')
  const [isPublic, setIsPublic] = useState(true)

  // Images : url existantes + prévisualisations + blobs rognés
  const [miniatureUrl, setMiniatureUrl] = useState<string | undefined>()
  const [banniereUrl, setBanniereUrl] = useState<string | undefined>()
  const [miniaturePreview, setMiniaturePreview] = useState<string | undefined>()
  const [bannierePreview, setBannierePreview] = useState<string | undefined>()
  const [miniatureBlob, setMiniatureBlob] = useState<Blob | null>(null)
  const [banniereBlob, setBanniereBlob] = useState<Blob | null>(null)

  // Crop modal
  const [cropModal, setCropModal] = useState<{
    src: string
    aspect: number
    title: string
    onDone: (blob: Blob) => void
  } | null>(null)
  const [pendingCropSrc, setPendingCropSrc] = useState<{ type: 'miniature' | 'banniere'; src: string } | null>(null)

  // Restrictions
  const [restrictDiplomes, setRestrictDiplomes] = useState<string[]>([])
  const [restrictCampus, setRestrictCampus] = useState<string[]>([])
  const [restrictCategories, setRestrictCategories] = useState<string[]>([])
  const [restrictPromotions, setRestrictPromotions] = useState<string[]>([])

  // Soumission
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // ── Chargement des données ───────────────────────────────
  useEffect(() => {
    async function fetchGroup() {
      try {
        const res = await fetch(`/api/groups/${params.id}?depth=1`)
        if (!res.ok) throw new Error('Groupe introuvable')
        const data: GroupData = await res.json()

        setTitre(data.titre ?? '')
        setSlug(data.slug ?? '')
        setCategorie(data.categorie ?? '')
        setDescription(data.description ?? '')
        setIsPublic(data.isPublic ?? true)

        if (data.miniature?.url) setMiniatureUrl(data.miniature.url)
        if (data.banniere?.url) setBanniereUrl(data.banniere.url)

        if (data.restrictDiplome) setRestrictDiplomes(data.restrictDiplome.split(',').map((s) => s.trim()).filter(Boolean))
        if (data.restrictCampus) setRestrictCampus(data.restrictCampus.split(',').map((s) => s.trim()).filter(Boolean))
        if (data.restrictCategorie) setRestrictCategories(data.restrictCategorie.split(',').map((s) => s.trim()).filter(Boolean))
        if (data.restrictPromotion) setRestrictPromotions(data.restrictPromotion.split(',').map((s) => s.trim()).filter(Boolean))
      } catch (err) {
        setLoadError(err instanceof Error ? err.message : 'Erreur de chargement')
      } finally {
        setLoading(false)
      }
    }
    fetchGroup()
  }, [params.id])

  // ── Crop helpers ─────────────────────────────────────────
  function openCrop(type: 'miniature' | 'banniere', src: string) {
    const aspect = type === 'miniature' ? 1 : 16 / 9
    const title = type === 'miniature' ? 'Recadrer la miniature (1:1)' : 'Recadrer la bannière (16:9)'
    setCropModal({
      src,
      aspect,
      title,
      onDone: (blob) => {
        const preview = URL.createObjectURL(blob)
        if (type === 'miniature') {
          setMiniaturePreview(preview)
          setMiniatureBlob(blob)
        } else {
          setBannierePreview(preview)
          setBanniereBlob(blob)
        }
        setCropModal(null)
      },
    })
    setPendingCropSrc({ type, src })
  }

  function handleImageFile(type: 'miniature' | 'banniere', file: File) {
    const reader = new FileReader()
    reader.onload = (e) => {
      if (e.target?.result) openCrop(type, e.target.result as string)
    }
    reader.readAsDataURL(file)
  }

  // ── Upload image vers PayloadCMS ─────────────────────────
  async function uploadMedia(blob: Blob, filename: string): Promise<string> {
    const formData = new FormData()
    formData.append('file', blob, filename)
    const res = await fetch('/api/media', { method: 'POST', body: formData })
    if (!res.ok) throw new Error('Erreur lors de l\'upload de l\'image')
    const data = await res.json()
    return data.doc?.id ?? data.id
  }

  // ── Soumission ───────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!titre.trim()) { setError('Le titre est obligatoire.'); return }
    setSubmitting(true)
    setError(null)

    try {
      let miniatureId: string | undefined
      let banniereId: string | undefined

      if (miniatureBlob) miniatureId = await uploadMedia(miniatureBlob, `miniature-${slug}.jpg`)
      if (banniereBlob) banniereId = await uploadMedia(banniereBlob, `banniere-${slug}.jpg`)

      const body: Record<string, unknown> = {
        titre: titre.trim(),
        categorie: categorie || undefined,
        description: description.trim() || undefined,
        isPublic,
        restrictDiplome: restrictDiplomes.join(', ') || undefined,
        restrictCampus: restrictCampus.join(', ') || undefined,
        restrictCategorie: restrictCategories.join(', ') || undefined,
        restrictPromotion: restrictPromotions.join(', ') || undefined,
      }

      if (miniatureId) body.miniature = miniatureId
      if (banniereId) body.banniere = banniereId

      // Si l'image a été retirée explicitement (previewUrl = undefined ET url = undefined)
      if (!miniaturePreview && !miniatureUrl) body.miniature = null
      if (!bannierePreview && !banniereUrl) body.banniere = null

      const res = await fetch(`/api/groups/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData?.message ?? 'Erreur lors de la mise à jour')
      }

      setSuccess(true)
      setTimeout(() => router.push(`/groups/${params.id}`), 1200)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue.')
    } finally {
      setSubmitting(false)
    }
  }

  // ─── Rendu états de chargement ───────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
          <p className="text-sm text-gray-500">Chargement du groupe…</p>
        </div>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 font-medium mb-4">{loadError}</p>
          <a href="/groups" className="text-sm text-indigo-600 hover:underline">← Retour aux groupes</a>
        </div>
      </div>
    )
  }

  // ─── Formulaire ──────────────────────────────────────────

  return (
    <>
      {cropModal && (
        <CropModal
          src={cropModal.src}
          aspect={cropModal.aspect}
          title={cropModal.title}
          onDone={cropModal.onDone}
          onCancel={() => setCropModal(null)}
        />
      )}

      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          {/* En-tête */}
          <div className="flex items-center gap-3 mb-8">
            <a
              href={`/groups/${params.id}`}
              className="rounded-lg p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </a>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Modifier le groupe</h1>
              <p className="text-sm text-gray-500 mt-0.5">{titre}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* ── Identité ─────────────────────────────────── */}
            <div className="rounded-2xl bg-white shadow-sm ring-1 ring-gray-100 p-6 space-y-5">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
                Identité
              </h2>

              {/* Titre */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Titre <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={titre}
                  onChange={(e) => {
                    setTitre(e.target.value)
                    setSlug(slugify(e.target.value))
                  }}
                  placeholder="Nom du groupe…"
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-colors"
                />
              </div>

              {/* Slug */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Slug
                  <span className="ml-1.5 text-xs text-gray-400 font-normal">auto-généré, non modifiable</span>
                </label>
                <input
                  type="text"
                  value={slug}
                  disabled
                  className="w-full rounded-xl border border-gray-100 bg-gray-50 px-3 py-2.5 text-sm text-gray-400 font-mono cursor-not-allowed"
                />
              </div>

              {/* Catégorie */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Catégorie</label>
                <select
                  value={categorie}
                  onChange={(e) => setCategorie(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-colors bg-white"
                >
                  <option value="">Sélectionner une catégorie…</option>
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
                <div className="rounded-xl border border-gray-200 overflow-hidden shadow-sm focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-colors">
                  <div className="flex items-center gap-1 px-3 py-2 bg-gray-50 border-b border-gray-100">
                    {['B', 'I', 'U'].map((f) => (
                      <button
                        key={f}
                        type="button"
                        className="rounded px-2 py-1 text-xs font-bold text-gray-500 hover:bg-gray-200 hover:text-gray-700 transition-colors"
                        title={f}
                      >
                        {f}
                      </button>
                    ))}
                    <div className="w-px h-4 bg-gray-200 mx-1" />
                    {['≡', '•', '№'].map((f) => (
                      <button
                        key={f}
                        type="button"
                        className="rounded px-2 py-1 text-sm text-gray-500 hover:bg-gray-200 hover:text-gray-700 transition-colors"
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    placeholder="Décrivez l'objectif et la communauté de ce groupe…"
                    className="w-full px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 bg-white outline-none resize-none"
                  />
                </div>
              </div>
            </div>

            {/* ── Images ───────────────────────────────────── */}
            <div className="rounded-2xl bg-white shadow-sm ring-1 ring-gray-100 p-6 space-y-5">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
                Visuels
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <ImageUploadField
                  label="Miniature"
                  hint="1:1"
                  aspectRatio={1}
                  previewClass="h-32"
                  currentUrl={miniatureUrl}
                  previewUrl={miniaturePreview}
                  onFileSelected={(f) => handleImageFile('miniature', f)}
                  onRemove={() => { setMiniatureUrl(undefined); setMiniaturePreview(undefined); setMiniatureBlob(null) }}
                />
                <ImageUploadField
                  label="Bannière"
                  hint="16:9"
                  aspectRatio={16 / 9}
                  previewClass="h-32"
                  currentUrl={banniereUrl}
                  previewUrl={bannierePreview}
                  onFileSelected={(f) => handleImageFile('banniere', f)}
                  onRemove={() => { setBanniereUrl(undefined); setBannierePreview(undefined); setBanniereBlob(null) }}
                />
              </div>
            </div>

            {/* ── Accès ─────────────────────────────────────── */}
            <div className="rounded-2xl bg-white shadow-sm ring-1 ring-gray-100 p-6 space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
                Droit d'accès
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {[
                  {
                    value: true,
                    label: 'Groupe public',
                    desc: 'Visible par tous',
                    icon: (
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
                      </svg>
                    ),
                  },
                  {
                    value: false,
                    label: 'Groupe privé',
                    desc: 'Sur invitation',
                    icon: (
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                      </svg>
                    ),
                  },
                ].map((opt) => (
                  <button
                    key={String(opt.value)}
                    type="button"
                    onClick={() => setIsPublic(opt.value)}
                    className={`flex items-center gap-3 rounded-xl border-2 p-3.5 text-left transition-all ${
                      isPublic === opt.value
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <span className={isPublic === opt.value ? 'text-indigo-600' : 'text-gray-400'}>
                      {opt.icon}
                    </span>
                    <div>
                      <p className={`text-sm font-semibold ${isPublic === opt.value ? 'text-indigo-700' : 'text-gray-800'}`}>
                        {opt.label}
                      </p>
                      <p className="text-xs text-gray-500">{opt.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* ── Restrictions ─────────────────────────────── */}
            <div className="rounded-2xl bg-white shadow-sm ring-1 ring-gray-100 p-6 space-y-4">
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
                  Restreindre la visibilité aux
                </h2>
                <p className="text-xs text-gray-400 mt-1">Laissez vide pour ne pas restreindre.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <MultiSelect
                  label="Diplômes"
                  groups={Object.entries(DIPLOMES_OPTIONS).map(([group, opts]) => ({
                    group,
                    options: opts.map((o) => ({ value: o, label: o })),
                  }))}
                  selected={restrictDiplomes}
                  onChange={setRestrictDiplomes}
                />
                <MultiSelect
                  label="Campus"
                  options={CAMPUS_OPTIONS.map((o) => ({ value: o, label: o }))}
                  selected={restrictCampus}
                  onChange={setRestrictCampus}
                />
                <MultiSelect
                  label="Catégories"
                  options={CATEGORIE_RESTRICT_OPTIONS.map((o) => ({ value: o, label: o }))}
                  selected={restrictCategories}
                  onChange={setRestrictCategories}
                />
                <MultiSelect
                  label="Promotions"
                  options={PROMOTION_OPTIONS.map((o) => ({ value: o, label: o }))}
                  selected={restrictPromotions}
                  onChange={setRestrictPromotions}
                />
              </div>
            </div>

            {/* ── Erreur / Succès ───────────────────────────── */}
            {error && (
              <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 flex items-start gap-2.5">
                <svg className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {success && (
              <div className="rounded-xl bg-green-50 border border-green-200 px-4 py-3 flex items-center gap-2.5">
                <svg className="h-5 w-5 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-green-700 font-medium">Modifications enregistrées. Redirection…</p>
              </div>
            )}

            {/* ── Actions ───────────────────────────────────── */}
            <div className="flex items-center justify-between gap-3 pb-4">
              <a
                href={`/groups/${params.id}`}
                className="rounded-xl px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 transition-colors shadow-sm"
              >
                Annuler
              </a>
              <button
                type="submit"
                disabled={submitting || success}
                className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              >
                {submitting ? (
                  <>
                    <div className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                    Enregistrement…
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Enregistrer les modifications
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
