'use client'
import React, { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Cropper from 'react-easy-crop'

export default function NewArticlePage() {
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
    titre: '',
    slug: '',
    description: '',
    contenu: '',
    categorie: 'vie_etablissement',
  })

  const handleTitreChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const titre = e.target.value
    const slug = titre
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '')
    setFormData({ ...formData, titre, slug })
  }

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0]
      const reader = new FileReader()
      reader.addEventListener('load', () => {
        setImageSrc(reader.result as string)
      })
      reader.readAsDataURL(file)
    }
  }

  const onCropComplete = useCallback((_croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }, [])

  const generateCroppedImage = async () => {
    if (!imageSrc || !croppedAreaPixels) return
    try {
      const image = new Image()
      image.src = imageSrc
      await new Promise((resolve) => (image.onload = resolve))

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
        const croppedFile = new File([blob], 'couverture-recadree.jpg', { type: 'image/jpeg' })
        setFinalFile(croppedFile)
        setPreviewUrl(URL.createObjectURL(croppedFile))
        setImageSrc(null)
      }, 'image/jpeg')
    } catch (e) {
      console.error(e)
      setError("Erreur lors du recadrage de l'image.")
    }
  }

  const handleSubmit = async (
    e: React.MouseEvent,
    typeStatut: 'publie' | 'brouillon' | 'attente',
  ) => {
    e.preventDefault()
    if (!finalFile)
      return setError('Veuillez importer et valider le recadrage de votre photo de couverture.')

    setLoading(true)
    setError('')

    try {
      // 1. Upload de l'image vers /api/media
      const mediaForm = new FormData()
      mediaForm.append('file', finalFile)
      const mediaRes = await fetch('/api/media', { method: 'POST', body: mediaForm })
      const mediaJson = await mediaRes.json()

      if (!mediaRes.ok) throw new Error("Échec du téléversement de l'image sur le serveur.")

      // 2. Récupération de l'ID brut renvoyé par Payload (sans forcer le format String)
      const imageId = mediaJson?.doc?.id ?? mediaJson?.id
      if (!imageId) throw new Error("L'image a été uploadée mais son ID est introuvable.")

      // 3. Format RichText Lexical structurellement valide
      const richTextContent = {
        root: {
          type: 'root',
          children: [
            {
              type: 'paragraph',
              children: [{ type: 'text', text: formData.contenu, version: 1 }],
              version: 1,
            },
          ],
          direction: 'ltr',
          format: '',
          indent: 0,
          version: 1,
        },
      }

      // 4. Payload attend la clé brute (number ou string natif selon ta base)
      const articlePayload = {
        titre: formData.titre,
        slug: formData.slug,
        description: formData.description,
        contenu: richTextContent,
        categorie: formData.categorie,
        statut: typeStatut,
        couverture: imageId, // ✅ ID natif envoyé proprement pour la relation d'upload
      }

      const articleRes = await fetch('/api/articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(articlePayload),
      })

      const resJson = await articleRes.json()

      if (articleRes.ok) {
        router.push('/blog')
      } else {
        const detailErreur =
          resJson.errors?.map((e: any) => `• ${e.message}`).join('\n') || JSON.stringify(resJson)
        setError(`Erreur de validation :\n${detailErreur}`)
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-gray-50 min-h-screen py-10 px-4 sm:px-6 lg:px-8 text-left font-sans">
      <div className="max-w-2xl mx-auto bg-white border border-gray-200 rounded-3xl p-8 shadow-sm space-y-6">
        <div>
          <h1 className="text-xl font-black text-gray-900 tracking-tight">Ajouter un article</h1>
          <p className="text-xs text-gray-400 mt-1">
            Publiez une actualité ou un événement marquant pour le réseau.
          </p>
        </div>

        {error && (
          <p className="text-xs font-bold text-center text-red-600 bg-red-50 border border-red-100 p-3 rounded-xl whitespace-pre-wrap">
            {error}
          </p>
        )}

        {/* CROPPER OVERLAY */}
        {imageSrc && (
          <div className="fixed inset-0 z-50 bg-black/80 flex flex-col items-center justify-center p-4">
            <div className="relative w-full max-w-xl h-96 bg-gray-900 rounded-2xl overflow-hidden shadow-2xl">
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
            <div className="mt-4 flex gap-3 items-center bg-white p-4 rounded-xl shadow-md w-full max-w-xl justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-gray-500 w-1/2">
                <span>Zoom :</span>
                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.1}
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>
              <div className="flex gap-2 text-xs font-black uppercase">
                <button
                  type="button"
                  onClick={() => setImageSrc(null)}
                  className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={generateCroppedImage}
                  className="px-4 py-2 bg-amber-500 text-white rounded-lg"
                >
                  Valider
                </button>
              </div>
            </div>
          </div>
        )}

        <form className="space-y-4 text-xs font-bold text-gray-600">
          <div>
            <label className="block text-gray-500 uppercase">Titre de l'article *</label>
            <input
              type="text"
              required
              value={formData.titre}
              onChange={handleTitreChange}
              className="mt-1 block w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl outline-none focus:border-amber-500 font-medium text-gray-800"
              placeholder="Ex: Grand Prix de l'Excellence 2026"
            />
          </div>

          <div>
            <label className="block text-gray-500 uppercase">Slug de l'URL *</label>
            <input
              type="text"
              required
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              className="mt-1 block w-full px-4 py-2.5 bg-gray-50 border border-gray-200 text-gray-400 rounded-xl outline-none font-mono text-[11px]"
            />
          </div>

          <div>
            <label className="block text-gray-500 uppercase">Résumé court *</label>
            <textarea
              required
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="mt-1 block w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl outline-none focus:border-amber-500 font-medium text-gray-800"
              placeholder="Courte accroche visible sur la fiche d'actualité..."
            />
          </div>

          <div>
            <label className="block text-gray-500 uppercase">Contenu de l'article *</label>
            <textarea
              required
              rows={5}
              value={formData.contenu}
              onChange={(e) => setFormData({ ...formData, contenu: e.target.value })}
              className="mt-1 block w-full px-4 py-3 bg-white border border-gray-200 rounded-xl outline-none focus:border-amber-500 font-medium text-gray-800"
              placeholder="Rédigez le corps complet de votre article..."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
            <div>
              <label className="block text-gray-500 uppercase">Catégorie cible *</label>
              <select
                value={formData.categorie}
                onChange={(e) => setFormData({ ...formData, categorie: e.target.value })}
                className="mt-1 block w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl outline-none font-medium text-gray-700"
              >
                <option value="vie_etablissement">Vie de l'établissement</option>
                <option value="portraits_anciens">Portraits d'anciens</option>
                <option value="international">International</option>
                <option value="evenements">Événements</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-500 uppercase">Photo de couverture *</label>
              <input
                type="file"
                accept="image/*"
                onChange={onFileChange}
                className="mt-1 block w-full text-gray-400 file:mr-4 file:py-1.5 file:px-4 file:rounded-xl file:border-0 file:text-[11px] file:font-black file:uppercase file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100 cursor-pointer font-medium"
              />
            </div>
          </div>

          {previewUrl && (
            <div className="pt-2">
              <p className="text-gray-400 text-[10px] uppercase mb-1">Aperçu sélectionné :</p>
              <div className="w-48 h-28 rounded-xl overflow-hidden border border-gray-200">
                <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row justify-end items-center gap-2 pt-4 border-t border-gray-100 text-[10px] uppercase tracking-wider font-black">
            <button
              type="button"
              disabled={loading}
              onClick={(e) => handleSubmit(e, 'brouillon')}
              className="w-full sm:w-auto px-5 py-3 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-colors"
            >
              Enregistrer en brouillon
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={(e) => handleSubmit(e, 'publie')}
              className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
            >
              {loading ? 'Traitement...' : 'Soumettre la publication'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
