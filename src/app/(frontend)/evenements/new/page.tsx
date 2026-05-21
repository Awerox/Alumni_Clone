'use client'
import React, { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Cropper from 'react-easy-crop'

export default function NewEventPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [imageSrc, setImageSrc] = useState<string | null>(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null)
  const [finalFile, setFinalFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    nom: '',
    slug: '',
    typeLocalisation: 'presentiel',
    dateDebut: '',
    dateFin: '',
    categorie: 'conference',
    description: '',
    modeInscription: 'plateforme',
  })

  const handleNomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nom = e.target.value
    const slug = nom
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '')
    setFormData({ ...formData, nom, slug })
  }

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0]
      const reader = new FileReader()
      reader.addEventListener('load', () => setImageSrc(reader.result as string))
      reader.readAsDataURL(file)
    }
  }

  const onCropComplete = useCallback((_area: any, pixels: any) => setCroppedAreaPixels(pixels), [])

  const generateCroppedImage = async () => {
    if (!imageSrc || !croppedAreaPixels) return
    try {
      const image = new Image()
      image.src = imageSrc
      await new Promise((r) => (image.onload = r))
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      canvas.width = croppedAreaPixels.width
      canvas.height = croppedAreaPixels.height
      if (ctx) {
        ctx.drawImage(
          image,
          croppedAreaPixels.x,
          croppedAreaPixels.y,
          croppedAreaPixels.width,
          croppedAreaPixels.height,
          0,
          0,
          croppedAreaPixels.width,
          croppedAreaPixels.height,
        )
      }
      canvas.toBlob((blob) => {
        if (!blob) return
        const croppedFile = new File([blob], 'couverture-event.jpg', { type: 'image/jpeg' })
        setFinalFile(croppedFile)
        setPreviewUrl(URL.createObjectURL(croppedFile))
        setImageSrc(null)
      }, 'image/jpeg')
    } catch (e) {
      setError('Erreur de recadrage.')
    }
  }

  const handleSubmit = async (
    e: React.FormEvent,
    typeStatut: 'publie' | 'brouillon' | 'attente',
  ) => {
    e.preventDefault()
    if (!finalFile) return setError('Veuillez ajouter et valider une photo de couverture.')
    setLoading(true)
    setError('')

    try {
      const mediaForm = new FormData()
      mediaForm.append('file', finalFile)
      const mediaRes = await fetch('/api/media', { method: 'POST', body: mediaForm })
      const mediaJson = await mediaRes.json()

      const imageId = mediaJson?.doc?.id ?? mediaJson?.id
      if (!imageId) throw new Error('ID média introuvable.')

      const richTextDescription = {
        root: {
          type: 'root',
          children: [
            {
              type: 'paragraph',
              children: [{ type: 'text', text: formData.description, version: 1 }],
              version: 1,
            },
          ],
          direction: 'ltr',
          format: '',
          indent: 0,
          version: 1,
        },
      }

      const eventPayload = {
        ...formData,
        description: richTextDescription,
        statut: typeStatut,
        couverture: imageId,
      }

      const res = await fetch('/api/evenements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventPayload),
      })

      if (res.ok) {
        router.push('/evenements')
      } else {
        const errJson = await res.json()
        setError(errJson.errors?.[0]?.message || 'Erreur lors de la sauvegarde.')
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-gray-50 min-h-screen py-10 px-4 text-left font-sans text-xs font-bold text-gray-600">
      <div className="max-w-2xl mx-auto bg-white border border-gray-200 rounded-3xl p-8 shadow-sm space-y-6">
        <h1 className="text-lg font-black text-gray-900 uppercase tracking-tight text-center">
          Création d'un nouvel événement
        </h1>

        {error && (
          <p className="text-red-600 bg-red-50 p-3 rounded-xl border border-red-100 text-center">
            {error}
          </p>
        )}

        {imageSrc && (
          <div className="fixed inset-0 z-50 bg-black/80 flex flex-col items-center justify-center p-4">
            <div className="relative w-full max-w-xl h-96 bg-gray-900 rounded-2xl overflow-hidden">
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={16 / 9}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
              />
            </div>
            <div className="mt-4 flex gap-3 bg-white p-4 rounded-xl w-full max-w-xl justify-between uppercase font-black">
              <button
                type="button"
                onClick={() => setImageSrc(null)}
                className="px-4 py-2 bg-gray-100 text-gray-500 rounded-lg"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={generateCroppedImage}
                className="px-4 py-2 bg-emerald-500 text-white rounded-lg"
              >
                Valider
              </button>
            </div>
          </div>
        )}

        <form className="space-y-4">
          <div>
            <label className="text-gray-500 uppercase">Nom de l'événement *</label>
            <input
              type="text"
              required
              value={formData.nom}
              onChange={handleNomChange}
              className="mt-1 block w-full px-4 py-2.5 border border-gray-200 rounded-xl outline-none focus:border-emerald-500 font-medium text-gray-800"
              placeholder="eg. Remise des diplômes 2024"
            />
          </div>

          <div>
            <label className="text-gray-500 uppercase">Localisation de l'événement *</label>
            <div className="mt-1 flex gap-4 font-medium text-gray-700">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="typeLocalisation"
                  value="presentiel"
                  checked={formData.typeLocalisation === 'presentiel'}
                  onChange={(e) => setFormData({ ...formData, typeLocalisation: e.target.value })}
                  className="text-emerald-500 focus:ring-emerald-400"
                />{' '}
                En présentiel
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="typeLocalisation"
                  value="enligne"
                  checked={formData.typeLocalisation === 'enligne'}
                  onChange={(e) => setFormData({ ...formData, typeLocalisation: e.target.value })}
                  className="text-emerald-500 focus:ring-emerald-400"
                />{' '}
                En ligne
              </label>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-gray-500 uppercase">Date de début *</label>
              <input
                type="date"
                required
                value={formData.dateDebut}
                onChange={(e) => setFormData({ ...formData, dateDebut: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-200 rounded-xl outline-none font-medium text-gray-700"
              />
            </div>
            <div>
              <label className="text-gray-500 uppercase">Date de fin *</label>
              <input
                type="date"
                required
                value={formData.dateFin}
                onChange={(e) => setFormData({ ...formData, dateFin: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-200 rounded-xl outline-none font-medium text-gray-700"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 items-end">
            <div>
              <label className="text-gray-500 uppercase">Catégorie *</label>
              <select
                value={formData.categorie}
                onChange={(e) => setFormData({ ...formData, categorie: e.target.value })}
                className="mt-1 block w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl outline-none font-medium text-gray-700"
              >
                <option value="conference">Conférence</option>
                <option value="reseau">Soirée Réseau / Anciens</option>
                <option value="atelier">Atelier Métier</option>
                <option value="jpo">JPO / Salon</option>
              </select>
            </div>
            <div>
              <label className="text-gray-500 uppercase">Photo de couverture *</label>
              <input
                type="file"
                accept="image/*"
                onChange={onFileChange}
                className="mt-1 block w-full text-gray-400 file:mr-4 file:py-1.5 file:px-4 file:rounded-xl file:border-0 file:bg-amber-50 file:text-amber-700 file:font-black file:uppercase file:text-[10px] cursor-pointer"
              />
            </div>
          </div>

          <div>
            <label className="text-gray-500 uppercase">Ajouter une description *</label>
            <textarea
              required
              rows={5}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="mt-1 block w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-emerald-500 font-medium text-gray-800 leading-relaxed"
              placeholder="Détaillez le programme..."
            />
          </div>

          <div>
            <label className="text-gray-500 uppercase">
              Comment souhaitez-vous recevoir les inscriptions ?
            </label>
            <div className="mt-1.5 space-y-2 font-medium text-gray-700">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="modeInscription"
                  value="plateforme"
                  checked={formData.modeInscription === 'plateforme'}
                  onChange={(e) => setFormData({ ...formData, modeInscription: e.target.value })}
                  className="text-emerald-500 focus:ring-emerald-400"
                />{' '}
                Inscription via la plateforme
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="modeInscription"
                  value="externe"
                  checked={formData.modeInscription === 'externe'}
                  onChange={(e) => setFormData({ ...formData, modeInscription: e.target.value })}
                  className="text-emerald-500 focus:ring-emerald-400"
                />{' '}
                Lien d'inscription externe
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="modeInscription"
                  value="libre"
                  checked={formData.modeInscription === 'libre'}
                  onChange={(e) => setFormData({ ...formData, modeInscription: e.target.value })}
                  className="text-emerald-500 focus:ring-emerald-400"
                />{' '}
                Événement sans inscription
              </label>
            </div>
          </div>

          {previewUrl && (
            <div className="w-40 h-24 rounded-xl overflow-hidden border border-gray-200 shadow-3xs">
              <img src={previewUrl} alt="" className="w-full h-full object-cover" />
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t border-gray-100 font-black uppercase text-[10px] tracking-wider">
            <button
              type="button"
              disabled={loading}
              onClick={(e) => handleSubmit(e, 'brouillon')}
              className="px-5 py-3 bg-gray-100 text-gray-500 rounded-xl hover:bg-gray-200"
            >
              Enregistrer en brouillon
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={(e) => handleSubmit(e, 'publie')}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-sm"
            >
              {loading ? 'Sauvegarde...' : 'Soumettre à la validation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
