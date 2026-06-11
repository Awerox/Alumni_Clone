'use client'
import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const STEPS = [
  { id: 'identite', label: 'Identité', icon: '👤' },
  { id: 'parcours', label: 'Parcours ENC', icon: '🎓' },
  { id: 'pro', label: 'Situation actuelle', icon: '💼' },
]

function StepBar({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-0 mb-10">
      {STEPS.map((step, i) => (
        <React.Fragment key={step.id}>
          <div className="flex flex-col items-center gap-1.5">
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center text-base font-black border-2 transition-all ${
                i < current
                  ? 'bg-enc border-enc text-white'
                  : i === current
                    ? 'bg-white border-enc text-enc shadow-md'
                    : 'bg-white border-gray-200 text-gray-300'
              }`}
            >
              {i < current ? '✓' : step.icon}
            </div>
            <span
              className={`text-[9px] font-black uppercase tracking-wider ${
                i === current ? 'text-enc' : i < current ? 'text-enc/60' : 'text-gray-300'
              }`}
            >
              {step.label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div
              className={`flex-1 h-0.5 mx-1 mb-5 transition-all ${i < current ? 'bg-enc' : 'bg-gray-200'}`}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  )
}

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Step 0 — Identité
  const [prenom, setPrenom] = useState('')
  const [nom, setNom] = useState('')
  const [ville, setVille] = useState('')
  const [telephone, setTelephone] = useState('')

  // Step 1 — Parcours ENC
  const [statut, setStatut] = useState<'etudiant' | 'alumni'>('alumni')
  const [diplome, setDiplome] = useState('')
  const [promotion, setPromotion] = useState('')

  // Step 2 — Situation actuelle
  const [poste, setPoste] = useState('')
  const [entreprise, setEntreprise] = useState('')
  const [linkedin, setLinkedin] = useState('')
  const [bio, setBio] = useState('')

  // Pré-remplir depuis le profil existant (Google/LinkedIn peuvent avoir fourni prénom/nom)
  useEffect(() => {
    fetch('/api/alumni/me')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data) return
        setPrenom(data.prenom || '')
        setNom(data.nom || '')
        setVille(data.ville || '')
        setTelephone(data.telephone || '')
        setStatut(data.statut || 'alumni')
        setDiplome(data.diplome || '')
        setPromotion(data.promotion ? String(data.promotion) : '')
        setPoste(data.poste || '')
        setEntreprise(data.entreprise || '')
        setLinkedin(data.linkedin || '')
        setBio(data.bio || '')
      })
      .catch(() => {})
  }, [])

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setStep(s => s + 1)
  }

  const handleFinish = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      const res = await fetch('/api/alumni/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prenom: prenom.trim(),
          nom: nom.trim(),
          ville: ville.trim(),
          telephone: telephone.trim(),
          statut,
          diplome: diplome.trim(),
          promotion: promotion ? Number(promotion) : null,
          poste: poste.trim(),
          entreprise: entreprise.trim(),
          linkedin: linkedin.trim(),
          bio: bio.trim(),
        }),
      })
      if (!res.ok) throw new Error('Erreur lors de la sauvegarde.')
      router.push('/?welcome=1')
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue.')
      setSaving(false)
    }
  }

  const inputClass =
    'mt-1 block w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-enc/20 focus:border-enc outline-none transition-all text-sm font-medium disabled:opacity-50'
  const labelClass = 'block text-xs font-bold uppercase text-gray-500 tracking-wider pl-0.5'

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-lg w-full bg-white rounded-2xl shadow-xl border border-gray-100 p-10 font-sans">

        {/* Header */}
        <div className="text-center mb-8">
          <img
            src="https://www.enc-bessieres.org/wp-content/uploads/2025/01/logo_enc_2025.jpg"
            alt="ENC Bessières"
            className="w-20 h-auto mx-auto mb-4 object-contain"
          />
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
            Bienvenue dans le réseau !
          </h1>
          <p className="mt-1.5 text-sm text-gray-500 font-medium">
            Complétez votre profil en 3 étapes pour rejoindre la communauté.
          </p>
        </div>

        <StepBar current={step} />

        {error && (
          <p role="alert" className="mb-4 text-red-600 text-xs font-bold text-center bg-red-50 py-2.5 px-4 rounded-xl border border-red-100">
            {error}
          </p>
        )}

        {/* ── STEP 0 : Identité ── */}
        {step === 0 && (
          <form onSubmit={handleNext} className="space-y-5" noValidate>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Prénom</label>
                <input
                  type="text"
                  required
                  value={prenom}
                  onChange={e => setPrenom(e.target.value)}
                  className={inputClass}
                  placeholder="Jean"
                />
              </div>
              <div>
                <label className={labelClass}>Nom</label>
                <input
                  type="text"
                  required
                  value={nom}
                  onChange={e => setNom(e.target.value)}
                  className={inputClass}
                  placeholder="Dupont"
                />
              </div>
            </div>
            <div>
              <label className={labelClass}>Ville</label>
              <input
                type="text"
                value={ville}
                onChange={e => setVille(e.target.value)}
                className={inputClass}
                placeholder="Paris"
              />
            </div>
            <div>
              <label className={labelClass}>Téléphone <span className="normal-case font-medium text-gray-400">(optionnel)</span></label>
              <input
                type="tel"
                value={telephone}
                onChange={e => setTelephone(e.target.value)}
                className={inputClass}
                placeholder="+33 6 12 34 56 78"
              />
            </div>
            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-enc text-white text-xs font-black uppercase tracking-widest hover:brightness-110 transition-all active:scale-[0.98] shadow-md"
            >
              Continuer →
            </button>
          </form>
        )}

        {/* ── STEP 1 : Parcours ENC ── */}
        {step === 1 && (
          <form onSubmit={handleNext} className="space-y-5" noValidate>
            <div>
              <label className={labelClass}>Vous êtes</label>
              <div className="mt-2 grid grid-cols-2 gap-3">
                {[
                  { value: 'etudiant', label: '🎒 Étudiant(e)', sub: 'Actuellement à l\'ENC' },
                  { value: 'alumni', label: '🎓 Alumni', sub: 'Diplômé(e) de l\'ENC' },
                ].map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setStatut(opt.value as any)}
                    className={`flex flex-col items-start px-4 py-3 rounded-xl border-2 text-left transition-all ${
                      statut === opt.value
                        ? 'border-enc bg-enc/5 text-enc'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <span className="text-sm font-bold">{opt.label}</span>
                    <span className="text-[10px] font-medium text-gray-400 mt-0.5">{opt.sub}</span>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className={labelClass}>Dernier diplôme à l'ENC</label>
              <input
                type="text"
                value={diplome}
                onChange={e => setDiplome(e.target.value)}
                className={inputClass}
                placeholder="BTS Comptabilité et Gestion…"
              />
            </div>
            <div>
              <label className={labelClass}>Année de promotion</label>
              <input
                type="number"
                value={promotion}
                onChange={e => setPromotion(e.target.value)}
                className={inputClass}
                placeholder={String(new Date().getFullYear())}
                min="1950"
                max={new Date().getFullYear() + 5}
              />
            </div>
            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={() => setStep(0)}
                className="flex-1 py-3.5 rounded-xl border border-gray-300 text-gray-700 text-xs font-black uppercase tracking-widest hover:bg-gray-50 transition-all"
              >
                ← Retour
              </button>
              <button
                type="submit"
                className="flex-1 py-3.5 rounded-xl bg-enc text-white text-xs font-black uppercase tracking-widest hover:brightness-110 transition-all active:scale-[0.98] shadow-md"
              >
                Continuer →
              </button>
            </div>
          </form>
        )}

        {/* ── STEP 2 : Situation pro ── */}
        {step === 2 && (
          <form onSubmit={handleFinish} className="space-y-5" noValidate>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Poste actuel</label>
                <input
                  type="text"
                  value={poste}
                  onChange={e => setPoste(e.target.value)}
                  className={inputClass}
                  placeholder="Comptable"
                />
              </div>
              <div>
                <label className={labelClass}>Entreprise</label>
                <input
                  type="text"
                  value={entreprise}
                  onChange={e => setEntreprise(e.target.value)}
                  className={inputClass}
                  placeholder="Cabinet XYZ"
                />
              </div>
            </div>
            <div>
              <label className={labelClass}>LinkedIn <span className="normal-case font-medium text-gray-400">(optionnel)</span></label>
              <input
                type="url"
                value={linkedin}
                onChange={e => setLinkedin(e.target.value)}
                className={inputClass}
                placeholder="https://linkedin.com/in/jean-dupont"
              />
            </div>
            <div>
              <label className={labelClass}>Bio <span className="normal-case font-medium text-gray-400">(optionnel)</span></label>
              <textarea
                value={bio}
                onChange={e => setBio(e.target.value)}
                rows={3}
                className={`${inputClass} resize-none`}
                placeholder="En quelques mots, présentez-vous…"
              />
            </div>
            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex-1 py-3.5 rounded-xl border border-gray-300 text-gray-700 text-xs font-black uppercase tracking-widest hover:bg-gray-50 transition-all"
              >
                ← Retour
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 py-3.5 rounded-xl bg-enc text-white text-xs font-black uppercase tracking-widest hover:brightness-110 transition-all active:scale-[0.98] shadow-md disabled:opacity-50"
              >
                {saving ? 'Enregistrement…' : 'Terminer ✓'}
              </button>
            </div>
          </form>
        )}

        {/* Skip */}
        {step < 2 ? null : null}
        <p className="text-center text-[10px] text-gray-400 font-medium mt-6">
          Vous pourrez modifier ces informations à tout moment depuis votre profil.
        </p>
      </div>
    </div>
  )
}
