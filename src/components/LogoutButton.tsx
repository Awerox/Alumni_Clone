'use client'
import React from 'react'
import { useRouter } from 'next/navigation'

const LogoutButton = () => {
  const router = useRouter()

  const handleLogout = async () => {
    try {
      // Appel à l'API de déconnexion de Payload
      const res = await fetch('/api/alumni/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      if (res.ok) {
        // Rediriger vers l'accueil et rafraîchir pour mettre à jour la Navbar
        router.push('/')
        router.refresh()
      }
    } catch (err) {
      console.error('Erreur lors de la déconnexion', err)
    }
  }

  return (
    <button
      onClick={handleLogout}
      className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-50 rounded-lg transition-colors group"
    >
      <i className="fa-solid fa-power-off group-hover:scale-110 transition-transform"></i>
      Déconnexion
    </button>
  )
}

export default LogoutButton