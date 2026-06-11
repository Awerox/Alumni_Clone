'use client'

// Style pour le placeholder du contenteditable (injecté une fois côté client)
const EDITOR_PLACEHOLDER_STYLE = `
  [contenteditable][data-placeholder]:empty:before {
    content: attr(data-placeholder);
    color: #9ca3af;
    pointer-events: none;
  }
`

import { useState, useCallback, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
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

// ─── Constantes ───────────────────────────────────────────────────────────────

const CATEGORIES = [
  { value: 'academique', label: 'Académique' },
  { value: 'culturel', label: 'Culturel' },
  { value: 'artistique', label: 'Artistique' },
  { value: 'sportif', label: 'Sportif' },
  { value: 'environnement', label: 'Environnement' },
  { value: 'solidarite', label: 'Solidarité' },
  { value: 'professionnel', label: 'Professionnel' },
  { value: 'loisir', label: 'Loisir' },
  { value: 'autre', label: 'Autre' },
]

const DIPLOMES_OPTIONS = {
  BTS: [
    'BTS ASSURANCE', 'BTS CG', 'BTS CI', 'BTS COMMUNICATION',
    'BTS GPME', 'BTS MCO', 'BTS NDRC', 'BTS PIM', 'BTS SIO',
  ],
  DCG3: ['DCG3'],
  Prépa: ['ATS', 'D1', 'D2', 'DCG', 'DCG2', 'DSCG', 'ECG', 'ECT'],
}

const CAMPUS_OPTIONS = ['ENC Bessières', 'ENC Bessières Apprentissage']
const CATEGORIE_RESTRICT_OPTIONS = [
  'Équipe administrative', 'Étudiant', 'Alumni', 'Enseignant', 'Recruteur', 'Candidat',
]
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

const getRadianAngle = (deg: number) => (deg * Math.PI) / 180

async function getCroppedImg(
  imageSrc: string,
  pixelCrop: CropArea,
  rotation = 0,
  flip = { h: false, v: false },
): Promise<Blob> {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    img.setAttribute('crossOrigin', 'anonymous')
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = imageSrc
  })

  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')!

  // On travaille sur une zone «safe» pour gérer rotation sans coupure
  const safeArea = Math.max(image.width, image.height) * 2
  canvas.width = safeArea
  canvas.height = safeArea

  ctx.translate(safeArea / 2, safeArea / 2)
  ctx.rotate(getRadianAngle(rotation))
  ctx.scale(flip.h ? -1 : 1, flip.v ? -1 : 1)
  ctx.translate(-safeArea / 2, -safeArea / 2)
  ctx.drawImage(image, safeArea / 2 - image.width / 2, safeArea / 2 - image.height / 2)

  const data = ctx.getImageData(0, 0, safeArea, safeArea)
  canvas.width = pixelCrop.width
  canvas.height = pixelCrop.height
  ctx.putImageData(
    data,
    Math.round(0 - safeArea / 2 + image.width / 2 - pixelCrop.x),
    Math.round(0 - safeArea / 2 + image.height / 2 - pixelCrop.y),
  )

  return new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('toBlob failed'))),
      'image/jpeg',
      0.92,
    ),
  )
}

// ─── Composant MultiSelect ────────────────────────────────────────────────────

