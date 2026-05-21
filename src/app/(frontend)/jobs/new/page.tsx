'use client'
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function NewJobPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // États pour la capture des médias (Logo et Document joint)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [docFile, setDocFile] = useState<File | null>(null)

  // États d'ouverture/fermeture des dropdowns personnalisés
  const [openDiplomes, setOpenDiplomes] = useState(false)
  const [openCampus, setOpenCampus] = useState(false)
  const [openPromotions, setOpenPromotions] = useState(false)

  const [formData, setFormData] = useState({
    poste: '',
    entreprise: '',
    localisation: '',
    typeContrat: 'CDI',
    secteur: 'digital_technologie',
    remuneration: '35-37,5K €',
    experience: '0_2_ans',
    dateDebut: '',
    dateLimite: '',
    description: '',
  })

  // États de sélections pour Payload CMS
  const [restreindreDiplomes, setRestreindreDiplomes] = useState<string[]>([])
  const [restreindreCampus, setRestreindreCampus] = useState<string[]>([])
  const [restreindrePromotions, setRestreindrePromotions] = useState<string[]>([])

  // Options structurées pour les Diplômes
  const optionsDiplomes = [
    {
      group: 'BTS',
      items: [
        'BTS ASSURANCE',
        'BTS CG',
        'BTS CI',
        'BTS COMMUNICATION',
        'BTS GPME',
        'BTS MCO',
        'BTS NDRC',
        'BTS PIM',
        'BTS SAM',
      ],
    },
    { group: 'DCG3', items: ['DCG3'] },
    {
      group: 'Prépa',
      items: ['ATS', 'D1', 'D2', 'DCG', 'DCG2', 'DSCG', 'ECG', 'ECT'],
    },
  ]

  const optionsCampus = ['ENC Bessières', 'ENC Bessières Apprentissage']

  // 🔄 CORRECTION : Génération dynamique et infinie des promotions (de 2010 jusqu'à l'année en cours + 15 ans)
  const startYear = 2010
  const endYear = new Date().getFullYear() + 15
  const optionsPromotions = Array.from(
    { length: endYear - startYear + 1 },
    (_, i) => (endYear - i).toString(), // Trié du plus récent au plus ancien
  )

  const handleMultiSelect = (
    value: string,
    currentList: string[],
    setList: React.Dispatch<React.SetStateAction<string[]>>,
  ) => {
    if (currentList.includes(value)) {
      setList(currentList.filter((item) => item !== value))
    } else {
      setList([...currentList, value])
    }
  }

  const uploadMediaFile = async (file: File, altText: string): Promise<string | null> => {
    const data = new FormData()
    data.append('file', file)
    data.append('alt', altText)

    const res = await fetch('/api/media', {
      method: 'POST',
      body: data,
    })

    if (!res.ok) return null
    const json = await res.json()
    return json.doc?.id || json.id || null
  }

  const handleSubmit = async (e: React.FormEvent, statusType: 'publie' | 'brouillon') => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      let logoId = null
      let documentJointId = null

      if (logoFile) {
        logoId = await uploadMediaFile(logoFile, `Logo ${formData.entreprise}`)
        if (!logoId) throw new Error('Échec du téléversement du logo.')
      }

      if (docFile) {
        documentJointId = await uploadMediaFile(docFile, `Document Offre ${formData.poste}`)
        if (!documentJointId) throw new Error('Échec du téléversement du document joint.')
      }

      const finalPayload = {
        ...formData,
        statut: statusType,
        logo: logoId,
        documentJoint: documentJointId,
        restreindreDiplomes,
        restreindreCampus,
        restreindrePromotions,
        dateDebut: formData.dateDebut ? new Date(formData.dateDebut).toISOString() : null,
        dateLimite: formData.dateLimite ? new Date(formData.dateLimite).toISOString() : null,
      }

      const res = await fetch('/api/offres', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalPayload),
      })

      if (res.ok) {
        router.push('/jobs')
      } else {
        const errJson = await res.json()
        setError(errJson.errors?.[0]?.message || "Erreur lors de la création de l'annonce.")
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-gray-50 min-h-screen py-10 px-4 text-left font-sans text-xs font-bold text-gray-600">
      <div className="max-w-2xl mx-auto bg-white border border-gray-200 rounded-3xl p-8 shadow-sm space-y-6">
        <div>
          <h1 className="text-lg font-black text-gray-900 uppercase tracking-tight">
            Création d'une nouvelle annonce
          </h1>
        </div>

        {error && (
          <p className="text-red-600 bg-red-50 p-3 rounded-xl text-center border border-red-100">
            {error}
          </p>
        )}

        <form className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="text-gray-700 font-bold block mb-1">
                Nom du poste <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.poste}
                onChange={(e) => setFormData({ ...formData, poste: e.target.value })}
                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl outline-none focus:border-purple-500 font-medium text-gray-800 shadow-3xs"
                placeholder="Nom du poste"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-gray-700 font-bold block mb-1">
                Nom de l'entreprise <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.entreprise}
                onChange={(e) => setFormData({ ...formData, entreprise: e.target.value })}
                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl outline-none focus:border-purple-500 font-medium text-gray-800 shadow-3xs"
                placeholder="Nom de l'entreprise"
              />
            </div>
            <div>
              <label className="text-gray-700 font-bold block mb-1">
                Nom de la ville <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.localisation}
                onChange={(e) => setFormData({ ...formData, localisation: e.target.value })}
                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl outline-none focus:border-purple-500 font-medium text-gray-800 shadow-3xs"
                placeholder="Nom de la ville"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-gray-700 font-bold block mb-1">
                Type de contrat <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.typeContrat}
                onChange={(e) => setFormData({ ...formData, typeContrat: e.target.value })}
                className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl outline-none focus:border-purple-500 font-medium text-gray-700 shadow-3xs cursor-pointer"
              >
                <option value="Stage">Stage</option>
                <option value="Alternance">Alternance</option>
                <option value="Independant">Indépendant</option>
                <option value="Interim">Intérim</option>
                <option value="CDD">CDD</option>
                <option value="CDI">CDI</option>
                <option value="VIA_VIE">VIA / VIE</option>
                <option value="Fonctionnaire">Fonctionnaire</option>
                <option value="Benevole">Bénévole</option>
                <option value="Service_Civique">Service Civique</option>
                <option value="Dirigeant">Dirigeant</option>
                <option value="Autre">Autre</option>
                <option value="CDDU">CDDU</option>
              </select>
            </div>
            <div>
              <label className="text-gray-700 font-bold block mb-1">
                Secteur d'activité de l'entreprise <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.secteur}
                onChange={(e) => setFormData({ ...formData, secteur: e.target.value })}
                className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl outline-none focus:border-purple-500 font-medium text-gray-700 shadow-3xs cursor-pointer"
              >
                <option value="autres">Autres</option>
                <option value="agro_alimentaire">Agro-alimentaire</option>
                <option value="architecture">Architecture</option>
                <option value="association_non_lucrative">Association non lucrative</option>
                <option value="banque_assurance_finance">Banque / Assurance / Finance</option>
                <option value="conseil_audit">Conseil / Audit</option>
                <option value="culture_media_divertissement">
                  Culture / Media / Divertissement
                </option>
                <option value="digital_technologie">Digital / Technologie</option>
                <option value="grande_distribution_ventes">Grande distribution / Ventes</option>
                <option value="droit_ecogestion_science_politique">
                  Droit / Éco-gestion / Science Politique
                </option>
                <option value="enseignement_formation_recrutement">
                  Enseignement / Formation / Recrutement
                </option>
                <option value="entrepreneuriat_startup">Entrepreneuriat / Start-up</option>
                <option value="travaux_publics">Travaux Publics</option>
                <option value="industrie">Industry</option>
                <option value="publicite_marketing_communication">
                  Publicité / Marketing / Communication
                </option>
                <option value="mode_luxe_beaute">Mode / Luxe / Beauté</option>
                <option value="environnement_sante_social">Environnement / Santé / Social</option>
                <option value="sciences_recherche">Sciences / Recherche</option>
                <option value="secteur_public_administration">
                  Secteur public et administration
                </option>
                <option value="automobile">Automobile</option>
                <option value="organisation_internationale">Organisation internationale</option>
                <option value="tourisme_hotellerie_restuarant">
                  Tourisme / Hôtellerie / Restauration
                </option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-gray-700 font-bold block mb-1">Expérience souhaitée</label>
              <select
                value={formData.experience}
                onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl outline-none focus:border-purple-500 font-medium text-gray-700 shadow-3xs cursor-pointer"
              >
                <option value="non_renseigne">Non renseigné</option>
                <option value="0_2_ans">0-2 ans</option>
                <option value="2_4_ans">2-4 ans</option>
                <option value="4_7_ans">4-7 ans</option>
                <option value="7_10_ans">7-10 ans</option>
                <option value="plus_10_ans">+ 10 ans</option>
              </select>
            </div>
            <div>
              <label className="text-gray-700 font-bold block mb-1">
                Rémunération (brut annuel)
              </label>
              <select
                value={formData.remuneration}
                onChange={(e) => setFormData({ ...formData, remuneration: e.target.value })}
                className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl outline-none focus:border-purple-500 font-medium text-gray-700 shadow-3xs cursor-pointer"
              >
                <option value="non_renseigne">Non renseigné</option>
                <option value="stage_non_indemnise">Stage non-indemnisé</option>
                <option value="stage_indemnise">Stage indemnisé</option>
                <option value="moins_15k">&lt; 15k €</option>
                <option value="20_225k">20-22,5K €</option>
                <option value="25_275k">25-27,5K €</option>
                <option value="30_325k">30-32,5K €</option>
                <option value="35-37,5K €">35-37,5K €</option>
                <option value="40_45k">40-45K €</option>
                <option value="45_50k">45-50K €</option>
                <option value="50_55k">50-55K €</option>
                <option value="60_65k">60-65K €</option>
                <option value="70_75k">70-75K €</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-gray-700 font-bold block mb-1">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={5}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-purple-500 font-medium text-gray-800 shadow-3xs leading-relaxed"
              placeholder="Détaillez les missions et exigences du poste..."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-gray-700 font-bold block mb-1">
                Date de début <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={formData.dateDebut}
                onChange={(e) => setFormData({ ...formData, dateDebut: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl outline-none focus:border-purple-500 font-medium text-gray-700 cursor-pointer shadow-3xs"
              />
            </div>
            <div>
              <label className="text-gray-700 font-bold block mb-1">
                Date limite de candidature <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={formData.dateLimite}
                onChange={(e) => setFormData({ ...formData, dateLimite: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl outline-none focus:border-purple-500 font-medium text-gray-700 cursor-pointer shadow-3xs"
              />
            </div>
          </div>

          {/* 🔒 MODULE DE VISIBILITÉ EN DROPDOWNS INTERACTIFS COMPATIBLES MAQUETTES */}
          <div className="border border-gray-200 rounded-2xl p-5 bg-gray-50/30 space-y-4">
            <p className="text-sm font-black text-gray-800 tracking-tight">
              Restreindre la visibilité aux :
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[11px] relative">
              {/* Dropdown 1 : Diplômes */}
              <div className="space-y-1 relative">
                <span className="text-gray-500 block">Diplômes suivants :</span>
                <div
                  onClick={() => {
                    setOpenDiplomes(!openDiplomes)
                    setOpenCampus(false)
                    setOpenPromotions(false)
                  }}
                  className="bg-white border border-gray-200 rounded-xl p-2.5 flex justify-between items-center cursor-pointer shadow-3xs text-gray-800 font-semibold select-none"
                >
                  <span>
                    {restreindreDiplomes.length > 0
                      ? `${restreindreDiplomes.length} sélectionnés`
                      : 'Sélectionner un diplôme'}
                  </span>
                  <span className="text-gray-400 text-[9px]">{openDiplomes ? '▲' : '▼'}</span>
                </div>

                {openDiplomes && (
                  <div className="absolute left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg p-3 max-h-60 overflow-y-auto z-50 space-y-3">
                    {optionsDiplomes.map((groupObj) => (
                      <div key={groupObj.group} className="space-y-1">
                        <div className="text-gray-400 font-bold uppercase tracking-wider text-[9px] border-b border-gray-100 pb-0.5">
                          {groupObj.group}
                        </div>
                        <div className="pl-1 space-y-1.5 pt-1">
                          {groupObj.items.map((subItem) => (
                            <label
                              key={subItem}
                              className="flex items-center gap-2 cursor-pointer text-gray-700 font-medium hover:text-purple-600 transition-colors"
                            >
                              <input
                                type="checkbox"
                                checked={restreindreDiplomes.includes(subItem)}
                                onChange={() =>
                                  handleMultiSelect(
                                    subItem,
                                    restreindreDiplomes,
                                    setRestreindreDiplomes,
                                  )
                                }
                                className="rounded text-purple-600 focus:ring-purple-400 w-3.5 h-3.5 cursor-pointer"
                              />
                              {subItem}
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Dropdown 2 : Campus */}
              <div className="space-y-1 relative">
                <span className="text-gray-500 block">Campus suivants :</span>
                <div
                  onClick={() => {
                    setOpenCampus(!openCampus)
                    setOpenDiplomes(false)
                    setOpenPromotions(false)
                  }}
                  className="bg-white border border-gray-200 rounded-xl p-2.5 flex justify-between items-center cursor-pointer shadow-3xs text-gray-800 font-semibold select-none"
                >
                  <span>
                    {restreindreCampus.length > 0
                      ? `${restreindreCampus.length} sélectionnés`
                      : 'Campus'}
                  </span>
                  <span className="text-gray-400 text-[9px]">{openCampus ? '▲' : '▼'}</span>
                </div>

                {openCampus && (
                  <div className="absolute left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg p-2 max-h-40 overflow-y-auto z-50 space-y-1.5">
                    {optionsCampus.map((campus) => (
                      <label
                        key={campus}
                        className="flex items-center gap-2 cursor-pointer text-gray-700 font-medium p-1 hover:bg-gray-50 rounded-lg"
                      >
                        <input
                          type="checkbox"
                          checked={restreindreCampus.includes(campus)}
                          onChange={() =>
                            handleMultiSelect(campus, restreindreCampus, setRestreindreCampus)
                          }
                          className="rounded text-purple-600 focus:ring-purple-400 w-3.5 h-3.5 cursor-pointer"
                        />
                        {campus}
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Dropdown 3 : Promotions INFINIES & FLUIDES (Scrollable avec sélections multiples) */}
              <div className="space-y-1 sm:col-span-2 relative">
                <span className="text-gray-500 block">Promotions suivantes :</span>
                <div
                  onClick={() => {
                    setOpenPromotions(!openPromotions)
                    setOpenDiplomes(false)
                    setOpenCampus(false)
                  }}
                  className="bg-white border border-gray-200 rounded-xl p-2.5 flex justify-between items-center cursor-pointer shadow-3xs text-gray-800 font-semibold select-none"
                >
                  <span>
                    {restreindrePromotions.length > 0
                      ? `${restreindrePromotions.length} sélectionnée(s)`
                      : 'Sélectionner les promotions'}
                  </span>
                  <span className="text-gray-400 text-[9px]">{openPromotions ? '▲' : '▼'}</span>
                </div>

                {openPromotions && (
                  <div className="absolute left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg p-3 max-h-48 overflow-y-auto z-50 grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {optionsPromotions.map((year) => (
                      <label
                        key={year}
                        className="flex items-center gap-2 cursor-pointer text-gray-700 font-medium p-1 hover:bg-gray-50 rounded-lg select-none transition-colors hover:text-purple-600"
                      >
                        <input
                          type="checkbox"
                          checked={restreindrePromotions.includes(year)}
                          onChange={() =>
                            handleMultiSelect(year, restreindrePromotions, setRestreindrePromotions)
                          }
                          className="rounded text-purple-600 focus:ring-purple-400 w-3.5 h-3.5 cursor-pointer"
                        />
                        {year}
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Section Médias Upload */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50/50 p-4 border border-gray-100 rounded-2xl">
            <div>
              <label className="text-gray-500 uppercase block mb-1">Logo de l'entreprise</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                className="w-full text-xs text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
              />
            </div>
            <div>
              <label className="text-gray-500 uppercase block mb-1">
                Pièce jointe (PDF, DOC, DOCX)
              </label>
              <input
                type="file"
                accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={(e) => setDocFile(e.target.files?.[0] || null)}
                className="w-full text-xs text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-gray-100 font-black uppercase text-[10px] tracking-wider">
            <button
              type="button"
              disabled={loading}
              onClick={(e) => handleSubmit(e, 'brouillon')}
              className="px-5 py-3 bg-gray-100 text-gray-500 rounded-xl hover:bg-gray-200 transition-colors cursor-pointer"
            >
              Enregistrer en Brouillon
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={(e) => handleSubmit(e, 'publie')}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm transition-colors cursor-pointer"
            >
              {loading ? 'Téléversement...' : "Publier l'annonce"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
