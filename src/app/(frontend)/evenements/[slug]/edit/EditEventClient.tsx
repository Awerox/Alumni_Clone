'use client'
import React, { useState, useCallback, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Cropper from 'react-easy-crop'

const CAT_OPTIONS = [
  { value: "conference", label: "🎤 Conférence", desc: "Présentation, keynote, conférence métier" },
  { value: "reseau", label: "🤝 Réseautage", desc: "Soirée anciens, networking, afterwork" },
  { value: "formation", label: "📚 Formation", desc: "Session de formation, cours, séminaire" },
  { value: "ceremonie", label: "🎓 Remise des diplômes", desc: "Cérémonie officielle de remise des diplômes" },
  { value: "gala", label: "🥂 Gala", desc: "Soirée gala, dîner de gala, événement festif" },
  { value: "atelier", label: "🛠️ Atelier", desc: "Workshop, atelier pratique, hackathon" },
  { value: "table_ronde", label: "💬 Table ronde", desc: "Débat, échange, panel d'experts" },
  { value: "webinaire", label: "💻 Webinaire", desc: "Conférence en ligne, webinar, live" },
  { value: "reunion", label: "📋 Réunion annuelle", desc: "AG, réunion annuelle, assemblée" },
  { value: "jpo", label: "🏫 Journée portes ouvertes", desc: "JPO, découverte de l'école, visite" },
  { value: "salon", label: "🎪 Salon", desc: "Salon professionnel, forum, exposition" },
]

interface Props {
  eventId: string
  initialData: {
    nom: string
    slug: string
    typeLocalisation: string
    lieuNom: string
    lieuAdresse: string
    lienVisio: string
    dateDebut: string
    dateFin: string
    heureDebut: string
    heureFin: string
    categorie: string
    description: string
    modeInscription: string
    lienExterne: string
    capaciteMax: string
    prixEntree: string
    contact: string
    tags: string
    statut: string
    existingCoverUrl: string | null
  }
}

export default function EditEventClient({ eventId, initialData }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showPastDateWarning, setShowPastDateWarning] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [visible, setVisible] = useState(false)

  // Image
  const [imageSrc, setImageSrc] = useState<string | null>(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null)
  const [finalFile, setFinalFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialData.existingCoverUrl)
  const fileRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState(initialData)

  useEffect(() => { setTimeout(() => setVisible(true), 50) }, [])

  const set = (k: string, v: string) => setFormData(prev => ({ ...prev, [k]: v }))

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setImageSrc(reader.result as string)
    reader.readAsDataURL(file)
  }

  const onCropComplete = useCallback((_: any, pixels: any) => setCroppedAreaPixels(pixels), [])

  const generateCroppedImage = async () => {
    if (!imageSrc || !croppedAreaPixels) return
    const image = new Image()
    image.src = imageSrc
    await new Promise(r => (image.onload = r))
    const canvas = document.createElement('canvas')
    canvas.width = croppedAreaPixels.width
    canvas.height = croppedAreaPixels.height
    const ctx = canvas.getContext('2d')
    if (ctx) ctx.drawImage(image, croppedAreaPixels.x, croppedAreaPixels.y, croppedAreaPixels.width, croppedAreaPixels.height, 0, 0, croppedAreaPixels.width, croppedAreaPixels.height)
    canvas.toBlob(blob => {
      if (!blob) return
      const file = new File([blob], 'couverture.jpg', { type: 'image/jpeg' })
      setFinalFile(file)
      setPreviewUrl(URL.createObjectURL(file))
      setImageSrc(null)
    }, 'image/jpeg')
  }

  const handleSave = async (statut?: string) => {
    setLoading(true)
    setError('')
    setSuccess('')
    try {
      let imageId: any = undefined
      if (finalFile) {
        const form = new FormData()
        form.append('file', finalFile)
        const r = await fetch('/api/media', { method: 'POST', body: form })
        const j = await r.json()
        imageId = j?.doc?.id ?? j?.id
      }

      const richText = {
        root: { type: 'root', children: [{ type: 'paragraph', children: [{ type: 'text', text: formData.description, version: 1 }], version: 1 }], direction: 'ltr', format: '', indent: 0, version: 1 }
      }

      const dateDebutLocal = new Date(`${formData.dateDebut}T${formData.heureDebut}:00`)
      const dateFinLocal = new Date(`${formData.dateFin}T${formData.heureFin}:00`)

      const body: any = {
        nom: formData.nom,
        typeLocalisation: formData.typeLocalisation,
        dateDebut: dateDebutLocal.toISOString(),
        dateFin: dateFinLocal.toISOString(),
        categorie: formData.categorie,
        description: richText,
        modeInscription: formData.modeInscription,
        lieuNom: formData.lieuNom || undefined,
        lieuAdresse: formData.lieuAdresse || undefined,
        lienVisio: formData.lienVisio || undefined,
        lienExterne: formData.lienExterne || undefined,
        contact: formData.contact || undefined,
        tags: formData.tags || undefined,
      }
      if (formData.capaciteMax) body.capaciteMax = Number(formData.capaciteMax)
      if (formData.prixEntree) body.prixEntree = Number(formData.prixEntree)
      if (imageId) body.couverture = imageId
      if (statut) body.statut = statut

      const res = await fetch(`/api/evenements/${eventId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      })

      if (res.ok) {
        setSuccess(statut === 'publie' ? 'Événement publié !' : statut === 'programme' ? 'Événement programmé !' : 'Modifications sauvegardées !')
        setTimeout(() => router.push('/evenements'), 1500)
      } else {
        const j = await res.json()
        setError(j.error || 'Erreur lors de la sauvegarde')
      }
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }

  const handleDelete = async () => {
    if (deleteConfirm !== formData.nom) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/evenements/${eventId}`, { method: 'DELETE', credentials: 'include' })
      if (res.ok) router.push('/evenements')
      else setError('Erreur lors de la suppression')
    } catch (e: any) { setError(e.message) }
    finally { setDeleting(false) }
  }

  const inputCls = "w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-800 outline-none focus:border-[#800020]/40 focus:bg-white transition-colors placeholder-gray-400"
  const labelCls = "block text-[10px] font-black text-gray-500 uppercase tracking-wider mb-1.5"
  const anim = (delay = 0) => ({
    opacity: visible ? 1 : 0,
    transform: visible ? 'translateY(0)' : 'translateY(16px)',
    transition: `opacity 0.4s ease ${delay}ms, transform 0.4s ease ${delay}ms`,
  })

  return (
    <>
      <style>{`
        @keyframes fadeIn { from{opacity:0}to{opacity:1} }
        @keyframes scaleIn { from{opacity:0;transform:scale(0.95)}to{opacity:1;transform:scale(1)} }
      `}</style>

      {/* Cropper */}
      {imageSrc && (
        <div className="fixed inset-0 z-50 bg-black/85 flex flex-col items-center justify-center p-4">
          <div className="relative w-full max-w-2xl h-80 rounded-2xl overflow-hidden">
            <Cropper image={imageSrc} crop={crop} zoom={zoom} aspect={16/9}
              onCropChange={setCrop} onCropComplete={onCropComplete} onZoomChange={setZoom} />
          </div>
          <div className="mt-4 w-full max-w-2xl">
            <input type="range" min={1} max={3} step={0.1} value={zoom} onChange={e => setZoom(Number(e.target.value))} className="w-full accent-[#800020]" />
          </div>
          <div className="mt-3 flex gap-3">
            <button onClick={() => setImageSrc(null)} className="px-5 py-2.5 bg-white/10 text-white rounded-xl text-xs font-black cursor-pointer hover:bg-white/20">Annuler</button>
            <button onClick={generateCroppedImage} className="px-5 py-2.5 bg-[#800020] text-white rounded-xl text-xs font-black cursor-pointer hover:bg-[#600018]">Valider</button>
          </div>
        </div>
      )}

      {/* Modale suppression */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" style={{ animation: 'fadeIn 0.2s ease' }}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden" style={{ animation: 'scaleIn 0.2s ease' }}>
            <div className="bg-red-50 border-b border-red-100 px-6 py-5 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center text-lg">🗑️</div>
              <div>
                <h3 className="text-sm font-black text-gray-900">Supprimer l'événement</h3>
                <p className="text-xs text-red-600 font-medium mt-0.5">Action irréversible</p>
              </div>
              <button onClick={() => setShowDeleteModal(false)} className="ml-auto text-gray-400 hover:text-gray-600 cursor-pointer">✕</button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <p className="text-sm text-gray-600">Tapez <span className="font-black text-gray-900">"{formData.nom}"</span> pour confirmer.</p>
              <input type="text" value={deleteConfirm} onChange={e => setDeleteConfirm(e.target.value)}
                placeholder={formData.nom}
                className={`${inputCls} ${deleteConfirm === formData.nom ? 'border-red-400 bg-red-50' : ''}`} />
              {deleteConfirm === formData.nom && <p className="text-[10px] text-emerald-600 font-bold">✓ Confirmation valide</p>}
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button onClick={() => setShowDeleteModal(false)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-xs font-black uppercase text-gray-600 hover:bg-gray-50 cursor-pointer">Annuler</button>
              <button onClick={handleDelete} disabled={deleteConfirm !== formData.nom || deleting}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-40 rounded-xl text-xs font-black uppercase text-white cursor-pointer flex items-center justify-center gap-2">
                {deleting ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : '🗑️ Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modale date passée */}
      {showPastDateWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" style={{ animation: 'fadeIn 0.2s ease' }}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden" style={{ animation: 'scaleIn 0.2s ease' }}>
            <div className="bg-amber-50 border-b border-amber-100 px-6 py-5 flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-lg flex-shrink-0">⚠️</div>
              <div>
                <h3 className="text-sm font-black text-gray-900">Date déjà passée</h3>
                <p className="text-xs text-amber-700 font-medium mt-0.5">La date de début est dans le passé</p>
              </div>
            </div>
            <div className="px-6 py-5">
              <p className="text-sm text-gray-600 leading-relaxed">
                La date sélectionnée (<span className="font-black text-gray-900">{formData.dateDebut} à {formData.heureDebut}</span>) est déjà passée.
                Si vous continuez, l'événement sera <span className="font-black text-gray-900">publié immédiatement</span> au lieu d'être programmé.
              </p>
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button onClick={() => setShowPastDateWarning(false)}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-xs font-black uppercase text-gray-600 hover:bg-gray-50 cursor-pointer transition-all">
                ← Modifier la date
              </button>
              <button onClick={() => { setShowPastDateWarning(false); handleSave('publie') }}
                className="flex-1 py-2.5 bg-[#800020] hover:bg-[#600018] text-white rounded-xl text-xs font-black uppercase cursor-pointer transition-all">
                🚀 Publier maintenant
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-gray-50 min-h-screen py-8 px-4">
        <div className="max-w-2xl mx-auto space-y-5">

          {/* Header */}
          <div style={anim(0)} className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-black text-gray-900">Modifier l'événement</h1>
              <p className="text-xs text-gray-500 mt-0.5">{formData.nom}</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setShowDeleteModal(true)}
                className="flex items-center gap-1.5 px-3 py-2 border border-red-200 text-red-500 hover:bg-red-50 rounded-xl text-xs font-black uppercase cursor-pointer transition-all">
                🗑️ Supprimer
              </button>
              <Link href="/evenements" className="text-xs font-bold text-gray-400 hover:text-gray-600">✕ Annuler</Link>
            </div>
          </div>

          {/* Messages */}
          {error && <div style={anim(0)} className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-bold text-red-600">⚠️ {error}</div>}
          {success && <div style={anim(0)} className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-600">✓ {success}</div>}

          {/* Formulaire */}
          <div style={anim(60)} className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-6 space-y-5">

              {/* Nom */}
              <div>
                <label className={labelCls}>Nom de l'événement *</label>
                <input type="text" value={formData.nom} onChange={e => set('nom', e.target.value)} className={inputCls} />
              </div>

              {/* Catégorie */}
              <div>
                <label className={labelCls}>Catégorie *</label>
                <div className="grid grid-cols-2 gap-2">
                  {CAT_OPTIONS.map(opt => (
                    <label key={opt.value}
                      className={`flex items-center gap-2.5 p-3 border rounded-xl cursor-pointer transition-all ${formData.categorie === opt.value ? 'border-[#800020] bg-red-50/50' : 'border-gray-200 hover:border-gray-300'}`}>
                      <input type="radio" name="categorie" value={opt.value} checked={formData.categorie === opt.value}
                        onChange={e => set('categorie', e.target.value)} className="hidden" />
                      <span className="text-sm">{opt.label.split(' ')[0]}</span>
                      <span className="text-xs font-bold text-gray-700">{opt.label.split(' ').slice(1).join(' ')}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Date de début *</label>
                  <input type="date" value={formData.dateDebut} onChange={e => set('dateDebut', e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Heure de début</label>
                  <input type="time" value={formData.heureDebut} onChange={e => set('heureDebut', e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Date de fin *</label>
                  <input type="date" value={formData.dateFin} onChange={e => set('dateFin', e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Heure de fin</label>
                  <input type="time" value={formData.heureFin} onChange={e => set('heureFin', e.target.value)} className={inputCls} />
                </div>
              </div>

              {/* Localisation */}
              <div>
                <label className={labelCls}>Localisation</label>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  {[{ value: 'presentiel', icon: '📍', label: 'En présentiel' }, { value: 'enligne', icon: '💻', label: 'En ligne' }].map(opt => (
                    <label key={opt.value}
                      className={`flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition-all ${formData.typeLocalisation === opt.value ? 'border-[#800020] bg-red-50/50' : 'border-gray-200'}`}>
                      <input type="radio" name="typeLocalisation" value={opt.value} checked={formData.typeLocalisation === opt.value}
                        onChange={e => set('typeLocalisation', e.target.value)} className="hidden" />
                      <span>{opt.icon}</span>
                      <span className="text-xs font-black text-gray-700">{opt.label}</span>
                    </label>
                  ))}
                </div>
                {formData.typeLocalisation === 'presentiel' ? (
                  <>
                    <input type="text" value={formData.lieuNom} onChange={e => set('lieuNom', e.target.value)} className={`${inputCls} mb-2`} placeholder="Nom du lieu" />
                    <input type="text" value={formData.lieuAdresse} onChange={e => set('lieuAdresse', e.target.value)} className={inputCls} placeholder="Adresse complète" />
                  </>
                ) : (
                  <input type="url" value={formData.lienVisio} onChange={e => set('lienVisio', e.target.value)} className={inputCls} placeholder="Lien visioconférence" />
                )}
              </div>

              {/* Inscriptions */}
              <div>
                <label className={labelCls}>Mode d'inscription</label>
                <div className="space-y-2">
                  {[
                    { value: 'plateforme', icon: '🎫', label: 'Via la plateforme' },
                    { value: 'externe', icon: '🔗', label: 'Lien externe' },
                    { value: 'libre', icon: '🚪', label: 'Entrée libre' },
                  ].map(opt => (
                    <label key={opt.value}
                      className={`flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition-all ${formData.modeInscription === opt.value ? 'border-[#800020] bg-red-50/50' : 'border-gray-200'}`}>
                      <input type="radio" name="modeInscription" value={opt.value} checked={formData.modeInscription === opt.value}
                        onChange={e => set('modeInscription', e.target.value)} className="hidden" />
                      <span>{opt.icon}</span>
                      <span className="text-xs font-black text-gray-700">{opt.label}</span>
                    </label>
                  ))}
                </div>
                {formData.modeInscription === 'externe' && (
                  <input type="url" value={formData.lienExterne} onChange={e => set('lienExterne', e.target.value)} className={`${inputCls} mt-2`} placeholder="https://..." />
                )}
              </div>

              {/* Capacité + Prix */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Capacité maximale</label>
                  <input type="number" min="0" value={formData.capaciteMax} onChange={e => set('capaciteMax', e.target.value)} className={inputCls} placeholder="Illimitée" />
                </div>
                <div>
                  <label className={labelCls}>Prix d'entrée (€)</label>
                  <input type="number" min="0" step="0.01" value={formData.prixEntree} onChange={e => set('prixEntree', e.target.value)} className={inputCls} placeholder="Gratuit" />
                </div>
              </div>

              {/* Contact + Tags */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Contact</label>
                  <input type="email" value={formData.contact} onChange={e => set('contact', e.target.value)} className={inputCls} placeholder="email@exemple.fr" />
                </div>
                <div>
                  <label className={labelCls}>Tags</label>
                  <input type="text" value={formData.tags} onChange={e => set('tags', e.target.value)} className={inputCls} placeholder="tag1, tag2..." />
                </div>
              </div>

              {/* Photo */}
              <div>
                <label className={labelCls}>Photo de couverture</label>
                <div onClick={() => fileRef.current?.click()}
                  className={`relative w-full h-40 rounded-xl border-2 border-dashed cursor-pointer overflow-hidden transition-colors ${previewUrl ? 'border-transparent' : 'border-gray-300 hover:border-[#800020]/40 bg-gray-50'}`}>
                  {previewUrl ? (
                    <>
                      <img src={previewUrl} alt="" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                        <span className="text-white text-xs font-black bg-black/50 px-3 py-1.5 rounded-xl">Changer l'image</span>
                      </div>
                    </>
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                      <span className="text-2xl">🖼️</span>
                      <p className="text-xs font-bold text-gray-400">Cliquez pour changer la photo</p>
                    </div>
                  )}
                </div>
                <input ref={fileRef} type="file" accept="image/*" onChange={onFileChange} className="hidden" />
              </div>

              {/* Description */}
              <div>
                <label className={labelCls}>Description *</label>
                <textarea value={formData.description} onChange={e => set('description', e.target.value)}
                  rows={5} className={`${inputCls} resize-none`} placeholder="Description de l'événement..." />
              </div>
            </div>

            {/* Footer actions */}
            <div className="px-6 py-4 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3">
              <button onClick={() => handleSave('brouillon')} disabled={loading}
                className="px-4 py-2.5 border border-gray-200 rounded-xl text-xs font-black uppercase text-gray-600 hover:bg-gray-50 disabled:opacity-40 cursor-pointer transition-all">
                💾 Sauvegarder brouillon
              </button>
              <div className="flex items-center gap-2">
                <button onClick={() => {
                    const debut = new Date(`${formData.dateDebut}T${formData.heureDebut}:00`)
                    if (debut <= new Date()) { setShowPastDateWarning(true); return }
                    handleSave('programme')
                  }} disabled={loading}
                  className="px-4 py-2.5 border border-amber-200 bg-amber-50 rounded-xl text-xs font-black uppercase text-amber-700 hover:bg-amber-100 disabled:opacity-40 cursor-pointer transition-all">
                  🕐 Programmer
                </button>
                <button onClick={() => handleSave('publie')} disabled={loading}
                  className="flex items-center gap-2 px-6 py-2.5 bg-[#800020] hover:bg-[#600018] text-white rounded-xl text-xs font-black uppercase cursor-pointer shadow-sm hover:-translate-y-0.5 disabled:opacity-40 transition-all">
                  {loading
                    ? <><div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> Sauvegarde...</>
                    : '🚀 Publier'
                  }
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
