'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/alumni/me', {
          credentials: 'include',
          headers: { 'Accept': 'application/json' },
        })
        if (res.ok) {
          const data = await res.json()
          if (data && data.user) setUser(data.user)
          else if (data && (data.email || data.id)) setUser(data)
        }
      } catch (err) {
        console.error("Erreur récupération utilisateur", err)
      } finally {
        setLoading(false)
      }
    }
    fetchUser()
  }, [])

  const handleLogout = async () => {
    try {
      await fetch('/api/alumni/logout', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      })
    } catch (err) {
      console.error('Erreur déconnexion', err)
    } finally {
      setUser(null)
      window.location.href = '/login'
    }
  }

  const navLinks = [
    { name: 'Accueil', href: '/' },
    { name: 'À propos', href: '/about' },
    {
      name: 'Membres',
      href: '#',
      submenu: [
        { name: 'Annuaire', href: '/directory' },
        { name: 'Groupes', href: '/groups' },
      ],
    },
    { name: 'Mentorat', href: '/mentoring' },
    {
      name: 'Actualités',
      href: '#',
      submenu: [
        { name: 'Actualités', href: '/blog' },
        { name: "Fil d'actualités", href: '/feed' },
        { name: 'Événements', href: '/evenements' },
      ],
    },
    { name: 'Emplois/stages', href: '/jobs' },
  ]

  const formatStatut = (statut: string) => {
    if (statut === 'etudiant') return 'Étudiant'
    if (statut === 'alumni') return 'Alumni'
    return 'Membre'
  }

  // ✅ FIX : évite le doublon prénom/nom quand OAuth ne retourne pas de nom de famille
  const getDisplayName = () => {
    const prenom = (user?.prenom || '').trim()
    const nom = (user?.nom || '').trim()
    if (!nom || nom.toLowerCase() === prenom.toLowerCase()) return prenom
    return prenom + ' ' + nom
  }

  // ✅ FIX : avatar sans doublon
  const getUserAvatarUrl = () => {
    if (user?.photo && typeof user.photo === 'object' && user.photo.url) {
      return user.photo.url
    }
    const prenom = (user?.prenom || 'U').trim()
    const nom = (user?.nom || '').trim()
    const nomPourAvatar = nom && nom.toLowerCase() !== prenom.toLowerCase() ? nom : ''
    const nameParam = nomPourAvatar
      ? encodeURIComponent(prenom) + '+' + encodeURIComponent(nomPourAvatar)
      : encodeURIComponent(prenom)
    return 'https://ui-avatars.com/api/?name=' + nameParam + '&background=800020&color=fff'
  }

  return (
    <header className="sticky top-0 z-50 shadow-sm bg-white">
      {/* TOP BAR */}
      <div className="bg-white border-b border-gray-100 py-1.5 hidden md:block">
        <div className="max-w-7xl mx-auto px-4 flex justify-between items-center text-[11px] text-gray-500 font-medium">
          <div className="flex items-center gap-4">
            <span className="font-bold">ENC Bessières</span>
            <span className="text-gray-300">|</span>
            <div className="flex gap-4 items-center text-gray-400">
              <a href="https://www.enc-bessieres.org/" target="_blank" rel="noopener noreferrer" className="hover:text-enc">
                <i className="fa-solid fa-globe"></i>
              </a>
              <a href="https://www.instagram.com/ufa.bessieres/" target="_blank" rel="noopener noreferrer" className="hover:text-enc">
                <i className="fa-brands fa-instagram"></i>
              </a>
              <a href="https://www.linkedin.com/school/enc-bessieres/" target="_blank" rel="noopener noreferrer" className="hover:text-enc">
                <i className="fa-brands fa-linkedin-in"></i>
              </a>
            </div>
          </div>
          <div className="flex gap-4 items-center">
            <Link href="/messages" className="cursor-pointer hover:text-enc transition-colors flex items-center gap-1">
              <i className="fa-regular fa-comment-dots text-[10px]" /> Message
            </Link>
            <span className="text-gray-200">|</span>
            <Link href="/help" className="cursor-pointer hover:text-enc transition-colors">Aide</Link>
          </div>
        </div>
      </div>

      {/* NAVIGATION PRINCIPALE */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-24">

            {/* LOGO */}
            <div className="flex items-center">
              <Link href="/" className="flex items-center gap-3 group transition-transform active:scale-[0.98]">
                <div className="flex items-center justify-center w-36 h-16 overflow-hidden flex-shrink-0 bg-transparent">
                  <img
                    src="https://www.enc-bessieres.org/wp-content/uploads/2025/01/logo_enc_2025.jpg"
                    alt="Logo ENC Bessières 2025"
                    className="max-w-full max-h-full object-contain"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                      const fallback = e.currentTarget.parentElement?.querySelector('.navbar-fallback-letter')
                      if (fallback) fallback.classList.remove('hidden')
                    }}
                  />
                  <span className="navbar-fallback-letter hidden bg-enc text-white px-4 py-2 rounded-xl font-black text-xl tracking-wider shadow-sm animate-pulse">
                    ENC
                  </span>
                </div>
              </Link>
            </div>

            {/* MENU DESKTOP */}
            <div className="hidden lg:flex items-center space-x-8">
              <div className="flex items-center space-x-6 mr-6 h-full">
                {navLinks.map((link) => (
                  <div
                    key={link.name}
                    className="relative h-full flex items-center"
                    onMouseEnter={() => link.submenu && setActiveDropdown(link.name)}
                    onMouseLeave={() => setActiveDropdown(null)}
                  >
                    <Link
                      href={link.href}
                      className="text-[13px] font-bold text-gray-700 hover:text-enc uppercase tracking-wide transition-colors flex items-center gap-1 py-4"
                    >
                      {link.name}
                      {link.submenu && (
                        <i className={
                          'fa-solid fa-chevron-down text-[10px] transition-transform duration-200 ' +
                          (activeDropdown === link.name ? 'rotate-180 text-enc' : 'text-gray-400')
                        }></i>
                      )}
                    </Link>

                    {link.submenu && activeDropdown === link.name && (
                      <div className="absolute top-[75%] left-0 w-48 bg-white border border-gray-100 shadow-xl rounded-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150 text-left">
                        {link.submenu.map((sub) => (
                          <Link
                            key={sub.name}
                            href={sub.href}
                            className="block px-4 py-2.5 text-[13px] font-semibold text-gray-600 hover:bg-gray-50 hover:text-enc transition-colors"
                          >
                            {sub.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {!loading && (user ? (
                <div className="relative group flex items-center">
                  <div className="flex items-center gap-3 cursor-pointer py-2 border-l border-gray-100 pl-6">
                    <div className="text-right">
                      <p className="text-[13px] font-black text-gray-800 leading-none uppercase">
                        {getDisplayName()}
                      </p>
                      <p className="text-[10px] text-enc font-bold uppercase tracking-tighter mt-1">
                        {formatStatut(user.statut)}
                      </p>
                    </div>
                    <div className="h-11 w-11 rounded-full border-2 border-enc p-0.5 overflow-hidden flex-shrink-0 bg-white shadow-xs">
                      <img
                        src={getUserAvatarUrl()}
                        alt="Profil"
                        className="h-full w-full rounded-full object-cover object-center"
                      />
                    </div>
                  </div>

                  <div className="absolute right-0 top-full w-52 bg-white border border-gray-100 shadow-2xl rounded-xl py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform group-hover:translate-y-1 z-50 text-left">
                    <Link href="/profile" className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-enc font-medium transition-colors">
                      <i className="fa-regular fa-user w-4 text-gray-400"></i> Profil
                    </Link>
                    <Link href="/settings" className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-enc font-medium transition-colors">
                      <i className="fa-solid fa-gear w-4 text-gray-400"></i> Paramètres
                    </Link>
                    <div className="h-[1px] bg-gray-100 my-1 mx-2"></div>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 font-bold transition-colors"
                    >
                      <i className="fa-solid fa-power-off w-4"></i> Déconnexion
                    </button>
                  </div>
                </div>
              ) : (
                <Link
                  href="/login"
                  className="px-6 py-3 rounded-xl bg-enc text-white text-xs font-black uppercase tracking-wider hover:brightness-110 shadow-md transition-all active:scale-95"
                >
                  Connexion / Inscription
                </Link>
              ))}
            </div>

            {/* BOUTON MOBILE */}
            <div className="flex lg:hidden items-center">
              <button onClick={() => setIsOpen(!isOpen)} className="p-2 text-gray-400 hover:text-enc transition-colors">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {isOpen
                    ? <path d="M6 18L18 6M6 6l12 12" strokeWidth={2} />
                    : <path d="M4 6h16M4 12h16M4 18h16" strokeWidth={2} />
                  }
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* MENU MOBILE */}
        {isOpen && (
          <div className="lg:hidden bg-white border-t border-gray-100 p-4 space-y-2 shadow-inner text-left">
            {navLinks.map((link) => (
              <div key={link.name} className="space-y-1">
                <Link
                  href={link.href}
                  className="block px-3 py-2 font-bold text-gray-700 uppercase hover:text-enc"
                  onClick={() => !link.submenu && setIsOpen(false)}
                >
                  {link.name}
                </Link>
                {link.submenu && (
                  <div className="pl-6 space-y-1 border-l-2 border-gray-150 ml-3">
                    {link.submenu.map((sub) => (
                      <Link
                        key={sub.name}
                        href={sub.href}
                        className="block py-2 text-[13px] font-semibold text-gray-500 hover:text-enc"
                        onClick={() => setIsOpen(false)}
                      >
                        {sub.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {!loading && (user ? (
              <div className="px-3 py-3 border-t border-gray-100 mt-2">
                <p className="font-black text-gray-800 text-sm uppercase">{getDisplayName()}</p>
                <p className="text-[11px] text-enc font-bold uppercase mt-0.5">{formatStatut(user.statut)}</p>
                <button
                  onClick={handleLogout}
                  className="block w-full py-4 rounded-xl bg-red-50 text-red-600 font-bold mt-3 transition-colors hover:bg-red-100"
                >
                  Déconnexion
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="block w-full py-4 rounded-xl bg-enc text-white text-center font-bold mt-4 shadow-sm"
                onClick={() => setIsOpen(false)}
              >
                Connexion / Inscription
              </Link>
            ))}
          </div>
        )}
      </nav>
    </header>
  )
}

export default Navbar
