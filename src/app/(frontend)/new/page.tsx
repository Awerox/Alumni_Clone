'use client'
import React, { useState, useEffect } from 'react'
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
    latitude: '', // Rempli automatiquement par la sélection
    longitude: '', // Rempli automatiquement par la sélection
    secteur: '',
    campus: 'bessieres',
    searchOpportunities: 'not_looking',
    mentoratActive: false,
    mentoratRole: 'filleul',
  })

  const [error, setError] = useState('')
  const [cityInput, setCityInput] = useState('')
  const [citySuggestions, setCitySuggestions] = useState<any[]>([])
  const [isCitySelected, setIsCitySelected] = useState(false) // Sécurise la sélection obligatoire
  const [searchingCity, setSearchingCity] = useState(false)
  const router = useRouter()

  const handleNext = () => setStep(step + 1)
  const handleBack = () => setStep(step - 1)

  // 🌍 Autocomplétion MONDIALE via OpenStreetMap (Nominatim API)
  useEffect(() => {
    if (cityInput.length < 2 || isCitySelected) {
      setCitySuggestions([])
      return
    }

    const delayDebounce = setTimeout(async () => {
      try {
        setSearchingCity(true)
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cityInput)}&limit=5&addressdetails=1&accept-language=fr`,
        )
        if (res.ok) {
          const data = await res.json()
          setCitySuggestions(data)
        }
      } catch (err) {
        console.error("Erreur d'autocomplétion internationale", err)
      } finally {
        setSearchingCity(false)
      }
    }, 400) // Temporisation pour économiser les requêtes sur l'API publique

    return () => clearTimeout(delayDebounce)
  }, [cityInput, isCitySelected])

  // Gestion du clic sur une suggestion de l'API mondiale
  const handleSelectCity = (place: any) => {
    const cityName = place.display_name.split(',')[0]
    const countryName = place.address?.country || ''
    const formattedLocation = countryName ? `${cityName} (${countryName})` : cityName

    setCityInput(formattedLocation)
    setFormData({
      ...formData,
      ville: formattedLocation,
      latitude: place.lat || '',
      longitude: place.lon || '',
    })
    setIsCitySelected(true) // L'utilisateur a bien sélectionné une option valide
    setCitySuggestions([])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // SÉCURITÉ : Bloquer l'envoi si la ville n'a pas été choisie dans la liste
    if (!isCitySelected) {
      setError(
        'Veuillez sélectionner obligatoirement une ville dans la liste des propositions pour géolocaliser votre profil sur la carte.',
      )
      return
    }

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
        setError(data.errors?.[0]?.message || 'Erreur lors de la création.')
      }
    } catch (err) {
      setError('Une erreur est survenue.')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
        {/* Header avec Progress Bar */}
        <div className="bg-enc p-8 text-white text-center">
          <h2 className="text-3xl font-black uppercase tracking-tighter">Création de compte</h2>
          <div className="flex justify-center mt-4 gap-2">
            <div
              className={`h-1.5 w-12 rounded-full ${step >= 1 ? 'bg-white' : 'bg-white/30'}`}
            ></div>
            <div
              className={`h-1.5 w-12 rounded-full ${step >= 2 ? 'bg-white' : 'bg-white/30'}`}
            ></div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-10 space-y-6">
          {error && (
            <p className="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center font-bold">
              {error}
            </p>
          )}

          {/* ÉTAPE 1 : IDENTITÉ */}
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in duration-500">
              <p className="text-gray-500 font-medium text-center mb-6">
                Commençons par faire connaissance
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1 text-left">
                  <label className="text-xs font-bold uppercase text-gray-400 ml-1">
                    Prénom <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-enc outline-none transition-all text-gray-800 font-medium"
                    value={formData.prenom}
                    onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                  />
                </div>
                <div className="space-y-1 text-left">
                  <label className="text-xs font-bold uppercase text-gray-400 ml-1">
                    Nom <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-enc outline-none transition-all text-gray-800 font-medium"
                    value={formData.nom}
                    onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-1 text-left">
                <label className="text-xs font-bold uppercase text-gray-400 ml-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-enc outline-none transition-all text-gray-800 font-medium"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div className="space-y-1 text-left">
                <label className="text-xs font-bold uppercase text-gray-400 ml-1">
                  Mot de passe <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-enc outline-none transition-all text-gray-800 font-medium"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
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

          {/* ÉTAPE 2 : PARCOURS & FORMULAIRES SÉCURISÉS */}
          {step === 2 && (
            <div className="space-y-4 animate-in slide-in-from-right duration-500">
              <p className="text-gray-500 font-medium text-center mb-6">
                Votre parcours et situation actuelle
              </p>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1 text-left">
                  <label className="text-xs font-bold uppercase text-gray-400 ml-1">
                    Statut <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-enc bg-white text-gray-700 font-semibold cursor-pointer"
                    value={formData.statut}
                    onChange={(e) => setFormData({ ...formData, statut: e.target.value })}
                  >
                    <option value="">Sélectionnez...</option>
                    <option value="etudiant">Étudiant</option>
                    <option value="alumni">Alumni (Ancien)</option>
                  </select>
                </div>
                <div className="space-y-1 text-left">
                  <label className="text-xs font-bold uppercase text-gray-400 ml-1">
                    Promotion <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-enc bg-white text-gray-700 font-semibold cursor-pointer"
                    value={formData.promotion}
                    onChange={(e) => setFormData({ ...formData, promotion: e.target.value })}
                  >
                    <option value="">Sélectionnez...</option>
                    <option value="2026">2026</option>
                    <option value="2025">2025</option>
                    <option value="2024">2024</option>
                    <option value="2023">2023</option>
                    <option value="2022">2022</option>
                  </select>
                </div>
              </div>

              {/* DIPLÔME CONTROLÉ */}
              <div className="space-y-1 text-left">
                <label className="text-xs font-bold uppercase text-gray-400 ml-1">
                  Diplôme suivi à l'ENC <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-enc bg-white text-gray-700 font-semibold cursor-pointer"
                  value={formData.diplome}
                  onChange={(e) => setFormData({ ...formData, diplome: e.target.value })}
                >
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
              </div>

              {/* CAMPUS ET RECHERCHE D'EMPLOI SÉCURISÉS */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1 text-left">
                  <label className="text-xs font-bold uppercase text-gray-400 ml-1">
                    Campus <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-enc bg-white text-gray-700 font-semibold cursor-pointer"
                    value={formData.campus}
                    onChange={(e) => setFormData({ ...formData, campus: e.target.value })}
                  >
                    <option value="bessieres">Bessières (ENC)</option>
                    <option value="autre">Autre campus</option>
                  </select>
                </div>
                <div className="space-y-1 text-left">
                  <label className="text-xs font-bold uppercase text-gray-400 ml-1">
                    Marché pro <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-enc bg-white text-gray-700 font-semibold cursor-pointer"
                    value={formData.searchOpportunities}
                    onChange={(e) =>
                      setFormData({ ...formData, searchOpportunities: e.target.value })
                    }
                  >
                    <option value="not_looking">En poste / Non dispo</option>
                    <option value="searching">En recherche active</option>
                    <option value="listening">À l'écoute du marché</option>
                  </select>
                </div>
              </div>

              {/* POSTE & ENTREPRISE */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1 text-left">
                  <label className="text-xs font-bold uppercase text-gray-400 ml-1">
                    Poste actuel / de stage
                  </label>
                  <input
                    placeholder="ex: Développeur, Alternant..."
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-enc text-gray-800 font-medium"
                    value={formData.poste}
                    onChange={(e) => setFormData({ ...formData, poste: e.target.value })}
                  />
                </div>
                <div className="space-y-1 text-left">
                  <label className="text-xs font-bold uppercase text-gray-400 ml-1">
                    Entreprise
                  </label>
                  <input
                    placeholder="ex: Orange, Capgemini..."
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-enc text-gray-800 font-medium"
                    value={formData.entreprise}
                    onChange={(e) => setFormData({ ...formData, entreprise: e.target.value })}
                  />
                </div>
              </div>

              {/* VILLE EN AUTOCOMPLÉTION GLOBALE OBLIGATOIRE ET SECTEUR */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1 text-left relative">
                  <label className="text-xs font-bold uppercase text-gray-400 ml-1">
                    Ville de résidence <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      required
                      placeholder="Tapez le nom de votre ville..."
                      className={`w-full px-4 py-3 border rounded-xl outline-none transition-all font-medium ${
                        isCitySelected
                          ? 'border-emerald-400 bg-emerald-50/20 text-emerald-900 focus:ring-emerald-400'
                          : 'border-gray-200 text-gray-800 focus:ring-enc'
                      }`}
                      value={cityInput}
                      onChange={(e) => {
                        setCityInput(e.target.value)
                        setIsCitySelected(false) // Invalide dès qu'on re-modifie à la main
                      }}
                    />
                    {isCitySelected && (
                      <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-emerald-500 font-bold text-sm">
                        ✓
                      </span>
                    )}
                  </div>

                  {/* Suggestions mondiales */}
                  {citySuggestions.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-2xl z-50 max-h-48 overflow-y-auto">
                      {citySuggestions.map((place, index) => (
                        <button
                          type="button"
                          key={index}
                          onClick={() => handleSelectCity(place)}
                          className="w-full text-left px-4 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-50 hover:text-enc transition-colors border-b last:border-0 border-gray-100"
                        >
                          🌍 {place.display_name.split(',').slice(0, 3).join(',')}
                        </button>
                      ))}
                    </div>
                  )}
                  {searchingCity && (
                    <p className="absolute right-3.5 bottom-3.5 text-[10px] text-gray-400 animate-pulse font-bold">
                      Recherche...
                    </p>
                  )}
                </div>

                <div className="space-y-1 text-left">
                  <label className="text-xs font-bold uppercase text-gray-400 ml-1">Secteur</label>
                  <select
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-enc bg-white text-gray-700 font-semibold cursor-pointer"
                    value={formData.secteur}
                    onChange={(e) => setFormData({ ...formData, secteur: e.target.value })}
                  >
                    <option value="">Sélectionnez...</option>
                    <option value="it">Informatique / Tech</option>
                    <option value="finance">Finance / Gestion</option>
                    <option value="commerce">Commerce / Vente</option>
                    <option value="assurance">Assurance / Banque</option>
                    <option value="tourisme">Tourisme / Voyage</option>
                  </select>
                </div>
              </div>

              {/* MENTORAT */}
              <div className="pt-4 border-t border-gray-100 text-left">
                <label className="flex items-start gap-3 cursor-pointer group p-3 rounded-xl hover:bg-gray-50 transition-colors">
                  <div className="relative flex items-center h-5">
                    <input
                      type="checkbox"
                      className="w-5 h-5 border-2 border-gray-300 rounded text-enc focus:ring-enc cursor-pointer"
                      checked={formData.mentoratActive}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          mentoratActive: e.target.checked,
                          mentoratRole: e.target.checked ? 'mentor' : 'filleul',
                        })
                      }
                    />
                  </div>
                  <div className="text-sm">
                    <span className="font-bold text-gray-700 block text-[13px]">
                      Souhaitez-vous devenir Mentor ?
                    </span>
                    <p className="text-gray-400 text-[11px]">
                      Partagez votre expérience avec les futurs diplômés.
                    </p>
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
            Déjà membre ?{' '}
            <Link href="/login" className="text-enc font-black hover:underline">
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
