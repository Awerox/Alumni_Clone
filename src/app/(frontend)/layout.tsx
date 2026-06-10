// app/(frontend)/layout.tsx
import React from 'react'
import type { Metadata } from 'next'
import '@/app/(payload)/admin/importMap.js'  // garde si tu l'avais
import Navbar from '@/components/Navbar'
import MiniMessenger from '@/components/MiniMessenger'

// ✅ Import du CSS global (contient le build Tailwind)
import '../globals.css'

export const metadata: Metadata = {
  title: 'Bessières Alumni | Réseau des anciens de l\'ENC',
}

export default function FrontendLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        {/* Font Awesome */}
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"
          integrity="sha512-DTOQO9RWCH3ppGqcWaEA1BIZOC6xxalwEsw9c2QQeAIftl+Vegovlnee1c9QX4TctnWMn13TZye+giMm8e2LwA=="
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
        />
        {/* ✅ SUPPRIMÉ : cdn.tailwindcss.com — remplacé par le build local via globals.css */}
      </head>
      <body className="bg-gray-50 antialiased min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow">{children}</main>
        <footer className="bg-white border-t border-gray-200 py-8">
          <div className="max-w-7xl mx-auto px-4 text-center text-gray-500 text-sm">
            © {new Date().getFullYear()} ENC BESSIÈRES Alumni - École Nationale de Commerce
          </div>
        </footer>
        <MiniMessenger />
      </body>
    </html>
  )
}
