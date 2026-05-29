// app/new/page.tsx
'use client'
import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

// ─── Indicateur de force du mot de passe ───────────────────────────────────
function getPasswordStrength(password: string): { score: number; label: string; color: string } {
  if (!password) return { score: 0, label: '', color: '' }
  let score = 0
  if (password.length >= 8) score++
  if (password.length >= 12) score++
  if (/[A-Z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++

  if (score <= 1) return { score, label: 'Très faible', color: 'bg-red-400' }
  if (score === 2) return { score, label: 'Faible', color: 'bg-orange-400' }
  if (score === 3) return { score, label: 'Moyen', color: 'bg-yellow-400' }
  if (score === 4) return { score, label: 'Fort', color: 'bg-lime-500' }
  return { score, label: 'Très fort', color: 'bg-emerald-500' }
}

// ─── Composant PasswordInput réutilisable ──────────────────────────────────
function PasswordInput({
  id,
  value,
  onChange,
  disabled,
  autoComplete,
  showStrength = false,
}: {
  id: string
  value: string
  onChange: (v: string) => void
  disabled: boolean
  autoComplete?: string
  showStrength?: boolean
}) {
  const [show, setShow] = useState(false)
  const strength = getPasswordStrength(value)

  return (
    <div>
      <div className="relative">
        <input
          id={id}
          type={show ? 'text' : 'password'}
          required
          disabled={disabled}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete || 'current-password'}
          minLength={8}
          className="w-full px-4 py-3 pr-12 border border-gray-200 rounded-xl focus:ring-2 focus:ring-enc outline-none transition-all text-gray-800 font-medium disabled:opacity-50"
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setShow(!show)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors"
          aria-label={show ? 'Masquer' : 'Afficher'}
        >
          {show ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19M1 1l22 22"/></svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          )}
        </button>
      </div>

      {showStrength && value && (
        <div className="mt-2">
          <div className="flex gap-1 mb-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full transition-all ${
                  i <= strength.score ? strength.color : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
          <p className="text-[11px] font-semibold text-gray-500">{strength.label}</p>
        </div>
      )}
    </div>
  )
}

// ─── Composant InputField ──────────────────────────────────────────────────
function InputField({
  label,
  id,
  required,
  children,
}: {
  label: string
  id?: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1 text-left">
      <label htmlFor={id} className="text-xs font-bold uppercase text-gray-400 ml-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  )
}

const INPUT_CLASS =
  'w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-enc outline-none transition-all text-gray-800 font-medium disabled:opacity-50'
const SELECT_CLASS =
  'w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-enc bg-white text-gray-700 font-semibold cursor-pointer disabled:opacity-50'

// ─── Page principale ───────────────────────────────────────────────────────
export default function RegisterPage() {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    prenom: '',
    nom: '',
    email: '',
    password: '',
    confirmPassword: '',
    statut: '',
    promotion: '',
    diplome: '',
    poste: '',
    entreprise: '',
    ville: '',
    latitude: '',
    longitude: '',
    secteur: '',
    campus: 'bessieres',
    searchOpportunities: 'not_looking',
    mentoratActive: false,
    mentoratRole: 'filleul',
  })

  const [error, setError] = useState('')
  const [step1Errors, setStep1Errors] = useState<Record<string, string>>({})
  const [cityInput, setCityInput] = useState('')
  const [citySuggestions, setCitySuggestions] = useState<any[]>([])
  const [isCitySelected, setIsCitySelected] = useState(false)
  const [searchingCity, setSearchingCity] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  // ── Validation étape 1 ─────────────────────────────────────────────────
  const validateStep1 = useCallback((): boolean => {
    const errors: Record<string, string> = {}
    if (!formData.prenom.trim()) errors.prenom = 'Prénom requis'
    if (!formData.nom.trim()) errors.nom = 'Nom requis'
    if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Email invalide'
    }
    if (formData.password.length < 8) {
      errors.password = 'Le mot de passe doit faire au moins 8 caractères'
    }
    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Les mots de passe ne correspondent pas'
    }
    setStep1Errors(errors)
    return Object.keys(errors).length === 0
  }, [formData])

  const handleNext = () => {
    if (validateStep1()) {
      setStep(2)
      setError('')
    }
  }
  const handleBack = () => {
    setStep(1)
    setError('')
  }

  const update = (field: string, value: any) =>
    setFormData((prev) => ({ ...prev, [field]: value }))

  // ── Autocomplétion ville ───────────────────────────────────────────────
  useEffect(() => {
    if (cityInput.length < 2 || isCitySelected) {
      setCitySuggestions([])
      return
    }
    const t = setTimeout(async () => {
      try {
        setSearchingCity(true)
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cityInput)}&limit=5&addressdetails=1&accept-language=fr`,
        )
        if (res.ok) setCitySuggestions(await res.json())
      } catch {
      } finally {
        setSearchingCity(false)
      }
    }, 400)
    return () => clearTimeout(t)
  }, [cityInput, isCitySelected])

  const handleSelectCity = (place: any) => {
    const city = place.display_name.split(',')[0]
    const country = place.address?.country || ''
    const formatted = country ? `${city} (${country})` : city
    setCityInput(formatted)
    setFormData((prev) => ({
      ...prev,
      ville: formatted,
      latitude: place.lat || '',
      longitude: place.lon || '',
    }))
    setIsCitySelected(true)
    setCitySuggestions([])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!isCitySelected) {
      setError('Veuillez sélectionner une ville dans la liste pour géolocaliser votre profil.')
      return
    }

    setIsSubmitting(true)
    try {
      // On ne transmet jamais confirmPassword à l'API
      const { confirmPassword, ...payload } = formData
      const res = await fetch('/api/alumni', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        router.push('/login?message=Compte créé avec succès ! Connectez-vous.')
      } else {
        const data = await res.json()
        setError(data.errors?.[0]?.message || 'Erreur lors de la création du compte.')
      }
    } catch {
      setError('Une erreur réseau est survenue.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
        {/* Header */}
        <div className="bg-enc p-8 text-white text-center">
          <h1 className="text-3xl font-black uppercase tracking-tighter">Création de compte</h1>
          <div className="flex justify-center mt-4 gap-2" role="progressbar" aria-valuenow={step} aria-valuemin={1} aria-valuemax={2}>
            <div className={`h-1.5 w-12 rounded-full transition-all ${step >= 1 ? 'bg-white' : 'bg-white/30'}`} />
            <div className={`h-1.5 w-12 rounded-full transition-all ${step >= 2 ? 'bg-white' : 'bg-white/30'}`} />
          </div>
          <p className="mt-2 text-white/70 text-sm">Étape {step} sur 2</p>
        </div>

        <form onSubmit={handleSubmit} className="p-10 space-y-6" noValidate>
          {error && (
            <p role="alert" className="bg-red-50 text-red-600 p-3 rounded-xl text-sm text-center font-bold border border-red-100">
              {error}
            </p>
          )}

          {/* ── ÉTAPE 1 ── */}
          {step === 1 && (
            <div className="space-y-4">
              <p className="text-gray-500 font-medium text-center mb-2">Commençons par faire connaissance</p>

              <div className="grid grid-cols-2 gap-4">
                <InputField label="Prénom" id="prenom" required>
                  <input
                    id="prenom"
                    required
                    autoComplete="given-name"
                    className={`${INPUT_CLASS} ${step1Errors.prenom ? 'border-red-400' : ''}`}
                    value={formData.prenom}
                    onChange={(e) => update('prenom', e.target.value)}
                  />
                  {step1Errors.prenom && <p className="text-[11px] text-red-500 mt-1">{step1Errors.prenom}</p>}
                </InputField>

                <InputField label="Nom" id="nom" required>
                  <input
                    id="nom"
                    required
                    autoComplete="family-name"
                    className={`${INPUT_CLASS} ${step1Errors.nom ? 'border-red-400' : ''}`}
                    value={formData.nom}
                    onChange={(e) => update('nom', e.target.value)}
                  />
                  {step1Errors.nom && <p className="text-[11px] text-red-500 mt-1">{step1Errors.nom}</p>}
                </InputField>
              </div>

              <InputField label="Email" id="email" required>
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  className={`${INPUT_CLASS} ${step1Errors.email ? 'border-red-400' : ''}`}
                  value={formData.email}
                  onChange={(e) => update('email', e.target.value)}
                  placeholder="votre@email.com"
                />
                {step1Errors.email && <p className="text-[11px] text-red-500 mt-1">{step1Errors.email}</p>}
              </InputField>

              <InputField label="Mot de passe" id="password" required>
                <PasswordInput
                  id="password"
                  value={formData.password}
                  onChange={(v) => update('password', v)}
                  disabled={false}
                  autoComplete="new-password"
                  showStrength
                />
                {step1Errors.password && <p className="text-[11px] text-red-500 mt-1">{step1Errors.password}</p>}
              </InputField>

              <InputField label="Confirmer le mot de passe" id="confirmPassword" required>
                <PasswordInput
                  id="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={(v) => update('confirmPassword', v)}
                  disabled={false}
                  autoComplete="new-password"
                />
                {step1Errors.confirmPassword && (
                  <p className="text-[11px] text-red-500 mt-1">{step1Errors.confirmPassword}</p>
                )}
              </InputField>

              <button
                type="button"
                onClick={handleNext}
                className="w-full py-4 bg-enc text-white rounded-xl font-bold uppercase tracking-widest hover:brightness-110 transition-all mt-4"
              >
                Suivant →
              </button>
            </div>
          )}

          {/* ── ÉTAPE 2 ── */}
          {step === 2 && (
            <div className="space-y-4">
              <p className="text-gray-500 font-medium text-center mb-2">Votre parcours et situation actuelle</p>

              <div className="grid grid-cols-2 gap-4">
                <InputField label="Statut" required>
                  <select required className={SELECT_CLASS} value={formData.statut} onChange={(e) => update('statut', e.target.value)}>
                    <option value="">Sélectionnez...</option>
                    <option value="etudiant">Étudiant</option>
                    <option value="alumni">Alumni (Ancien)</option>
                  </select>
                </InputField>
                <InputField label="Promotion" required>
                  <select required className={SELECT_CLASS} value={formData.promotion} onChange={(e) => update('promotion', e.target.value)}>
                    <option value="">Sélectionnez...</option>
                    {['2026', '2025', '2024', '2023', '2022'].map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </InputField>
              </div>

              <InputField label="Diplôme suivi à l'ENC" required>
                <select required className={SELECT_CLASS} value={formData.diplome} onChange={(e) => update('diplome', e.target.value)}>
                  <option value="">Sélectionnez votre cursus...</option>
                  <option value="bts_sio_slam">BTS SIO (SLAM)</option>
                  <option value="bts_sio_sisr">BTS SIO (SISR)</option>
                  <option value="bts_assurance">BTS Assurance</option>
                  <option value="bts_cg">BTS CG (Comptabilité)</option>
                  <option value="bts_communication">BTS Communication</option>
                  <option value="bts_ci">BTS Commerce International</option>
                  <option value="bts_gpme">BTS GPME</option>
                  <option value="bts_mco">BTS MCO</option>
                  <option value="bts_ndrc">BTS NDRC</option>
                  <option value="bts_sam">BTS SAM</option>
                  <option value="bts_tourisme">BTS Tourisme</option>
                  <option value="dcg">DCG</option>
                </select>
              </InputField>

              <div className="grid grid-cols-2 gap-4">
                <InputField label="Campus" required>
                  <select required className={SELECT_CLASS} value={formData.campus} onChange={(e) => update('campus', e.target.value)}>
                    <option value="bessieres">Bessières (ENC)</option>
                    <option value="autre">Autre campus</option>
                  </select>
                </InputField>
                <InputField label="Marché pro" required>
                  <select required className={SELECT_CLASS} value={formData.searchOpportunities} onChange={(e) => update('searchOpportunities', e.target.value)}>
                    <option value="not_looking">En poste / Non dispo</option>
                    <option value="searching">En recherche active</option>
                    <option value="listening">À l'écoute du marché</option>
                  </select>
                </InputField>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <InputField label="Poste actuel / de stage">
                  <input placeholder="ex: Développeur..." className={INPUT_CLASS} value={formData.poste} onChange={(e) => update('poste', e.target.value)} />
                </InputField>
                <InputField label="Entreprise">
                  <input placeholder="ex: Orange, Capgemini..." className={INPUT_CLASS} value={formData.entreprise} onChange={(e) => update('entreprise', e.target.value)} />
                </InputField>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Autocomplétion ville */}
                <div className="space-y-1 text-left relative">
                  <label className="text-xs font-bold uppercase text-gray-400 ml-1">
                    Ville de résidence <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      required
                      placeholder="Tapez le nom de votre ville..."
                      aria-autocomplete="list"
                      aria-expanded={citySuggestions.length > 0}
                      className={`w-full px-4 py-3 pr-10 border rounded-xl outline-none transition-all font-medium ${
                        isCitySelected
                          ? 'border-emerald-400 bg-emerald-50/30 text-emerald-900 focus:ring-emerald-400'
                          : 'border-gray-200 text-gray-800 focus:ring-2 focus:ring-enc'
                      }`}
                      value={cityInput}
                      onChange={(e) => {
                        setCityInput(e.target.value)
                        setIsCitySelected(false)
                      }}
                    />
                    {isCitySelected && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500" aria-hidden="true">✓</span>
                    )}
                    {searchingCity && !isCitySelected && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-[10px] font-bold">…</span>
                    )}
                  </div>

                  {citySuggestions.length > 0 && (
                    <ul role="listbox" className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-2xl z-50 max-h-48 overflow-y-auto">
                      {citySuggestions.map((place, i) => (
                        <li key={i}>
                          <button
                            type="button"
                            role="option"
                            onClick={() => handleSelectCity(place)}
                            className="w-full text-left px-4 py-2.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 hover:text-enc transition-colors border-b last:border-0 border-gray-100"
                          >
                            🌍 {place.display_name.split(',').slice(0, 3).join(',')}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <InputField label="Secteur">
                  <select className={SELECT_CLASS} value={formData.secteur} onChange={(e) => update('secteur', e.target.value)}>
                    <option value="">Sélectionnez...</option>
                    <option value="it">Informatique / Tech</option>
                    <option value="finance">Finance / Gestion</option>
                    <option value="commerce">Commerce / Vente</option>
                    <option value="assurance">Assurance / Banque</option>
                    <option value="tourisme">Tourisme / Voyage</option>
                  </select>
                </InputField>
              </div>

              {/* Mentorat */}
              <div className="pt-4 border-t border-gray-100">
                <label className="flex items-start gap-3 cursor-pointer p-3 rounded-xl hover:bg-gray-50 transition-colors">
                  <input
                    type="checkbox"
                    className="w-5 h-5 mt-0.5 border-2 border-gray-300 rounded text-enc focus:ring-enc cursor-pointer"
                    checked={formData.mentoratActive}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        mentoratActive: e.target.checked,
                        mentoratRole: e.target.checked ? 'mentor' : 'filleul',
                      }))
                    }
                  />
                  <div>
                    <span className="font-bold text-gray-700 block text-[13px]">Souhaitez-vous devenir Mentor ?</span>
                    <p className="text-gray-400 text-[11px] mt-0.5">Partagez votre expérience avec les futurs diplômés.</p>
                  </div>
                </label>
              </div>

              <div className="flex gap-4 pt-2">
                <button type="button" onClick={handleBack} className="flex-1 py-4 border-2 border-gray-100 text-gray-400 rounded-xl font-bold uppercase text-xs hover:bg-gray-50 transition-all">
                  ← Retour
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-[2] py-4 bg-enc text-white rounded-xl font-bold uppercase text-xs tracking-widest hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Création en cours...' : 'Finaliser l\'inscription'}
                </button>
              </div>
            </div>
          )}
        </form>

        <div className="p-8 bg-gray-50 border-t border-gray-100 text-center">
          <p className="text-sm text-gray-500">
            Déjà membre ?{' '}
            <Link href="/login" className="text-enc font-black hover:underline">Se connecter</Link>
          </p>
        </div>
      </div>
    </div>
  )
}