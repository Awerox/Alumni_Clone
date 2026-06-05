'use client'
import React, { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'

const MAX_ATTEMPTS = 5
const LOCKOUT_SECONDS = 30

function PasswordInput({
  value,
  onChange,
  disabled,
  placeholder,
  autoComplete,
}: {
  value: string
  onChange: (v: string) => void
  disabled: boolean
  placeholder?: string
  autoComplete?: string
}) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative">
      <input
        type={show ? 'text' : 'password'}
        required
        disabled={disabled}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete || 'current-password'}
        placeholder={placeholder}
        className="mt-1 block w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-enc/20 focus:border-enc outline-none transition-all disabled:opacity-50 text-sm font-medium"
      />
      <button
        type="button"
        tabIndex={-1}
        onClick={() => setShow(!show)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors"
        aria-label={show ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
      >
        {show ? (
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
        )}
      </button>
    </div>
  )
}

function LoginContent() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [attempts, setAttempts] = useState(0)
  const [lockoutUntil, setLockoutUntil] = useState<number | null>(null)
  const [countdown, setCountdown] = useState(0)

  const searchParams = useSearchParams()
  const router = useRouter()
  
  const message = searchParams.get('message')
  const rawRedirect = searchParams.get('redirect')

  const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'
  const redirectUri = `${baseUrl}/api/oauth/google/callback`

  let redirectTo = '/'
  if (rawRedirect) {
    try {
      if (typeof window !== 'undefined') {
        const parsed = new URL(rawRedirect, window.location.origin)
        if (parsed.origin === window.location.origin) {
          redirectTo = parsed.pathname + parsed.search
        }
      }
    } catch {
      redirectTo = rawRedirect.startsWith('/') ? rawRedirect : '/'
    }
  }

  const loginWithGoogleUrl = `https://accounts.google.com/o/oauth2/v2/auth?` + new URLSearchParams({
    client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '',
    redirect_uri: `${baseUrl}/api/oauth/google/callback`,
    response_type: 'code',
    scope: 'openid email profile',
  }).toString()

  const loginWithLinkedinUrl = `https://www.linkedin.com/oauth/v2/authorization?` + new URLSearchParams({
    client_id: process.env.NEXT_PUBLIC_LINKEDIN_CLIENT_ID || '',
    redirect_uri: `${baseUrl}/api/oauth/linkedin/callback`,
    response_type: 'code',
    scope: 'openid profile email',
  }).toString()

  // Affiche le message de succès post-inscription
  useEffect(() => {
    if (message) setSuccessMsg(message)
  }, [message])

  // Compte à rebours de lockout
  useEffect(() => {
    if (!lockoutUntil) return
    const interval = setInterval(() => {
      const remaining = Math.ceil((lockoutUntil - Date.now()) / 1000)
      if (remaining <= 0) {
        setLockoutUntil(null)
        setAttempts(0)
        setCountdown(0)
        clearInterval(interval)
      } else {
        setCountdown(remaining)
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [lockoutUntil])

  const isLocked = lockoutUntil !== null && Date.now() < lockoutUntil

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isLocked) return

    setError('')
    setIsSubmitting(true)

    try {
      const res = await fetch('/api/alumni/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, rememberMe }),
      })

      if (res.ok) {
        window.location.href = redirectTo
      } else {
        const newAttempts = attempts + 1
        setAttempts(newAttempts)

        if (newAttempts >= MAX_ATTEMPTS) {
          setLockoutUntil(Date.now() + LOCKOUT_SECONDS * 1000)
          setError(`Trop de tentatives. Veuillez attendre ${LOCKOUT_SECONDS} secondes avant de réessayer.`)
        } else {
          setError(`Identifiants incorrects. ${MAX_ATTEMPTS - newAttempts} tentative(s) restante(s).`)
        }
      }
    } catch {
      setError('Une erreur réseau est survenue. Veuillez réessayer.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-md w-full space-y-6 bg-white p-10 rounded-2xl shadow-xl border border-gray-100 font-sans text-left">
        <div className="text-center">
          <div className="inline-block bg-enc p-3 rounded-lg text-white font-bold text-2xl mb-4 select-none">
            E
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Accédez à votre réseau</h1>
          <p className="mt-2 text-sm text-gray-600">
            Connectez-vous pour retrouver vos anciens camarades.
          </p>
        </div>

        {successMsg && (
          <div role="alert" className="flex items-center gap-2 bg-emerald-50 text-emerald-700 border border-emerald-200 px-4 py-3 rounded-xl text-sm font-medium">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" className="flex-shrink-0"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
            {successMsg}
          </div>
        )}

        <form className="space-y-4" onSubmit={handleLogin} noValidate>
          {error && <p role="alert" className="text-red-600 text-xs font-bold text-center bg-red-50 py-2.5 px-4 rounded-xl border border-red-100">{error}</p>}

          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-xs font-bold uppercase text-gray-500 tracking-wider pl-0.5">Email</label>
              <input id="email" type="email" required disabled={isSubmitting || isLocked} value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-enc/20 focus:border-enc outline-none transition-all disabled:opacity-50 text-sm font-medium" placeholder="votre@email.com" />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-bold uppercase text-gray-500 tracking-wider pl-0.5">Mot de passe</label>
              <PasswordInput value={password} onChange={setPassword} disabled={isSubmitting || isLocked} />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-enc focus:ring-enc" />
              <span className="text-xs font-medium text-gray-600">Se souvenir de moi</span>
            </label>
            <Link href="/forgot" className="text-xs font-bold text-enc hover:underline">Mot de passe oublié ?</Link>
          </div>

          <button type="submit" disabled={isSubmitting || isLocked} className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-md text-xs font-black uppercase tracking-widest text-white bg-enc hover:brightness-110 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed">
            {isLocked ? `Réessayez dans ${countdown}s` : isSubmitting ? 'Connexion en cours...' : 'Se connecter'}
          </button>
        </form>

        {/* 🔘 SÉPARATEUR INTERMÉDIAIRE POUR L'ACCÈS SOCIAL */}
        <div className="relative flex py-2 items-center text-gray-300">
          <div className="flex-grow border-t border-gray-200/70"></div>
          <span className="flex-shrink mx-3 text-[9px] font-black uppercase text-gray-400 select-none">Ou continuer avec</span>
          <div className="flex-grow border-t border-gray-200/70"></div>
        </div>

        {/* 🤝 BOUTONS DE CONNEXION GOOGLE & LINKEDIN */}
        <div className="grid grid-cols-2 gap-3 text-xs font-bold text-gray-700">
          <a href={isLocked ? '#' : loginWithGoogleUrl} onClick={(e) => isLocked && e.preventDefault()} className={`flex items-center justify-center gap-2 py-3 border border-gray-200 rounded-xl bg-white hover:bg-gray-50 transition-colors shadow-2xs ${isLocked ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}>
            <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-4 h-4 select-none" alt="" />
            <span>Google</span>
          </a>

          <a href={isLocked ? '#' : loginWithLinkedinUrl} onClick={(e) => isLocked && e.preventDefault()} className={`flex items-center justify-center gap-2 py-3 border border-gray-200 rounded-xl bg-white hover:bg-gray-50 transition-colors shadow-2xs ${isLocked ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}>
            <img src="https://www.svgrepo.com/show/475661/linkedin-color.svg" className="w-4 h-4 select-none" alt="" />
            <span>LinkedIn</span>
          </a>
        </div>

        <p className="text-center text-xs font-medium text-gray-500 pt-2">
          Pas encore de compte ?{' '}
          <Link href="/new" className="font-black text-enc hover:underline">S'inscrire</Link>
        </p>
      </div>
    </div>
  )
}

// ─── 🛡️ EXPORT GLOBAL SOUS PROTÉGÉ PAR LE BLOC SUSPENSE ───
export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center font-bold text-enc animate-pulse uppercase">Chargement de l'environnement...</div>}>
      <LoginContent />
    </Suspense>
  )
}