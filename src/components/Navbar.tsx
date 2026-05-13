'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  // 1. Récupérer l'utilisateur connecté au chargement de la page
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/alumni/me')
        const data = await res.json()
        if (data.user) {
          setUser(data.user)
        }
      } catch (err) {
        console.error("Erreur lors de la récupération de l'utilisateur", err)
      } finally {
        setLoading(false)
      }
    }
    fetchUser()
  }, [])

  const handleLogout = async () => {
    try {
      const res = await fetch('/api/alumni/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      if (res.ok) {
        setUser(null)
        router.push('/')
        router.refresh()
      }
    } catch (err) {
      console.error('Erreur lors de la déconnexion', err)
    }
  }

  const navLinks = [
    { name: 'Accueil', href: '/' },
    { name: 'À propos', href: '/about' },
    { name: 'Annuaire', href: '/directory' },
    { name: 'Mentorat', href: '/mentoring' },
    { name: 'Actualités', href: '/blog' },
    { name: 'Emplois/stages', href: '/jobs' },
  ]

  // Fonction pour formater le statut proprement
  const formatStatut = (statut: string) => {
    if (statut === 'etudiant') return 'Étudiant'
    if (statut === 'alumni') return 'Alumni'
    return 'Membre'
  }

  return (
    <header className="sticky top-0 z-50 shadow-sm">
      {/* 1. TOP BAR */}
      <div className="bg-white border-b border-gray-100 py-1.5 hidden md:block">
        <div className="max-w-7xl mx-auto px-4 flex justify-between items-center text-[11px] text-gray-500 font-medium">
          <div className="flex items-center gap-4">
            <span className="font-bold">ENC Bessières</span>
            <span className="text-gray-300">|</span>
            <div className="flex gap-4 items-center text-gray-400">
              <a href="https://www.enc-bessieres.org/" target="_blank" className="hover:text-enc"><i className="fa-solid fa-globe"></i></a>
              <a href="https://www.instagram.com/ufa.bessieres/" target="_blank" className="hover:text-enc"><i className="fa-brands fa-instagram"></i></a>
              <a href="https://www.linkedin.com/school/enc-bessieres/" target="_blank" className="hover:text-enc"><i className="fa-brands fa-linkedin-in"></i></a>
            </div>
          </div>
          <div className="flex gap-4">
            <span className="cursor-pointer hover:text-enc">Contact</span>
            <span className="cursor-pointer hover:text-enc">Aide</span>
          </div>
        </div>
      </div>

      {/* 2. NAVIGATION PRINCIPALE */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-24">
            {/* Logo */}
            <div className="flex items-center">
              <Link href="/" className="flex flex-col group">
                <span className="text-2xl font-black text-gray-800 leading-none tracking-tighter">
                  <span className="text-enc">ENC</span> BESSIÈRES
                </span>
                <span className="text-[10px] font-bold text-gray-400 tracking-widest uppercase mt-1">
                  École Nationale de Commerce
                </span>
              </Link>
            </div>

            {/* Menu Desktop */}
            <div className="hidden lg:flex items-center space-x-8">
              <div className="flex items-center space-x-6 mr-6">
                {navLinks.map((link) => (
                  <Link key={link.name} href={link.href} className="text-[13px] font-bold text-gray-700 hover:text-enc uppercase">
                    {link.name}
                  </Link>
                ))}
              </div>
              
              {/* --- CONDITION : SI CONNECTÉ OU NON --- */}
              {!loading && (
                user ? (
                  <div className="relative group flex items-center">
                    <div className="flex items-center gap-3 cursor-pointer py-2 border-l border-gray-100 pl-6">
                      <div className="text-right">
                        <p className="text-[13px] font-black text-gray-800 leading-none uppercase">
                          {user.prenom} {user.nom}
                        </p>
                        <p className="text-[10px] text-enc font-bold uppercase tracking-tighter">
                          {formatStatut(user.statut)}
                        </p>
                      </div>
                      <div className="h-10 w-10 rounded-full border-2 border-enc p-0.5">
                        <img 
                          src={`https://ui-avatars.com/api/?name=${user.prenom}+${user.nom}&background=800020&color=fff`} 
                          alt="Profil" 
                          className="h-full w-full rounded-full object-cover"
                        />
                      </div>
                    </div>

                    {/* Dropdown Menu au survol */}
                    <div className="absolute right-0 top-full w-52 bg-white border border-gray-100 shadow-2xl rounded-xl py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform group-hover:translate-y-1 z-50">
                      <Link href="/profile" className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-enc transition-colors">
                        <i className="fa-regular fa-user w-4"></i> Profil
                      </Link>
                      <Link href="/settings" className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-enc transition-colors">
                        <i className="fa-solid fa-gear w-4"></i> Paramètres
                      </Link>
                      <div className="h-[1px] bg-gray-100 my-1 mx-2"></div>
                      <div className="px-4 py-2 flex items-center justify-between text-sm text-gray-600">
                        <span className="flex items-center gap-3"><i className="fa-solid fa-language w-4"></i> Langue</span>
                        <span className="text-lg">🇫🇷</span>
                      </div>
                      <div className="h-[1px] bg-gray-100 my-1 mx-2"></div>
                      <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 font-bold transition-colors">
                        <i className="fa-solid fa-power-off w-4"></i> Déconnexion
                      </button>
                    </div>
                  </div>
                ) : (
                  /* --- SI NON CONNECTÉ --- */
                  <Link
                    href="/login"
                    className="px-6 py-3 rounded bg-enc text-white text-xs font-bold hover:bg-opacity-90 shadow-md transition-all active:scale-95"
                  >
                    Connexion / Inscription
                  </Link>
                )
              )}
            </div>

            {/* Menu Mobile Button */}
            <div className="flex lg:hidden items-center">
              <button onClick={() => setIsOpen(!isOpen)} className="p-2 text-gray-400 hover:text-enc">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {isOpen ? <path d="M6 18L18 6M6 6l12 12" strokeWidth={2} /> : <path d="M4 6h16M4 12h16M4 18h16" strokeWidth={2} />}
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Content */}
        {isOpen && (
          <div className="lg:hidden bg-white border-t border-gray-100 p-4 space-y-2 shadow-inner">
            {navLinks.map((link) => (
              <Link key={link.name} href={link.href} className="block px-3 py-3 font-bold text-gray-700 uppercase" onClick={() => setIsOpen(false)}>
                {link.name}
              </Link>
            ))}
            {!loading && (
              user ? (
                <button onClick={handleLogout} className="block w-full py-4 rounded bg-red-50 text-red-600 font-bold mt-4">Déconnexion</button>
              ) : (
                <Link href="/login" className="block w-full py-4 rounded bg-enc text-white text-center font-bold mt-4" onClick={() => setIsOpen(false)}>
                  Connexion / Inscription
                </Link>
              )
            )}
          </div>
        )}
      </nav>
    </header>
  )
}

export default Navbar