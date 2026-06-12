'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function RequestActionButtons({
  acceptAction,
  rejectAction,
}: {
  acceptAction: () => Promise<void>
  rejectAction: (motif?: string) => Promise<void>
}) {
  const router = useRouter()
  const [pending, setPending] = useState<'accept' | 'reject' | null>(null)
  const [done, setDone] = useState<'accept' | 'reject' | null>(null)

  async function handleAccept() {
    setPending('accept')
    try {
      await acceptAction()
      setDone('accept')
      router.refresh()
    } finally {
      setPending(null)
    }
  }

  async function handleReject() {
    // Demande un motif optionnel — non bloquant si laissé vide
    const motif = prompt(
      "Motif du refus (optionnel — sera visible par la personne concernée) :",
      ''
    )
    // prompt() retourne null uniquement si l'utilisateur clique sur Annuler
    if (motif === null) return

    setPending('reject')
    try {
      await rejectAction(motif.trim() || undefined)
      setDone('reject')
      router.refresh()
    } finally {
      setPending(null)
    }
  }

  if (done) {
    const label = done === 'accept' ? 'Acceptée ✓' : 'Refusée ✕'
    const colorClass = done === 'accept' ? 'text-emerald-600' : 'text-red-500'
    return (
      <div className={`text-xs font-black uppercase tracking-wider px-3 py-2 ${colorClass}`}>
        {label}
      </div>
    )
  }

  return (
    <div className="flex gap-2 flex-shrink-0">
      <button
        type="button"
        disabled={pending !== null}
        onClick={handleReject}
        className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors disabled:opacity-50"
      >
        {pending === 'reject' ? '…' : 'Refuser'}
      </button>
      <button
        type="button"
        disabled={pending !== null}
        onClick={handleAccept}
        className="rounded-xl bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-700 transition-colors disabled:opacity-50"
      >
        {pending === 'accept' ? '…' : 'Accepter'}
      </button>
    </div>
  )
}
