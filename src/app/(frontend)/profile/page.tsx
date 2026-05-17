'use client'
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showPopup, setShowPopup] = useState<string | null>(null)
  const [tempData, setTempData] = useState<any>({})
  const router = useRouter()

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/alumni/me')
      const data = await res.json()
      if (data.user) setUser(data.user)
      else router.push('/login')
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchProfile() }, [])

  const handleSave = async (updatedFields: any) => {
    try {
      const res = await fetch(`/api/alumni/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedFields),
      })
      if (res.ok) {
        setShowPopup(null)
        setTempData({})
        fetchProfile()
      }
    } catch (err) { console.error(err) }
  }

  const handleDeleteItem = async (field: string, index: number) => {
    const newList = [...user[field]]
    newList.splice(index, 1)
    handleSave({ [field]: newList })
  }

  if (loading) return <div className="text-center py-20 font-bold text-enc uppercase tracking-widest">Chargement...</div>

  return (
    <div className="min-h-screen bg-[#F8F9FA] py-10 px-4">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* 1. HEADER IDENTITÉ */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="h-32 bg-enc"></div>
          <div className="px-8 pb-8 flex flex-col md:flex-row items-center md:items-end -mt-12 gap-6">
            <img 
              src={`https://ui-avatars.com/api/?name=${user.prenom}+${user.nom}&size=150&background=800020&color=fff`} 
              className="w-32 h-32 rounded-full border-4 border-white shadow-lg object-cover"
              alt="Profil"
            />
            <div className="flex-1 text-center md:text-left mb-2">
              <h1 className="text-3xl font-black text-gray-800 uppercase leading-none">{user.prenom} {user.nom}</h1>
              <p className="text-enc font-bold uppercase text-xs mt-1">Promotion {user.promotion}</p>
            </div>
            <div className="flex gap-3 mb-2">
               <button onClick={() => setShowPopup('social')} className="bg-emerald-500 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:brightness-105 transition-all text-xs uppercase tracking-widest shadow-md">
                Ajouter CV / Liens
              </button>
              <button onClick={() => router.push('/profile/edit')} className="px-5 py-2.5 bg-enc text-white font-bold rounded-xl text-xs uppercase hover:brightness-110 transition-all shadow-md">
                Modifier
              </button>
            </div>
          </div>
        </div>

        {/* 2. GRILLE PRINCIPALE */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          
          {/* COLONNE GAUCHE (Coordonnées + Réseaux) */}
          <div className="md:col-span-4 space-y-6">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-8 flex items-center gap-2">
                <i className="fa-solid fa-address-book text-enc text-xs"></i> Coordonnées
              </h3>
              <div className="space-y-6">
                <div>
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-tighter mb-1">Email</p>
                  <p className="text-sm font-bold text-gray-800">{user.email}</p>
                </div>
                <div>
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-tighter mb-1">Téléphone</p>
                  <p className="text-sm font-bold text-gray-800">{user.telephone || 'Non renseigné'}</p>
                </div>
                <div>
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-tighter mb-1">Localisation</p>
                  <p className="text-sm font-bold text-gray-800">{user.ville || 'Non renseignée'}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-6 text-center">Réseaux Sociaux</h3>
              <div className="flex justify-center gap-4">
                <a href={user.linkedin || '#'} className="w-12 h-12 rounded-full bg-[#EBF4FF] flex items-center justify-center text-[#0A66C2] text-xl hover:scale-110 transition-transform shadow-sm">
                  <i className="fa-brands fa-linkedin-in"></i>
                </a>
                <a href={user.instagram || '#'} className="w-12 h-12 rounded-full bg-[#FFF0F5] flex items-center justify-center text-[#E4405F] text-xl hover:scale-110 transition-transform shadow-sm">
                  <i className="fa-brands fa-instagram"></i>
                </a>
              </div>
            </div>
          </div>

          {/* COLONNE DROITE (Contenu) */}
          <div className="md:col-span-8 space-y-6">
            
            {/* RÉSUMÉ / BIO */}
            <section className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <i className="fa-solid fa-user text-enc"></i> Quelques mots pour me définir
                </h3>
                {user.bio && <button onClick={() => { setTempData({bio: user.bio}); setShowPopup('bio') }} className="text-enc text-xs font-bold uppercase underline">Modifier</button>}
              </div>
              {user.bio ? (
                <p className="text-gray-600 leading-relaxed font-medium italic">"{user.bio}"</p>
              ) : (
                <div className="bg-gray-50 p-10 text-center rounded-2xl border-2 border-dashed border-gray-200">
                  <p className="text-gray-400 text-sm mb-4 font-medium">Aucun résumé n'est saisi sur votre profil</p>
                  <button onClick={() => setShowPopup('bio')} className="bg-emerald-500 text-white px-8 py-3 rounded-xl font-bold uppercase text-[10px] tracking-widest shadow-md hover:bg-emerald-600 transition-all">+ Ajouter un résumé</button>
                </div>
              )}
            </section>

            {/* EXPÉRIENCES PROFESSIONNELLES */}
            <section className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <i className="fa-solid fa-briefcase text-enc"></i> Expériences professionnelles
                </h3>
                <button onClick={() => setShowPopup('exp')} className="bg-emerald-500 text-white px-4 py-2 rounded-lg font-bold uppercase text-[9px] tracking-widest">+ Ajouter</button>
              </div>
              {user.experiences?.length > 0 ? (
                <div className="space-y-4">
                  {user.experiences.map((exp: any, i: number) => (
                    <div key={i} className="flex justify-between items-start p-5 bg-[#F8F9FA] rounded-2xl border border-gray-50 group">
                      <div>
                        <p className="font-black text-gray-800 uppercase text-sm tracking-tight">{exp.poste}</p>
                        <p className="text-xs text-enc font-bold">{exp.entreprise}</p>
                        <p className="text-[10px] text-gray-400 font-medium uppercase mt-1">{exp.periode}</p>
                      </div>
                      <button onClick={() => handleDeleteItem('experiences', i)} className="p-2 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"><i className="fa-solid fa-trash-can"></i></button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 bg-blue-50 border-l-4 border-blue-400 rounded-r-xl">
                  <p className="text-blue-700 text-xs font-medium leading-relaxed">
                    Aucun poste actuel n'est saisi dans votre profil. Complétez-le dès maintenant pour que ce poste soit visible par votre réseau alumni.
                  </p>
                </div>
              )}
            </section>

            {/* FORMATIONS */}
            <section className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <i className="fa-solid fa-graduation-cap text-enc"></i> Formations
                </h3>
                <button onClick={() => setShowPopup('form')} className="bg-emerald-500 text-white px-4 py-2 rounded-lg font-bold uppercase text-[9px] tracking-widest">+ Ajouter</button>
              </div>
              <div className="space-y-4">
                {user.formations?.map((form: any, i: number) => (
                  <div key={i} className="flex justify-between items-start p-5 bg-[#F8F9FA] rounded-2xl border border-gray-50 group">
                    <div className="flex gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl shadow-sm ${form.isENC ? 'bg-enc text-white' : 'bg-white text-gray-400'}`}>
                        <i className={form.isENC ? 'fa-solid fa-certificate' : 'fa-solid fa-university'}></i>
                      </div>
                      <div>
                        <p className="font-black text-gray-800 uppercase text-sm tracking-tight">{form.nom}</p>
                        <p className="text-xs font-bold text-gray-500 uppercase">{form.etablissement}</p>
                        <p className="text-[10px] text-gray-400 font-medium mt-1">Année : {form.annee}</p>
                      </div>
                    </div>
                    <button onClick={() => handleDeleteItem('formations', i)} className="p-2 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"><i className="fa-solid fa-trash-can"></i></button>
                  </div>
                ))}
              </div>
            </section>

            {/* CENTRES D'INTÉRÊT */}
            <section className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                <i className="fa-solid fa-heart text-enc"></i> Centres d'intérêt
              </h3>
              <div className="flex flex-wrap gap-3">
                {user.interets?.map((int: any, i: number) => (
                  <div key={i} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl font-bold text-[10px] uppercase flex items-center gap-2 border border-gray-200">
                    {int.nom} 
                    <button onClick={() => handleDeleteItem('interets', i)} className="text-gray-400 hover:text-red-500"><i className="fa-solid fa-xmark text-xs"></i></button>
                  </div>
                ))}
                <button onClick={() => setShowPopup('interet')} className="px-4 py-2 border-2 border-dashed border-gray-200 text-gray-400 rounded-xl font-bold text-[10px] uppercase hover:border-emerald-500 hover:text-emerald-500 transition-all">+ Ajouter</button>
              </div>
            </section>

            {/* BANDEAU MENTORAT */}
            {user.isMentor && (
              <div className="bg-[#EFFFFB] p-6 rounded-2xl border border-[#D1F2EB] flex items-center gap-6">
                <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center text-2xl shadow-sm">🤝</div>
                <div>
                  <p className="text-[10px] font-black text-[#00695C] uppercase tracking-[0.2em] mb-1">Membre Mentor</p>
                  <p className="text-sm text-[#00796B] font-bold">Cet utilisateur est volontaire pour accompagner les membres du réseau.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODALS POPUPS */}
      {showPopup && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden animate-in zoom-in duration-200">
            <div className="bg-gray-50 p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-lg font-black text-gray-800 uppercase tracking-tighter">
                {showPopup === 'exp' ? 'Expérience' : showPopup === 'form' ? 'Formation' : showPopup === 'bio' ? 'Résumé' : 'Intérêt'}
              </h2>
              <button onClick={() => {setShowPopup(null); setTempData({})}} className="text-gray-400 hover:text-red-500"><i className="fa-solid fa-circle-xmark text-xl"></i></button>
            </div>
            <div className="p-8 space-y-4">
              {showPopup === 'bio' && (
                <textarea value={tempData.bio} className="w-full p-4 border border-gray-200 rounded-2xl h-40 outline-none focus:ring-2 focus:ring-enc font-medium" placeholder="Parlez-nous de vous..." onChange={(e) => setTempData({ bio: e.target.value })}></textarea>
              )}
              {showPopup === 'exp' && (
                <>
                  <input placeholder="Poste" className="w-full p-4 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-enc" onChange={(e) => setTempData({...tempData, poste: e.target.value})} />
                  <input placeholder="Entreprise" className="w-full p-4 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-enc" onChange={(e) => setTempData({...tempData, entreprise: e.target.value})} />
                  <input placeholder="Période" className="w-full p-4 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-enc" onChange={(e) => setTempData({...tempData, periode: e.target.value})} />
                </>
              )}
              {showPopup === 'form' && (
                <>
                  <div className="flex gap-4 mb-4">
                    <button onClick={() => setTempData({...tempData, isENC: true, etablissement: 'ENC Bessières'})} className={`flex-1 py-3 rounded-xl border-2 font-bold text-[10px] uppercase ${tempData.isENC ? 'border-enc bg-enc/5 text-enc' : 'border-gray-100 text-gray-400'}`}>ENC Bessières</button>
                    <button onClick={() => setTempData({...tempData, isENC: false, etablissement: ''})} className={`flex-1 py-3 rounded-xl border-2 font-bold text-[10px] uppercase ${tempData.isENC === false ? 'border-blue-500 bg-blue-50 text-blue-500' : 'border-gray-100 text-gray-400'}`}>Autre</button>
                  </div>
                  <input placeholder="Diplôme" className="w-full p-4 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-enc" onChange={(e) => setTempData({...tempData, nom: e.target.value})} />
                  {!tempData.isENC && <input placeholder="Établissement" className="w-full p-4 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-enc" onChange={(e) => setTempData({...tempData, etablissement: e.target.value})} />}
                  <input placeholder="Année" className="w-full p-4 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-enc" onChange={(e) => setTempData({...tempData, annee: e.target.value})} />
                </>
              )}
              {showPopup === 'interet' && (
                <input placeholder="Ex: Musique, Dev..." className="w-full p-4 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-enc" onChange={(e) => setTempData({ nom: e.target.value })} />
              )}
            </div>
            <div className="p-6 bg-gray-50 border-t border-gray-100 flex gap-4">
              <button onClick={() => setShowPopup(null)} className="flex-1 py-4 text-gray-400 font-bold uppercase text-[10px]">Annuler</button>
              <button 
                onClick={() => {
                  if(showPopup === 'bio') handleSave({ bio: tempData.bio })
                  if(showPopup === 'exp') handleSave({ experiences: [...(user.experiences || []), tempData] })
                  if(showPopup === 'form') handleSave({ formations: [...(user.formations || []), tempData] })
                  if(showPopup === 'interet') handleSave({ interets: [...(user.interets || []), tempData] })
                }}
                className="flex-[2] py-4 bg-enc text-white rounded-2xl font-bold uppercase text-[10px] shadow-lg"
              >
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}