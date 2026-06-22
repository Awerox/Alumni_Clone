'use client'
import React, { Suspense } from 'react'
import { MessagesAndChatPage } from './MessagesAndChatPage' // 🎯 Importation nommée pour éviter le conflit de duplication

export default function Page() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-xs font-black text-gray-400 uppercase tracking-widest animate-pulse">
          Chargement de la messagerie...
        </div>
      </div>
    }>
      <MessagesAndChatPage />
    </Suspense>
  )
}