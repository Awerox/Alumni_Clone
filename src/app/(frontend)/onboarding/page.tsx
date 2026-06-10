'use client'
import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

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

function PasswordInput({ id, value, onChange, autoComplete, showStrength = false }: {
  id: string; value: string; onChange: (v: string) => void
  autoComplete?: string; showStrength?: boolean
}) {
  const [show, setShow] = useState(false)
  const strength = getPasswordStrength(value)
  return (
    <div>
      <div className="relative">
        <input
          id={id} type={show ? 'text' : 'password'}
          value={value} onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete || 'new-password'}
          className="w-full px-4 py-3 pr-12 border border-gray-200 rounded-xl focus:ring-2 focus:ring-enc outline-none transition-all text-gray-800 font-medium"
        />
        <button type="button" tabIndex={-1} onClick={() => setShow(!show)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700">
          {show
            ? <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19M1 1l22 22"/></svg>
            : <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          }
        </button>
      </div>
      {showStrength && value && (
        <div className="mt-2">
          <div className="flex gap-1 mb-1">
            {[1,2,3,4,5].map((i) => (
              <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= strength.score ? strength.color : 'bg-gray-200'}`} />
            ))}
          </div>
          <p className="text-[11px] font-semibold text-gray-500">{strength.label}</p>
        </div>
      )}
    </div>
  )
}

function InputField({ label, required, children }: {
  label: string; required?: boolean; children: React.ReactNode
}) {
  return (
    <div className="space-y-1 text-left">
      <label className="text-xs font-bold uppercase text-gray-400 ml-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  )
}

const INPUT_CLASS = 'w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-enc outline-none transition-all text-gray-800 font-medium'
const SELECT_CLASS = 'w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-enc bg-white text-gray-700 font-semibold cursor-pointer'
const TOTAL_STEPS = 3

function StepBar({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex justify-center gap-2">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className={`h-1.5 w-12 rounded-full transition-all ${i < current ? 'bg-white' : 'bg-white/30'}`} />
      ))}
    </div>
  )
}

const ONBOARDING_DRAFT_KEY = 'enc_onboarding_draft'

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [draftRestored, setDraftRestored] = useState(false)

  // ✅ nomManquant : true si le nom OAuth est un doublon du prénom
  const [nomManquant, setNomManquant] = useState(false)

  const [prenom, setPrenom] = useState('')
  const [nom, setNom] = useState('')
  const [dateNaissance, setDateNaissance] = useState('')
  const [civilite, setCivilite] = useState('')

  const [statut, setStatut] = useState('etudiant')
  const [diplome, setDiplome] = useState('')
  const [promotion, setPromotion] = useState('')
  const [campus, setCampus] = useState('bessieres')

  const [poste, setPoste] = useState('')
  const [entreprise, setEntreprise] = useState('')
  const [secteur, setSecteur] = useState('')
  const [searchOpportunities, setSearchOpportunities] = useState('not_looking')
  const [mentoratActive, setMentoratActive] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [skipPassword, setSkipPassword] = useState(false)

  // Ville
  const [cityInput, setCityInput] = useState('')
  const [citySuggestions, setCitySuggestions] = useState<any[]>([])
  const [isCitySelected, setIsCitySelected] = useState(false)
  const [searchingCity, setSearchingCity] = useState(false)
  const [villeFormatted, setVilleFormatted] = useState('')

  useEffect(() => {
    fetch('/api/alumni/me?depth=0')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data?.user) { router.push('/login'); return }
        const u = data.user
        setUser(u)
        setPrenom(u.prenom || '')
        // ── Restaurer brouillon onboarding ──────────────────────────────────
  useEffect(() => {
    try {
      const saved = localStorage.getItem(ONBOARDING_DRAFT_KEY)
      if (!saved) return
      const draft = JSON.parse(saved)
      if (draft.step && draft.step > 1) setStep(draft.step)
      if (draft.statut) setStatut(draft.statut)
      if (draft.diplome) setDiplome(draft.diplome)
      if (draft.promotion) setPromotion(draft.promotion)
      if (draft.campus) setCampus(draft.campus)
      if (draft.poste) setPoste(draft.poste)
      if (draft.entreprise) setEntreprise(draft.entreprise)
      if (draft.secteur) setSecteur(draft.secteur)
      if (draft.searchOpportunities) setSearchOpportunities(draft.searchOpportunities)
      if (draft.mentoratActive !== undefined) setMentoratActive(draft.mentoratActive)
      if (draft.cityInput) setCityInput(draft.cityInput)
      if (draft.isCitySelected) { setIsCitySelected(true); setVilleFormatted(draft.villeFormatted || '') }
      if (draft.civilite) setCivilite(draft.civilite)
      if (draft.dateNaissance) setDateNaissance(draft.dateNaissance)
      setDraftRestored(true)
    } catch {}
  }, [])

  // ── Sauvegarder à chaque modification ────────────────────────────────
  useEffect(() => {
    if (!step) return
    try {
      localStorage.setItem(ONBOARDING_DRAFT_KEY, JSON.stringify({
        step, statut, diplome, promotion, campus,
        poste, entreprise, secteur, searchOpportunities, mentoratActive,
        cityInput, isCitySelected, villeFormatted, civilite, dateNaissance,
        // Jamais de mot de passe en localStorage
      }))
    } catch {}
  }, [step, statut, diplome, promotion, campus, poste, entreprise, secteur,
      searchOpportunities, mentoratActive, cityInput, isCitySelected, villeFormatted,
      civilite, dateNaissance])

  // ✅ Détecter si nom = prénom (doublon OAuth) → forcer la saisie
        const nomEstDoublon = u.nom && u.prenom && u.nom.toLowerCase() === u.prenom.toLowerCase()
        if (nomEstDoublon || !u.nom) {
          setNom('')
          setNomManquant(true)
        } else {
          setNom(u.nom || '')
          setNomManquant(false)
        }
        setLoading(false)
      })
      .catch(() => router.push('/login'))
  }, [router])

  // ✅ Autocomplétion ville — France en priorité, fallback monde
  useEffect(() => {
    if (cityInput.length < 2 || isCitySelected) { setCitySuggestions([]); return }
    const t = setTimeout(async () => {
      try {
        setSearchingCity(true)
        // D'abord chercher en France
        const resFrance = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cityInput)}&limit=5&addressdetails=1&accept-language=fr&countrycodes=fr`
        )
        let results = resFrance.ok ? await resFrance.json() : []

        // Si aucun résultat en France → chercher dans le monde entier
        if (results.length === 0) {
          const resMonde = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cityInput)}&limit=5&addressdetails=1&accept-language=fr`
          )
          results = resMonde.ok ? await resMonde.json() : []
        }

        // Garder uniquement les villes/communes (éviter les rues, bâtiments, etc.)
        const filtered = results.filter((p: any) =>
          ['city', 'town', 'village', 'municipality', 'administrative'].includes(p.type) ||
          p.class === 'place' || p.class === 'boundary'
        )
        setCitySuggestions(filtered.length > 0 ? filtered : results.slice(0, 5))
      } catch {} finally { setSearchingCity(false) }
    }, 400)
    return () => clearTimeout(t)
  }, [cityInput, isCitySelected])

  const handleSelectCity = (place: any) => {
    // Construire un nom lisible : Ville + département/région si France, sinon Ville + Pays
    const parts = place.display_name.split(',').map((s: string) => s.trim())
    const city = parts[0]
    const country = place.address?.country || ''
    const isFrance = place.address?.country_code === 'fr'
    const dept = place.address?.state || place.address?.county || ''
    const formatted = isFrance && dept
      ? `${city} (${dept})`
      : country ? `${city} (${country})` : city

    setCityInput(formatted)
    setVilleFormatted(formatted)
    setIsCitySelected(true)
    setCitySuggestions([])
  }

  // ✅ Validation stricte — pas de skip possible
  const validateStep = useCallback((): string | null => {
    if (step === 1) {
      if (!prenom.trim()) return 'Le prénom est obligatoire.'
      if (!nom.trim()) return 'Le nom de famille est obligatoire.'
      // Vérifier que nom ≠ prénom
      if (nom.trim().toLowerCase() === prenom.trim().toLowerCase())
        return 'Veuillez saisir votre vrai nom de famille (différent du prénom).'
    }
    if (step === 2) {
      if (!statut) return 'Sélectionnez votre statut.'
      if (!diplome) return 'Sélectionnez votre diplôme.'
      if (!promotion) return 'Sélectionnez votre promotion.'
    }
    if (step === 3) {
      if (!isCitySelected) return 'La ville de résidence est obligatoire. Sélectionnez-la dans la liste.'
      if (!skipPassword) {
        if (password && password.length < 8) return 'Le mot de passe doit faire au moins 8 caractères.'
        if (password && password !== confirmPassword) return 'Les mots de passe ne correspondent pas.'
      }
    }
    return null
  }, [step, prenom, nom, diplome, promotion, statut, isCitySelected, skipPassword, password, confirmPassword])

  const handleNext = () => {
    const err = validateStep()
    if (err) { setError(err); return }
    setError('')
    setStep(s => s + 1)
  }

  const handleBack = () => { setError(''); setStep(s => s - 1) }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const err = validateStep()
    if (err) { setError(err); return }

    setIsSubmitting(true)
    setError('')

    const body: Record<string, any> = {
      prenom: prenom.trim(),
      nom: nom.trim(),
      statut,
      diplome,
      promotion: promotion ? Number(promotion) : undefined,
      formations: diplome ? [{
        nom: diplome,
        etablissement: campus === 'bessieres' ? 'ENC Bessières' : 'ENC',
        annee: promotion,
        isENC: true,
        campus,
      }] : [],
      ville: villeFormatted,
      searchOpportunities,
      mentoratActive,
      mentoratRole: mentoratActive ? 'mentor' : 'filleul',
      ...(dateNaissance ? { dateNaissance } : {}),
      ...(civilite ? { civilite } : {}),
      ...(poste ? { poste } : {}),
      ...(entreprise ? { entreprise } : {}),
      ...(secteur ? { secteur } : {}),
      ...(password && !skipPassword ? { password } : {}),
    }

    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (res.ok) {
        localStorage.removeItem(ONBOARDING_DRAFT_KEY)
        router.push('/')
      } else {
        setError(data.error || 'Erreur lors de la sauvegarde.')
      }
    } catch {
      setError('Erreur réseau. Veuillez réessayer.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-400 font-bold text-xs uppercase tracking-widest animate-pulse">Chargement...</div>
      </div>
    )
  }

  const stepSubtitles = [
    'Vérifiez et complétez vos informations',
    'Votre formation à l\'ENC Bessières',
    'Votre situation actuelle et accès au compte',
  ]

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100">

        {/* Header */}
        <div className="bg-enc p-8 text-white text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full mb-3">
            <span className="text-[10px] font-black uppercase tracking-widest text-white/80">
              Bienvenue {user?.prenom} !
            </span>
          </div>
          <h1 className="text-2xl font-black uppercase tracking-tight" style={{color: 'white', textDecoration: 'none'}}>
            Complétez votre profil
          </h1>
          <p className="text-white/60 text-xs mt-1">{stepSubtitles[step - 1]}</p>
          <div className="mt-4">
            <StepBar current={step} total={TOTAL_STEPS} />
            <p className="text-white/50 text-xs mt-2">Étape {step} sur {TOTAL_STEPS}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="p-10 space-y-5">

            {/* ✅ Bandeau brouillon restauré */}
            {draftRestored && (
              <div className="flex items-center justify-between bg-blue-50 border border-blue-100 text-blue-700 px-4 py-2.5 rounded-xl text-xs font-semibold">
                <div className="flex items-center gap-2">
                  <i className="fa-solid fa-rotate-left text-blue-400" />
                  <span>Profil repris là où vous en étiez</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    localStorage.removeItem(ONBOARDING_DRAFT_KEY)
                    setStep(1); setStatut('etudiant'); setDiplome(''); setPromotion('')
                    setCampus('bessieres'); setPoste(''); setEntreprise(''); setSecteur('')
                    setCityInput(''); setIsCitySelected(false); setVilleFormatted('')
                    setCivilite(''); setDateNaissance(''); setDraftRestored(false)
                  }}
                  className="text-blue-400 hover:text-blue-600 underline text-[11px]"
                >
                  Recommencer
                </button>
              </div>
            )}

            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm font-bold border border-red-100 flex items-center gap-2">
                <i className="fa-solid fa-triangle-exclamation flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* ══ ÉTAPE 1 — Identité ══════════════════════════════════════════ */}
            {step === 1 && (
              <div className="space-y-4">

                {/* ✅ Bandeau avertissement si nom manquant */}
                {nomManquant && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2">
                    <i className="fa-solid fa-circle-info text-amber-500 flex-shrink-0 mt-0.5" />
                    <p className="text-xs font-semibold text-amber-700">
                      Votre compte Google ne contient pas de nom de famille. Merci de le renseigner ci-dessous.
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <InputField label="Civilité">
                    <select className={SELECT_CLASS} value={civilite} onChange={e => setCivilite(e.target.value)}>
                      <option value="">—</option>
                      <option value="M.">M.</option>
                      <option value="Mme">Mme</option>
                    </select>
                  </InputField>
                  <InputField label="Date de naissance">
                    <input type="date" className={INPUT_CLASS} value={dateNaissance} onChange={e => setDateNaissance(e.target.value)} />
                  </InputField>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <InputField label="Prénom" required>
                    <input
                      className={INPUT_CLASS}
                      value={prenom}
                      onChange={e => setPrenom(e.target.value)}
                      placeholder="Jean"
                    />
                  </InputField>
                  <InputField label="Nom de famille" required>
                    <input
                      className={`${INPUT_CLASS} ${nomManquant && !nom ? 'border-amber-400 focus:ring-amber-400' : ''}`}
                      value={nom}
                      onChange={e => setNom(e.target.value)}
                      placeholder="Dupont"
                      autoFocus={nomManquant}
                    />
                  </InputField>
                </div>

                {(prenom || nom) && (
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 text-center">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">Aperçu</p>
                    <p className="font-black text-gray-800 text-sm">{civilite && `${civilite} `}{prenom} {nom}</p>
                  </div>
                )}

                <button type="button" onClick={handleNext}
                  className="w-full py-4 bg-enc text-white rounded-xl font-bold uppercase tracking-widest hover:brightness-110 transition-all mt-2">
                  Suivant →
                </button>
              </div>
            )}

            {/* ══ ÉTAPE 2 — Parcours ENC ══════════════════════════════════════ */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <InputField label="Statut" required>
                    <select className={SELECT_CLASS} value={statut} onChange={e => setStatut(e.target.value)}>
                      <option value="etudiant">Étudiant</option>
                      <option value="alumni">Alumni (Ancien)</option>
                    </select>
                  </InputField>
                  <InputField label="Promotion" required>
                    <select className={SELECT_CLASS} value={promotion} onChange={e => setPromotion(e.target.value)}>
                      <option value="">Sélectionnez...</option>
                      {Array.from({ length: 15 }, (_, i) => 2026 - i).map(y => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </InputField>
                </div>

                <InputField label="Diplôme suivi à l'ENC" required>
                  <select className={SELECT_CLASS} value={diplome} onChange={e => setDiplome(e.target.value)}>
                    <option value="">Sélectionnez votre cursus...</option>
                    <optgroup label="BTS">
                      {['BTS Assurance','BTS CG (Comptabilité et Gestion)','BTS Communication',
                        'BTS CI (Commerce International)','BTS GPME','BTS MCO','BTS NDRC',
                        'BTS SAM','BTS SIO (SLAM/SISR)','BTS Tourisme'].map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </optgroup>
                    <optgroup label="DCG">
                      <option value="DCG (Diplôme de Comptabilité et de Gestion)">DCG</option>
                    </optgroup>
                    <optgroup label="Prépa">
                      {['Classe préparatoire ATS','Classe préparatoire ENS D1',
                        'Classe préparatoire ENS D2','Classe préparatoire ECT',
                        'Classe préparatoire ECG'].map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </optgroup>
                  </select>
                </InputField>

                <InputField label="Campus">
                  <select className={SELECT_CLASS} value={campus} onChange={e => setCampus(e.target.value)}>
                    <option value="bessieres">Bessières (ENC)</option>
                    <option value="autre">Autre campus</option>
                  </select>
                </InputField>

                <div className="flex gap-4 pt-2">
                  <button type="button" onClick={handleBack}
                    className="flex-1 py-4 border-2 border-gray-100 text-gray-400 rounded-xl font-bold uppercase text-xs hover:bg-gray-50 transition-all">
                    ← Retour
                  </button>
                  <button type="button" onClick={handleNext}
                    className="flex-[2] py-4 bg-enc text-white rounded-xl font-bold uppercase tracking-widest hover:brightness-110 transition-all">
                    Suivant →
                  </button>
                </div>
              </div>
            )}

            {/* ══ ÉTAPE 3 — Pro + Ville + Mot de passe ════════════════════════ */}
            {step === 3 && (
              <div className="space-y-4">

                {/* ✅ Ville obligatoire avec France en priorité */}
                <div className="space-y-1 text-left relative">
                  <label className="text-xs font-bold uppercase text-gray-400 ml-1">
                    Ville de résidence <span className="text-red-500">*</span>
                  </label>
                  <p className="text-[10px] text-gray-400 ml-1">Commencez à taper — France en priorité</p>
                  <div className="relative">
                    <input
                      placeholder="Ex : Paris, Lyon, Marseille..."
                      className={`w-full px-4 py-3 pr-10 border rounded-xl outline-none transition-all font-medium ${
                        isCitySelected
                          ? 'border-emerald-400 bg-emerald-50/30 text-emerald-900'
                          : 'border-gray-200 text-gray-800 focus:ring-2 focus:ring-enc'
                      }`}
                      value={cityInput}
                      onChange={e => { setCityInput(e.target.value); setIsCitySelected(false); setVilleFormatted('') }}
                    />
                    {isCitySelected && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500">
                        <i className="fa-solid fa-circle-check" />
                      </span>
                    )}
                    {searchingCity && !isCitySelected && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2">
                        <div className="w-4 h-4 border-2 border-gray-300 border-t-enc rounded-full animate-spin" />
                      </span>
                    )}
                  </div>
                  {citySuggestions.length > 0 && (
                    <ul className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-2xl z-50 max-h-52 overflow-y-auto">
                      {citySuggestions.map((place, i) => {
                        const city = place.display_name.split(',')[0].trim()
                        const isFr = place.address?.country_code === 'fr'
                        const region = isFr
                          ? (place.address?.state || place.address?.county || '')
                          : (place.address?.country || '')
                        return (
                          <li key={i}>
                            <button type="button" onClick={() => handleSelectCity(place)}
                              className="w-full text-left px-4 py-2.5 hover:bg-gray-50 transition-colors border-b last:border-0 border-gray-100 flex items-center gap-3">
                              <span className="text-base">{isFr ? '🇫🇷' : '🌍'}</span>
                              <div>
                                <p className="text-xs font-bold text-gray-800">{city}</p>
                                {region && <p className="text-[10px] text-gray-400">{region}</p>}
                              </div>
                            </button>
                          </li>
                        )
                      })}
                    </ul>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <InputField label="Poste actuel">
                    <input className={INPUT_CLASS} placeholder="Développeur, Comptable..." value={poste} onChange={e => setPoste(e.target.value)} />
                  </InputField>
                  <InputField label="Entreprise">
                    <input className={INPUT_CLASS} placeholder="Nom de l'entreprise" value={entreprise} onChange={e => setEntreprise(e.target.value)} />
                  </InputField>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <InputField label="Secteur">
                    <select className={SELECT_CLASS} value={secteur} onChange={e => setSecteur(e.target.value)}>
                      <option value="">Sélectionnez...</option>
                      <option value="it">Informatique / Tech</option>
                      <option value="finance">Finance / Gestion</option>
                      <option value="commerce">Commerce / Vente</option>
                      <option value="assurance">Assurance / Banque</option>
                      <option value="tourisme">Tourisme / Voyage</option>
                      <option value="autre">Autre</option>
                    </select>
                  </InputField>
                  <InputField label="Marché pro">
                    <select className={SELECT_CLASS} value={searchOpportunities} onChange={e => setSearchOpportunities(e.target.value)}>
                      <option value="not_looking">En poste / Non dispo</option>
                      <option value="searching">En recherche active</option>
                      <option value="listening">À l'écoute du marché</option>
                    </select>
                  </InputField>
                </div>

                {/* Mentorat */}
                <div className="pt-2 border-t border-gray-100">
                  <label className="flex items-start gap-3 cursor-pointer p-3 rounded-xl hover:bg-gray-50 transition-colors">
                    <input type="checkbox"
                      className="w-5 h-5 mt-0.5 border-2 border-gray-300 rounded cursor-pointer"
                      checked={mentoratActive}
                      onChange={e => setMentoratActive(e.target.checked)}
                    />
                    <div>
                      <span className="font-bold text-gray-700 block text-[13px]">Devenir Mentor</span>
                      <p className="text-gray-400 text-[11px] mt-0.5">Partagez votre expérience avec les futurs diplômés.</p>
                    </div>
                  </label>
                </div>

                {/* Mot de passe optionnel */}
                <div className="pt-2 border-t border-gray-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-black text-gray-700 uppercase tracking-wider">Définir un mot de passe</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">Permet de se connecter par email en plus de Google/LinkedIn</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer"
                        checked={!skipPassword}
                        onChange={e => setSkipPassword(!e.target.checked)}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-checked:bg-enc rounded-full transition-all after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full" />
                    </label>
                  </div>
                  {!skipPassword && (
                    <div className="space-y-3">
                      <InputField label="Nouveau mot de passe">
                        <PasswordInput id="password" value={password} onChange={setPassword} showStrength />
                      </InputField>
                      <InputField label="Confirmer le mot de passe">
                        <PasswordInput id="confirmPassword" value={confirmPassword} onChange={setConfirmPassword} />
                        {password && confirmPassword && password !== confirmPassword && (
                          <p className="text-[11px] text-red-500 mt-1">Les mots de passe ne correspondent pas</p>
                        )}
                      </InputField>
                    </div>
                  )}
                </div>

                <div className="flex gap-4 pt-2">
                  <button type="button" onClick={handleBack}
                    className="flex-1 py-4 border-2 border-gray-100 text-gray-400 rounded-xl font-bold uppercase text-xs hover:bg-gray-50 transition-all">
                    ← Retour
                  </button>
                  <button type="submit" disabled={isSubmitting}
                    className="flex-[2] py-4 bg-enc text-white rounded-xl font-bold uppercase text-xs tracking-widest hover:brightness-110 transition-all disabled:opacity-50">
                    {isSubmitting ? 'Sauvegarde...' : 'Terminer →'}
                  </button>
                </div>
              </div>
            )}

          </div>
        </form>
      </div>
    </div>
  )
}
