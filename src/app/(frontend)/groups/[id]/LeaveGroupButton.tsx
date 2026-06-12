'use client'

import { useState } from 'react'

export default function LeaveGroupButton({
  action,
  isPublic,
}: {
  action: () => Promise<void>
  isPublic: boolean
}) {
  const [pending, setPending] = useState(false)

  async function handleClick() {
    const message = isPublic
      ? 'Voulez-vous vraiment quitter ce groupe ? Vous pourrez le rejoindre à nouveau à tout moment.'
      : 'Voulez-vous vraiment quitter ce groupe ? Il est privé : vous devrez envoyer une nouvelle demande d\'accès et attendre une approbation pour y revenir.'

    if (!confirm(message)) return

    setPending(true)
    try {
      await action()
    } finally {
      setPending(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors disabled:opacity-50"
    >
      {pending ? '…' : '✕ Quitter le groupe'}
    </button>
  )
}
