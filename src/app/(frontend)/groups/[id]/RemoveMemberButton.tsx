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
  const [pending, setPending] = useState(false)

  async function handleClick() {
    if (!confirm(`Voulez-vous vraiment retirer ${memberName} de ce groupe ?`)) return

    const motif = prompt(
      `Raison du retrait de ${memberName} (optionnel — visible par la personne concernée) :`,
      ''
    )
    // prompt() retourne null si annulé -> on annule l'action dans ce cas
    if (motif === null) return

    setPending(true)
    try {
      await action(motif.trim() || undefined)
      router.refresh()
    } finally {
      setPending(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      title="Retirer du groupe"
      className="opacity-0 group-hover:opacity-100 rounded-lg p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all flex-shrink-0 disabled:opacity-50"
    >
      {pending ? (
        <div className="h-4 w-4 rounded-full border-2 border-gray-300 border-t-red-500 animate-spin" />
      ) : (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      )}
    </button>
  )
}
