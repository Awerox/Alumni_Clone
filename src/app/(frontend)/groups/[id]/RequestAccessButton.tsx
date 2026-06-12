'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function RequestAccessButton({
  action,
  label = "✦ Demander l'accès",
  variant = 'primary',
  doneLabel = '✓ Demande envoyée',
  doneVariant = 'success',
  persistDone = true,
  doneDurationMs = 1500,
}: {
  action: () => Promise<void>
  label?: string
  variant?: 'primary' | 'secondary'
  doneLabel?: string
  doneVariant?: 'success' | 'danger'
  /** Si false, l'état "done" est temporaire et le bouton redevient cliquable après doneDurationMs */
  persistDone?: boolean
  doneDurationMs?: number
}) {
  const router = useRouter()
  const [pending, setPending] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleClick() {
    setPending(true)
    setError(null)
    try {
      // Timeout de sécurité : si l'action ne répond pas en 15s, on débloque le bouton
      await Promise.race([
        action(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 15000)),
      ])
      setDone(true)
      router.refresh()
      if (!persistDone) {
        setTimeout(() => setDone(false), doneDurationMs)
      }
    } catch (err) {
      setError(
        err instanceof Error && err.message === 'timeout'
          ? "Le serveur ne répond pas. Réessayez dans quelques secondes."
          : "Une erreur est survenue. Réessayez."
      )
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
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className={`${baseClass} ${pending ? 'opacity-70 cursor-wait' : ''}`}
      >
        {pending ? '…' : label}
      </button>
      {error && (
        <p className="text-xs text-red-500 font-medium text-center">{error}</p>
      )}
    </div>
  )
}