interface MultiSelectOption { value: string; label: string }
interface MultiSelectGroup { group: string; options: MultiSelectOption[] }

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

  // Fermeture au clic extérieur
  const handleBlur = useCallback((e: React.FocusEvent) => {
    if (!ref.current?.contains(e.relatedTarget as Node)) setOpen(false)
  }, [])

  const allOptions: MultiSelectOption[] = groups
    ? groups.flatMap((g) => g.options)
    : (options ?? [])

  const toggle = (v: string) =>
    onChange(selected.includes(v) ? selected.filter((s) => s !== v) : [...selected, v])

  const toggleGroup = (groupOptions: MultiSelectOption[]) => {
    const vals = groupOptions.map((o) => o.value)
    const allIn = vals.every((v) => selected.includes(v))
    onChange(allIn ? selected.filter((s) => !vals.includes(s)) : [...new Set([...selected, ...vals])])
  }

  return (
    <div ref={ref} className="relative" onBlur={handleBlur}>
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
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-30 mt-1 w-full rounded-xl border border-gray-200 bg-white shadow-lg overflow-hidden">
          {/* Barre tout / aucun */}
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
                      {/* En-tête groupe avec checkbox indéterminée */}
                      <button
                        type="button"
                        className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-gray-50 transition-colors"
                        onClick={() => toggleGroup(g.options)}
                      >
                        <div className={`h-4 w-4 rounded flex items-center justify-center flex-shrink-0 border ${
                          allIn ? 'bg-indigo-600 border-indigo-600'
                          : someIn ? 'bg-indigo-200 border-indigo-400'
                          : 'border-gray-300'
                        }`}>
                          {(allIn || someIn) && (
                            <svg className="h-2.5 w-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                        <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                          {g.group}
                        </span>
                      </button>
                      {g.options.map((opt) => (
                        <label key={opt.value} className="flex items-center gap-2 px-3 py-1.5 pl-8 hover:bg-gray-50 cursor-pointer transition-colors">
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
                  <label key={opt.value} className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-50 cursor-pointer transition-colors">
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

          {/* Chips des sélections actives */}
          {selected.length > 0 && (
            <div className="px-3 py-2 border-t border-gray-100 bg-gray-50 flex flex-wrap gap-1">
              {selected.map((v) => (
                <span key={v} className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700">
                  {v}
                  <button type="button" onClick={() => toggle(v)} className="ml-0.5 hover:text-indigo-900">×</button>
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
  const [flip, setFlip] = useState({ h: false, v: false })
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<CropArea | null>(null)

  const onCropComplete = useCallback((_: unknown, pixels: CropArea) => {
    setCroppedAreaPixels(pixels)
  }, [])

  const handleDone = async () => {
    if (!croppedAreaPixels) return
    try {
      const blob = await getCroppedImg(src, croppedAreaPixels, rotation, flip)
      onDone(blob)
    } catch {
      onCancel()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* En-tête */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">{title}</h3>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Zone de crop */}
        <div className="relative bg-gray-900" style={{ height: 300 }}>
          <Cropper
            image={src}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={aspect}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
            transform={`translate(${crop.x}px, ${crop.y}px) rotate(${rotation}deg) scale(${flip.h ? -zoom : zoom}, ${flip.v ? -zoom : zoom})`}
          />
        </div>

        {/* Contrôles */}
        <div className="px-5 py-4 space-y-3 border-t border-gray-100">
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500 w-16 flex-shrink-0">Zoom</span>
            <input
              type="range" min={1} max={3} step={0.05} value={zoom}
              onChange={(e) => setZoom(+e.target.value)}
              className="flex-1 accent-indigo-600"
            />
            <span className="text-xs text-gray-400 w-10 text-right">{Math.round(zoom * 100)}%</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500 w-16 flex-shrink-0">Rotation</span>
            <input
              type="range" min={0} max={360} step={1} value={rotation}
              onChange={(e) => setRotation(+e.target.value)}
              className="flex-1 accent-indigo-600"
            />
            <span className="text-xs text-gray-400 w-10 text-right">{rotation}°</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setFlip((f) => ({ ...f, h: !f.h }))}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                flip.h ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 3M21 7.5H7.5" />
              </svg>
              Miroir H
            </button>
            <button
              type="button"
              onClick={() => setFlip((f) => ({ ...f, v: !f.v }))}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                flip.v ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5L7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5" />
              </svg>
              Miroir V
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="px-5 pb-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleDone}
            className="rounded-xl px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
          >
            Valider le recadrage
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── ImageUploadField ─────────────────────────────────────────────────────────

function ImageUploadField({
  id,
  label,
  hint,
  previewClass,
  previewUrl,
  onFileSelected,
  onRemove,
  required,
}: {
  id: string
  label: string
  hint: string
  previewClass: string
  previewUrl?: string
  onFileSelected: (file: File) => void
  onRemove: () => void
  required?: boolean
}) {
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
        <span className="ml-1.5 text-xs text-gray-400 font-normal">{hint}</span>
      </label>
      <div
        className={`relative overflow-hidden rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 hover:border-indigo-400 hover:bg-indigo-50/30 transition-colors cursor-pointer ${previewClass}`}
        onClick={() => inputRef.current?.click()}
      >
        {previewUrl ? (
          <>
            <img src={previewUrl} alt="" className="h-full w-full object-cover" />
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
        id={id}
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

// ─── Page de création ─────────────────────────────────────────────────────────

export default function CreateGroupPage() {
  const router = useRouter()

  // Injecte le style placeholder pour le contenteditable
  useEffect(() => {
    const id = 'enc-editor-style'
    if (!document.getElementById(id)) {
      const style = document.createElement('style')
      style.id = id
      style.textContent = EDITOR_PLACEHOLDER_STYLE
      document.head.appendChild(style)
    }
  }, [])

  // Champs texte
  const [titre, setTitre] = useState('')
  const [categorie, setCategorie] = useState('')
  const [description, setDescription] = useState('')
  const [isPublic, setIsPublic] = useState(true)

  // Images
  const [miniatureBlob, setMiniatureBlob] = useState<Blob | null>(null)
  const [banniereBlob, setBanniereBlob] = useState<Blob | null>(null)
  const [miniaturePreview, setMiniaturePreview] = useState<string | undefined>()
  const [bannierePreview, setBannierePreview] = useState<string | undefined>()

  // Crop modal
  const [cropModal, setCropModal] = useState<{
    src: string
    aspect: number
    title: string
    onDone: (blob: Blob) => void
  } | null>(null)

  // Restrictions
  const [restrictDiplomes, setRestrictDiplomes] = useState<string[]>([])
  const [restrictCampus, setRestrictCampus] = useState<string[]>([])
  const [restrictCategories, setRestrictCategories] = useState<string[]>([])
  const [restrictPromotions, setRestrictPromotions] = useState<string[]>([])

  // Slug
  const [slugEdited, setSlugEdited] = useState(false)
  const [customSlug, setCustomSlug] = useState('')
  const [slugError, setSlugError] = useState<string | null>(null)
  const [slugChecking, setSlugChecking] = useState(false)
  const slugCheckTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const titleCheckTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Soumission
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Slug calculé : auto depuis titre tant que non édité manuellement
  const slug = slugEdited ? customSlug : slugify(titre)

  // Vérifie l'unicité du slug
  const checkSlug = useCallback(async (value: string) => {
    if (!value) return
    setSlugChecking(true)
    setSlugError(null)
    try {
      const res = await fetch(
        `/api/groups?where[slug][equals]=${encodeURIComponent(value)}&limit=1`,
      )
      const data = await res.json()
      if ((data.totalDocs ?? data.docs?.length ?? 0) > 0) {
        setSlugError('Ce slug est déjà utilisé par un autre groupe.')
      }
    } catch {
      // silencieux
    } finally {
      setSlugChecking(false)
    }
  }, [])

  const handleSlugChange = (value: string) => {
    const clean = value.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/--+/g, '-').replace(/^-|-$/g, '')
    setCustomSlug(clean)
    setSlugEdited(true)
    setSlugError(null)
    if (slugCheckTimer.current) clearTimeout(slugCheckTimer.current)
    slugCheckTimer.current = setTimeout(() => checkSlug(clean), 500)
  }

  const handleTitreChange = (value: string) => {
    setTitre(value)
    if (!slugEdited) {
      const auto = slugify(value)
      setSlugError(null)
      if (titleCheckTimer.current) clearTimeout(titleCheckTimer.current)
      titleCheckTimer.current = setTimeout(() => checkSlug(auto), 600)
    }
  }


  // ── Gestion des images ───────────────────────────────────
  function openCrop(type: 'miniature' | 'banniere', file: File) {
    const reader = new FileReader()
    reader.onload = (e) => {
      if (!e.target?.result) return
      const src = e.target.result as string
      const aspect = type === 'miniature' ? 1 : 16 / 9
      const title =
        type === 'miniature'
          ? 'Recadrer la miniature (1:1)'
          : 'Recadrer la bannière (16:9)'
      setCropModal({
        src,
        aspect,
        title,
        onDone: (blob) => {
          const preview = URL.createObjectURL(blob)
          if (type === 'miniature') {
            setMiniatureBlob(blob)
            setMiniaturePreview(preview)
          } else {
            setBanniereBlob(blob)
            setBannierePreview(preview)
          }
          setCropModal(null)
        },
      })
    }
    reader.readAsDataURL(file)
  }

  // ── Upload + soumission ──────────────────────────────────
  async function uploadMedia(blob: Blob, filename: string): Promise<string> {
    const formData = new FormData()
    formData.append('file', blob, filename)
    const res = await fetch('/api/media', { method: 'POST', body: formData })
    if (!res.ok) throw new Error("Erreur lors de l'upload de l'image")
    const data = await res.json()
    return data.doc?.id ?? data.id
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!titre.trim()) { setError('Le titre est obligatoire.'); return }
    if (slugError) { setError('Le slug est déjà utilisé, veuillez en choisir un autre.'); return }
    if (!slug) { setError('Le slug est obligatoire.'); return }
    if (!miniatureBlob) { setError('La miniature est obligatoire.'); return }
    if (!banniereBlob) { setError("L'image d'en-tête est obligatoire."); return }

    setSubmitting(true)
    try {
      const [miniatureId, banniereId] = await Promise.all([
        uploadMedia(miniatureBlob, `miniature-${slug}.jpg`),
        uploadMedia(banniereBlob, `banniere-${slug}.jpg`),
      ])

      const res = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titre: titre.trim(),
          slug,
          categorie: categorie || undefined,
          description: description.trim() || undefined,
          isPublic,
          miniature: miniatureId,
          banniere: banniereId,
          restrictDiplome: restrictDiplomes.join(', ') || undefined,
          restrictCampus: restrictCampus.join(', ') || undefined,
          restrictCategorie: restrictCategories.join(', ') || undefined,
          restrictPromotion: restrictPromotions.join(', ') || undefined,
        }),
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData?.errors?.[0]?.message ?? errData?.message ?? 'Erreur lors de la création')
      }

      router.push('/groups')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue.')
    } finally {
      setSubmitting(false)
    }
  }

  // ─── Rendu ────────────────────────────────────────────────

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
            <Link
              href="/groups"
              className="rounded-lg p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Créer un groupe</h1>
              <p className="text-sm text-gray-500 mt-0.5">
                Nouvelle communauté sur le réseau ENC
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">

            {/* ── Identité ──────────────────────────────────── */}
            <div className="rounded-2xl bg-white shadow-sm ring-1 ring-gray-100 p-6 space-y-5">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
                Identité
              </h2>

              {/* Titre + Slug */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Titre <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={titre}
                    onChange={(e) => handleTitreChange(e.target.value)}
                    placeholder="Nom du groupe…"
                    required
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Slug
                    <span className="ml-1.5 text-xs text-gray-400 font-normal">personnalisable</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={slug}
                      onChange={(e) => handleSlugChange(e.target.value)}
                      placeholder="mon-groupe"
                      className={`w-full rounded-xl border px-3 py-2.5 text-sm font-mono shadow-sm outline-none transition-colors pr-8 ${
                        slugError
                          ? 'border-red-400 bg-red-50 focus:ring-2 focus:ring-red-400/20'
                          : 'border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20'
                      }`}
                    />
                    <div className="absolute inset-y-0 right-2.5 flex items-center pointer-events-none">
                      {slugChecking && (
                        <div className="h-3.5 w-3.5 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin" />
                      )}
                      {!slugChecking && !slugError && slug && (
                        <svg className="h-4 w-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                      )}
                      {!slugChecking && slugError && (
                        <svg className="h-4 w-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      )}
                    </div>
                  </div>
                  {slugError && (
                    <p className="mt-1 text-xs text-red-600">{slugError}</p>
                  )}
                </div>
              </div>

              {/* Catégorie */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Catégorie <span className="text-red-500">*</span>
                </label>
                <select
                  value={categorie}
                  onChange={(e) => setCategorie(e.target.value)}
                  required
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
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Description <span className="text-red-500">*</span>
                </label>
                <div className="rounded-xl border border-gray-200 overflow-hidden shadow-sm focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-colors">
                  {/* Barre d'outils fonctionnelle */}
                  <div className="flex items-center gap-1 px-3 py-2 bg-gray-50 border-b border-gray-100">
                    {([
                      { cmd: 'bold', label: 'B', style: 'font-bold', title: 'Gras' },
                      { cmd: 'italic', label: 'I', style: 'italic', title: 'Italique' },
                      { cmd: 'underline', label: 'U', style: 'underline', title: 'Souligné' },
                    ] as const).map(({ cmd, label, style, title }) => (
                      <button
                        key={cmd}
                        type="button"
                        title={title}
                        onMouseDown={(e) => {
                          e.preventDefault()
                          document.execCommand(cmd, false)
                          const el = document.getElementById('desc-editor')
                          if (el) setDescription(el.innerHTML)
                        }}
                        className={`rounded px-2 py-1 text-xs text-gray-500 hover:bg-gray-200 hover:text-gray-700 transition-colors ${style}`}
                      >
                        {label}
                      </button>
                    ))}
                    <div className="w-px h-4 bg-gray-200 mx-1" />
                    <button
                      type="button"
                      title="Liste ordonnée"
                      onMouseDown={(e) => {
                        e.preventDefault()
                        document.execCommand('insertOrderedList', false)
                        const el = document.getElementById('desc-editor')
                        if (el) setDescription(el.innerHTML)
                      }}
                      className="rounded px-2 py-1 text-sm text-gray-500 hover:bg-gray-200 hover:text-gray-700 transition-colors"
                    >≡</button>
                    <button
                      type="button"
                      title="Liste à puces"
                      onMouseDown={(e) => {
                        e.preventDefault()
                        document.execCommand('insertUnorderedList', false)
                        const el = document.getElementById('desc-editor')
                        if (el) setDescription(el.innerHTML)
                      }}
                      className="rounded px-2 py-1 text-sm text-gray-500 hover:bg-gray-200 hover:text-gray-700 transition-colors"
                    >•</button>
                  </div>
                  <div
                    id="desc-editor"
                    contentEditable
                    suppressContentEditableWarning
                    onInput={(e) => setDescription((e.currentTarget as HTMLDivElement).innerHTML)}
                    className="w-full px-3 py-2.5 text-sm text-gray-900 bg-white outline-none min-h-[100px] prose prose-sm max-w-none"
                    data-placeholder="Décrivez l'objectif et la communauté de ce groupe…"
                    style={{ minHeight: 100 }}
                  />
                </div>
                {/* Champ caché pour la validation HTML5 */}
                {!description.replace(/<[^>]*>/g, '').trim() && (
                  <input
                    type="text"
                    required
                    value=""
                    onChange={() => {}}
                    className="sr-only"
                    tabIndex={-1}
                    aria-hidden="true"
                  />
                )}
              </div>
            </div>

            {/* ── Visuels ───────────────────────────────────── */}
            <div className="rounded-2xl bg-white shadow-sm ring-1 ring-gray-100 p-6 space-y-5">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
                Visuels
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <ImageUploadField
                  id="miniature"
                  label="Miniature"
                  hint="1:1"
                  previewClass="h-32"
                  previewUrl={miniaturePreview}
                  onFileSelected={(f) => openCrop('miniature', f)}
                  onRemove={() => { setMiniatureBlob(null); setMiniaturePreview(undefined) }}
                  required
                />
                <ImageUploadField
                  id="banniere"
                  label="Bannière"
                  hint="16:9"
                  previewClass="h-32"
                  previewUrl={bannierePreview}
                  onFileSelected={(f) => openCrop('banniere', f)}
                  onRemove={() => { setBanniereBlob(null); setBannierePreview(undefined) }}
                  required
                />
              </div>
            </div>

            {/* ── Droit d'accès ─────────────────────────────── */}
            <div className="rounded-2xl bg-white shadow-sm ring-1 ring-gray-100 p-6 space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
                Droit d'accès
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {[
                  {
                    value: true,
                    label: 'Groupe public',
                    desc: 'Le groupe peut être rejoint par n\'importe quel membre du réseau.',
                    icon: (
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
                      </svg>
                    ),
                  },
                  {
                    value: false,
                    label: 'Groupe privé',
                    desc: 'Les membres peuvent demander à rejoindre, mais le contenu est restreint aux membres acceptés.',
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

            {/* ── Restrictions ──────────────────────────────── */}
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

            {/* ── Erreur ────────────────────────────────────── */}
            {error && (
              <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 flex items-start gap-2.5">
                <svg className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* ── Actions ───────────────────────────────────── */}
            <div className="flex items-center justify-between gap-3 pb-4">
              <Link
                href="/groups"
                className="rounded-xl px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 transition-colors shadow-sm"
              >
                Annuler
              </Link>
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              >
                {submitting ? (
                  <>
                    <div className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                    Création en cours…
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    Créer le groupe
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
