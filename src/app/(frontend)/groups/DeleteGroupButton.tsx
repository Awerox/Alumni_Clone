'use client'

import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'

export default function DeleteGroupButton({ groupId, groupTitre }: { groupId: string; groupTitre: string }) {
  const router = useRouter()
  const [showModal, setShowModal] = useState(false)
  const [typed, setTyped] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [mounted, setMounted] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (showModal) {
      setTyped('')
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [showModal])

  const handleDelete = async () => {
    if (typed !== groupTitre) return
    setDeleting(true)
    try {
      await fetch(`/api/groups/${groupId}`, { method: 'DELETE', credentials: 'include' })
      setShowModal(false)
      router.refresh()
    } catch (e) {
      console.error(e)
    } finally {
      setDeleting(false)
    }
  }

  const modal = showModal && mounted ? createPortal(
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', animation: 'fadeIn 0.2s ease' }}
      onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false) }}
    >
      <style>{`
        @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
        @keyframes scaleIn { from { opacity:0; transform:scale(0.94); } to { opacity:1; transform:scale(1); } }
      `}</style>
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
        style={{ animation: 'scaleIn 0.2s ease' }}
      >
        {/* Header */}
        <div className="bg-red-50 border-b border-red-100 px-6 py-5 flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0 text-lg">🗑️</div>
          <div>
            <h3 className="text-sm font-black text-gray-900 uppercase tracking-wide">Supprimer le groupe</h3>
            <p className="text-xs text-red-600 font-medium mt-0.5">Cette action est irréversible</p>
          </div>
          <button onClick={() => setShowModal(false)} className="ml-auto text-gray-400 hover:text-gray-600 cursor-pointer text-lg leading-none">✕</button>
        </div>

        {/* Corps */}
        <div className="px-6 py-5 space-y-4">
          <p className="text-sm text-gray-600 leading-relaxed">
            Vous êtes sur le point de supprimer définitivement le groupe{' '}
            <span className="font-black text-gray-900">"{groupTitre}"</span>.
            Tous les membres, publications et données associées seront perdus.
          </p>

          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
            <p className="text-xs font-black text-gray-500 uppercase tracking-wider mb-2">
              Tapez <span className="text-red-600">{groupTitre}</span> pour confirmer
            </p>
            <input
              ref={inputRef}
              type="text"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && typed === groupTitre && handleDelete()}
              placeholder={groupTitre}
              className={`w-full px-3 py-2.5 rounded-xl border text-sm font-medium outline-none transition-colors ${
                typed === groupTitre
                  ? 'border-red-400 bg-red-50 text-red-700'
                  : 'border-gray-200 bg-white text-gray-800 focus:border-gray-400'
              }`}
            />
            {typed.length > 0 && typed !== groupTitre && (
              <p className="text-[10px] text-red-500 font-bold mt-1.5">✕ Le nom ne correspond pas</p>
            )}
            {typed === groupTitre && (
              <p className="text-[10px] text-emerald-600 font-bold mt-1.5">✓ Confirmation valide</p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 pb-6 flex gap-3">
          <button
            onClick={() => setShowModal(false)}
            className="flex-1 py-2.5 border border-gray-200 rounded-xl text-xs font-black uppercase tracking-wider text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
          >
            Annuler
          </button>
          <button
            onClick={handleDelete}
            disabled={typed !== groupTitre || deleting}
            className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl text-xs font-black uppercase tracking-wider text-white transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            {deleting
              ? <><div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> Suppression...</>
              : '🗑️ Supprimer'
            }
          </button>
        </div>
      </div>
    </div>,
    document.body
  ) : null

  return (
    <>
      <button
        type="button"
        onClick={() => setShowModal(true)}
        className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors cursor-pointer"
      >
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
        </svg>
        Supprimer
      </button>
      {modal}
    </>
  )
}
