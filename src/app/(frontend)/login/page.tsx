'use client'
import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    try {
      const res = await fetch('/api/alumni/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (res.ok) {
        // Connexion réussie : rediriger vers le dashboard ou l'accueil
        router.push('/')
        router.refresh()
      } else {
        setError(data.errors?.[0]?.message || 'Identifiants invalides')
      }
    } catch (err) {
      setError('Une erreur est survenue lors de la connexion.')
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
          {error && <p className="text-red-500 text-sm text-center bg-red-50 py-2 rounded">{error}</p>}
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input 
                type="email" 
                required 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-enc focus:border-enc outline-none" 
                placeholder="ex: xualex300@gmail.com" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Mot de passe</label>
              <input 
                type="password" 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-enc focus:border-enc outline-none" 
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Link href="/forgot" className="text-sm font-medium text-enc hover:text-orange-500">Mot de passe oublié ?</Link>
          </div>

          <button type="submit" className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-enc hover:bg-orange_bessieres transition-colors active:scale-95">
            Se connecter
          </button>
        </form>
        
        <p className="text-center text-sm text-gray-500">
          Pas encore de compte ? <Link href="/new" className="font-bold text-enc">S'inscrire</Link>
        </p>
      </div>
    </div>
  )
}