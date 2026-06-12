'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function RemoveMemberButton({
  action,
  memberName,
}: {
  action: (motif?: string) => Promise<void>
  memberName: string
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [motif, setMotif] = useState('')
  const [pending, setPending] = useState(false)

  async function handleConfirm() {
    setPending(true)
    try {
      await action(motif.trim() || undefined)
      router.refresh()
      setOpen(false)
      setMotif('')
    } finally {
      setPending(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title="Retirer du groupe"
        className="opacity-0 group-hover:opacity-100 rounded-lg p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all flex-shrink-0"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={() => !pending && setOpen(false)}
        >
          <div
            className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* En-tête */}
            <div className="flex items-start gap-3 p-5 border-b border-gray-100">
              <div className="flex-shrink-0 h-10 w-10 rounded-xl bg-red-50 flex items-center justify-center">
                <svg className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Retirer {memberName} ?</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Cette personne perdra l'accès au contenu du groupe et devra refaire une demande pour y revenir.
                </p>
              </div>
            </div>

            {/* Motif */}
            <div className="p-5 space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">
                Raison du retrait
                <span className="ml-1.5 text-xs text-gray-400 font-normal">(optionnel, visible par la personne)</span>
              </label>
              <textarea
                value={motif}
                onChange={(e) => setMotif(e.target.value)}
                rows={3}
                placeholder="Ex : Inactivité prolongée, non-respect des règles…"
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm shadow-sm focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none transition-colors resize-none"
                disabled={pending}
                autoFocus
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 px-5 pb-5">
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={pending}
                className="rounded-xl px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={pending}
                className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-60"
              >
                {pending ? (
                  <>
                    <div className="h-3.5 w-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                    Retrait…
                  </>
                ) : (
                  'Retirer du groupe'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
