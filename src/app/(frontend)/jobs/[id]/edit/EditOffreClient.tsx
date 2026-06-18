'use client'
import React, { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const CONTRAT_OPTIONS = [
  { value: 'CDI', label: '💼 CDI' },
  { value: 'CDD', label: '📄 CDD' },
  { value: 'Alternance', label: '🎓 Alternance' },
  { value: 'Stage', label: '🧑‍💻 Stage' },
  { value: 'Independant', label: '🚀 Indépendant' },
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

interface Props {
  offreId: string
  initialData: {
    poste: string
    entreprise: string
    typeContrat: string
    secteur: string
    localisation: string
    remuneration: string
    experience: string
    dateDebut: string
    dateLimite: string
    description: string
    statut: string
    restreindreDiplomes: string[]
    restreindreCampus: string[]
    restreindrePromotions: string[]
    existingLogoUrl: string | null
    existingDocUrl: string | null
    existingDocName: string | null
  }
}

export default function EditOffreClient({ offreId, initialData }: Props) {
  const router = useRouter()
  const [formData, setFormData] = useState({
    poste: initialData.poste,
    entreprise: initialData.entreprise,
    typeContrat: initialData.typeContrat,
    secteur: initialData.secteur,
    localisation: initialData.localisation,
    remuneration: initialData.remuneration,
    experience: initialData.experience,
    dateDebut: initialData.dateDebut,
    dateLimite: initialData.dateLimite,
    description: initialData.description,
    statut: initialData.statut,
  })
  const [restreindreDiplomes, setRestreindreDiplomes] = useState<string[]>(initialData.restreindreDiplomes)
  const [restreindreCampus, setRestreindreCampus] = useState<string[]>(initialData.restreindreCampus)
  const [restreindrePromotions, setRestreindrePromotions] = useState<string[]>(initialData.restreindrePromotions)

  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(initialData.existingLogoUrl)
  const [docFile, setDocFile] = useState<File | null>(null)
  const logoRef = useRef<HTMLInputElement>(null)
  const docRef = useRef<HTMLInputElement>(null)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [deleting, setDeleting] = useState(false)

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

  const handleSave = async (statut?: string) => {
    setLoading(true)
    setError('')
    setSuccess('')
    try {
      let logoId: string | undefined
      let documentJointId: string | undefined

      if (logoFile) {
        const form = new FormData()
        form.append('file', logoFile)
        form.append('alt', `Logo ${formData.entreprise}`)
        const r = await fetch('/api/media', { method: 'POST', body: form })
        const j = await r.json()
        logoId = j?.doc?.id ?? j?.id
      }
      if (docFile) {
        const form = new FormData()
        form.append('file', docFile)
        form.append('alt', `Document ${formData.poste}`)
        const r = await fetch('/api/media', { method: 'POST', body: form })
        const j = await r.json()
        documentJointId = j?.doc?.id ?? j?.id
      }

      const body: any = {
        poste: formData.poste,
        entreprise: formData.entreprise,
        typeContrat: formData.typeContrat,
        secteur: formData.secteur,
        localisation: formData.localisation,
        remuneration: formData.remuneration,
        experience: formData.experience,
        description: formData.description,
        restreindreDiplomes,
        restreindreCampus,
        restreindrePromotions,
      }
      body.dateDebut = formData.dateDebut ? new Date(formData.dateDebut).toISOString() : null
      body.dateLimite = formData.dateLimite ? new Date(formData.dateLimite).toISOString() : null
      if (logoId) body.logo = logoId
      if (documentJointId) body.documentJoint = documentJointId
      if (statut) body.statut = statut

      const res = await fetch(`/api/offres/${offreId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      })

      if (res.ok) {
        setSuccess(statut === 'publie' ? 'Offre publiée !' : statut === 'brouillon' ? 'Brouillon sauvegardé !' : 'Modifications enregistrées !')
        setTimeout(() => router.push('/jobs'), 1200)
      } else {
        const j = await res.json().catch(() => ({}))
        setError(j.error || 'Erreur lors de la sauvegarde')
      }
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }

  const handleDelete = async () => {
    if (deleteConfirm !== formData.poste) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/offres/${offreId}`, { method: 'DELETE', credentials: 'include' })
      if (res.ok) router.push('/jobs')
      else setError('Erreur lors de la suppression')
    } catch (e: any) { setError(e.message) }
    finally { setDeleting(false) }
  }

  const inputCls = "w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-800 outline-none focus:border-[#800020]/40 focus:bg-white transition-colors placeholder-gray-400"
  const labelCls = "block text-[10px] font-black text-gray-500 uppercase tracking-wider mb-1.5"
  const pillCls = (active: boolean) =>
    `flex items-center gap-2 px-3 py-2 rounded-full text-[11px] font-bold cursor-pointer transition-all border ${active ? 'bg-[#800020] text-white border-[#800020]' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`

  return (
    <>
      <style>{`
        @keyframes fadeIn { from{opacity:0}to{opacity:1} }
        @keyframes scaleIn { from{opacity:0;transform:scale(0.95)}to{opacity:1;transform:scale(1)} }
        .anim-fade-up { animation: fadeIn 0.4s ease both; }
      `}</style>

      {/* Modale suppression */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" style={{ animation: 'fadeIn 0.2s ease' }}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden" style={{ animation: 'scaleIn 0.2s ease' }}>
            <div className="bg-red-50 border-b border-red-100 px-6 py-5 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center text-lg">🗑️</div>
              <div>
                <h3 className="text-sm font-black text-gray-900">Supprimer l'offre</h3>
                <p className="text-xs text-red-600 font-medium mt-0.5">Action irréversible</p>
              </div>
              <button onClick={() => setShowDeleteModal(false)} className="ml-auto text-gray-400 hover:text-gray-600 cursor-pointer">✕</button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <p className="text-sm text-gray-600">Tapez <span className="font-black text-gray-900">"{formData.poste}"</span> pour confirmer.</p>
              <input type="text" value={deleteConfirm} onChange={e => setDeleteConfirm(e.target.value)}
                placeholder={formData.poste}
                className={`${inputCls} ${deleteConfirm === formData.poste ? 'border-red-400 bg-red-50' : ''}`} />
              {deleteConfirm === formData.poste && <p className="text-[10px] text-emerald-600 font-bold">✓ Confirmation valide</p>}
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button onClick={() => setShowDeleteModal(false)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-xs font-black uppercase text-gray-600 hover:bg-gray-50 cursor-pointer">Annuler</button>
              <button onClick={handleDelete} disabled={deleteConfirm !== formData.poste || deleting}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-40 rounded-xl text-xs font-black uppercase text-white cursor-pointer flex items-center justify-center gap-2">
                {deleting ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : '🗑️ Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-gray-50 min-h-screen py-8 px-4">
        <div className="max-w-2xl mx-auto space-y-5">

          {/* Header */}
          <div className="anim-fade-up flex items-center justify-between">
            <div>
              <h1 className="text-xl font-black text-gray-900">
                {formData.statut === 'brouillon' ? 'Continuer mon brouillon' : "Modifier l'offre"}
              </h1>
              <p className="text-xs text-gray-500 mt-0.5">{formData.poste || 'Offre sans titre'}</p>
            </div>
            <Link href="/jobs" className="text-xs font-bold text-gray-400 hover:text-gray-600 transition-colors">✕ Fermer</Link>
          </div>

          <div className="anim-fade-up bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            {error && (
              <div className="mx-6 mt-6 p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-bold text-red-600 flex items-center gap-2">
                <span>⚠️</span> {error}
              </div>
            )}
            {success && (
              <div className="mx-6 mt-6 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-700 flex items-center gap-2">
                <span>✓</span> {success}
              </div>
            )}

            <div className="p-6 space-y-5">
              {/* Poste & entreprise */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Intitulé du poste *</label>
                  <input type="text" value={formData.poste} onChange={e => set('poste', e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Entreprise *</label>
                  <input type="text" value={formData.entreprise} onChange={e => set('entreprise', e.target.value)} className={inputCls} />
                </div>
              </div>

              {/* Contrat */}
              <div>
                <label className={labelCls}>Type de contrat *</label>
                <div className="flex flex-wrap gap-2">
                  {CONTRAT_OPTIONS.map(opt => (
                    <button type="button" key={opt.value} onClick={() => set('typeContrat', opt.value)}
                      className={pillCls(formData.typeContrat === opt.value)}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Secteur + localisation */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Secteur d'activité *</label>
                  <select value={formData.secteur} onChange={e => set('secteur', e.target.value)} className={inputCls + ' cursor-pointer'}>
                    {SECTEUR_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Localisation *</label>
                  <input type="text" value={formData.localisation} onChange={e => set('localisation', e.target.value)} className={inputCls} />
                </div>
              </div>

              {/* Rémunération + expérience */}
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

              {/* Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Date de début souhaitée</label>
                  <input type="date" value={formData.dateDebut} onChange={e => set('dateDebut', e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Date limite de candidature</label>
                  <input type="date" value={formData.dateLimite} onChange={e => set('dateLimite', e.target.value)} className={inputCls} />
                </div>
              </div>

              {/* Visibilité */}
              <div className="border border-gray-200 rounded-2xl p-4 bg-gray-50/40 space-y-3">
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-wider">Visibilité restreinte (optionnel)</p>
                <div>
                  <span className="text-[10px] text-gray-400 font-bold block mb-1.5">Diplômes</span>
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
                  <span className="text-[10px] text-gray-400 font-bold block mb-1.5">Campus</span>
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
                  <span className="text-[10px] text-gray-400 font-bold block mb-1.5">Promotions</span>
                  <div className="flex flex-wrap gap-2">
                    {PROMOTION_OPTIONS.map(year => (
                      <button type="button" key={year} onClick={() => toggle(year, restreindrePromotions, setRestreindrePromotions)}
                        className={pillCls(restreindrePromotions.includes(year))}>
                        {restreindrePromotions.includes(year) && '✓ '}{year}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Médias */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Logo de l'entreprise</label>
                  <div onClick={() => logoRef.current?.click()}
                    className="relative w-full h-28 rounded-xl border-2 border-dashed border-gray-300 hover:border-[#800020]/40 bg-gray-50 cursor-pointer overflow-hidden flex items-center justify-center">
                    {logoPreview ? (
                      <img src={logoPreview} alt="" className="max-h-full max-w-full object-contain p-2" />
                    ) : (
                      <div className="flex flex-col items-center gap-1">
                        <div className="w-9 h-9 bg-gray-200 rounded-xl flex items-center justify-center text-base">🏢</div>
                        <p className="text-[10px] font-bold text-gray-500">Ajouter un logo</p>
                      </div>
                    )}
                  </div>
                  <input ref={logoRef} type="file" accept="image/*" onChange={onLogoChange} className="hidden" />
                </div>
                <div>
                  <label className={labelCls}>Pièce jointe</label>
                  <div onClick={() => docRef.current?.click()}
                    className="relative w-full h-28 rounded-xl border-2 border-dashed border-gray-300 hover:border-[#800020]/40 bg-gray-50 cursor-pointer flex flex-col items-center justify-center gap-1">
                    <div className="w-9 h-9 bg-gray-200 rounded-xl flex items-center justify-center text-base">📎</div>
                    <p className="text-[10px] font-bold text-gray-500 px-3 text-center truncate max-w-full">
                      {docFile ? docFile.name : initialData.existingDocName || 'Ajouter un document'}
                    </p>
                  </div>
                  <input ref={docRef} type="file"
                    accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    onChange={e => setDocFile(e.target.files?.[0] || null)} className="hidden" />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className={labelCls}>Description / Détails de candidature *</label>
                <textarea value={formData.description} onChange={e => set('description', e.target.value)}
                  rows={5} className={inputCls + ' resize-none'} />
              </div>
            </div>

            {/* Footer actions */}
            <div className="px-6 py-4 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3">
              {formData.statut === 'publie' ? (
                <>
                  <button onClick={() => setShowDeleteModal(true)}
                    className="text-[10px] font-black uppercase text-red-500 hover:text-red-600 cursor-pointer transition-colors">
                    🗑️ Supprimer l'offre
                  </button>
                  <button onClick={() => handleSave()} disabled={loading}
                    className="flex items-center gap-2 px-6 py-2.5 bg-[#800020] hover:bg-[#600018] text-white rounded-xl text-xs font-black uppercase cursor-pointer shadow-sm hover:-translate-y-0.5 disabled:opacity-40 transition-all">
                    {loading
                      ? <><div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> Enregistrement...</>
                      : '💾 Enregistrer les modifications'
                    }
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => setShowDeleteModal(true)}
                    className="text-[10px] font-black uppercase text-red-500 hover:text-red-600 cursor-pointer transition-colors">
                    🗑️ Supprimer
                  </button>
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleSave('brouillon')} disabled={loading}
                      className="px-4 py-2.5 border border-gray-200 rounded-xl text-xs font-black uppercase text-gray-600 hover:bg-gray-50 disabled:opacity-40 cursor-pointer transition-all">
                      💾 Sauvegarder brouillon
                    </button>
                    <button onClick={() => handleSave('publie')} disabled={loading}
                      className="flex items-center gap-2 px-6 py-2.5 bg-[#800020] hover:bg-[#600018] text-white rounded-xl text-xs font-black uppercase cursor-pointer shadow-sm hover:-translate-y-0.5 disabled:opacity-40 transition-all">
                      {loading
                        ? <><div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> Sauvegarde...</>
                        : '🚀 Publier'
                      }
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
