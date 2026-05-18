'use client'
import React, { useState } from 'react'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      const res = await fetch('/api/alumni/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const contentType = res.headers.get('content-type')
      let data: any = {}
      if (contentType && contentType.includes('application/json')) {
        data = await res.json()
      }

      if (res.ok) {
        // SOLUTION ICI : window.location.href force le navigateur à charger la page 
        // en envoyant directement le cookie de session Payload tout juste reçu.
        // Plus besoin d'actualiser manuellement !
        window.location.href = '/profile'
      } else {
        const serverMessage = data.message || data.errors?.[0]?.message || 'Identifiants invalides.'
        setError(serverMessage)
      }
    } catch (err) {
      console.error("Erreur de connexion :", err)
      setError('Une erreur réseau ou serveur est survenue.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-2xl shadow-xl border border-gray-100">
        
        <div className="text-center">
          <div className="inline-block bg-enc p-3 rounded-lg text-white font-bold text-2xl mb-4">E</div>
          <h2 className="text-3xl font-extrabold text-gray-900">Accédez à votre réseau</h2>
          <p className="mt-2 text-sm text-gray-600">Connectez-vous pour retrouver vos anciens camarades.</p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          {error && (
            <p className="text-red-500 text-xs font-bold text-center bg-red-50 py-2.5 rounded-xl border border-red-100">
              {error}
            </p>
          )}
          
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase text-gray-500 tracking-wider">Email</label>
              <input 
                type="email" 
                required 
                disabled={isSubmitting}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-enc/20 focus:border-enc outline-none transition-all disabled:opacity-50 text-sm font-medium" 
                placeholder="ex: xualex300@gmail.com" 
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-gray-500 tracking-wider">Mot de passe</label>
              <input 
                type="password" 
                required 
                disabled={isSubmitting}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-enc/20 focus:border-enc outline-none transition-all disabled:opacity-50 text-sm font-medium" 
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Link href="/forgot" className="text-xs font-bold text-enc hover:underline">
              Mot de passe oublié ?
            </Link>
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-md text-xs font-black uppercase tracking-widest text-white bg-enc hover:brightness-110 transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {isSubmitting ? 'Connexion en cours...' : 'Se connecter'}
          </button>
        </form>
        
        <p className="text-center text-xs font-medium text-gray-500">
          Pas encore de compte ? <Link href="/new" className="font-black text-enc hover:underline">S'inscrire</Link>
        </p>
      </div>
    </div>
  )
}