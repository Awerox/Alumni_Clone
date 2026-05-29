// app/forgot/page.tsx  ← fichier à créer
'use client'
import React, { useState } from 'react'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      await fetch('/api/alumni/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      // On affiche toujours le même message, qu'un compte existe ou non
      // (ne pas confirmer si un email est enregistré = sécurité)
      setSent(true)
    } catch {
      setError('Une erreur réseau est survenue. Veuillez réessayer.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-md w-full bg-white p-10 rounded-2xl shadow-xl border border-gray-100">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-enc/10 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" className="text-enc" style={{color: 'var(--color-enc, #4f46e5)'}}>
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900">Mot de passe oublié ?</h1>
          <p className="mt-2 text-sm text-gray-500 max-w-xs mx-auto">
            Saisissez votre email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
          </p>
        </div>

        {sent ? (
          <div className="text-center space-y-5">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-50 mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" className="text-emerald-500">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
              </svg>
            </div>
            <p className="text-gray-700 font-semibold text-sm">
              Si un compte existe avec l'adresse <strong>{email}</strong>, vous recevrez un email dans quelques minutes.
            </p>
            <p className="text-gray-400 text-xs">
              Pensez à vérifier vos spams.
            </p>
            <Link
              href="/login"
              className="inline-block mt-4 text-xs font-black text-enc hover:underline uppercase tracking-widest"
            >
              ← Retour à la connexion
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            {error && (
              <p role="alert" className="text-red-600 text-xs font-bold text-center bg-red-50 py-2.5 rounded-xl border border-red-100">
                {error}
              </p>
            )}

            <div>
              <label htmlFor="email" className="block text-xs font-bold uppercase text-gray-500 tracking-wider mb-1">
                Adresse email
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                disabled={isSubmitting}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre@email.com"
                className="block w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-enc/20 focus:border-enc outline-none transition-all disabled:opacity-50 text-sm font-medium"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !email}
              className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-md text-xs font-black uppercase tracking-widest text-white bg-enc hover:brightness-110 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Envoi en cours...' : 'Envoyer le lien de réinitialisation'}
            </button>

            <p className="text-center text-xs text-gray-400 pt-2">
              <Link href="/login" className="font-bold text-enc hover:underline">
                ← Retour à la connexion
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  )
}