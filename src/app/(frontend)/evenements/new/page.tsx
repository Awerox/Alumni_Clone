'use client'
import React, { useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Cropper from 'react-easy-crop'

const CAT_OPTIONS = [
  { value: 'conference', label: '🎤 Conférence', desc: 'Présentation, table ronde, conférence métier' },
  { value: 'reseau', label: '🤝 Réseautage', desc: 'Soirée anciens, networking, afterwork' },
  { value: 'atelier', label: '🛠️ Atelier Métier', desc: 'Workshop, formation pratique, hackathon' },
  { value: 'jpo', label: '🎓 JPO / Salon', desc: 'Journée portes ouvertes, salon, forum' },
]

const STEPS = ['Infos générales', 'Date & lieu', 'Inscriptions', 'Photo & description']

export default function NewEventPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Image
  const [imageSrc, setImageSrc] = useState<string | null>(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null)
  const [finalFile, setFinalFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState({
    nom: '',
    slug: '',
    typeLocalisation: 'presentiel',
    lieuNom: '',
    lieuAdresse: '',
    lienVisio: '',
    dateDebut: '',
    dateFin: '',
    heureDebut: '09:00',
    heureFin: '18:00',
    categorie: 'conference',
    description: '',
    modeInscription: 'plateforme',
    lienExterne: '',
    capaciteMax: '',
    prixEntree: '',
    contact: '',
    tags: '',
  })

  const set = (k: string, v: string) => setFormData(prev => ({ ...prev, [k]: v }))

  const handleNomChange = (val: string) => {
    const slug = val.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
    setFormData(prev => ({ ...prev, nom: val, slug }))
  }

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

  // Validation par étape
  const validateStep = () => {
    if (step === 0) {
      if (!formData.nom.trim()) return 'Le nom de l\'événement est requis'
      if (!formData.categorie) return 'Sélectionnez une catégorie'
    }
    if (step === 1) {
      if (!formData.dateDebut) return 'La date de début est requise'
      if (!formData.dateFin) return 'La date de fin est requise'
      if (new Date(formData.dateFin) < new Date(formData.dateDebut)) return 'La date de fin doit être après le début'
      if (formData.typeLocalisation === 'presentiel' && !formData.lieuNom.trim()) return 'Le nom du lieu est requis'
      if (formData.typeLocalisation === 'enligne' && !formData.lienVisio.trim()) return 'Le lien de visioconférence est requis'
    }
    if (step === 3) {
      if (!finalFile) return 'La photo de couverture est requise'
      if (!formData.description.trim()) return 'La description est requise'
    }
    return null
  }

  const nextStep = () => {
    const err = validateStep()
    if (err) { setError(err); return }
    setError('')
    setStep(s => Math.min(s + 1, STEPS.length - 1))
  }

  const prevStep = () => { setError(''); setStep(s => Math.max(s - 1, 0)) }

  const handleSubmit = async (statut: 'publie' | 'brouillon') => {
    const err = validateStep()
    if (err) { setError(err); return }
    setLoading(true)
    setError('')
    try {
      // Upload image
      const mediaForm = new FormData()
      mediaForm.append('file', finalFile!)
      const mediaRes = await fetch('/api/media', { method: 'POST', body: mediaForm })
      const mediaJson = await mediaRes.json()
      const imageId = mediaJson?.doc?.id ?? mediaJson?.id
      if (!imageId) throw new Error('Erreur upload image')

      const richText = {
        root: { type: 'root', children: [{ type: 'paragraph', children: [{ type: 'text', text: formData.description, version: 1 }], version: 1 }], direction: 'ltr', format: '', indent: 0, version: 1 }
      }

      const payload: any = {
        nom: formData.nom,
        slug: formData.slug,
        typeLocalisation: formData.typeLocalisation,
        dateDebut: `${formData.dateDebut}T${formData.heureDebut}:00.000Z`,
        dateFin: `${formData.dateFin}T${formData.heureFin}:00.000Z`,
        categorie: formData.categorie,
        description: richText,
        modeInscription: formData.modeInscription,
        statut,
        couverture: imageId,
      }
      if (formData.lienExterne) payload.lienExterne = formData.lienExterne
      if (formData.lieuNom) payload.lieuNom = formData.lieuNom
      if (formData.lieuAdresse) payload.lieuAdresse = formData.lieuAdresse
      if (formData.lienVisio) payload.lienVisio = formData.lienVisio

      const res = await fetch('/api/evenements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (res.ok) router.push('/evenements')
      else {
        const json = await res.json()
        setError(json.errors?.[0]?.message || 'Erreur lors de la sauvegarde')
      }
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const inputCls = "w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-800 outline-none focus:border-[#800020]/40 focus:bg-white transition-colors placeholder-gray-400"
  const labelCls = "block text-[10px] font-black text-gray-500 uppercase tracking-wider mb-1.5"

  return (
    <>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
        .anim-fade-up { animation: fadeUp 0.35s ease both; }
        .anim-fade-in { animation: fadeIn 0.25s ease both; }
      `}</style>

      {/* Cropper modal */}
      {imageSrc && (
        <div className="fixed inset-0 z-50 bg-black/85 flex flex-col items-center justify-center p-4">
          <div className="relative w-full max-w-2xl h-96 rounded-2xl overflow-hidden">
            <Cropper image={imageSrc} crop={crop} zoom={zoom} aspect={16 / 9}
              onCropChange={setCrop} onCropComplete={onCropComplete} onZoomChange={setZoom} />
          </div>
          <div className="mt-4 flex gap-3 w-full max-w-2xl">
            <input type="range" min={1} max={3} step={0.1} value={zoom}
              onChange={e => setZoom(Number(e.target.value))}
              className="flex-1 accent-[#800020]" />
          </div>
          <div className="mt-3 flex gap-3">
            <button onClick={() => setImageSrc(null)}
              className="px-6 py-2.5 bg-white/10 text-white rounded-xl text-xs font-black uppercase cursor-pointer hover:bg-white/20 transition-colors">
              Annuler
            </button>
            <button onClick={generateCroppedImage}
              className="px-6 py-2.5 bg-[#800020] text-white rounded-xl text-xs font-black uppercase cursor-pointer hover:bg-[#600018] transition-colors">
              Valider le recadrage
            </button>
          </div>
        </div>
      )}

      <div className="bg-gray-50 min-h-screen py-10 px-4">
        <div className="max-w-2xl mx-auto space-y-6">

          {/* Header */}
          <div className="anim-fade-up flex items-center justify-between">
            <div>
              <h1 className="text-xl font-black text-gray-900">Créer un événement</h1>
              <p className="text-xs text-gray-500 mt-0.5">Étape {step + 1} sur {STEPS.length} · {STEPS[step]}</p>
            </div>
            <Link href="/evenements" className="text-xs font-bold text-gray-400 hover:text-gray-600 transition-colors">✕ Annuler</Link>
          </div>

          {/* Progress bar */}
          <div className="anim-fade-up bg-gray-200 h-1.5 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#800020] rounded-full transition-all duration-500"
              style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
            />
          </div>

          {/* Steps indicator */}
          <div className="anim-fade-up flex items-center gap-2">
            {STEPS.map((s, i) => (
              <div key={i} className="flex items-center gap-2 flex-1">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0 transition-all ${i < step ? 'bg-emerald-500 text-white' : i === step ? 'bg-[#800020] text-white' : 'bg-gray-200 text-gray-400'}`}>
                  {i < step ? '✓' : i + 1}
                </div>
                <span className={`text-[10px] font-black uppercase tracking-wide hidden sm:block ${i === step ? 'text-[#800020]' : i < step ? 'text-emerald-600' : 'text-gray-400'}`}>{s}</span>
                {i < STEPS.length - 1 && <div className={`flex-1 h-px ${i < step ? 'bg-emerald-300' : 'bg-gray-200'}`} />}
              </div>
            ))}
          </div>

          {/* Card formulaire */}
          <div className="anim-fade-up bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">

            {/* Erreur */}
            {error && (
              <div className="mx-6 mt-6 p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-bold text-red-600 flex items-center gap-2">
                <span>⚠️</span> {error}
              </div>
            )}

            <div className="p-6 space-y-5 anim-fade-in" key={step}>

              {/* ── ÉTAPE 0 : Infos générales ── */}
              {step === 0 && (
                <>
                  <div>
                    <label className={labelCls}>Nom de l'événement *</label>
                    <input type="text" value={formData.nom} onChange={e => handleNomChange(e.target.value)}
                      className={inputCls} placeholder="Ex: Conférence Alumni 2025" />
                    {formData.slug && (
                      <p className="text-[10px] text-gray-400 mt-1 font-medium">Slug : <span className="font-black text-gray-500">{formData.slug}</span></p>
                    )}
                  </div>

                  <div>
                    <label className={labelCls}>Catégorie *</label>
                    <div className="grid grid-cols-2 gap-3">
                      {CAT_OPTIONS.map(opt => (
                        <label key={opt.value}
                          className={`flex flex-col gap-1 p-3.5 border rounded-xl cursor-pointer transition-all ${formData.categorie === opt.value ? 'border-[#800020] bg-red-50/50 shadow-sm' : 'border-gray-200 hover:border-gray-300'}`}>
                          <input type="radio" name="categorie" value={opt.value} checked={formData.categorie === opt.value}
                            onChange={e => set('categorie', e.target.value)} className="hidden" />
                          <span className="text-sm font-black text-gray-800">{opt.label}</span>
                          <span className="text-[10px] text-gray-400 font-medium">{opt.desc}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className={labelCls}>Contact organisateur</label>
                    <input type="email" value={formData.contact} onChange={e => set('contact', e.target.value)}
                      className={inputCls} placeholder="email@exemple.fr" />
                  </div>

                  <div>
                    <label className={labelCls}>Tags (séparés par des virgules)</label>
                    <input type="text" value={formData.tags} onChange={e => set('tags', e.target.value)}
                      className={inputCls} placeholder="réseautage, emploi, numérique..." />
                  </div>
                </>
              )}

              {/* ── ÉTAPE 1 : Date & lieu ── */}
              {step === 1 && (
                <>
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

                  <div>
                    <label className={labelCls}>Localisation *</label>
                    <div className="grid grid-cols-2 gap-3">
                      {[{ value: 'presentiel', icon: '📍', label: 'En présentiel' }, { value: 'enligne', icon: '💻', label: 'En ligne' }].map(opt => (
                        <label key={opt.value}
                          className={`flex items-center gap-3 p-4 border rounded-xl cursor-pointer transition-all ${formData.typeLocalisation === opt.value ? 'border-[#800020] bg-red-50/50' : 'border-gray-200 hover:border-gray-300'}`}>
                          <input type="radio" name="typeLocalisation" value={opt.value} checked={formData.typeLocalisation === opt.value}
                            onChange={e => set('typeLocalisation', e.target.value)} className="hidden" />
                          <span className="text-xl">{opt.icon}</span>
                          <span className="text-xs font-black text-gray-700">{opt.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {formData.typeLocalisation === 'presentiel' ? (
                    <>
                      <div>
                        <label className={labelCls}>Nom du lieu *</label>
                        <input type="text" value={formData.lieuNom} onChange={e => set('lieuNom', e.target.value)}
                          className={inputCls} placeholder="Ex: Amphithéâtre ENC Bessières" />
                      </div>
                      <div>
                        <label className={labelCls}>Adresse complète</label>
                        <input type="text" value={formData.lieuAdresse} onChange={e => set('lieuAdresse', e.target.value)}
                          className={inputCls} placeholder="15 rue Bessières, 75017 Paris" />
                      </div>
                    </>
                  ) : (
                    <div>
                      <label className={labelCls}>Lien de visioconférence *</label>
                      <input type="url" value={formData.lienVisio} onChange={e => set('lienVisio', e.target.value)}
                        className={inputCls} placeholder="https://meet.google.com/..." />
                      <p className="text-[10px] text-gray-400 mt-1">Zoom, Google Meet, Teams, etc.</p>
                    </div>
                  )}
                </>
              )}

              {/* ── ÉTAPE 2 : Inscriptions ── */}
              {step === 2 && (
                <>
                  <div>
                    <label className={labelCls}>Mode d'inscription *</label>
                    <div className="space-y-2">
                      {[
                        { value: 'plateforme', icon: '🎫', label: 'Via la plateforme', desc: 'Les participants s\'inscrivent directement ici' },
                        { value: 'externe', icon: '🔗', label: 'Lien externe', desc: 'Redirection vers un formulaire tiers (Eventbrite, Billetweb...)' },
                        { value: 'libre', icon: '🚪', label: 'Entrée libre', desc: 'Pas d\'inscription requise' },
                      ].map(opt => (
                        <label key={opt.value}
                          className={`flex items-center gap-4 p-4 border rounded-xl cursor-pointer transition-all ${formData.modeInscription === opt.value ? 'border-[#800020] bg-red-50/50' : 'border-gray-200 hover:border-gray-300'}`}>
                          <input type="radio" name="modeInscription" value={opt.value} checked={formData.modeInscription === opt.value}
                            onChange={e => set('modeInscription', e.target.value)} className="hidden" />
                          <span className="text-xl flex-shrink-0">{opt.icon}</span>
                          <div>
                            <p className="text-xs font-black text-gray-800">{opt.label}</p>
                            <p className="text-[10px] text-gray-400 font-medium">{opt.desc}</p>
                          </div>
                          {formData.modeInscription === opt.value && (
                            <span className="ml-auto text-[#800020] text-sm">✓</span>
                          )}
                        </label>
                      ))}
                    </div>
                  </div>

                  {formData.modeInscription === 'externe' && (
                    <div>
                      <label className={labelCls}>Lien d'inscription *</label>
                      <input type="url" value={formData.lienExterne} onChange={e => set('lienExterne', e.target.value)}
                        className={inputCls} placeholder="https://..." />
                    </div>
                  )}

                  {formData.modeInscription === 'plateforme' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className={labelCls}>Capacité maximale</label>
                        <input type="number" value={formData.capaciteMax} onChange={e => set('capaciteMax', e.target.value)}
                          className={inputCls} placeholder="Ex: 50 (vide = illimitée)" min="1" />
                      </div>
                      <div>
                        <label className={labelCls}>Prix d'entrée (€)</label>
                        <input type="number" value={formData.prixEntree} onChange={e => set('prixEntree', e.target.value)}
                          className={inputCls} placeholder="0 = gratuit" min="0" step="0.50" />
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* ── ÉTAPE 3 : Photo & description ── */}
              {step === 3 && (
                <>
                  <div>
                    <label className={labelCls}>Photo de couverture * (format 16:9 recommandé)</label>
                    <div
                      onClick={() => fileRef.current?.click()}
                      className={`relative w-full h-48 rounded-xl border-2 border-dashed cursor-pointer overflow-hidden transition-colors ${previewUrl ? 'border-transparent' : 'border-gray-300 hover:border-[#800020]/40 bg-gray-50'}`}
                    >
                      {previewUrl ? (
                        <>
                          <img src={previewUrl} alt="" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                            <span className="text-white text-xs font-black uppercase bg-black/50 px-3 py-1.5 rounded-xl">Changer l'image</span>
                          </div>
                        </>
                      ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                          <div className="w-12 h-12 bg-gray-200 rounded-xl flex items-center justify-center text-xl">🖼️</div>
                          <p className="text-xs font-bold text-gray-500">Cliquez pour ajouter une photo</p>
                          <p className="text-[10px] text-gray-400">JPG, PNG · Max 5 Mo</p>
                        </div>
                      )}
                    </div>
                    <input ref={fileRef} type="file" accept="image/*" onChange={onFileChange} className="hidden" />
                  </div>

                  <div>
                    <label className={labelCls}>Description *</label>
                    <textarea value={formData.description} onChange={e => set('description', e.target.value)}
                      rows={6} className={inputCls + ' resize-none'}
                      placeholder="Présentez votre événement : programme, intervenants, objectifs..." />
                    <p className="text-[10px] text-gray-400 mt-1">{formData.description.length} caractères</p>
                  </div>

                  {/* Récap */}
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-2">
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-wider mb-2">Récapitulatif</p>
                    {[
                      { label: 'Nom', val: formData.nom },
                      { label: 'Catégorie', val: CAT_OPTIONS.find(c => c.value === formData.categorie)?.label },
                      { label: 'Date', val: formData.dateDebut ? `${formData.dateDebut} ${formData.heureDebut} → ${formData.dateFin} ${formData.heureFin}` : '—' },
                      { label: 'Lieu', val: formData.typeLocalisation === 'enligne' ? '💻 En ligne' : formData.lieuNom || '—' },
                      { label: 'Inscriptions', val: formData.modeInscription === 'plateforme' ? '🎫 Via la plateforme' : formData.modeInscription === 'externe' ? '🔗 Lien externe' : '🚪 Entrée libre' },
                    ].map(({ label, val }) => (
                      <div key={label} className="flex items-baseline gap-2">
                        <span className="text-[10px] font-black text-gray-400 uppercase w-24 flex-shrink-0">{label}</span>
                        <span className="text-xs font-bold text-gray-700 truncate">{val || '—'}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Footer navigation */}
            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
              <button onClick={prevStep} disabled={step === 0}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-black uppercase text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer">
                ← Précédent
              </button>

              {step < STEPS.length - 1 ? (
                <button onClick={nextStep}
                  className="flex items-center gap-2 px-6 py-2.5 bg-[#800020] hover:bg-[#600018] text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-sm hover:-translate-y-0.5">
                  Suivant → 
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button onClick={() => handleSubmit('brouillon')} disabled={loading}
                    className="px-4 py-2.5 border border-gray-200 rounded-xl text-xs font-black uppercase text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-all cursor-pointer">
                    💾 Brouillon
                  </button>
                  <button onClick={() => handleSubmit('publie')} disabled={loading}
                    className="flex items-center gap-2 px-6 py-2.5 bg-[#800020] hover:bg-[#600018] text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-sm hover:-translate-y-0.5 disabled:opacity-40">
                    {loading
                      ? <><div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> Publication...</>
                      : '🚀 Publier l\'événement'
                    }
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
