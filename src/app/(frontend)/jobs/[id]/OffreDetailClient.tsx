'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface RecruteurData {
  id: string
  prenom: string
  nom: string
  poste: string | null
  photoUrl: string | null
}

interface OffreData {
  id: string
  poste: string
  entreprise: string
  typeContrat: string
  contratLabel: string
  contratIcon: string
  secteur: string
  secteurLabel: string
  localisation: string
  remuneration: string
  remunerationLabel: string
  experience: string
  experienceLabel: string
  description: string
  dateDebut: string | null
  dateLimite: string | null
  dateDebutFormatted: string | null
  dateLimiteFormatted: string | null
  statut: string
  isExpired: boolean
  logoUrl: string | null
  documentJointUrl: string | null
  documentJointName: string | null
  restreindreDiplomesLabels: string[]
  restreindreCampusLabels: string[]
  restreindrePromotions: string[]
  isRecruteur: boolean
  currentUserId: string | null
  recruteur: RecruteurData | null
}

export default function OffreDetailClient({ offre }: { offre: OffreData }) {
  const router = useRouter()
  const [showDelete, setShowDelete] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [publishError, setPublishError] = useState('')
  const [published, setPublished] = useState(false)

  const handleDelete = async () => {
    if (deleteConfirm !== offre.poste || deleting) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/offres/${offre.id}`, { method: 'DELETE', credentials: 'include' })
      if (res.ok) router.push('/jobs')
    } catch (e) { console.error(e) }
    finally { setDeleting(false) }
  }

  const handlePublish = async () => {
    if (publishing) return
    setPublishing(true)
    setPublishError('')
    try {
      const res = await fetch(`/api/offres/${offre.id}/publish`, { method: 'POST', credentials: 'include' })
      if (res.ok) { setPublished(true); router.refresh() }
      else {
        const j = await res.json().catch(() => ({}))
        setPublishError(j.error || 'Erreur lors de la publication')
      }
    } catch (e: any) { setPublishError(e.message || 'Erreur réseau') }
    finally { setPublishing(false) }
  }

  const hasRestrictions = offre.restreindreDiplomesLabels.length > 0 || offre.restreindreCampusLabels.length > 0 || offre.restreindrePromotions.length > 0
  const initials = offre.entreprise.slice(0, 2).toUpperCase()

  return (
    <>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
        @keyframes scaleIn { from { opacity:0; transform:scale(0.94); } to { opacity:1; transform:scale(1); } }
        .anim-fade-up { animation: fadeUp 0.45s ease both; }
        .anim-fade-in { animation: fadeIn 0.3s ease both; }
        .d1{animation-delay:.06s} .d2{animation-delay:.12s} .d3{animation-delay:.18s}
        .card-hover { transition: box-shadow 0.2s, transform 0.2s; }
        .card-hover:hover { box-shadow: 0 8px 24px rgba(0,0,0,0.08); transform: translateY(-1px); }
      `}</style>

      {/* Modale suppression */}
      {showDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" style={{ animation: 'fadeIn 0.2s ease' }}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden" style={{ animation: 'scaleIn 0.2s ease' }}>
            <div className="bg-red-50 border-b border-red-100 px-6 py-5 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center text-lg">🗑️</div>
              <div>
                <h3 className="text-sm font-black text-gray-900">Supprimer l'offre</h3>
                <p className="text-xs text-red-600 font-medium mt-0.5">Action irréversible</p>
              </div>
              <button onClick={() => setShowDelete(false)} className="ml-auto text-gray-400 hover:text-gray-600 cursor-pointer">✕</button>
            </div>
            <div className="px-6 py-5 space-y-3">
              <p className="text-sm text-gray-600">Tapez <span className="font-black text-gray-900">"{offre.poste}"</span> pour confirmer.</p>
              <input type="text" value={deleteConfirm} onChange={e => setDeleteConfirm(e.target.value)}
                placeholder={offre.poste}
                className={`w-full px-4 py-3 bg-gray-50 border rounded-xl text-sm font-medium outline-none transition-colors ${deleteConfirm === offre.poste ? 'border-red-400 bg-red-50' : 'border-gray-200'}`} />
              {deleteConfirm === offre.poste && <p className="text-[10px] text-emerald-600 font-bold">✓ Confirmation valide</p>}
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button onClick={() => setShowDelete(false)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-xs font-black uppercase text-gray-600 hover:bg-gray-50 cursor-pointer">Annuler</button>
              <button onClick={handleDelete} disabled={deleteConfirm !== offre.poste || deleting}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-40 rounded-xl text-xs font-black uppercase text-white cursor-pointer flex items-center justify-center gap-2">
                {deleting ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : '🗑️ Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-gray-50 min-h-screen font-sans">

        {/* ── HERO ── */}
        <div className="relative w-full h-64 md:h-72 overflow-hidden bg-[#800020]">
          <div className="absolute inset-0 bg-[radial-gradient(#ffffff14_1px,transparent_1px)] [background-size:14px_14px]" />
          <div className="absolute inset-0 bg-gradient-to-br from-[#800020] via-[#900025] to-[#5a0018]" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

          {/* Retour */}
          <div className="absolute top-4 left-4">
            <Link href="/jobs"
              className="inline-flex items-center gap-1.5 bg-black/25 backdrop-blur-sm text-white text-xs font-bold uppercase tracking-wide px-3 py-2 rounded-xl border border-white/10 hover:bg-black/40 transition-all">
              ← Offres
            </Link>
          </div>

          {/* Actions recruteur */}
          {offre.isRecruteur && (
            <div className="absolute top-4 right-4 flex gap-2">
              <Link href={`/jobs/${offre.id}/edit`}
                className="inline-flex items-center gap-1.5 bg-black/25 backdrop-blur-sm text-white text-xs font-bold uppercase tracking-wide px-3 py-2 rounded-xl border border-white/10 hover:bg-black/40 transition-all">
                ⚙️ Modifier
              </Link>
              <button onClick={() => setShowDelete(true)}
                className="inline-flex items-center gap-1.5 bg-red-600/80 backdrop-blur-sm text-white text-xs font-bold uppercase tracking-wide px-3 py-2 rounded-xl border border-red-400/30 hover:bg-red-600 transition-all cursor-pointer">
                🗑️ Supprimer
              </button>
            </div>
          )}

          {/* Logo */}
          <div className="absolute left-6 sm:left-10 bottom-0 translate-y-1/2">
            <div className="w-24 h-24 rounded-2xl border-4 border-white shadow-xl overflow-hidden bg-white flex-shrink-0">
              {offre.logoUrl ? (
                <img src={offre.logoUrl} alt="" className="w-full h-full object-contain p-2" />
              ) : (
                <div className="w-full h-full bg-gray-50 flex items-center justify-center text-[#800020] font-black text-2xl">{initials}</div>
              )}
            </div>
          </div>

          {/* Badges */}
          <div className="absolute bottom-4 right-4 flex flex-wrap gap-2 justify-end">
            <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-white/90 text-[#800020] shadow-md">
              {offre.contratIcon} {offre.contratLabel}
            </span>
            {offre.statut === 'brouillon' && (
              <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-gray-800 text-white shadow-md">✏️ Brouillon</span>
            )}
            {offre.statut === 'publie' && offre.isExpired && (
              <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-gray-600 text-white shadow-md">Expirée</span>
            )}
          </div>
        </div>

        {/* ── TITRE ── */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-16 pb-2">
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 leading-tight">{offre.poste}</h1>
          <p className="text-gray-500 text-sm font-bold mt-1">
            {offre.entreprise}
            {offre.localisation && <span className="text-gray-400 font-medium"> · 📍 {offre.localisation}</span>}
          </p>
        </div>

        {/* ── CONTENU ── */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* COLONNE PRINCIPALE */}
          <div className="lg:col-span-2 space-y-5">
            <section className="anim-fade-up card-hover bg-white border border-gray-100 rounded-2xl p-6 shadow-xs">
              <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <i className="fa-solid fa-align-left text-[#800020] text-xs" /> Description du poste
              </h2>
              {offre.description ? (
                <div className="prose prose-sm max-w-none text-gray-600 leading-relaxed whitespace-pre-wrap text-sm">
                  {offre.description}
                </div>
              ) : (
                <p className="text-sm text-gray-400 italic">Aucune description disponible.</p>
              )}
            </section>

            {offre.documentJointUrl && (
              <section className="anim-fade-up d1 card-hover bg-white border border-gray-100 rounded-2xl p-6 shadow-xs">
                <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">📎 Document joint</h2>
                <a href={offre.documentJointUrl} target="_blank" rel="noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#800020]/5 border border-[#800020]/20 hover:bg-[#800020]/10 text-[#800020] rounded-xl text-xs font-black uppercase tracking-wide transition-all">
                  ⬇️ Télécharger {offre.documentJointName ? `· ${offre.documentJointName}` : ''}
                </a>
              </section>
            )}

            {hasRestrictions && (
              <section className="anim-fade-up d2 card-hover bg-white border border-gray-100 rounded-2xl p-6 shadow-xs">
                <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">🔒 Visibilité restreinte</h2>
                <div className="flex flex-wrap gap-2">
                  {offre.restreindreDiplomesLabels.map(l => (
                    <span key={l} className="text-[10px] font-bold text-purple-700 bg-purple-50 border border-purple-100 px-2.5 py-1 rounded-full">🎓 {l}</span>
                  ))}
                  {offre.restreindreCampusLabels.map(l => (
                    <span key={l} className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-full">🏫 {l}</span>
                  ))}
                  {offre.restreindrePromotions.map(l => (
                    <span key={l} className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-100 px-2.5 py-1 rounded-full">Promo {l}</span>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* SIDEBAR */}
          <div className="space-y-4">
            {/* Bloc statut / publication rapide */}
            <div className="anim-fade-in card-hover bg-white border border-gray-100 rounded-2xl p-5 shadow-xs space-y-3 sticky top-6">
              {published ? (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
                  <p className="text-xs font-black text-emerald-700">✓ Offre publiée avec succès</p>
                </div>
              ) : offre.statut === 'brouillon' && offre.isRecruteur ? (
                <>
                  {publishError && (
                    <p className="text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 rounded-lg px-2.5 py-1.5">⚠️ {publishError}</p>
                  )}
                  <p className="text-xs font-black text-gray-700 text-center">✏️ Cette offre est en brouillon</p>
                  <div className="grid grid-cols-2 gap-2">
                    <Link href={`/jobs/${offre.id}/edit`}
                      className="py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wide bg-gray-100 hover:bg-gray-200 text-gray-700 transition-all text-center">
                      ✏️ Continuer
                    </Link>
                    <button onClick={handlePublish} disabled={publishing}
                      className="py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wide bg-emerald-600 hover:bg-emerald-700 text-white transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-40">
                      {publishing ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : '🚀 Publier'}
                    </button>
                  </div>
                </>
              ) : offre.isExpired ? (
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl text-center">
                  <p className="text-xs font-black text-gray-500">⏪ Candidatures closes</p>
                </div>
              ) : (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
                  <p className="text-xs font-black text-emerald-700">🟢 Offre active</p>
                  {offre.dateLimiteFormatted && (
                    <p className="text-[10px] text-emerald-600 mt-0.5">Candidature avant le {offre.dateLimiteFormatted}</p>
                  )}
                </div>
              )}
            </div>

            {/* Infos */}
            <div className="anim-fade-up d1 card-hover bg-white border border-gray-100 rounded-2xl p-5 shadow-xs space-y-3">
              <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Informations</h2>
              {[
                { icon: offre.contratIcon, label: 'Contrat', val: offre.contratLabel },
                { icon: '🏷️', label: 'Secteur', val: offre.secteurLabel },
                { icon: '💶', label: 'Rémunération', val: offre.remunerationLabel },
                { icon: '📈', label: 'Expérience', val: offre.experienceLabel },
                offre.dateDebutFormatted ? { icon: '📅', label: 'Début souhaité', val: offre.dateDebutFormatted } : { icon: '📅', label: 'Début', val: 'Dès que possible' },
                offre.dateLimiteFormatted ? { icon: '⏳', label: 'Limite candidature', val: offre.dateLimiteFormatted } : null,
              ].filter(Boolean).map((item: any) => (
                <div key={item.label} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0 text-sm">{item.icon}</div>
                  <div>
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-wider">{item.label}</p>
                    <p className="text-xs font-bold text-gray-800">{item.val}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Recruteur */}
            {offre.recruteur && (
              <div className="anim-fade-up d2 card-hover bg-white border border-gray-100 rounded-2xl p-5 shadow-xs">
                <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Publié par</h2>
                <Link href={`/profile/${offre.recruteur.id}`} className="flex items-center gap-3 group">
                  <div className="w-10 h-10 rounded-xl overflow-hidden bg-[#800020] flex items-center justify-center flex-shrink-0">
                    {offre.recruteur.photoUrl
                      ? <img src={offre.recruteur.photoUrl} alt="" className="w-full h-full object-cover" />
                      : <span className="text-white text-xs font-black">{offre.recruteur.prenom[0]}{offre.recruteur.nom[0]}</span>
                    }
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-black text-gray-900 group-hover:text-[#800020] transition-colors">
                      {offre.recruteur.prenom} {offre.recruteur.nom}
                    </p>
                    {offre.recruteur.poste && <p className="text-[10px] text-gray-400 font-medium truncate">{offre.recruteur.poste}</p>}
                  </div>
                  <i className="fa-solid fa-arrow-right text-[10px] text-gray-300 ml-auto group-hover:text-[#800020] transition-colors" />
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
