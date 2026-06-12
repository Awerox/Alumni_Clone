'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function RequestAccessButton({
  action,
  label = "✦ Demander l'accès",
  variant = 'primary',
  doneLabel = '✓ Demande envoyée',
  doneVariant = 'success',
}: {
  action: () => Promise<void>
  label?: string
  variant?: 'primary' | 'secondary'
  doneLabel?: string
  doneVariant?: 'success' | 'danger'
}) {
  const router = useRouter()
  const [pending, setPending] = useState(false)
  const [done, setDone] = useState(false)

  async function handleClick() {
    setPending(true)
    try {
      await action()
      setDone(true)
      router.refresh()
    } finally {
      setPending(false)
    }
  }

  const baseClass = variant === 'primary'
    ? 'w-full py-3 bg-amber-500 hover:bg-amber-400 text-gray-900 text-xs font-black uppercase tracking-widest rounded-xl transition-all duration-200 shadow-sm hover:-translate-y-0.5 active:scale-[0.98]'
    : 'w-full py-2.5 bg-white border border-gray-200 hover:bg-red-50 hover:border-red-200 hover:text-red-600 text-gray-500 text-xs font-black uppercase tracking-widest rounded-xl transition-all duration-200'

  if (done) {
    const doneClass = doneVariant === 'danger'
      ? 'bg-red-50 border-red-200 text-red-600'
      : 'bg-emerald-50 border-emerald-200 text-emerald-700'
    return (
      <div className={`flex items-center justify-center gap-2 py-3 border text-xs font-black uppercase tracking-widest rounded-xl ${doneClass}`}>
        {doneLabel}
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className={`${baseClass} ${pending ? 'opacity-70 cursor-wait' : ''}`}
    >
      {pending ? '…' : label}
    </button>
  )
}
