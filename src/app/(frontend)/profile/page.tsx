'use client'
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showPopup, setShowPopup] = useState<string | null>(null)
  const [step, setStep] = useState(1) 
  const [tempData, setTempData] = useState<any>({})
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const router = useRouter()

  // Structure des diplômes officiels de l'ENC Bessières
  const diplomaHierarchy = {
    "BTS": [
      "BTS Assurance", "BTS CG (Comptabilité et Gestion)", "BTS Communication", 
      "BTS CI (Commerce International)", "BTS GPME", "BTS MCO", "BTS NDRC", 
      "BTS SAM", "BTS SIO (SLAM/SISR)", "BTS Tourisme"
    ],
    "DCG3": [
      "DCG (Diplôme de Comptabilité et de Gestion)"
    ],
    "Prépa": [
      "Classe préparatoire ATS", "Classe préparatoire ENS D1", 
      "Classe préparatoire ENS D2", "Classe préparatoire ECT", "Classe préparatoire ECG"
    ]
  }

  const iconsList = [
    { name: 'Facebook', icon: 'fa-brands fa-facebook', bg: '#EBF4FF', color: '#1877F2' },
    { name: 'Instagram', icon: 'fa-brands fa-instagram', bg: '#FFF0F5', color: '#E4405F' },
    { name: 'LinkedIn', icon: 'fa-brands fa-linkedin-in', bg: '#EBF4FF', color: '#0A66C2' },
    { name: 'X / Twitter', icon: 'fa-brands fa-x-twitter', bg: '#F3F4F6', color: '#000000' },
    { name: 'YouTube', icon: 'fa-brands fa-youtube', bg: '#FEE2E2', color: '#FF0000' },
    { name: 'Snapchat', icon: 'fa-brands fa-snapchat', bg: '#FEF08A', color: '#FFFC00' },
    { name: 'TikTok', icon: 'fa-brands fa-tiktok', bg: '#F3F4F6', color: '#010101' },
    { name: 'Site internet', icon: 'fa-solid fa-globe', bg: '#E0F2FE', color: '#0369A1' },
    { name: 'GitHub', icon: 'fa-brands fa-github', bg: '#F3F4F6', color: '#24292E' },
    { name: 'Lien externe', icon: 'fa-solid fa-link', bg: '#F1F5F9', color: '#475569' },
    { name: 'Fichier PDF / CV', icon: 'fa-solid fa-file-pdf', bg: '#FEE2E2', color: '#DC2626' },
    { name: 'Mallette / Portfolio', icon: 'fa-solid fa-briefcase', bg: '#FEF3C7', color: '#D97706' },
    { name: 'Diplôme / Certificat', icon: 'fa-solid fa-user-graduate', bg: '#E0F2FE', color: '#0284C7' },
  ]

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/alumni/me')
      if (!res.ok) { setUser(null); setLoading(false); return; }
      const contentType = res.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) { setUser(null); setLoading(false); return; }
      const data = await res.json()
      if (data && data.user) setUser(data.user)
    } catch (err) { 
      console.error(err)
    } finally { 
      setLoading(false) 
    }
  }

  useEffect(() => { 
    fetchProfile() 
  }, [])

  const validateDates = (type: string, data: any): boolean => {
    setErrorMessage(null)
    const parseDateValue = (dateStr: string) => {
      if (!dateStr) return 0
      if (dateStr.includes('/')) {
        const [month, year] = dateStr.split('/').map(Number)
        return year * 12 + month
      }
      return Number(dateStr) * 12
    }

    const regexFormat = /^(0[1-9]|1[0-2])\/\d{4}$|^\d{4}$/

    if (type === 'exp') {
      if (!data.poste || !data.entreprise || !data.localite) { setErrorMessage("Les champs marqués d'une astérisque (*) sont obligatoires."); return false; }
      if (!data.dateDebut) { setErrorMessage("La date de début est obligatoire."); return false; }
      if (!regexFormat.test(data.dateDebut)) { setErrorMessage("Le format de début doit être MM/AAAA (ex: 09/2024)."); return false; }
      if (!data.isCurrent && data.dateFin) {
        if (!regexFormat.test(data.dateFin)) { setErrorMessage("Le format de fin doit être MM/AAAA (ex: 06/2025)."); return false; }
        const start = parseDateValue(data.dateDebut)
        const end = parseDateValue(data.dateFin)
        if (end < start) { setErrorMessage("La date de fin ne peut pas être antérieure à la date de début."); return false; }
      }
    }

    if (type === 'form') {
      if (data.isENC === undefined) { setErrorMessage("Veuillez sélectionner l'établissement d'origine."); return false; }
      if (!data.nom) { setErrorMessage("Le choix ou le nom de la formation est obligatoire."); return false; }
      if (data.isENC && !data.campus) { setErrorMessage("Veuillez renseigner votre Campus de rattachement."); return false; }
      if (!data.isENC && (!data.typeDiplome || !data.etablissement || !data.localiteEtablissement || !data.statutObtention)) {
        setErrorMessage("Veuillez remplir tous les champs obligatoires (*).");
        return false;
      }
      if (!data.annee) { setErrorMessage("L'année d'obtention est obligatoire."); return false; }
      const yearNum = Number(data.annee)
      if (isNaN(yearNum) || yearNum < 1960 || yearNum > 2035) { setErrorMessage("Veuillez saisir une année valide à 4 chiffres (ex: 2025)."); return false; }
    }

    if (type === 'interet') {
      if (!data.nom || data.nom.trim() === "") { setErrorMessage("Le nom de l'intérêt ne peut pas être vide."); return false; }
    }

    return true
  }

  const handleSave = async (updatedFields: any, typeValidation?: string) => {
    if (typeValidation) {
      const fieldName = typeValidation === 'exp' ? 'experiences' : typeValidation === 'form' ? 'formations' : 'interets'
      const payloadArray = updatedFields[fieldName]
      const lastItemAdded = payloadArray[payloadArray.length - 1]
      if (!validateDates(typeValidation, lastItemAdded)) return;
    }

    try {
      const res = await fetch(`/api/alumni/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedFields),
      })
      if (res.ok) {
        setShowPopup(null)
        setStep(1)
        setTempData({})
        setErrorMessage(null)
        fetchProfile()
      }
    } catch (err) { console.error(err) }
  }

  const handleDeleteItem = async (field: string, index: number) => {
    const newList = [...user[field]]
    newList.splice(index, 1)
    handleSave({ [field]: newList })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center">
        <div className="text-center font-bold text-enc uppercase tracking-widest animate-pulse">Chargement du profil...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex flex-col items-center justify-center gap-4">
        <div className="text-gray-500 font-bold text-sm uppercase tracking-wider">Session expirée ou introuvable</div>
        <button onClick={() => router.push('/login')} className="px-6 py-2.5 bg-enc text-white font-bold rounded-xl text-xs uppercase shadow-md">Se connecter</button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] py-10 px-4">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* 1. HEADER IDENTITÉ */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="h-32 bg-enc"></div>
          <div className="px-8 pb-8 flex flex-col md:flex-row items-center md:items-center -mt-16 gap-6">
            <img 
              src={`https://ui-avatars.com/api/?name=${user.prenom}+${user.nom}&size=150&background=800020&color=fff`} 
              className="w-32 h-32 rounded-full border-4 border-white shadow-lg object-cover z-10"
              alt="Profil"
            />
            <div className="flex-1 text-center md:text-left pt-2 md:pt-14">
              <div className="flex flex-col md:flex-row md:items-center gap-3 justify-center md:justify-start">
                <h1 className="text-3xl font-black text-gray-800 uppercase tracking-tight leading-none">{user.prenom} {user.nom}</h1>
                <span className="inline-block bg-enc/10 text-enc font-black uppercase text-[10px] px-2.5 py-1 rounded-full tracking-wider w-max mx-auto md:mx-0">Promotion {user.promotion}</span>
              </div>
            </div>
            <div className="flex gap-3 mt-4 md:mt-14 self-center md:self-end">
              <button onClick={() => router.push('/profile/edit')} className="px-6 py-2.5 bg-enc text-white font-bold rounded-xl text-xs uppercase hover:brightness-110 transition-all shadow-md">Modifier le profil</button>
            </div>
          </div>
        </div>

        {/* 2. GRILLE PRINCIPALE */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-4 space-y-6">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-8 flex items-center gap-2"><i className="fa-solid fa-address-book text-enc text-xs"></i> Coordonnées</h3>
              <div className="space-y-6">
                <div><p className="text-[9px] font-black text-gray-400 uppercase mb-1">Email</p><p className="text-sm font-bold text-gray-800">{user.email}</p></div>
                <div><p className="text-[9px] font-black text-gray-400 uppercase mb-1">Téléphone</p><p className="text-sm font-bold text-gray-800">{user.telephone || 'Non renseigné'}</p></div>
                <div><p className="text-[9px] font-black text-gray-400 uppercase mb-1">Localisation</p><p className="text-sm font-bold text-gray-800">{user.ville || 'Non renseignée'}</p></div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 space-y-6 relative">
              <div className="flex justify-between items-center border-b border-gray-100 pb-4">
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em]">Liens externes & Documents</h3>
                <button onClick={() => { setShowPopup('social'); setStep(1); setErrorMessage(null); }} className="w-7 h-7 bg-[#4ADE80] text-white rounded-lg flex items-center justify-center hover:scale-105 transition-transform"><i className="fa-solid fa-plus text-xs"></i></button>
              </div>
              <div className="space-y-6">
                <div className="pt-2">
                  <p className="text-[9px] font-black text-gray-400 uppercase mb-4 text-center">Mes documents & Raccourcis</p>
                  {user.socialLinks && user.socialLinks.length > 0 ? (
                    <div className="flex flex-wrap justify-center gap-4">
                      {user.socialLinks.map((link: any, i: number) => {
                        const matchedIcon = iconsList.find(item => item.icon === link.icon);
                        return (
                          <div key={i} className="relative group">
                            <a href={link.url} target="_blank" rel="noopener noreferrer" style={{ backgroundColor: matchedIcon?.bg || '#F1F5F9', color: matchedIcon?.color || '#475569' }} className="w-12 h-12 rounded-full flex items-center justify-center text-xl hover:scale-110 transition-transform shadow-sm relative">
                              <i className={link.icon}></i>
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1 bg-gray-900 text-white text-[10px] rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none font-bold shadow-md z-30">{link.label}</div>
                            </a>
                            <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDeleteItem('socialLinks', i); }} className="absolute -top-1 -right-1 w-4 h-4 bg-white hover:bg-red-500 hover:text-white border border-gray-100 rounded-full flex items-center justify-center text-[8px] text-gray-400">✕</button>
                          </div>
                        )
                      })}
                    </div>
                  ) : <p className="text-center text-[11px] text-gray-400 italic">Aucun document ou lien enregistré.</p>}
                </div>
              </div>
            </div>
          </div>

          <div className="md:col-span-8 space-y-6">
            {/* BIO */}
            <section className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-6"><h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2"><i className="fa-solid fa-user text-enc"></i> Quelques mots pour me définir</h3></div>
              {user.bio ? <p className="text-gray-600 leading-relaxed font-medium italic">"{user.bio}"</p> : <div className="bg-gray-50 p-10 text-center rounded-2xl border-2 border-dashed border-gray-200"><button onClick={() => { setShowPopup('bio'); setErrorMessage(null); }} className="bg-emerald-500 text-white px-8 py-3 rounded-xl font-bold uppercase text-[10px] tracking-widest">+ Ajouter un résumé</button></div>}
            </section>

            {/* EXPÉRIENCES */}
            <section className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2"><i className="fa-solid fa-briefcase text-enc"></i> Expériences professionnelles</h3>
                <button onClick={() => { setTempData({ isCurrent: false, matchFormation: false, isCadre: false }); setShowPopup('exp'); setErrorMessage(null); }} className="bg-emerald-500 text-white px-4 py-2 rounded-lg font-bold uppercase text-[9px] tracking-widest">+ Ajouter</button>
              </div>
              {user.experiences?.length > 0 ? (
                <div className="space-y-4">
                  {user.experiences.map((exp: any, i: number) => (
                    <div key={i} className="flex justify-between items-start p-5 bg-[#F8F9FA] rounded-2xl border border-gray-50 group">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-black text-gray-800 uppercase text-sm tracking-tight">{exp.poste}</p>
                          {exp.typeContrat && <span className="bg-gray-200 text-gray-700 font-bold text-[9px] px-2 py-0.5 rounded-sm uppercase">{exp.typeContrat}</span>}
                          {exp.isCurrent && <span className="bg-emerald-100 text-emerald-700 font-bold text-[9px] px-2 py-0.5 rounded-sm uppercase">Poste actuel</span>}
                        </div>
                        <p className="text-xs text-enc font-bold">{exp.entreprise} {exp.localite && <span className="text-gray-400 font-medium ml-1">📍 {exp.localite}</span>}</p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase mt-0.5"><i className="fa-regular fa-calendar-days text-xs mr-1"></i> {exp.dateDebut} — {exp.isCurrent ? 'Présent' : exp.dateFin || '---'}</p>
                        {exp.description && <p className="text-xs text-gray-500 mt-3 italic border-l-2 border-gray-200 pl-3 whitespace-pre-line">{exp.description}</p>}
                      </div>
                      <button onClick={() => handleDeleteItem('experiences', i)} className="p-2 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity ml-4"><i className="fa-solid fa-trash-can"></i></button>
                    </div>
                  ))}
                </div>
              ) : <div className="p-6 bg-blue-50 border-l-4 border-blue-400 rounded-r-xl"><p className="text-blue-700 text-xs font-medium">Aucune expérience saisie.</p></div>}
            </section>

            {/* FORMATIONS */}
            <section className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2"><i className="fa-solid fa-graduation-cap text-enc"></i> Formations</h3>
                <button onClick={() => { setTempData({ isENC: true, statutObtention: "J'ai obtenu mon diplôme" }); setShowPopup('form'); setErrorMessage(null); }} className="bg-emerald-500 text-white px-4 py-2 rounded-lg font-bold uppercase text-[9px] tracking-widest">+ Ajouter</button>
              </div>
              <div className="space-y-4">
                {user.formations?.map((form: any, i: number) => (
                  <div key={i} className="flex justify-between items-start p-5 bg-[#F8F9FA] rounded-2xl border border-gray-50 group">
                    <div className="flex gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl shadow-sm ${form.isENC ? 'bg-enc text-white' : 'bg-white text-gray-400'}`}><i className={form.isENC ? 'fa-solid fa-certificate' : 'fa-solid fa-university'}></i></div>
                      <div>
                        <p className="font-black text-gray-800 uppercase text-sm tracking-tight">{form.nom}</p>
                        <p className="text-xs font-bold text-gray-500 uppercase">
                          {form.etablissement} {form.campus ? `(${form.campus})` : form.localiteEtablissement ? `(${form.localiteEtablissement})` : ''}
                        </p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className="text-[10px] text-gray-400 font-bold uppercase">Année : {form.annee}</span>
                          {form.typeDiplome && <span className="bg-gray-200 text-gray-600 font-bold text-[8px] px-1.5 py-0.5 rounded-sm uppercase">{form.typeDiplome}</span>}
                          {form.statutObtention && <span className="bg-blue-50 text-blue-600 font-bold text-[8px] px-1.5 py-0.5 rounded-sm uppercase">{form.statutObtention}</span>}
                        </div>
                        {form.descriptionFormation && <p className="text-xs text-gray-500 mt-2 italic whitespace-pre-line">{form.descriptionFormation}</p>}
                      </div>
                    </div>
                    <button onClick={() => handleDeleteItem('formations', i)} className="p-2 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"><i className="fa-solid fa-trash-can"></i></button>
                  </div>
                ))}
              </div>
            </section>

            {/* CENTRES D'INTÉRÊT RECOUPÉS PROPREMENT */}
            <section className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <i className="fa-solid fa-heart text-enc"></i> Centres d'intérêt
                </h3>
                <button 
                  onClick={() => { setTempData({ nom: '' }); setShowPopup('interet'); setErrorMessage(null); }} 
                  className="w-7 h-7 bg-[#4ADE80] text-white rounded-lg flex items-center justify-center hover:scale-105 transition-transform shadow-xs"
                  title="Ajouter un centre d'intérêt"
                >
                  <i className="fa-solid fa-plus text-xs"></i>
                </button>
              </div>
              <div className="flex flex-wrap gap-3">
                {user.interets && user.interets.length > 0 ? (
                  user.interets.map((int: any, i: number) => (
                    <div key={i} className="px-4 py-2 bg-gray-50 text-gray-700 rounded-xl font-bold text-[10px] uppercase flex items-center gap-2 border border-gray-200 shadow-xs">
                      <span>{int.nom}</span>
                      <button onClick={() => handleDeleteItem('interets', i)} className="text-gray-400 hover:text-red-500 transition-colors p-0.5"><i className="fa-solid fa-xmark text-xs"></i></button>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-400 text-xs italic font-medium">Aucun centre d'intérêt renseigné pour le moment.</p>
                )}
              </div>
            </section>

          </div>
        </div>
      </div>

      {/* POPUPS ET MODALS CONTROLLEURS */}
      {showPopup && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden animate-in zoom-in duration-200">
            <div className="bg-gray-50 p-5 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-base font-black text-gray-800 uppercase tracking-tighter">
                {showPopup === 'social' ? 'Ajouter un lien / document' : showPopup === 'exp' ? 'Saisir une expérience professionnelle' : showPopup === 'form' ? 'Ajouter une formation' : 'Ajouter un centre d\'intérêt'}
              </h2>
              <button onClick={() => {setShowPopup(null); setStep(1); setTempData({}); setErrorMessage(null);}} className="text-gray-400 hover:text-red-500"><i className="fa-solid fa-circle-xmark text-xl"></i></button>
            </div>
            
            <div className="p-6 max-h-[75vh] overflow-y-auto space-y-5 text-left">
              
              {errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-xl flex items-center gap-2 animate-in shake duration-300">
                  <i className="fa-solid fa-triangle-exclamation text-base"></i>
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* SOCIAL */}
              {showPopup === 'social' && (
                <div className="space-y-4">
                  <div className={`p-4 rounded-2xl border-2 ${step === 1 ? 'border-blue-500 bg-blue-50' : 'border-emerald-500 bg-emerald-50'}`}>
                    {step === 1 && (
                      <div className="grid grid-cols-5 gap-3 max-h-[160px] overflow-y-auto pr-1">
                        {iconsList.map((item) => (
                          <button key={item.name} onClick={() => { setTempData({...tempData, icon: item.icon}); setStep(2); }} className="h-11 bg-white rounded-xl border border-gray-200 flex items-center justify-center text-lg text-gray-700 hover:border-enc hover:scale-105 transition-all shadow-xs"><i className={item.icon}></i></button>
                        ))}
                      </div>
                    )}
                  </div>
                  {step === 2 && (
                    <div className="flex gap-2"><input className="flex-1 p-3 border border-gray-200 rounded-xl outline-none text-sm font-medium" placeholder="ex: Mon CV Web..." onChange={(e) => setTempData({...tempData, label: e.target.value})} /><button onClick={() => setStep(3)} disabled={!tempData.label} className="bg-blue-500 text-white px-5 rounded-xl font-bold text-xs uppercase">Ok</button></div>
                  )}
                  {step === 3 && (
                    <div className="space-y-4"><input className="w-full p-3 border border-gray-200 rounded-xl outline-none text-sm font-medium" placeholder="https://..." onChange={(e) => setTempData({...tempData, url: e.target.value})} /><button onClick={() => handleSave({ socialLinks: [...(user.socialLinks || []), tempData] })} className="w-full py-3.5 bg-emerald-500 text-white rounded-2xl font-bold uppercase text-xs shadow-lg">Enregistrer</button></div>
                  )}
                </div>
              )}

              {/* EXPÉRIENCE */}
              {showPopup === 'exp' && (
                <div className="space-y-4 font-medium text-gray-700 text-sm">
                  <div><label className="block text-xs font-bold text-gray-600 mb-1">Fonction <span className="text-red-500">*</span></label><input className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:border-blue-500" placeholder="Fonction occupée" onChange={(e) => setTempData({...tempData, poste: e.target.value})} /></div>
                  <div><label className="block text-xs font-bold text-gray-600 mb-1">Entreprise <span className="text-red-500">*</span></label><input className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:border-blue-500" placeholder="Nom de l'entreprise" onChange={(e) => setTempData({...tempData, entreprise: e.target.value})} /></div>
                  <div><label className="block text-xs font-bold text-gray-600 mb-1">Localisation <span className="text-red-500">*</span></label><input className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:border-blue-500" placeholder="Ville, Pays" onChange={(e) => setTempData({...tempData, localite: e.target.value})} /></div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1.5">J'occupe actuellement cette fonction <span className="text-red-500">*</span></label>
                    <div className="flex gap-2 w-max border rounded-xl overflow-hidden p-1 bg-gray-50">
                      <button onClick={() => setTempData({...tempData, isCurrent: true})} className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase ${tempData.isCurrent ? 'bg-white text-emerald-600 shadow-sm border border-emerald-200' : 'text-gray-400'}`}>Oui</button>
                      <button onClick={() => setTempData({...tempData, isCurrent: false})} className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase ${!tempData.isCurrent ? 'bg-white text-rose-500 shadow-sm border border-rose-200' : 'text-gray-400'}`}>Non</button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-xs font-bold text-gray-600 mb-1">Date de début <span className="text-red-500">*</span></label><input className="w-full p-3 border border-gray-200 rounded-xl outline-none text-center" placeholder="ex: 09/2024" onChange={(e) => setTempData({...tempData, dateDebut: e.target.value})} /></div>
                    {!tempData.isCurrent && <div><label className="block text-xs font-bold text-gray-600 mb-1">Date de fin <span className="text-red-500">*</span></label><input className="w-full p-3 border border-gray-200 rounded-xl outline-none text-center" placeholder="ex: 06/2025" onChange={(e) => setTempData({...tempData, dateFin: e.target.value})} /></div>}
                  </div>
                  <div><label className="block text-xs font-bold text-gray-600 mb-1">Description des missions</label><textarea rows={3} className="w-full p-3 border border-gray-200 rounded-xl text-xs outline-none focus:border-blue-500 leading-relaxed" placeholder="Détaillez vos activités..." onChange={(e) => setTempData({...tempData, description: e.target.value})}></textarea></div>
                  
                  <div className="bg-[#FFFDF4] border border-[#FDEFC2] rounded-2xl p-5 space-y-4">
                    <p className="text-xs font-bold text-[#A17903] uppercase tracking-wider border-b border-[#FDEFC2] pb-1.5">Informations complémentaires</p>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-500 mb-1">Secteur d'activité de l'entreprise</label>
                      <select className="w-full p-2.5 border bg-white border-gray-200 rounded-xl text-xs outline-none" onChange={(e) => setTempData({...tempData, secteur: e.target.value})}>
                        <option value="">Sélectionnez un secteur</option>
                        <option value="Agro-alimentaire">Agro-alimentaire</option><option value="Architecture">Architecture</option><option value="Association non lucrative">Association non lucrative</option><option value="Banque / Assurance / Finance">Banque / Assurance / Finance</option><option value="Conseil / Audit">Conseil / Audit</option><option value="Digital / Technologie">Digital / Technologie</option><option value="Enseignement / Formation / Recrutement">Enseignement / Formation / Recrutement</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-500 mb-1">Type de contrat</label>
                      <select className="w-full p-2.5 border bg-white border-gray-200 rounded-xl text-xs outline-none" onChange={(e) => setTempData({...tempData, typeContrat: e.target.value})}>
                        <option value="">Sélectionnez un contrat</option><option value="CDI">CDI (Temps plein)</option><option value="CDD">CDD</option><option value="Alternance">Alternance / Apprentissage</option><option value="Stage">Stage professionnel</option><option value="Interim">Intérim</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-500 mb-1">Rémunération annuelle brute</label>
                      <select className="w-full p-2.5 border bg-white border-gray-200 rounded-xl text-xs outline-none" onChange={(e) => setTempData({...tempData, remuneration: e.target.value})}>
                        <option value="">Sélectionnez une tranche (K€)</option><option value="Moins de 20k">Moins de 20 000 €</option><option value="20k - 25k">20 000 € - 25 000 €</option><option value="25k - 30k">25 000 € - 30 000 €</option><option value="30k - 35k">30 000 € - 35 000 €</option><option value="Plus de 80k">Plus de 80 000 €</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-500 mb-1">Comment avez-vous trouvé cet emploi ?</label>
                      <select className="w-full p-2.5 border bg-white border-gray-200 rounded-xl text-xs outline-none" onChange={(e) => setTempData({...tempData, provenanceEmploi: e.target.value})}>
                        <option value="">Sélectionnez une option</option><option value="Réseau Alumni ENC">Le réseau Alumni de l'ENC</option><option value="Candidature spontanée">Candidature spontanée</option><option value="Job board (Indeed, Welcome to the Jungle, etc.)">Job board (Indeed, Welcome to the Jungle, etc.)</option><option value="Suite du Stage / Alternance">Suite logique d'un stage ou d'une alternance</option>
                      </select>
                    </div>
                  </div>
                  <button onClick={() => handleSave({ experiences: [...(user.experiences || []), tempData] }, 'exp')} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold uppercase text-xs shadow-md">Enregistrer</button>
                </div>
              )}

              {/* FORMATIONS */}
              {showPopup === 'form' && (
                <div className="space-y-4 font-medium text-gray-700 text-sm">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-2">Ajouter une nouvelle formation dispensée par :</label>
                    <div className="flex gap-6 items-center p-3 bg-gray-50 rounded-xl border border-gray-100">
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-bold">
                        <input type="radio" checked={tempData.isENC === true} onChange={() => setTempData({ isENC: true, nom: '', annee: '', etablissement: 'ENC Bessières', campus: 'ENC Bessières' })} className="text-enc focus:ring-enc w-4 h-4" />
                        <span>ENC Bessières</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-bold">
                        <input type="radio" checked={tempData.isENC === false} onChange={() => setTempData({ isENC: false, nom: '', annee: '', etablissement: '', typeDiplome: '', localiteEtablissement: '', statutObtention: '' })} className="text-enc focus:ring-enc w-4 h-4" />
                        <span>Un autre établissement</span>
                      </label>
                    </div>
                  </div>

                  {tempData.isENC ? (
                    <>
                      <div>
                        <label className="block text-xs font-bold text-gray-600 mb-1">Diplôme <span className="text-red-500">*</span></label>
                        <select className="w-full p-3 border bg-white border-gray-200 rounded-xl text-xs outline-none focus:border-blue-500" value={tempData.nom || ''} onChange={(e) => setTempData({...tempData, nom: e.target.value})}>
                          <option value="">Sélectionnez votre filière</option>
                          <optgroup label="BTS">
                            {diplomaHierarchy.BTS.map((name) => <option key={name} value={name}>{name}</option>)}
                          </optgroup>
                          <optgroup label="DCG3">
                            {diplomaHierarchy.DCG3.map((name) => <option key={name} value={name}>{name}</option>)}
                          </optgroup>
                          <optgroup label="Prépa">
                            {diplomaHierarchy.Prépa.map((name) => <option key={name} value={name}>{name}</option>)}
                          </optgroup>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-600 mb-1">Nom de l'établissement <span className="text-red-500">*</span></label>
                        <input className="w-full p-3 border bg-gray-100 border-gray-200 rounded-xl text-xs outline-none text-gray-500 cursor-not-allowed" value="ENC Bessières" readOnly />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-600 mb-1">Campus <span className="text-red-500">*</span></label>
                        <select className="w-full p-3 border bg-white border-gray-200 rounded-xl text-xs outline-none focus:border-blue-500" value={tempData.campus || ''} onChange={(e) => setTempData({...tempData, campus: e.target.value})}>
                          <option value="">Campus</option>
                          <option value="ENC Bessières">ENC Bessières</option>
                          <option value="ENC Bessières Apprentissage">ENC Bessières Apprentissage</option>
                        </select>
                      </div>
                    </>
                  ) : (
                    <div className="space-y-4 animate-in fade-in duration-150">
                      <div>
                        <label className="block text-xs font-bold text-gray-600 mb-1">Nom de la formation <span className="text-red-500">*</span></label>
                        <input className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:border-blue-500 text-xs" placeholder="Master en physique nucléaire..." value={tempData.nom || ''} onChange={(e) => setTempData({...tempData, nom: e.target.value})} />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-600 mb-1">Type de diplôme <span className="text-red-500">*</span></label>
                        <select className="w-full p-3 border bg-white border-gray-200 rounded-xl text-xs outline-none" value={tempData.typeDiplome || ''} onChange={(e) => setTempData({...tempData, typeDiplome: e.target.value})}>
                          <option value="">Type de diplôme</option>
                          <option value="Classe préparatoire (Titre de Niveau 4)">Classe préparatoire (Titre de Niveau 4)</option>
                          <option value="BTS / BTSA / DUT (Titre de Niveau 5)">BTS / BTSA / DUT (Titre de Niveau 5)</option>
                          <option value="DUT / BUT (Titre de Niveau 5)">DUT / BUT (Titre de Niveau 5)</option>
                          <option value="PACES (Titre de Niveau 6)">PACES (Titre de Niveau 6)</option>
                          <option value="Bachelor / Licence / BUT (Titre de Niveau 6)">Bachelor / Licence / BUT (Titre de Niveau 6)</option>
                          <option value="Master 1 (Titre de Niveau 6)">Master 1 (Titre de Niveau 6)</option>
                          <option value="Master 2 (Titre de Niveau 7)">Master 2 (Titre de Niveau 7)</option>
                          <option value="Diplôme d'ingénieur (Titre de Niveau 7)">Diplôme d'ingénieur (Titre de Niveau 7)</option>
                          <option value="Doctorat (Titre de Niveau 8)">Doctorat (Titre de Niveau 8)</option>
                          <option value="CAP (Titre de Niveau 3)">CAP (Titre de Niveau 3)</option>
                          <option value="BEP / BEPC (Titre de Niveau 3)">BEP / BEPC (Titre de Niveau 3)</option>
                          <option value="Baccalauréat (Titre de Niveau 4)">Baccalauréat (Titre de Niveau 4)</option>
                          <option value="Autre">Autre</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-600 mb-1">Nom de l'établissement <span className="text-red-500">*</span></label>
                        <input className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:border-blue-500 text-xs" placeholder="Nom de l'établissement" value={tempData.etablissement || ''} onChange={(e) => setTempData({...tempData, etablissement: e.target.value})} />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-600 mb-1">Localisation de l'établissement <span className="text-red-500">*</span></label>
                        <input className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:border-blue-500 text-xs" placeholder="Localisation de l'établissement" value={tempData.localiteEtablissement || ''} onChange={(e) => setTempData({...tempData, localiteEtablissement: e.target.value})} />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-600 mb-1">Obtention <span className="text-red-500">*</span></label>
                        <select className="w-full p-3 border bg-white border-gray-200 rounded-xl text-xs outline-none focus:border-blue-500" value={tempData.statutObtention || ''} onChange={(e) => setTempData({...tempData, statutObtention: e.target.value})}>
                          <option value="">Obtention</option>
                          <option value="J'ai obtenu mon diplôme">J'ai obtenu mon diplôme</option>
                          <option value="Je suis en cours d'obtention">Je suis en cours d'obtention</option>
                          <option value="Je n'ai pas obtenu le diplôme">Je n'ai pas obtenu le diplôme</option>
                        </select>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Année d'obtention / année de promotion <span className="text-red-500">*</span></label>
                    <input className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:border-blue-500 text-xs" placeholder="ex: 2025" value={tempData.annee || ''} onChange={(e) => setTempData({...tempData, annee: e.target.value})} />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Description de la formation</label>
                    <textarea rows={3} className="w-full p-3 border border-gray-200 rounded-xl text-xs outline-none focus:border-blue-500 leading-relaxed" placeholder="Description de la formation" value={tempData.descriptionFormation || ''} onChange={(e) => setTempData({...tempData, descriptionFormation: e.target.value})}></textarea>
                  </div>

                  <button onClick={() => handleSave({ formations: [...(user.formations || []), tempData] }, 'form')} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold uppercase text-xs shadow-md transition-all hover:bg-blue-700">Enregistrer</button>
                </div>
              )}

              {/* INTERET INTÉGRÉ GRAPHRE ET VALIDÉ */}
              {showPopup === 'interet' && (
                <div className="space-y-4 font-medium text-gray-700 text-sm">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Nouveau centre d'intérêt <span className="text-red-500">*</span></label>
                    <input 
                      placeholder="Ex: Guitare, Développement Web, Cyber sécurité..." 
                      className="w-full p-3 border border-gray-200 rounded-xl h-12 outline-none focus:border-blue-500 text-xs font-medium" 
                      value={tempData.nom || ''}
                      onChange={(e) => setTempData({ nom: e.target.value })} 
                    />
                  </div>
                  <button 
                    onClick={() => handleSave({ interets: [...(user.interets || []), tempData] }, 'interet')} 
                    className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold uppercase text-xs shadow-md transition-all hover:bg-blue-700"
                  >
                    Enregistrer le centre d'intérêt
                  </button>
                </div>
              )}

            </div>
          </div>
        </div>
      )}
    </div>
  )
}