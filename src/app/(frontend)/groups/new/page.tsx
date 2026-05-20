'use client'

import React, { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Cropper from 'react-easy-crop'

// --- FONCTIONS UTILITAIRES POUR LE RECADRAGE DANS LE NAVIGATEUR ---
const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image()
    image.addEventListener('load', () => resolve(image))
    image.addEventListener('error', (error) => reject(error))
    image.setAttribute('crossOrigin', 'anonymous')
    image.src = url
  })

const getRadianAngle = (degreeValue: number) => (degreeValue * Math.PI) / 180

async function getCroppedImg(
  imageSrc: string,
  pixelCrop: any,
  rotation = 0,
  flip = { h: false, v: false },
): Promise<File | null> {
  const image = await createImage(imageSrc)
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) return null

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

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(new File([blob], 'cropped_image.jpg', { type: 'image/jpeg' }))
      else resolve(null)
    }, 'image/jpeg')
  })
}
// -------------------------------------------------------------------

export default function CreateGroupPage() {
  const [formData, setFormData] = useState({
    titre: '',
    description: '',
    categorie: '',
    isPublic: true,
    restrictDiplome: '',
    restrictCampus: '',
    restrictCategorie: '',
    restrictPromotion: '',
  })

  const [miniatureFile, setMiniatureFile] = useState<File | null>(null)
  const [banniereFile, setBanniereFile] = useState<File | null>(null)
  const [miniaturePreview, setMiniaturePreview] = useState<string | null>(null)
  const [bannierePreview, setBannierePreview] = useState<string | null>(null)

  // ÉTATS POUR L'INTERFACE DE RECADRAGE (MODAL)
  const [cropModal, setCropModal] = useState<{
    isOpen: boolean
    type: 'miniature' | 'banniere'
    src: string
  }>({ isOpen: false, type: 'miniature', src: '' })
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [flip, setFlip] = useState({ h: false, v: false })
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const generateSlug = (text: string) =>
    text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '')

  // Ouvre le Modal de recadrage lors de la sélection d'un fichier
  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'miniature' | 'banniere',
  ) => {
    if (e.target.files && e.target.files.length > 0) {
      const reader = new FileReader()
      reader.readAsDataURL(e.target.files[0])
      reader.onload = () => {
        setCropModal({ isOpen: true, type, src: reader.result as string })
        setZoom(1)
        setRotation(0)
        setFlip({ h: false, v: false })
        setCrop({ x: 0, y: 0 })
      }
    }
  }

  // Valide le recadrage depuis le Modal
  const handleCropConfirm = async () => {
    try {
      const croppedFile = await getCroppedImg(cropModal.src, croppedAreaPixels, rotation, flip)
      if (croppedFile) {
        const previewUrl = URL.createObjectURL(croppedFile)
        if (cropModal.type === 'miniature') {
          setMiniatureFile(croppedFile)
          setMiniaturePreview(previewUrl)
        } else {
          setBanniereFile(croppedFile)
          setBannierePreview(previewUrl)
        }
      }
    } catch (e) {
      setError("Erreur lors de la sauvegarde de l'image recadrée.")
    }
    setCropModal({ ...cropModal, isOpen: false })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (!miniatureFile || !banniereFile) {
      setError('Veuillez ajouter et recadrer une miniature et une image d’en-tête.')
      setLoading(false)
      return
    }

    try {
      const miniFormData = new FormData()
      miniFormData.append('file', miniatureFile)
      const miniRes = await fetch('/api/media', { method: 'POST', body: miniFormData })
      const miniJson = await miniRes.json()
      const miniatureId = miniJson.doc?.id || miniJson.id

      const bannerFormData = new FormData()
      bannerFormData.append('file', banniereFile)
      const bannerRes = await fetch('/api/media', { method: 'POST', body: bannerFormData })
      const bannerJson = await bannerRes.json()
      const banniereId = bannerJson.doc?.id || bannerJson.id

      const groupRes = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          slug: generateSlug(formData.titre),
          miniature: miniatureId,
          banniere: banniereId,
        }),
      })

      if (groupRes.ok) router.push('/groups')
      else {
        const errData = await groupRes.json()
        setError(errData.errors?.[0]?.message || 'Erreur lors de l’enregistrement du groupe.')
      }
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white min-h-screen py-10 px-4 sm:px-6 lg:px-8 text-left font-sans relative">
      {/* 🖼️ MODAL DE RECADRAGE INTERACTIF */}
      {cropModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/90 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-black text-gray-800 uppercase tracking-tight text-sm">
                Recadrer :{' '}
                {cropModal.type === 'miniature'
                  ? 'Miniature (Carré)'
                  : "Bannière d'en-tête (Large)"}
              </h3>
              <button
                onClick={() => setCropModal({ ...cropModal, isOpen: false })}
                className="text-gray-400 hover:text-red-500 font-bold"
              >
                ✕ Fermer
              </button>
            </div>

            <div className="relative w-full h-[400px] bg-gray-900">
              <Cropper
                image={cropModal.src}
                crop={crop}
                zoom={zoom}
                rotation={rotation}
                aspect={cropModal.type === 'miniature' ? 1 : 16 / 9}
                onCropChange={setCrop}
                onCropComplete={(percent, pixels) => setCroppedAreaPixels(pixels as any)}
                onZoomChange={setZoom}
                onRotationChange={setRotation}
                transform={`translate(${crop.x}px, ${crop.y}px) rotate(${rotation}deg) scale(${flip.h ? -zoom : zoom}, ${flip.v ? -zoom : zoom})`}
              />
            </div>

            <div className="p-6 bg-white space-y-4">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">
                    🔍 Zoom ({Math.round(zoom * 100)}%)
                  </label>
                  <input
                    type="range"
                    min={1}
                    max={3}
                    step={0.1}
                    value={zoom}
                    onChange={(e) => setZoom(Number(e.target.value))}
                    className="w-full accent-enc"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">
                    🔄 Rotation ({rotation}°)
                  </label>
                  <input
                    type="range"
                    min={0}
                    max={360}
                    step={1}
                    value={rotation}
                    onChange={(e) => setRotation(Number(e.target.value))}
                    className="w-full accent-enc"
                  />
                </div>
              </div>
              <div className="flex justify-between items-center pt-2">
                <button
                  type="button"
                  onClick={() => setFlip({ ...flip, h: !flip.h })}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-xs font-bold text-gray-600 hover:bg-gray-50"
                >
                  ↔️ Effet Miroir
                </button>
                <button
                  type="button"
                  onClick={handleCropConfirm}
                  className="px-6 py-2.5 bg-enc text-white rounded-lg text-xs font-black uppercase tracking-widest hover:bg-opacity-90 shadow-md"
                >
                  ✂️ Valider le recadrage
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RESTE DU FORMULAIRE */}
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold text-gray-800 tracking-tight">Ajouter un groupe</h1>
        </div>
        {error && (
          <p className="bg-red-50 text-red-600 p-3 rounded-xl text-xs font-bold text-center border border-red-100">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 text-xs font-bold text-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label>
                Titre <span className="text-red-500">*</span>
              </label>
              <input
                required
                type="text"
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md outline-none focus:border-purple-500 font-medium text-gray-800"
                onChange={(e) => setFormData({ ...formData, titre: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-gray-400">Slug *</label>
              <input
                disabled
                type="text"
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md outline-none font-semibold text-gray-400 select-none"
                value={generateSlug(formData.titre)}
              />
            </div>
          </div>

          {/* Zones d'images */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label>
                Miniature <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-3">
                {miniaturePreview ? (
                  <img
                    src={miniaturePreview}
                    alt=""
                    className="w-12 h-12 rounded object-cover shadow-sm border border-gray-200"
                  />
                ) : (
                  <div className="w-12 h-12 rounded bg-gray-100 border border-dashed border-gray-300 flex items-center justify-center text-xl">
                    📸
                  </div>
                )}
                <div className="flex flex-col gap-1">
                  <input
                    required={!miniatureFile}
                    type="file"
                    accept="image/*"
                    id="miniature"
                    className="hidden"
                    onChange={(e) => handleFileChange(e, 'miniature')}
                  />
                  <label
                    htmlFor="miniature"
                    className="px-3 py-1.5 bg-amber-400/10 border border-amber-400/30 text-amber-800 rounded-md cursor-pointer hover:bg-amber-400/20 transition-colors uppercase tracking-wider text-[10px]"
                  >
                    {miniatureFile ? 'Modifier miniature' : 'Ajouter miniature'}
                  </label>
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label>
                Image d'en-tête <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-3">
                {bannierePreview ? (
                  <img
                    src={bannierePreview}
                    alt=""
                    className="w-20 h-12 rounded object-cover shadow-sm border border-gray-200"
                  />
                ) : (
                  <div className="w-20 h-12 rounded bg-gray-100 border border-dashed border-gray-300 flex items-center justify-center text-xl">
                    🖼️
                  </div>
                )}
                <div className="flex flex-col gap-1">
                  <input
                    required={!banniereFile}
                    type="file"
                    accept="image/*"
                    id="banniere"
                    className="hidden"
                    onChange={(e) => handleFileChange(e, 'banniere')}
                  />
                  <label
                    htmlFor="banniere"
                    className="px-3 py-1.5 bg-amber-400/10 border border-amber-400/30 text-amber-800 rounded-md cursor-pointer hover:bg-amber-400/20 transition-colors uppercase tracking-wider text-[10px]"
                  >
                    {banniereFile ? 'Modifier image' : "Ajouter image d'en-tête"}
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label>
              Catégorie <span className="text-red-500">*</span>
            </label>
            <select
              required
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md font-medium text-gray-600 outline-none cursor-pointer focus:border-purple-500"
              value={formData.categorie}
              onChange={(e) => setFormData({ ...formData, categorie: e.target.value })}
            >
              <option value="">Choisissez une catégorie parmi les suivantes ...</option>
              <option value="bts_sio">Projets Informatiques (SIO)</option>
              <option value="entrepreneuriat">Entrepreneuriat & Startups</option>
              <option value="vie_etudiante">Vie Étudiante & Associations</option>
              <option value="entraide">Entraide & Mentorat</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label>
              Description du groupe <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={5}
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md font-medium text-gray-800 outline-none focus:border-purple-500"
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="border border-gray-300 rounded-md p-5 space-y-4 bg-gray-50/30">
            <p className="text-gray-600 font-bold text-sm">Restreindre la visibilité aux :</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-gray-500">Diplômes suivants :</label>
                <select
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md font-medium text-gray-600 outline-none"
                  value={formData.restrictDiplome}
                  onChange={(e) => setFormData({ ...formData, restrictDiplome: e.target.value })}
                >
                  <option value="">Diplôme</option>
                  <option value="bts_sio_slam">BTS SIO (SLAM)</option>
                  <option value="bts_sio_sisr">BTS SIO (SISR)</option>
                  <option value="dcg">DCG</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-gray-500">Campus suivants :</label>
                <select
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md font-medium text-gray-600 outline-none"
                  value={formData.restrictCampus}
                  onChange={(e) => setFormData({ ...formData, restrictCampus: e.target.value })}
                >
                  <option value="">Campus</option>
                  <option value="bessieres">Bessières (ENC)</option>
                  <option value="autre">Autre</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-gray-500">Catégories suivantes :</label>
                <select
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md font-medium text-gray-600 outline-none"
                  value={formData.restrictCategorie}
                  onChange={(e) => setFormData({ ...formData, restrictCategorie: e.target.value })}
                >
                  <option value="">Catégorie</option>
                  <option value="etudiant">Étudiant</option>
                  <option value="alumni">Alumni</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-gray-500">Promotions suivantes :</label>
                <select
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md font-medium text-gray-600 outline-none"
                  value={formData.restrictPromotion}
                  onChange={(e) => setFormData({ ...formData, restrictPromotion: e.target.value })}
                >
                  <option value="">Promotion</option>
                  <option value="2026">2026</option>
                  <option value="2025">2025</option>
                  <option value="2024">2024</option>
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label>
              Droit d'accès au groupe <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, isPublic: true })}
                className={`px-4 py-2 rounded-md font-bold transition-all border ${formData.isPublic ? 'bg-purple-700 border-purple-700 text-white' : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'}`}
              >
                Groupe public
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, isPublic: false })}
                className={`px-4 py-2 rounded-md font-bold transition-all border ${!formData.isPublic ? 'bg-purple-700 border-purple-700 text-white' : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'}`}
              >
                Groupe privé
              </button>
            </div>

            <p className="text-[10px] text-gray-400 font-normal mt-2 transition-all">
              {formData.isPublic
                ? "✓ Le groupe peut être rejoint librement par n'importe quel membre du réseau."
                : '🔒 Les membres peuvent demander à rejoindre le groupe, mais son contenu est restreint aux seuls membres que vous avez acceptés.'}
            </p>
          </div>

          <div className="pt-4 flex gap-2 justify-start text-[11px]">
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-300 shadow-sm flex items-center justify-center min-w-[120px]"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                'Enregistrer'
              )}
            </button>
            <Link
              href="/groups"
              className="px-4 py-2 border border-gray-300 bg-white text-gray-600 rounded-md hover:bg-gray-50 transition-colors text-center min-w-[120px]"
            >
              Annuler
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
