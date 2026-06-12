'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LeaveGroupButton({
  action,
  isPublic,
}: {
  action: () => Promise<void>
  isPublic: boolean
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState(false)

  async function handleConfirm() {
    setPending(true)
    try {
      await action()
      router.refresh()
      setOpen(false)
    } finally {
      setPending(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
      >
        ✕ Quitter le groupe
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
            <div className="flex items-start gap-3 p-5 border-b border-gray-100">
              <div className="flex-shrink-0 h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center">
                <svg className="h-5 w-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Quitter ce groupe ?</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {isPublic
                    ? 'Vous pourrez le rejoindre à nouveau à tout moment.'
                    : "Ce groupe est privé : vous devrez envoyer une nouvelle demande d'accès et attendre une approbation pour y revenir."}
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 p-5">
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
                    Sortie…
                  </>
                ) : (
                  'Quitter le groupe'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
