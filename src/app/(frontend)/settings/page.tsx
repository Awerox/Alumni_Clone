'use client'
import React, { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'

export default function SettingsPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('profile')
  const [isSaving, setIsSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  
  // États pour le Popup de Recadrage (Crop)
  const [showCropModal, setShowCropModal] = useState(false)
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null)
  const [previewImageSrc, setPreviewImageSrc] = useState<string>('')
  const [zoomScale, setZoomScale] = useState<number>(1)

  // État local du formulaire global
  const [formData, setFormData] = useState<any>({})
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/alumni/me', { credentials: 'include' })
      if (!res.ok) { router.push('/login'); return; }
      const data = await res.json()
      if (data && data.user) {
        setUser(data.user)
        setFormData({
          prenom: data.user.prenom || '',
          nom: data.user.nom || '',
          nomNaissance: data.user.nomNaissance || '',
          email: data.user.email || '',
          civilite: data.user.civilite || 'M.',
          telephone: data.user.telephone || '',
          ville: data.user.ville || '',
          dateNaissance: data.user.dateNaissance || '',
          avatar: data.user.avatar || null,
          searchOpportunities: data.user.searchOpportunities ?? true,
          profileVisibility: data.user.profileVisibility ?? true,
          interveneEstablishment: data.user.interveneEstablishment ?? false,
          shareExperience: data.user.shareExperience ?? true,
          ambassador: data.user.ambassador ?? false,
          jury: data.user.jury ?? false,
          notifNewsletter: data.user.notifNewsletter ?? false,
          notifPlatform: data.user.notifPlatform ?? true,
          notifWeeklyJobs: data.user.notifWeeklyJobs ?? false,
          notifLastPosts: data.user.notifLastPosts ?? true,
          notifLastBlogs: data.user.notifLastBlogs ?? true,
          notifLastEvents: data.user.notifLastEvents ?? true,
          notifMassMessages: data.user.notifMassMessages ?? true,
          notifGroupInvites: data.user.notifGroupInvites ?? true,
          mentoratRole: data.user.mentoratRole || 'filleul', 
          mentoratActive: data.user.mentoratActive ?? false,
        })
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchSettings() }, [])

  // Envoie les modifications textuelles simples à la base de données
  const handleUpdateFields = async (fieldsToSave: any) => {
    setIsSaving(true)
    setSuccessMessage(null)
    setErrorMessage(null)

    // Nettoyage de l'ID d'avatar pour ne jamais envoyer un objet imbriqué à l'API
    let avatarId = fieldsToSave.avatar
    if (avatarId && typeof avatarId === 'object') {
      avatarId = avatarId.id
    }

    const payload = {
      ...fieldsToSave,
      avatar: avatarId
    }

    try {
      const res = await fetch(`/api/alumni/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include',
      })
      if (res.ok) {
        setSuccessMessage('Modifications enregistrées avec succès !')
        setTimeout(() => setSuccessMessage(null), 3000)
        fetchSettings()
      } else {
        setErrorMessage("Le serveur a refusé la mise à jour des données.")
      }
    } catch (err) {
      console.error(err)
      setErrorMessage("Erreur réseau lors de la mise à jour.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleToggle = (key: string) => {
    const updatedValue = !formData[key]
    setFormData((prev: any) => ({ ...prev, [key]: updatedValue }))
    handleUpdateFields({ ...formData, [key]: updatedValue })
  }

  const handleMentoratRoleChange = (role: 'filleul' | 'mentor') => {
    setFormData((prev: any) => ({ ...prev, mentoratRole: role }))
    handleUpdateFields({ ...formData, mentoratRole: role })
  }

  const handleFileSelection = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return
    const file = e.target.files[0]
    
    setSelectedImageFile(file)
    setPreviewImageSrc(URL.createObjectURL(file))
    setZoomScale(1)
    setShowCropModal(true)
  }

  // TÉLÉVERSEMENT ISOLÉ IMMÉDIAT DÈS LA VALIDATION DU CROP
  const handleSaveCroppedImage = async () => {
    if (!selectedImageFile) return
    
    setUploadingAvatar(true)
    setShowCropModal(false)
    setErrorMessage(null)
    
    const mediaFormData = new FormData()
    mediaFormData.append('file', selectedImageFile)
    mediaFormData.append('alt', `Avatar de ${formData.prenom} ${formData.nom}`)

    try {
      const mediaRes = await fetch('/api/media', {
        method: 'POST',
        body: mediaFormData,
        credentials: 'include', // Nécessaire pour maintenir la session sur les PC du lycée
      })
      
      if (!mediaRes.ok) {
        throw new Error("Droits d'accès refusés par Payload sur la collection Media.")
      }
      
      const mediaData = await mediaRes.json()
      
      if (mediaData?.doc?.id) {
        // Enregistre directement la nouvelle relation en BDD pour qu'elle soit visible globalement
        setFormData((prev: any) => ({ ...prev, avatar: mediaData.doc }))
        await handleUpdateFields({ ...formData, avatar: mediaData.doc.id })
        setSuccessMessage("Photo de profil mise à jour et visible par tous les utilisateurs !")
      }
    } catch (err: any) {
      console.error(err)
      setErrorMessage(err.message || "Impossible de lier l'image à votre profil.")
    } finally {
      setUploadingAvatar(false)
    }
  }

  const getAvatarUrl = () => {
    if (formData.avatar && typeof formData.avatar === 'object' && formData.avatar.url) {
      return formData.avatar.url
    }
    if (user?.avatar && typeof user.avatar === 'object' && user.avatar.url) {
      return user.avatar.url
    }
    return `https://ui-avatars.com/api/?name=${formData.prenom}+${formData.nom}&size=180&background=800020&color=fff`
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center font-bold text-enc animate-pulse uppercase">Chargement des paramètres...</div>

  return (
    <div className="min-h-screen bg-[#F8F9FA] py-10 px-4">
      <div className="max-w-6xl mx-auto bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        
        {/* BARRE DE NAVIGATION DES ONGLETS */}
        <div className="flex border-b border-gray-100 overflow-x-auto bg-gray-50/50">
          {[
            { id: 'profile', label: 'Données personnelles', icon: 'fa-solid fa-user' },
            { id: 'params', label: 'Paramètres', icon: 'fa-solid fa-gear' },
            { id: 'notifs', label: 'Notifications', icon: 'fa-solid fa-bell' },
            { id: 'mentorat', label: 'Mentorat', icon: 'fa-solid fa-user-group' },
            { id: 'signalements', label: 'Signalements', icon: 'fa-solid fa-circle-exclamation' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-4 text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all border-b-2 ${
                activeTab === tab.id ? 'border-purple-600 text-purple-600 bg-white' : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              <i className={tab.icon}></i>
              {tab.label}
            </button>
          ))}
        </div>

        {/* FEEDBACKS UTILISATEUR */}
        {successMessage && <div className="mx-8 mt-6 p-3 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-xl animate-in fade-in">{successMessage}</div>}
        {errorMessage && <div className="mx-8 mt-6 p-3 bg-rose-50 text-rose-700 text-xs font-bold rounded-xl animate-in shake duration-200">{errorMessage}</div>}

        <div className="p-8 md:p-10">
          
          {/* ================= ONGLET 1 : DONNÉES PERSONNELLES ================= */}
          {activeTab === 'profile' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 text-left">
              <div className="lg:col-span-8 space-y-5">
                <h3 className="text-lg font-black text-gray-800 uppercase tracking-tight mb-6">Informations Personnelles</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Prénom *</label>
                    <input className="w-full p-3 border border-gray-200 rounded-xl outline-none text-sm font-medium focus:border-purple-500" value={formData.prenom || ''} onChange={(e) => setFormData({...formData, prenom: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Nom *</label>
                    <input className="w-full p-3 border border-gray-200 rounded-xl outline-none text-sm font-medium focus:border-purple-500" value={formData.nom || ''} onChange={(e) => setFormData({...formData, nom: e.target.value})} />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Nom de naissance (si différent)</label>
                  <input className="w-full p-3 border border-gray-200 rounded-xl outline-none text-sm font-medium focus:border-purple-500" value={formData.nomNaissance || ''} placeholder="NOM DE NAISSANCE" onChange={(e) => setFormData({...formData, nomNaissance: e.target.value})} />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Email *</label>
                  <input type="email" className="w-full p-3 border border-gray-200 rounded-xl outline-none text-sm font-medium bg-gray-50 cursor-not-allowed text-gray-400" value={formData.email || ''} readOnly />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Civilité *</label>
                    <select className="w-full p-3 border bg-white border-gray-200 rounded-xl text-sm font-medium outline-none" value={formData.civilite || 'M.'} onChange={(e) => setFormData({...formData, civilite: e.target.value})}>
                      <option value="M.">M.</option>
                      <option value="Mme">Mme</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-gray-500 mb-1">Téléphone</label>
                    <div className="flex border border-gray-200 rounded-xl overflow-hidden focus-within:border-purple-500">
                      <div className="bg-gray-50 border-r border-gray-200 px-3 flex items-center gap-1 text-xs font-bold text-gray-600">🇫🇷</div>
                      <input className="w-full p-3 outline-none text-sm font-medium" value={formData.telephone || ''} onChange={(e) => setFormData({...formData, telephone: e.target.value})} />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Ville</label>
                    <input className="w-full p-3 border border-gray-200 rounded-xl outline-none text-sm font-medium focus:border-purple-500" value={formData.ville || ''} onChange={(e) => setFormData({...formData, ville: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Date de naissance</label>
                    <input type="date" className="w-full p-3 border border-gray-200 rounded-xl outline-none text-sm font-medium focus:border-purple-500" value={formData.dateNaissance || ''} onChange={(e) => setFormData({...formData, dateNaissance: e.target.value})} />
                  </div>
                </div>

                <button onClick={() => handleUpdateFields(formData)} disabled={isSaving || uploadingAvatar} className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-md transition-all">
                  {isSaving ? 'Enregistrement...' : 'Enregistrer les informations'}
                </button>
              </div>

              {/* SECTEUR IMAGE DÉCLENCHEUR */}
              <div className="lg:col-span-4 flex flex-col items-center lg:border-l border-gray-100 lg:pl-10 space-y-6">
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Photo de profil</p>
                
                {/* Sécurité : value={''} permet de vider l'input et ré-importer la même image en boucle si besoin */}
                <input type="file" ref={fileInputRef} accept="image/*" className="hidden" onChange={handleFileSelection} value={''} />
                
                <div onClick={() => !uploadingAvatar && fileInputRef.current?.click()} className={`relative group w-44 h-44 rounded-2xl overflow-hidden border bg-gray-50 flex flex-col items-center justify-center cursor-pointer shadow-sm hover:scale-[1.02] transition-all ${uploadingAvatar ? 'animate-pulse' : ''}`}>
                  <img src={getAvatarUrl()} className="w-full h-full object-cover" alt="Avatar" />
                  <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity text-white font-bold text-xs">
                    <i className="fa-solid fa-camera text-lg"></i>
                    <span>{uploadingAvatar ? 'Envoi...' : 'Changer la photo'}</span>
                  </div>
                </div>
                
                <div className="w-full space-y-3 pt-6 border-t border-gray-100 text-center text-sm font-medium">
                  <p className="text-[11px] font-bold text-gray-500">CGU & Politique de Confidentialité</p>
                  <label className="flex items-center justify-center gap-2 text-xs text-gray-400">
                    <input type="checkbox" checked readOnly className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4 cursor-not-allowed" />
                    <span>Vous avez accepté les Conditions Générales</span>
                  </label>
                  <div className="pt-4">
                    <button type="button" onClick={() => setShowDeleteModal(true)} className="w-full py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-bold text-xs uppercase shadow-sm">Désactiver mon compte</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= PARAMÈTRES DU COMPTE ================= */}
          {activeTab === 'params' && (
            <div className="space-y-8 text-left max-w-4xl">
              <h3 className="text-lg font-black text-gray-800 uppercase tracking-tight border-b border-gray-100 pb-2">Paramètres du compte</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                
                <div className="space-y-2">
                  <p className="font-bold text-sm text-gray-800">Visibilité du profil par les employeurs</p>
                  <div className="flex gap-1 border border-gray-200 w-max p-1 bg-gray-50 rounded-xl">
                    <button onClick={() => handleToggle('profileVisibility')} className={`px-4 py-1 rounded-lg text-xs font-bold uppercase ${formData.profileVisibility ? 'bg-white text-emerald-600' : 'text-gray-400'}`}>Oui</button>
                    <button onClick={() => handleToggle('profileVisibility')} className={`px-4 py-1 rounded-lg text-xs font-bold uppercase ${!formData.profileVisibility ? 'bg-white text-rose-500' : 'text-gray-400'}`}>Non</button>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="font-bold text-sm text-gray-800">Intervenir dans l'établissement</p>
                  <div className="flex gap-1 border border-gray-200 w-max p-1 bg-gray-50 rounded-xl">
                    <button onClick={() => handleToggle('interveneEstablishment')} className={`px-4 py-1 rounded-lg text-xs font-bold uppercase ${formData.interveneEstablishment ? 'bg-white text-emerald-600 shadow-xs' : 'text-gray-400'}`}>Oui</button>
                    <button onClick={() => handleToggle('interveneEstablishment')} className={`px-4 py-1 rounded-lg text-xs font-bold uppercase ${!formData.interveneEstablishment ? 'bg-white text-rose-500 shadow-xs' : 'text-gray-400'}`}>Non</button>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* ================= ONGLET 4 : MENTORAT ================= */}
          {activeTab === 'mentorat' && (
            <div className="space-y-6 text-left">
              <h3 className="text-lg font-black text-gray-800 uppercase tracking-tight border-b border-gray-100 pb-2">Mentorat</h3>
              <div className="space-y-2">
                <p className="text-xs font-bold text-gray-600">Je souhaite...</p>
                <div className="flex border rounded-xl overflow-hidden p-1 bg-gray-50 w-full md:w-max">
                  <button onClick={() => handleMentoratRoleChange('filleul')} className={`px-6 py-2 rounded-lg text-xs font-bold uppercase transition-all ${formData.mentoratRole === 'filleul' ? 'bg-purple-600 text-white shadow-sm' : 'text-gray-500'}`}>Être mentoré(e)</button>
                  <button onClick={() => handleMentoratRoleChange('mentor')} className={`px-6 py-2 rounded-lg text-xs font-bold uppercase transition-all ${formData.mentoratRole === 'mentor' ? 'bg-purple-600 text-white shadow-sm' : 'text-gray-500'}`}>Devenir mentor</button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* MODAL DE CROP */}
      {showCropModal && (
        <div className="fixed inset-0 bg-gray-900/70 backdrop-blur-xs flex items-center justify-center z-[200] p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="text-center space-y-1">
              <h3 className="text-md font-black uppercase text-gray-800 tracking-tight">Recadrer votre photo</h3>
            </div>
            <div className="w-56 h-56 mx-auto rounded-full overflow-hidden border-4 border-gray-100 shadow-inner bg-gray-50 flex items-center justify-center relative">
              <img src={previewImageSrc} style={{ transform: `scale(${zoomScale})` }} className="w-full h-full object-cover pointer-events-none" alt="Crop preview" />
            </div>
            <div className="space-y-2 max-w-xs mx-auto">
              <input type="range" min="1" max="3" step="0.05" value={zoomScale} onChange={(e) => setZoomScale(parseFloat(e.target.value))} className="w-full accent-blue-600 bg-gray-100 h-1.5 rounded-lg cursor-pointer" />
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={handleSaveCroppedImage} className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl text-xs uppercase shadow-md">Valider</button>
              <button onClick={() => { setShowCropModal(false); setSelectedImageFile(null); setPreviewImageSrc(''); }} className="px-5 py-3 border rounded-xl font-bold text-xs uppercase text-gray-500">Annuler</button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}