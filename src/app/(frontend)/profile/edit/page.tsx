'use client'
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function EditProfilePage() {
  const [formData, setFormData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/alumni/me')
        const data = await res.json()
        if (data.user) setFormData(data.user)
        else router.push('/login')
      } catch (err) { console.error(err) }
      finally { setLoading(false) }
    }
    fetchUser()
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setUpdating(true)

    try {
      const res = await fetch(`/api/alumni/${formData.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (res.ok) router.push('/profile')
      else alert("Erreur lors de la sauvegarde")
    } catch (err) { console.error(err) }
    finally { setUpdating(false) }
  }

  if (loading) return <div className="text-center py-20 font-bold text-enc">Chargement...</div>

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow-xl p-10 border border-gray-100">
        <div className="flex items-center gap-4 mb-10 border-b pb-6">
           <button onClick={() => router.back()} className="text-gray-400 hover:text-enc"><i className="fa-solid fa-arrow-left text-xl"></i></button>
           <h1 className="text-2xl font-black text-gray-800 uppercase tracking-tighter">Modifier mon profil</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Prénom</label>
              <input value={formData.prenom} onChange={(e) => setFormData({...formData, prenom: e.target.value})} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-enc outline-none font-medium"/>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Nom</label>
              <input value={formData.nom} onChange={(e) => setFormData({...formData, nom: e.target.value})} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-enc outline-none font-medium"/>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Téléphone</label>
              <input value={formData.telephone || ''} onChange={(e) => setFormData({...formData, telephone: e.target.value})} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-enc outline-none font-medium" placeholder="06..."/>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Ville</label>
              <input value={formData.ville || ''} onChange={(e) => setFormData({...formData, ville: e.target.value})} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-enc outline-none font-medium"/>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Poste actuel</label>
              <input value={formData.poste || ''} onChange={(e) => setFormData({...formData, poste: e.target.value})} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-enc outline-none font-medium"/>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Entreprise</label>
              <input value={formData.entreprise || ''} onChange={(e) => setFormData({...formData, entreprise: e.target.value})} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-enc outline-none font-medium"/>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-400 uppercase ml-1">LinkedIn (URL)</label>
            <input value={formData.linkedin || ''} onChange={(e) => setFormData({...formData, linkedin: e.target.value})} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-enc outline-none font-medium" placeholder="https://linkedin.com/in/..."/>
          </div>

          <div className="flex gap-4 pt-6">
            <button type="button" onClick={() => router.back()} className="flex-1 py-4 border-2 border-gray-100 text-gray-400 rounded-2xl font-bold uppercase text-xs hover:bg-gray-50 transition-all">Annuler</button>
            <button type="submit" disabled={updating} className="flex-[2] py-4 bg-enc text-white rounded-2xl font-bold uppercase text-xs tracking-widest hover:brightness-110 shadow-lg disabled:opacity-50">
              {updating ? 'Mise à jour...' : 'Enregistrer les changements'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}