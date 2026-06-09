'use client'
import React, { useState } from 'react'

export default function PublishBox({
  userPrenom,
  userNom,
}: {
  userPrenom: string
  userNom: string
}) {
  const [contenu, setContenu] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!contenu.trim()) return
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/alumni-posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ contenu }),
      })

      if (res.ok) {
        setContenu('')
        window.location.href = '/feed'
      } else {
        const data = await res.json()
        setError(data.error || 'Erreur lors de la publication.')
      }
    } catch (err) {
      console.error(err)
      setError('Erreur réseau.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-2xs space-y-3 text-left">
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-full bg-purple-100 text-purple-700 font-black flex items-center justify-center uppercase text-xs">
          {userPrenom[0]}{userNom[0]}
        </div>
        <span className="text-xs font-black text-gray-700">{userPrenom} {userNom}</span>
      </div>

      <form onSubmit={handlePublish} className="space-y-3">
        <textarea
          value={contenu}
          onChange={(e) => setContenu(e.target.value.slice(0, 500))}
          placeholder="Un déplacement prévu ? Une annonce à faire ? Écrivez ici un message à la communauté."
          className="w-full min-h-[60px] text-xs font-medium text-gray-600 outline-none resize-none placeholder-gray-400 bg-transparent"
        />

        {error && (
          <p className="text-[11px] text-red-500 font-bold bg-red-50 px-3 py-1.5 rounded-lg">
            {error}
          </p>
        )}

        <div className="flex justify-between items-center pt-2 border-t border-gray-100">
          <div className="flex gap-3 text-gray-400 text-sm cursor-pointer">
            <span className="hover:text-amber-500 transition-colors">😊</span>
            <span className="hover:text-purple-500 transition-colors">🖼️</span>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-[10px] font-bold ${contenu.length > 450 ? 'text-orange-400' : 'text-gray-400'}`}>
              {contenu.length}/500
            </span>
            <button
              type="submit"
              disabled={loading || !contenu.trim()}
              className="px-4 py-1.5 bg-[#800020] hover:bg-opacity-90 disabled:opacity-40 text-white text-[10px] font-black uppercase rounded-xl transition-all tracking-wider"
            >
              {loading ? '...' : 'Poster'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
