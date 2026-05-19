'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (!miniatureFile || !banniereFile) {
      setError('Veuillez ajouter obligatoirement une miniature et une image d’en-tête.')
      setLoading(false)
      return
    }

    try {
      // 1. Upload de la Miniature
      const miniFormData = new FormData()
      miniFormData.append('file', miniatureFile)
      const miniRes = await fetch('/api/media', { method: 'POST', body: miniFormData })
      if (!miniRes.ok) throw new Error('Échec de l’upload de la miniature.')
      const miniJson = await miniRes.json()

      // ✅ CORRECTION DU CRASH : Accès direct à l'id racine (Payload 3)
      const miniatureId = miniJson.id

      // 2. Upload de la Bannière d'en-tête
      const bannerFormData = new FormData()
      bannerFormData.append('file', banniereFile)
      const bannerRes = await fetch('/api/media', { method: 'POST', body: bannerFormData })
      if (!bannerRes.ok) throw new Error('Échec de l’upload de l’image d’en-tête.')
      const bannerJson = await bannerRes.json()

      // ✅ CORRECTION DU CRASH
      const banniereId = bannerJson.id

      // 3. Création finale du groupe
      const groupRes = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titre: formData.titre,
          slug: generateSlug(formData.titre),
          description: formData.description,
          categorie: formData.categorie,
          miniature: miniatureId,
          banniere: banniereId,
          isPublic: formData.isPublic,
          restrictDiplome: formData.restrictDiplome || null,
          restrictCampus: formData.restrictCampus || null,
          restrictCategorie: formData.restrictCategorie || null,
          restrictPromotion: formData.restrictPromotion || null,
        }),
      })

      if (groupRes.ok) {
        router.push('/groups')
      } else {
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
    <div className="bg-white min-h-screen py-10 px-4 sm:px-6 lg:px-8 text-left font-sans">
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
          {/* Ligne : Titre & Slug */}
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

          {/* Ligne : Miniature & Image d'en-tête */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label>
                Miniature <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-3">
                <input
                  required
                  type="file"
                  accept="image/*"
                  id="miniature"
                  className="hidden"
                  onChange={(e) => setMiniatureFile(e.target.files?.[0] || null)}
                />
                <label
                  htmlFor="miniature"
                  className="px-3 py-2 bg-amber-400/10 border border-amber-400/30 text-amber-800 rounded-md cursor-pointer hover:bg-amber-400/20 transition-colors uppercase tracking-wider text-[10px]"
                >
                  📁 {miniatureFile ? 'Image chargée' : 'Ajouter miniature'}
                </label>
                <span className="text-[10px] text-gray-400 font-medium font-normal">
                  Taille recommandée : 300 × 300
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label>
                Image d'en-tête <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-3">
                <input
                  required
                  type="file"
                  accept="image/*"
                  id="banniere"
                  className="hidden"
                  onChange={(e) => setBanniereFile(e.target.files?.[0] || null)}
                />
                <label
                  htmlFor="banniere"
                  className="px-3 py-2 bg-amber-400/10 border border-amber-400/30 text-amber-800 rounded-md cursor-pointer hover:bg-amber-400/20 transition-colors uppercase tracking-wider text-[10px]"
                >
                  📁 {banniereFile ? 'Image chargée' : "Ajouter image d'en-tête"}
                </label>
                <span className="text-[10px] text-gray-400 font-medium font-normal">
                  Taille recommandée : 800 × 480
                </span>
              </div>
            </div>
          </div>

          {/* Catégorie */}
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

          {/* Description */}
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

          {/* 🔐 SECTION RESTRICTION VISIBILITÉ (CONFORME MAQUETTE) */}
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

          {/* Droit d'accès */}
          <div className="space-y-2">
            <label>
              Droit d'accès au groupe <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, isPublic: true })}
                className={`px-4 py-2 rounded-md font-bold transition-all border ${
                  formData.isPublic
                    ? 'bg-purple-700 border-purple-700 text-white'
                    : 'bg-white border-gray-300 text-gray-500'
                }`}
              >
                Groupe public
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, isPublic: false })}
                className={`px-4 py-2 rounded-md font-bold transition-all border ${
                  !formData.isPublic
                    ? 'bg-purple-700 border-purple-700 text-white'
                    : 'bg-white border-gray-300 text-gray-500'
                }`}
              >
                Groupe privé
              </button>
            </div>
            <p className="text-[10px] text-gray-400 font-normal mt-1">
              Le groupe peut être rejoint par n'importe quel membre du réseau.
            </p>
          </div>

          {/* Actions Finales */}
          <div className="pt-4 flex gap-2 justify-start text-[11px]">
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-300 shadow-sm"
            >
              {loading ? 'Enregistrement...' : 'Enregistrer'}
            </button>
            <Link
              href="/groups"
              className="px-4 py-2 border border-gray-300 bg-white text-gray-600 rounded-md hover:bg-gray-50 transition-colors text-center"
            >
              Annuler
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
