'use client'
import React, { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const CONTRAT_OPTIONS = [
  { value: 'CDI', label: '💼 CDI', desc: 'Contrat à durée indéterminée' },
  { value: 'CDD', label: '📄 CDD', desc: 'Contrat à durée déterminée' },
  { value: 'Alternance', label: '🎓 Alternance', desc: 'Apprentissage, professionnalisation' },
  { value: 'Stage', label: '🧑‍💻 Stage', desc: "Stage conventionné, stage de fin d'études" },
  { value: 'Independant', label: '🚀 Indépendant', desc: 'Freelance, mission ponctuelle' },
]

const SECTEUR_OPTIONS = [
  { value: 'compta', label: 'Comptabilité / Gestion' },
  { value: 'rh', label: 'Ressources Humaines' },
  { value: 'informatique', label: 'Informatique / SLAM / SISR' },
  { value: 'commerce', label: 'Commerce / Marketing' },
  { value: 'agro_alimentaire', label: 'Agro-alimentaire' },
  { value: 'architecture', label: 'Architecture' },
  { value: 'association_non_lucrative', label: 'Association non lucrative' },
  { value: 'banque_assurance_finance', label: 'Banque / Assurance / Finance' },
  { value: 'conseil_audit', label: 'Conseil / Audit' },
  { value: 'culture_media_divertissement', label: 'Culture / Média / Divertissement' },
  { value: 'digital_technologie', label: 'Digital / Technologie' },
  { value: 'grande_distribution_ventes', label: 'Grande distribution / Ventes' },
  { value: 'droit_ecogestion_science_politique', label: 'Droit / Éco-gestion / Science Politique' },
  { value: 'enseignement_formation_recrutement', label: 'Enseignement / Formation / Recrutement' },
  { value: 'entrepreneuriat_startup', label: 'Entrepreneuriat / Start-up' },
  { value: 'travaux_publics', label: 'Travaux Publics' },
  { value: 'industrie', label: 'Industrie' },
  { value: 'publicite_marketing_communication', label: 'Publicité / Marketing / Communication' },
  { value: 'mode_luxe_beaute', label: 'Mode / Luxe / Beauté' },
  { value: 'environnement_sante_social', label: 'Environnement / Santé / Social' },
  { value: 'sciences_recherche', label: 'Sciences / Recherche' },
  { value: 'secteur_public_administration', label: 'Secteur public et administration' },
  { value: 'automobile', label: 'Automobile' },
  { value: 'organisation_internationale', label: 'Organisation internationale' },
  { value: 'tourisme_hotellerie_restauration', label: 'Tourisme / Hôtellerie / Restauration' },
  { value: 'autres', label: 'Autres' },
]

const REMUNERATION_OPTIONS = [
  { value: 'non_renseigne', label: 'Non renseigné' },
  { value: 'stage_non_indemnise', label: 'Stage non-indemnisé' },
  { value: 'stage_indemnise', label: 'Stage indemnisé' },
  { value: 'moins_15k', label: '< 15K €' },
  { value: '20_225k', label: '20-22,5K €' },
  { value: '25_275k', label: '25-27,5K €' },
  { value: '30_325k', label: '30-32,5K €' },
  { value: '35_375k', label: '35-37,5K €' },
  { value: '40_45k', label: '40-45K €' },
  { value: '45_50k', label: '45-50K €' },
  { value: '50_55k', label: '50-55K €' },
  { value: '60_65k', label: '60-65K €' },
  { value: '70_75k', label: '70-75K €' },
]

const EXPERIENCE_OPTIONS = [
  { value: 'non_renseigne', label: 'Non renseigné' },
  { value: '0_2_ans', label: '0-2 ans' },
  { value: '2_4_ans', label: '2-4 ans' },
  { value: '4_7_ans', label: '4-7 ans' },
  { value: '7_10_ans', label: '7-10 ans' },
  { value: 'plus_10_ans', label: '+ 10 ans' },
]

const DIPLOME_OPTIONS = [
  { value: 'bts', label: 'BTS' },
  { value: 'dcg3', label: 'DCG3' },
  { value: 'prepa', label: 'Prépa' },
]

const CAMPUS_OPTIONS = [
  { value: 'enc_bessieres', label: 'ENC Bessières' },
  { value: 'enc_bessieres_apprentissage', label: 'ENC Bessières Apprentissage' },
]

const PROMOTION_OPTIONS = ['2026', '2027', '2028', '2029', '2030', '2031']

const STEPS = ['Poste & entreprise', 'Conditions', 'Visibilité', 'Logo & description']

export default function NewOffreFormClient() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [docFile, setDocFile] = useState<File | null>(null)
  const logoRef = useRef<HTMLInputElement>(null)
  const docRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState({
    poste: '',
    entreprise: '',
    typeContrat: 'CDI',
    secteur: 'digital_technologie',
    localisation: 'Paris',
    remuneration: 'non_renseigne',
    experience: 'non_renseigne',
    dateDebut: '',
    dateLimite: '',
    description: '',
  })

  const [restreindreDiplomes, setRestreindreDiplomes] = useState<string[]>([])
  const [restreindreCampus, setRestreindreCampus] = useState<string[]>([])
  const [restreindrePromotions, setRestreindrePromotions] = useState<string[]>([])

  const set = (k: string, v: string) => setFormData(prev => ({ ...prev, [k]: v }))

  const toggle = (value: string, list: string[], setList: (l: string[]) => void) => {
    setList(list.includes(value) ? list.filter(v => v !== value) : [...list, value])
  }

  const onLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setLogoFile(file)
    setLogoPreview(URL.createObjectURL(file))
  }

  const validateStep = () => {
    if (step === 0) {
      if (!formData.poste.trim()) return "L'intitulé du poste est requis"
      if (!formData.entreprise.trim()) return "Le nom de l'entreprise est requis"
      if (!formData.secteur) return 'Sélectionnez un secteur'
    }
    if (step === 1) {
      if (!formData.localisation.trim()) return 'La localisation est requise'
    }
    if (step === 3) {
      if (!formData.description.trim()) return 'La description est requise'
    }
    return null
  }

  const nextStep = () => {
    const err = validateStep()
    if (err) { setError(err); return }
    setError('')
    setStep(s => Math.min(s + 1, STEPS.length - 1))
  }

  const prevStep = () => { setError(''); setStep(s => Math.max(s - 1, 0)) }

  const uploadMediaFile = async (file: File, altText: string): Promise<string | null> => {
    const data = new FormData()
    data.append('file', file)
    data.append('alt', altText)
    const res = await fetch('/api/media', { method: 'POST', body: data })
    if (!res.ok) return null
    const json = await res.json()
    return json.doc?.id ?? json.id ?? null
  }

  const handleSubmit = async (statut: 'publie' | 'brouillon') => {
    const err = validateStep()
    if (err) { setError(err); return }
    setLoading(true)
    setError('')
    try {
      let logoId: string | null = null
      let documentJointId: string | null = null

      if (logoFile) {
        logoId = await uploadMediaFile(logoFile, `Logo ${formData.entreprise}`)
        if (!logoId) throw new Error('Échec du téléversement du logo')
      }
      if (docFile) {
        documentJointId = await uploadMediaFile(docFile, `Document ${formData.poste}`)
        if (!documentJointId) throw new Error('Échec du téléversement du document joint')
      }

      const payload: any = {
        poste: formData.poste,
        entreprise: formData.entreprise,
        typeContrat: formData.typeContrat,
        secteur: formData.secteur,
        localisation: formData.localisation,
        remuneration: formData.remuneration,
        experience: formData.experience,
        description: formData.description,
        statut,
        restreindreDiplomes,
        restreindreCampus,
        restreindrePromotions,
      }
      if (formData.dateDebut) payload.dateDebut = new Date(formData.dateDebut).toISOString()
      if (formData.dateLimite) payload.dateLimite = new Date(formData.dateLimite).toISOString()
      if (logoId) payload.logo = logoId
      if (documentJointId) payload.documentJoint = documentJointId

      const res = await fetch('/api/offres', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      })

      if (res.ok) router.push('/jobs')
      else {
        const json = await res.json().catch(() => ({}))
        setError(json.errors?.[0]?.message || 'Erreur lors de la sauvegarde')
      }
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const inputCls = "w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-800 outline-none focus:border-[#800020]/40 focus:bg-white transition-colors placeholder-gray-400"
  const labelCls = "block text-[10px] font-black text-gray-500 uppercase tracking-wider mb-1.5"

  const pillCls = (active: boolean) =>
    `flex items-center gap-2 px-3 py-2 rounded-full text-[11px] font-bold cursor-pointer transition-all border ${active ? 'bg-[#800020] text-white border-[#800020]' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`

  return (
    <>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
        .anim-fade-up { animation: fadeUp 0.35s ease both; }
        .anim-fade-in { animation: fadeIn 0.25s ease both; }
      `}</style>

      <div className="bg-gray-50 min-h-screen py-10 px-4">
        <div className="max-w-2xl mx-auto space-y-6">

          {/* Header */}
          <div className="anim-fade-up flex items-center justify-between">
            <div>
              <h1 className="text-xl font-black text-gray-900">Publier une offre</h1>
              <p className="text-xs text-gray-500 mt-0.5">Étape {step + 1} sur {STEPS.length} · {STEPS[step]}</p>
            </div>
            <Link href="/jobs" className="text-xs font-bold text-gray-400 hover:text-gray-600 transition-colors">✕ Annuler</Link>
          </div>

          {/* Progress bar */}
          <div className="anim-fade-up bg-gray-200 h-1.5 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#800020] rounded-full transition-all duration-500"
              style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
            />
          </div>

          {/* Steps indicator */}
          <div className="anim-fade-up flex items-center gap-2">
            {STEPS.map((s, i) => (
              <div key={i} className="flex items-center gap-2 flex-1">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0 transition-all ${i < step ? 'bg-emerald-500 text-white' : i === step ? 'bg-[#800020] text-white' : 'bg-gray-200 text-gray-400'}`}>
                  {i < step ? '✓' : i + 1}
                </div>
                <span className={`text-[10px] font-black uppercase tracking-wide hidden sm:block ${i === step ? 'text-[#800020]' : i < step ? 'text-emerald-600' : 'text-gray-400'}`}>{s}</span>
                {i < STEPS.length - 1 && <div className={`flex-1 h-px ${i < step ? 'bg-emerald-300' : 'bg-gray-200'}`} />}
              </div>
            ))}
          </div>

          {/* Card formulaire */}
          <div className="anim-fade-up bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">

            {error && (
              <div className="mx-6 mt-6 p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-bold text-red-600 flex items-center gap-2">
                <span>⚠️</span> {error}
              </div>
            )}

            <div className="p-6 space-y-5 anim-fade-in" key={step}>

              {/* ── ÉTAPE 0 : Poste & entreprise ── */}
              {step === 0 && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>Intitulé du poste *</label>
                      <input type="text" value={formData.poste} onChange={e => set('poste', e.target.value)}
                        className={inputCls} placeholder="Ex: Stagiaire Comptabilité" />
                    </div>
                    <div>
                      <label className={labelCls}>Entreprise *</label>
                      <input type="text" value={formData.entreprise} onChange={e => set('entreprise', e.target.value)}
                        className={inputCls} placeholder="Ex: Cabinet Dupont & Associés" />
                    </div>
                  </div>

                  <div>
                    <label className={labelCls}>Type de contrat *</label>
                    <div className="grid grid-cols-2 gap-3">
                      {CONTRAT_OPTIONS.map(opt => (
                        <label key={opt.value}
                          className={`flex flex-col gap-1 p-3.5 border rounded-xl cursor-pointer transition-all ${formData.typeContrat === opt.value ? 'border-[#800020] bg-red-50/50 shadow-sm' : 'border-gray-200 hover:border-gray-300'}`}>
                          <input type="radio" name="typeContrat" value={opt.value} checked={formData.typeContrat === opt.value}
                            onChange={e => set('typeContrat', e.target.value)} className="hidden" />
                          <span className="text-sm font-black text-gray-800">{opt.label}</span>
                          <span className="text-[10px] text-gray-400 font-medium">{opt.desc}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className={labelCls}>Secteur d'activité *</label>
                    <select value={formData.secteur} onChange={e => set('secteur', e.target.value)} className={inputCls + ' cursor-pointer'}>
                      {SECTEUR_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                </>
              )}

              {/* ── ÉTAPE 1 : Conditions ── */}
              {step === 1 && (
                <>
                  <div>
                    <label className={labelCls}>Localisation *</label>
                    <input type="text" value={formData.localisation} onChange={e => set('localisation', e.target.value)}
                      className={inputCls} placeholder="Ex: Paris, Lyon, Télétravail..." />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>Rémunération</label>
                      <select value={formData.remuneration} onChange={e => set('remuneration', e.target.value)} className={inputCls + ' cursor-pointer'}>
                        {REMUNERATION_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>Expérience requise</label>
                      <select value={formData.experience} onChange={e => set('experience', e.target.value)} className={inputCls + ' cursor-pointer'}>
                        {EXPERIENCE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>Date de début souhaitée</label>
                      <input type="date" value={formData.dateDebut} onChange={e => set('dateDebut', e.target.value)} className={inputCls} />
                      <p className="text-[10px] text-gray-400 mt-1">Laissez vide pour "Dès que possible"</p>
                    </div>
                    <div>
                      <label className={labelCls}>Date limite de candidature</label>
                      <input type="date" value={formData.dateLimite} onChange={e => set('dateLimite', e.target.value)} className={inputCls} />
                      <p className="text-[10px] text-gray-400 mt-1">L'offre passera en "Expirée" après cette date</p>
                    </div>
                  </div>
                </>
              )}

              {/* ── ÉTAPE 2 : Visibilité ── */}
              {step === 2 && (
                <>
                  <div className="bg-blue-50 border border-blue-100 rounded-xl p-3.5 flex items-start gap-2.5">
                    <span className="text-base flex-shrink-0">ℹ️</span>
                    <p className="text-xs text-blue-700 font-medium leading-relaxed">
                      Par défaut, votre offre est visible par tous les membres. Cochez des cases ci-dessous uniquement si vous souhaitez la restreindre à certains profils.
                    </p>
                  </div>

                  <div>
                    <label className={labelCls}>Restreindre aux diplômes</label>
                    <div className="flex flex-wrap gap-2">
                      {DIPLOME_OPTIONS.map(opt => (
                        <button type="button" key={opt.value} onClick={() => toggle(opt.value, restreindreDiplomes, setRestreindreDiplomes)}
                          className={pillCls(restreindreDiplomes.includes(opt.value))}>
                          {restreindreDiplomes.includes(opt.value) && '✓ '}{opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className={labelCls}>Restreindre aux campus</label>
                    <div className="flex flex-wrap gap-2">
                      {CAMPUS_OPTIONS.map(opt => (
                        <button type="button" key={opt.value} onClick={() => toggle(opt.value, restreindreCampus, setRestreindreCampus)}
                          className={pillCls(restreindreCampus.includes(opt.value))}>
                          {restreindreCampus.includes(opt.value) && '✓ '}{opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className={labelCls}>Restreindre aux promotions</label>
                    <div className="flex flex-wrap gap-2">
                      {PROMOTION_OPTIONS.map(year => (
                        <button type="button" key={year} onClick={() => toggle(year, restreindrePromotions, setRestreindrePromotions)}
                          className={pillCls(restreindrePromotions.includes(year))}>
                          {restreindrePromotions.includes(year) && '✓ '}{year}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* ── ÉTAPE 3 : Logo, document & description ── */}
              {step === 3 && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>Logo de l'entreprise</label>
                      <div
                        onClick={() => logoRef.current?.click()}
                        className={`relative w-full h-32 rounded-xl border-2 border-dashed cursor-pointer overflow-hidden transition-colors flex items-center justify-center ${logoPreview ? 'border-transparent bg-white' : 'border-gray-300 hover:border-[#800020]/40 bg-gray-50'}`}
                      >
                        {logoPreview ? (
                          <>
                            <img src={logoPreview} alt="" className="max-h-full max-w-full object-contain p-2" />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                              <span className="text-white text-[10px] font-black uppercase bg-black/50 px-3 py-1.5 rounded-xl">Changer</span>
                            </div>
                          </>
                        ) : (
                          <div className="flex flex-col items-center gap-1.5">
                            <div className="w-10 h-10 bg-gray-200 rounded-xl flex items-center justify-center text-lg">🏢</div>
                            <p className="text-[10px] font-bold text-gray-500">Ajouter un logo</p>
                          </div>
                        )}
                      </div>
                      <input ref={logoRef} type="file" accept="image/*" onChange={onLogoChange} className="hidden" />
                    </div>

                    <div>
                      <label className={labelCls}>Pièce jointe (PDF, DOC...)</label>
                      <div
                        onClick={() => docRef.current?.click()}
                        className="relative w-full h-32 rounded-xl border-2 border-dashed border-gray-300 hover:border-[#800020]/40 bg-gray-50 cursor-pointer flex flex-col items-center justify-center gap-1.5"
                      >
                        <div className="w-10 h-10 bg-gray-200 rounded-xl flex items-center justify-center text-lg">📎</div>
                        <p className="text-[10px] font-bold text-gray-500 px-3 text-center truncate max-w-full">
                          {docFile ? docFile.name : 'Ajouter un document'}
                        </p>
                      </div>
                      <input ref={docRef} type="file"
                        accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                        onChange={e => setDocFile(e.target.files?.[0] || null)} className="hidden" />
                    </div>
                  </div>

                  <div>
                    <label className={labelCls}>Description / Détails de candidature *</label>
                    <textarea value={formData.description} onChange={e => set('description', e.target.value)}
                      rows={6} className={inputCls + ' resize-none'}
                      placeholder="Décrivez le poste, les missions, le profil recherché, comment postuler..." />
                    <p className="text-[10px] text-gray-400 mt-1">{formData.description.length} caractères</p>
                  </div>

                  {/* Récap */}
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-2">
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-wider mb-2">Récapitulatif</p>
                    {[
                      { label: 'Poste', val: formData.poste },
                      { label: 'Entreprise', val: formData.entreprise },
                      { label: 'Contrat', val: CONTRAT_OPTIONS.find(c => c.value === formData.typeContrat)?.label },
                      { label: 'Secteur', val: SECTEUR_OPTIONS.find(s => s.value === formData.secteur)?.label },
                      { label: 'Localisation', val: formData.localisation },
                      { label: 'Limite candidature', val: formData.dateLimite || '—' },
                    ].map(({ label, val }) => (
                      <div key={label} className="flex items-baseline gap-2">
                        <span className="text-[10px] font-black text-gray-400 uppercase w-32 flex-shrink-0">{label}</span>
                        <span className="text-xs font-bold text-gray-700 truncate">{val || '—'}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Footer navigation */}
            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
              <button onClick={prevStep} disabled={step === 0}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-black uppercase text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer">
                ← Précédent
              </button>

              {step < STEPS.length - 1 ? (
                <button onClick={nextStep}
                  className="flex items-center gap-2 px-6 py-2.5 bg-[#800020] hover:bg-[#600018] text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-sm hover:-translate-y-0.5">
                  Suivant →
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button onClick={() => handleSubmit('brouillon')} disabled={loading}
                    className="px-4 py-2.5 border border-gray-200 rounded-xl text-xs font-black uppercase text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-all cursor-pointer">
                    💾 Brouillon
                  </button>
                  <button onClick={() => handleSubmit('publie')} disabled={loading}
                    className="flex items-center gap-2 px-6 py-2.5 bg-[#800020] hover:bg-[#600018] text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-sm hover:-translate-y-0.5 disabled:opacity-40">
                    {loading
                      ? <><div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> Publication...</>
                      : '🚀 Publier l\'offre'
                    }
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
