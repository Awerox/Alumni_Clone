'use client'
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function RegisterPage() {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    prenom: '',
    nom: '',
    email: '',
    password: '',
    statut: '',
    promotion: '',
    diplome: '',
    poste: '',
    entreprise: '',
    ville: '',
    isMentor: false,
  })
  const [error, setError] = useState('')
  const router = useRouter()

  const handleNext = () => setStep(step + 1)
  const handleBack = () => setStep(step - 1)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    try {
      const res = await fetch('/api/alumni', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        router.push('/login?message=Compte créé avec succès !')
      } else {
        const data = await res.json()
        setError(data.errors?.[0]?.message || "Erreur lors de la création.")
      }
    } catch (err) {
      setError("Une erreur est survenue.")
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
        
        {/* Header avec Progress Bar */}
        <div className="bg-enc p-8 text-white text-center">
          <h2 className="text-3xl font-black uppercase tracking-tighter">Création de compte</h2>
          <div className="flex justify-center mt-4 gap-2">
            <div className={`h-1.5 w-12 rounded-full ${step >= 1 ? 'bg-white' : 'bg-white/30'}`}></div>
            <div className={`h-1.5 w-12 rounded-full ${step >= 2 ? 'bg-white' : 'bg-white/30'}`}></div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-10 space-y-6">
          {error && <p className="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center font-bold">{error}</p>}

          {/* ÉTAPE 1 : IDENTITÉ */}
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in duration-500">
              <p className="text-gray-500 font-medium text-center mb-6">Commençons par faire connaissance</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase text-gray-400 ml-1">
                    Prénom <span className="text-red-500">*</span>
                  </label>
                  <input 
                    required 
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-enc outline-none transition-all"
                    onChange={(e) => setFormData({...formData, prenom: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase text-gray-400 ml-1">
                    Nom <span className="text-red-500">*</span>
                  </label>
                  <input 
                    required 
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-enc outline-none transition-all"
                    onChange={(e) => setFormData({...formData, nom: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-gray-400 ml-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <input 
                  type="email" 
                  required 
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-enc outline-none transition-all"
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-gray-400 ml-1">
                  Mot de passe <span className="text-red-500">*</span>
                </label>
                <input 
                  type="password" 
                  required 
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-enc outline-none transition-all"
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                />
              </div>
              <button 
                type="button"
                onClick={handleNext}
                className="w-full py-4 bg-enc text-white rounded-xl font-bold uppercase tracking-widest hover:bg-opacity-90 transition-all mt-4"
              >
                Suivant →
              </button>
            </div>
          )}

          {/* ÉTAPE 2 : PARCOURS & INFOS PRO */}
          {step === 2 && (
            <div className="space-y-4 animate-in slide-in-from-right duration-500">
              <p className="text-gray-500 font-medium text-center mb-6">Votre parcours et situation actuelle</p>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase text-gray-400 ml-1">
                    Statut <span className="text-red-500">*</span>
                  </label>
                  <select 
                    required
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-enc bg-white"
                    onChange={(e) => setFormData({...formData, statut: e.target.value})}
                  >
                    <option value="">Sélectionnez...</option>
                    <option value="etudiant">Étudiant</option>
                    <option value="alumni">Alumni (Ancien)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase text-gray-400 ml-1">
                    Promotion <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="number"
                    required
                    placeholder="ex: 2026"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-enc"
                    onChange={(e) => setFormData({...formData, promotion: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-gray-400 ml-1">
                  Diplôme suivi à l'ENC <span className="text-red-500">*</span>
                </label>
                <input 
                  required
                  placeholder="ex: BTS SIO SLAM"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-enc"
                  onChange={(e) => setFormData({...formData, diplome: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase text-gray-400 ml-1">Poste actuel</label>
                  <input 
                    placeholder="ex: Développeur"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-enc"
                    onChange={(e) => setFormData({...formData, poste: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase text-gray-400 ml-1">Entreprise</label>
                  <input 
                    placeholder="ex: Freelance, Google..."
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-enc"
                    onChange={(e) => setFormData({...formData, entreprise: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-gray-400 ml-1">
                  Ville <span className="text-red-500">*</span>
                </label>
                <input 
                  required
                  placeholder="ex: Paris, Ivry-sur-Seine..."
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-enc"
                  onChange={(e) => setFormData({...formData, ville: e.target.value})}
                />
              </div>

              {/* SECTION MENTORAT */}
              <div className="pt-4 border-t border-gray-100">
                <label className="flex items-start gap-3 cursor-pointer group p-3 rounded-xl hover:bg-gray-50 transition-colors">
                  <div className="relative flex items-center h-5">
                    <input
                      type="checkbox"
                      className="w-5 h-5 border-2 border-gray-300 rounded text-enc focus:ring-enc"
                      checked={formData.isMentor}
                      onChange={(e) => setFormData({...formData, isMentor: e.target.checked})}
                    />
                  </div>
                  <div className="text-sm">
                    <span className="font-bold text-gray-700 block text-[13px]">Souhaitez-vous devenir Mentor ?</span>
                    <p className="text-gray-400 text-[11px]">Partagez votre expérience avec les futurs diplômés.</p>
                  </div>
                </label>
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  type="button"
                  onClick={handleBack}
                  className="flex-1 py-4 border-2 border-gray-100 text-gray-400 rounded-xl font-bold uppercase text-xs hover:bg-gray-50 transition-all"
                >
                  Retour
                </button>
                <button 
                  type="submit"
                  className="flex-[2] py-4 bg-enc text-white rounded-xl font-bold uppercase text-xs tracking-widest hover:bg-opacity-90 transition-all"
                >
                  Finaliser l'inscription
                </button>
              </div>
            </div>
          )}
        </form>

        <div className="p-8 bg-gray-50 border-t border-gray-100 text-center">
          <p className="text-sm text-gray-500">
            Déjà membre ? <Link href="/login" className="text-enc font-black hover:underline">Se connecter</Link>
          </p>
        </div>
      </div>
    </div>
  )
}