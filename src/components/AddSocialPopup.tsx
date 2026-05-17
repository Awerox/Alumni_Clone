'use client'
import React, { useState } from 'react'

const icons = ['fa-facebook', 'fa-instagram', 'fa-linkedin', 'fa-x-twitter', 'fa-github', 'fa-file-pdf', 'fa-globe']

export default function AddSocialPopup({ userId, onClose, onRefresh }: any) {
  const [step, setStep] = useState(1) // 1: Icône, 2: Titre, 3: Lien/Fichier
  const [data, setData] = useState({ icon: '', label: '', url: '', file: '' })

  const handleSave = async () => {
    await fetch('/api/social-links', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, owner: userId }),
    })
    onRefresh()
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[110] p-4">
      <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl">
        <div className="p-6 border-b flex justify-between items-center">
          <h2 className="font-bold text-gray-800">Ajouter un lien / document</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-red-500">✕</button>
        </div>

        <div className="p-8 space-y-6">
          {/* ÉTAPE 1 : ICONE */}
          <div className={`p-4 rounded-xl border-2 transition-all ${step === 1 ? 'border-blue-500 bg-blue-50' : data.icon ? 'border-emerald-500 bg-emerald-50' : 'border-gray-100 opacity-50'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] ${data.icon ? 'bg-emerald-500' : 'bg-blue-500'}`}>
                  {data.icon ? '✓' : '1'}
                </span>
                <div>
                  <p className="font-bold text-sm">Choisissez l'icône</p>
                  <p className="text-xs text-gray-400">Qui correspond le mieux</p>
                </div>
              </div>
              {step !== 1 && !data.icon && <span>🔒</span>}
              {step === 1 && <button onClick={() => {}} className="text-blue-500 text-xs font-bold">En cours</button>}
            </div>
            
            {step === 1 && (
              <div className="grid grid-cols-5 gap-3 mt-4 animate-in fade-in">
                {icons.map(icon => (
                  <button key={icon} onClick={() => { setData({...data, icon}); setStep(2); }} className="p-3 hover:bg-white rounded-lg border border-transparent hover:border-blue-200 text-xl text-gray-600">
                    <i className={`fa-brands ${icon} fa-solid`}></i>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ÉTAPE 2 : TITRE */}
          <div className={`p-4 rounded-xl border-2 transition-all ${step === 2 ? 'border-blue-500 bg-blue-50' : data.label ? 'border-emerald-500 bg-emerald-50' : 'border-gray-100 opacity-50'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] ${data.label ? 'bg-emerald-500' : 'bg-blue-500'}`}>
                  {data.label ? '✓' : '2'}
                </span>
                <p className="font-bold text-sm">Choisissez le titre</p>
              </div>
              {step < 2 && <span>🔒</span>}
            </div>
            {step === 2 && (
              <div className="mt-4 space-y-3">
                <input autoFocus className="w-full p-3 border rounded-xl outline-none" placeholder="ex: Mon Portfolio, CV..." onChange={(e) => setData({...data, label: e.target.value})} />
                <button onClick={() => setStep(3)} disabled={!data.label} className="w-full py-2 bg-blue-500 text-white rounded-lg font-bold text-xs">Suivant</button>
              </div>
            )}
          </div>

          {/* ÉTAPE 3 : LIEN OU FICHIER */}
          <div className={`p-4 rounded-xl border-2 transition-all ${step === 3 ? 'border-blue-500 bg-blue-50' : 'border-gray-100 opacity-50'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full flex items-center justify-center bg-blue-500 text-white text-[10px]">3</span>
                <p className="font-bold text-sm">Insérez le lien ou fichier</p>
              </div>
              {step < 3 && <span>🔒</span>}
            </div>
            {step === 3 && (
              <div className="mt-4 space-y-4">
                {!data.file && (
                  <input className="w-full p-3 border rounded-xl outline-none" placeholder="https://..." onChange={(e) => setData({...data, url: e.target.value})} />
                )}
                {!data.url && !data.file && <p className="text-center text-[10px] text-gray-400 font-bold uppercase">Ou</p>}
                {!data.url && (
                  <input type="file" className="text-xs" onChange={(e) => setData({...data, file: 'id_du_fichier_apres_upload'})} />
                )}
                <button onClick={handleSave} className="w-full py-3 bg-emerald-500 text-white rounded-xl font-bold uppercase text-[10px] tracking-widest shadow-lg">Enregistrer</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}