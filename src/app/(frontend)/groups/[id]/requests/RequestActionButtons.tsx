'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function RequestActionButtons({
  acceptAction,
  rejectAction,
}: {
  acceptAction: () => Promise<void>
  rejectAction: () => Promise<void>
}) {
  const router = useRouter()
  const [pending, setPending] = useState<'accept' | 'reject' | null>(null)
  const [done, setDone] = useState(false)

  async function handle(type: 'accept' | 'reject', action: () => Promise<void>) {
    setPending(type)
    try {
      await action()
      setDone(true)
      router.refresh()
    } finally {
      setPending(null)
    }
  }

  if (done) {
    return (
      <div className="text-xs font-bold text-gray-400 px-3 py-2">
        Traité ✓
      </div>
    )
  }

  return (
    <div className="flex gap-2 flex-shrink-0">
      <button
        type="button"
        disabled={pending !== null}
        onClick={() => handle('reject', rejectAction)}
        className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors disabled:opacity-50"
      >
        {pending === 'reject' ? '…' : 'Refuser'}
      </button>
      <button
        type="button"
        disabled={pending !== null}
        onClick={() => handle('accept', acceptAction)}
        className="rounded-xl bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-700 transition-colors disabled:opacity-50"
      >
        {pending === 'accept' ? '…' : 'Accepter'}
      </button>
    </div>
  )
}
