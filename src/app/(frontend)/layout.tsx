import React from 'react'
import Navbar from '@/components/Navbar' // Vérifie que le chemin vers ta Navbar est correct
import MiniMessenger from '@/components/MiniMessenger' // 🎯 AJOUT : Importation du composant de chat flottant

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Bessières Alumni | Réseau des anciens de l'ENC</title>

        {/* L'IMPORTATION CRITIQUE POUR LES LOGOS (Font Awesome) */}
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"
          integrity="sha512-DTOQO9RWCH3ppGqcWaEA1BIZOC6xxalwEsw9c2QQeAIftl+Vegovlnee1c9QX4TctnWMn13TZye+giMm8e2LwA=="
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
        />

        {/* SCRIPT TAILWIND CDN (Si tu ne l'as pas déjà configuré localement) */}
        <script src="https://cdn.tailwindcss.com"></script>

        {/* CONFIGURATION DES COULEURS POUR TAILWIND */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
            tailwind.config = {
              theme: {
                extend: {
                  colors: {
                    enc: '#800020', // Bordeaux officiel
                    orange_bessieres: '#f59e0b', // Orange pour les accents
                  }
                }
              }
            }
          `,
          }}
        />
      </head>

      <body className="bg-gray-50 antialiased min-h-screen flex flex-col">
        {/* La Navbar s'affichera sur toutes les pages */}
        <Navbar />

        {/* Contenu principal de tes pages */}
        <main className="flex-grow">{children}</main>

        {/* Optionnel : Un footer simple pour terminer la structure */}
        <footer className="bg-white border-t border-gray-200 py-8">
          <div className="max-w-7xl mx-auto px-4 text-center text-gray-500 text-sm">
            © {new Date().getFullYear()} ENC BESSIÈRES Alumni - École Nationale de Commerce
          </div>
        </footer>

        {/* 🎯 AJOUT : La mini-fenêtre flottante style Messenger s'affiche désormais par-dessus tout le site */}
        <MiniMessenger />
      </body>
    </html>
  )
}