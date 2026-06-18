// src/app/(frontend)/jobs/new/page.tsx
import React from 'react'
import Link from 'next/link'
import { getAuthUser } from '@/lib/auth'
import NewOffreFormClient from './NewOffreFormClient'

export const dynamic = 'force-dynamic'

export default async function NewOffrePage() {
  const { user } = await getAuthUser()

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 font-sans">
        <div className="text-center p-8 bg-white border border-gray-200 rounded-3xl shadow-sm max-w-sm">
          <div className="text-3xl mb-3">🔒</div>
          <p className="text-sm font-black text-gray-700">Accès réservé aux membres</p>
          <p className="text-xs text-gray-400 mt-1 mb-4">Connectez-vous pour publier une offre.</p>
          <Link href="/login?redirect=/jobs/new"
            className="inline-block w-full text-center py-2.5 bg-[#800020] hover:bg-[#600018] text-white text-xs font-black uppercase rounded-xl transition-colors shadow-sm">
            Se connecter
          </Link>
        </div>
      </div>
    )
  }

  return <NewOffreFormClient />
}
