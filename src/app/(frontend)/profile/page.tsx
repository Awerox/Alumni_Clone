'use client'
import React, { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showPopup, setShowPopup] = useState<string | null>(null)
  const [step, setStep] = useState(1)
  const [tempData, setTempData] = useState<any>({})
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState<boolean>(false)

  // Photo de profil
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [savedAvatar, setSavedAvatar] = useState<string | null>(null)
  const [zoom, setZoom] = useState<number>(1)
  const [rotation, setRotation] = useState<number>(0)
  const [flipH, setFlipH] = useState<boolean>(false)
  const [flipV, setFlipV] = useState<boolean>(false)

  // Éditeur bio
  const editorRef = useRef<HTMLDivElement>(null)

  // ✅ Ces inputs sont TOUJOURS dans le DOM (jamais conditionnels)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const documentInputRef = useRef<HTMLInputElement>(null)
  const colorInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const diplomaHierarchy: Record<string, string[]> = {
    BTS: [
      'BTS Assurance',
      'BTS CG (Comptabilité et Gestion)',
      'BTS Communication',
      'BTS CI (Commerce International)',
      'BTS GPME',
      'BTS MCO',
      'BTS NDRC',
      'BTS SAM',
      'BTS SIO (SLAM/SISR)',
      'BTS Tourisme',
    ],
    DCG3: ['DCG (Diplôme de Comptabilité et de Gestion)'],
    Prépa: [
      'Classe préparatoire ATS',
      'Classe préparatoire ENS D1',
      'Classe préparatoire ENS D2',
      'Classe préparatoire ECT',
      'Classe préparatoire ECG',
    ],
  }

  const iconsList = [
    {
      name: 'Facebook',
      icon: 'fa-brands fa-facebook',
      bg: '#EBF4FF',
      color: '#1877F2',
      isFile: false,
    },
    {
      name: 'Instagram',
      icon: 'fa-brands fa-instagram',
      bg: '#FFF0F5',
      color: '#E4405F',
      isFile: false,
    },
    {
      name: 'LinkedIn',
      icon: 'fa-brands fa-linkedin-in',
      bg: '#EBF4FF',
      color: '#0A66C2',
      isFile: false,
    },
    {
      name: 'X / Twitter',
      icon: 'fa-brands fa-x-twitter',
      bg: '#F3F4F6',
      color: '#000000',
      isFile: false,
    },
    {
      name: 'YouTube',
      icon: 'fa-brands fa-youtube',
      bg: '#FEE2E2',
      color: '#FF0000',
      isFile: false,
    },
    {
      name: 'Snapchat',
      icon: 'fa-brands fa-snapchat',
      bg: '#FEF08A',
      color: '#000000',
      isFile: false,
    },
    { name: 'TikTok', icon: 'fa-brands fa-tiktok', bg: '#F3F4F6', color: '#010101', isFile: false },
    { name: 'Twitch', icon: 'fa-brands fa-twitch', bg: '#F3E8FF', color: '#9146FF', isFile: false },
    {
      name: 'Spotify',
      icon: 'fa-brands fa-spotify',
      bg: '#DCFCE7',
      color: '#1ED760',
      isFile: false,
    },
    {
      name: 'SoundCloud',
      icon: 'fa-brands fa-soundcloud',
      bg: '#FFEDD5',
      color: '#FF5500',
      isFile: false,
    },
    { name: 'Reddit', icon: 'fa-brands fa-reddit', bg: '#FFE4E6', color: '#FF4500', isFile: false },
    {
      name: 'Discord',
      icon: 'fa-brands fa-discord',
      bg: '#E0E7FF',
      color: '#5865F2',
      isFile: false,
    },
    { name: 'GitHub', icon: 'fa-brands fa-github', bg: '#F3F4F6', color: '#24292E', isFile: false },
    { name: 'GitLab', icon: 'fa-brands fa-gitlab', bg: '#FFEBE5', color: '#FC6D26', isFile: false },
    { name: 'Figma', icon: 'fa-brands fa-figma', bg: '#FFEBEB', color: '#F24E1E', isFile: false },
    { name: 'Notion', icon: 'fa-solid fa-cube', bg: '#F3F4F6', color: '#000000', isFile: false },
    {
      name: 'Site internet',
      icon: 'fa-solid fa-globe',
      bg: '#E0F2FE',
      color: '#0369A1',
      isFile: false,
    },
    {
      name: 'Lien externe',
      icon: 'fa-solid fa-link',
      bg: '#F1F5F9',
      color: '#475569',
      isFile: false,
    },
    {
      name: 'Fichier PDF / CV',
      icon: 'fa-solid fa-file-pdf',
      bg: '#FEE2E2',
      color: '#DC2626',
      isFile: true,
    },
    {
      name: 'Mallette / Portfolio',
      icon: 'fa-solid fa-briefcase',
      bg: '#FEF3C7',
      color: '#D97706',
      isFile: true,
    },
    {
      name: 'Arbre de liens (Tree)',
      icon: 'fa-solid fa-tree',
      bg: '#E6F4EA',
      color: '#137333',
      isFile: false,
    },
  ]

  const quickColors = [
    { color: '#800020', label: 'Bordeaux' },
    { color: '#1877F2', label: 'Bleu' },
    { color: '#10B981', label: 'Émeraude' },
    { color: '#F59E0B', label: 'Ambre' },
    { color: '#EF4444', label: 'Rouge' },
    { color: '#8B5CF6', label: 'Violet' },
    { color: '#EC4899', label: 'Rose' },
    { color: '#06B6D4', label: 'Cyan' },
    { color: '#84CC16', label: 'Lime' },
    { color: '#F97316', label: 'Orange' },
    { color: '#6366F1', label: 'Indigo' },
    { color: '#14B8A6', label: 'Teal' },
  ]

  // ─── FETCH ─────────────────────────────────────────────────────────────────
  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/alumni/me?depth=1')
      if (!res.ok) {
        setUser(null)
        setLoading(false)
        return
      }
      const ct = res.headers.get('content-type')
      if (!ct?.includes('application/json')) {
        setUser(null)
        setLoading(false)
        return
      }
      const data = await res.json()
      if (data?.user) setUser(data.user)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProfile()
  }, [])

  // ─── AVATAR ────────────────────────────────────────────────────────────────
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 4 * 1024 * 1024) {
      alert("L'image est trop volumineuse (max 4 Mo).")
      return
    }
    const reader = new FileReader()
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string)
      setZoom(1)
      setRotation(0)
      setFlipH(false)
      setFlipV(false)
      setShowPopup('cropAvatar')
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const saveCroppedAvatar = useCallback(async () => {
  if (!avatarPreview) return

  const SIZE = 400
  const canvas = document.createElement('canvas')
  canvas.width = SIZE
  canvas.height = SIZE
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const img = new Image()
  img.crossOrigin = 'anonymous'
  img.src = avatarPreview

  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve()
    img.onerror = () => reject(new Error('Chargement image échoué'))
  })

  const imgW = img.naturalWidth
  const imgH = img.naturalHeight
  const imgRatio = imgW / imgH
  let srcX = 0, srcY = 0, srcW = imgW, srcH = imgH
  if (imgRatio > 1) {
    srcW = imgH
    srcX = (imgW - srcW) / 2
  } else if (imgRatio < 1) {
    srcH = imgW
    srcY = (imgH - srcH) / 2
  }

  ctx.save()
  ctx.translate(SIZE / 2, SIZE / 2)
  ctx.rotate((rotation * Math.PI) / 180)
  ctx.scale(flipH ? -zoom : zoom, flipV ? -zoom : zoom)
  ctx.drawImage(img, srcX, srcY, srcW, srcH, -SIZE / 2, -SIZE / 2, SIZE, SIZE)
  ctx.restore()

  const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/png'))
  if (!blob) return

  setIsUploading(true)
  try {
    const formData = new FormData()
    formData.append('file', blob, 'photo-profil.png')
    formData.append('alt', `Avatar de ${user?.prenom || 'Alumni'}`)

    const uploadRes = await fetch('/api/media', {
      method: 'POST',
      body: formData,
    })

    if (!uploadRes.ok) {
      const errData = await uploadRes.json().catch(() => ({}))
      setErrorMessage(errData?.error || "Échec de l'upload de la photo.")
      return
    }

    const uploadData = await uploadRes.json()
    // FIX : on force Number() ici aussi comme filet de sécurité,
    // même si /api/media retourne déjà un Number.
    const mediaId = Number(uploadData?.doc?.id)
    const mediaUrl = uploadData?.doc?.url

    if (!mediaId || isNaN(mediaId)) {
      setErrorMessage('Réponse invalide du serveur (id manquant).')
      return
    }

    if (mediaUrl) setSavedAvatar(mediaUrl)

    await handleSave({ photo: mediaId })
    setShowPopup(null)
    setAvatarPreview(null)
  } catch (err) {
    console.error(err)
    setErrorMessage("Erreur lors de l'envoi de la photo.")
  } finally {
    setIsUploading(false)
  }
}, [avatarPreview, zoom, rotation, flipH, flipV, user])

  // ─── DOCUMENT UPLOAD ───────────────────────────────────────────────────────
  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const MAX_SIZE = 5 * 1024 * 1024
    if (file.size > MAX_SIZE) {
      setErrorMessage('Fichier trop lourd — limite de 5 Mo (PDF, Word, image).')
      e.target.value = ''
      return
    }
    setErrorMessage(null)
    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('alt', tempData.label || 'Document joint')

      const uploadRes = await fetch('/api/media', {
        method: 'POST',
        body: formData,
      })
      if (!uploadRes.ok) {
        setErrorMessage("Échec de l'upload du fichier. Vérifiez votre connexion.")
        setIsUploading(false)
        return
      }
      const uploadData = await uploadRes.json()
      const mediaUrl = uploadData?.doc?.url
      if (!mediaUrl) {
        setErrorMessage('Réponse invalide du serveur.')
        setIsUploading(false)
        return
      }
      setTempData((prev: any) => ({ ...prev, url: mediaUrl, file: file, fileName: file.name }))
    } catch (err) {
      console.error(err)
      setErrorMessage("Erreur réseau lors de l'envoi du fichier.")
    } finally {
      setIsUploading(false)
      e.target.value = ''
    }
  }

  // ─── ÉDITEUR WYSIWYG ───────────────────────────────────────────────────────
  const execEditorCommand = useCallback((command: string, value?: string) => {
    editorRef.current?.focus()
    document.execCommand(command, false, value ?? '')
  }, [])

  const handleColorPickerChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    editorRef.current?.focus()
    document.execCommand('foreColor', false, e.target.value)
  }, [])

  const handleHighlightPickerChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    editorRef.current?.focus()
    document.execCommand('hiliteColor', false, e.target.value)
  }, [])

  useEffect(() => {
    if (showPopup === 'bio' && editorRef.current) {
      editorRef.current.innerHTML = user?.bio || ''
    }
  }, [showPopup])

  const handleSaveBio = () => {
    const html = editorRef.current?.innerHTML || ''
    handleSave({ bio: html })
  }

  // ─── VALIDATION ────────────────────────────────────────────────────────────
  const validateDates = (type: string, data: any): boolean => {
    setErrorMessage(null)
    const parseDateValue = (s: string) => {
      if (!s) return 0
      if (s.includes('/')) {
        const [m, y] = s.split('/').map(Number)
        return y * 12 + m
      }
      return Number(s) * 12
    }
    const fmt = /^(0[1-9]|1[0-2])\/\d{4}$|^\d{4}$/

    if (type === 'exp') {
      if (!data.poste || !data.entreprise || !data.localite) {
        setErrorMessage('Les champs marqués (*) sont obligatoires.')
        return false
      }
      if (!data.dateDebut) {
        setErrorMessage('La date de début est obligatoire.')
        return false
      }
      if (!fmt.test(data.dateDebut)) {
        setErrorMessage('Format début : MM/AAAA (ex: 09/2024).')
        return false
      }
      if (!data.isCurrent && data.dateFin) {
        if (!fmt.test(data.dateFin)) {
          setErrorMessage('Format fin : MM/AAAA (ex: 06/2025).')
          return false
        }
        if (parseDateValue(data.dateFin) < parseDateValue(data.dateDebut)) {
          setErrorMessage('La date de fin ne peut pas être antérieure au début.')
          return false
        }
      }
    }
    if (type === 'form') {
      if (data.isENC === undefined) {
        setErrorMessage("Sélectionnez l'établissement.")
        return false
      }
      if (!data.nom) {
        setErrorMessage('Le nom de la formation est obligatoire.')
        return false
      }
      if (data.isENC && !data.campus) {
        setErrorMessage('Renseignez votre campus.')
        return false
      }
      if (
        !data.isENC &&
        (!data.typeDiplome ||
          !data.etablissement ||
          !data.localiteEtablissement ||
          !data.statutObtention)
      ) {
        setErrorMessage('Remplissez tous les champs obligatoires (*).')
        return false
      }
      if (!data.annee) {
        setErrorMessage("L'année d'obtention est obligatoire.")
        return false
      }
      const y = Number(data.annee)
      if (isNaN(y) || y < 1960 || y > 2035) {
        setErrorMessage('Année invalide (ex: 2025).')
        return false
      }
    }
    return true
  }

  // ─── SAVE ──────────────────────────────────────────────────────────────────
  const handleSave = async (updatedFields: any, typeValidation?: string) => {
    if (typeValidation) {
      const fieldName =
        typeValidation === 'exp'
          ? 'experiences'
          : typeValidation === 'form'
            ? 'formations'
            : 'interets'
      const arr = updatedFields[fieldName]
      if (!validateDates(typeValidation, arr[arr.length - 1])) return
    }
    try {
      const res = await fetch(`/api/alumni-profile/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedFields),
      })
      if (res.ok) {
        setShowPopup(null)
        setStep(1)
        setTempData({})
        setErrorMessage(null)
        // ✅ FIX C : si la photo vient d'être mise à jour, vider savedAvatar
        // pour que le prochain render lise user.photo.url (URL Cloudinary fraîche)
        // plutôt que l'ancien blob local
        if ('photo' in updatedFields) setSavedAvatar(null)
        await fetchProfile()
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleDeleteItem = (field: string, index: number) => {
    const newList = [...user[field]]
    newList.splice(index, 1)
    handleSave({ [field]: newList })
  }

  if (loading)
    return (
      <div className="min-h-screen bg-[#FAFAFC] flex items-center justify-center">
        <div className="text-center font-black text-xs text-gray-400 uppercase tracking-[0.25em] animate-pulse">
          Chargement du studio...
        </div>
      </div>
    )

  if (!user)
    return (
      <div className="min-h-screen bg-[#FAFAFC] flex flex-col items-center justify-center gap-5">
        <div className="text-gray-400 font-bold text-xs uppercase tracking-widest">
          Session expirée
        </div>
        <button
          onClick={() => router.push('/login')}
          className="px-5 py-2.5 bg-[#800020] text-white font-bold rounded-xl text-xs uppercase shadow-sm"
        >
          Se connecter
        </button>
      </div>
    )

  const avatarSrc =
    savedAvatar ||
    (typeof user.photo === 'object' ? user.photo?.url : null) ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(user.prenom || '')}+${encodeURIComponent(user.nom || '')}&size=400&background=800020&color=fff`

  const animStyles = `
    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(20px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes scaleIn {
      from { opacity: 0; transform: scale(0.95); }
      to   { opacity: 1; transform: scale(1); }
    }
    .anim-fade-up  { animation: fadeUp  0.5s ease both; }
    .anim-scale-in { animation: scaleIn 0.4s ease both; }
    .d1 { animation-delay: 0.05s; }
    .d2 { animation-delay: 0.12s; }
    .d3 { animation-delay: 0.20s; }
    .d4 { animation-delay: 0.28s; }
    .d5 { animation-delay: 0.36s; }
    .d6 { animation-delay: 0.44s; }
    .card-hover { transition: box-shadow 0.25s, transform 0.25s; }
    .card-hover:hover { box-shadow: 0 8px 32px rgba(128,0,32,0.10); transform: translateY(-2px); }
  `

  return (
    <div className="min-h-screen bg-[#F6F6FA] py-12 px-4 text-gray-800 antialiased selection:bg-gray-200">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleAvatarChange}
        accept="image/*"
        className="hidden"
      />
      <input
        type="file"
        ref={documentInputRef}
        onChange={handleDocumentUpload}
        accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
        className="hidden"
      />

      <style>{animStyles}</style>

      <div className="max-w-5xl mx-auto space-y-8">
        {/* ── HEADER ── */}
        <div className="anim-scale-in bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
          {/* Bannière bordeaux avec photo intégrée */}
          <div className="h-52 bg-[#800020] relative flex items-center px-8 gap-6">
            <div className="absolute inset-0 bg-[radial-gradient(#ffffff15_1px,transparent_1px)] [background-size:16px_16px] opacity-40" />
            <div className="absolute inset-0 bg-gradient-to-br from-[#800020] via-[#900025] to-[#600018]" />

            {/* Photo cliquable pour modifier */}
            <div className="relative z-10 flex-shrink-0">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="anim-scale-in d1 w-32 h-32 rounded-2xl border-4 border-white/30 shadow-2xl overflow-hidden cursor-pointer group"
              >
                <img
                  src={avatarSrc}
                  alt="Photo de profil"
                  className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/55 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center text-white gap-1 backdrop-blur-[2px]">
                  <i className="fa-solid fa-camera text-base" />
                  <span className="text-[8px] font-black uppercase tracking-wider">Modifier</span>
                </div>
              </div>
            </div>

            {/* Infos */}
            <div className="anim-fade-up d1 relative z-10 flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  {user.prenom} {user.nom}
                </h1>
                <span className="bg-white/15 text-white/90 font-black uppercase text-[9px] px-2.5 py-1 rounded-full tracking-wider backdrop-blur-sm">
                  {user.statut === 'alumni' ? 'Alumni' : 'Étudiant'}
                  {user.promotion ? ` · Promo ${user.promotion}` : ''}
                </span>
                {user.isMentor && (
                  <span className="inline-flex items-center gap-1 bg-amber-400 text-white font-black uppercase text-[9px] px-2.5 py-1 rounded-full tracking-wider shadow-sm">
                    <i className="fa-solid fa-star text-[8px]" /> Mentor
                  </span>
                )}
              </div>
              <p className="text-white/70 text-sm font-semibold mb-2">
                {user.poste && user.entreprise
                  ? `${user.poste} · ${user.entreprise}`
                  : 'École Nationale de Commerce · ENC Bessières'}
              </p>
              {user.ville && (
                <span className="flex items-center gap-1 text-white/60 text-[11px] font-semibold">
                  <i className="fa-solid fa-location-dot text-white/40 text-[10px]" />
                  {user.ville}
                </span>
              )}
            </div>

            {/* Bouton modifier */}
            <div className="anim-fade-up d2 relative z-10 flex-shrink-0">
              <button
                onClick={() => router.push('/profile/edit')}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-[#800020] font-black rounded-xl text-xs uppercase tracking-wider hover:bg-gray-50 transition-all shadow-lg"
              >
                <i className="fa-solid fa-pen-to-square" />
                Modifier le profil
              </button>
            </div>
          </div>
        </div>

        {/* Bandeau Mentor */}
        {user.isMentor && (
          <div className="p-4 bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200/60 rounded-2xl flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-amber-400 flex items-center justify-center flex-shrink-0 shadow-sm">
              <i className="fa-solid fa-star text-white text-sm" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-black text-amber-800 uppercase tracking-wider mb-0.5">
                Membre Mentor
              </p>
              <p className="text-xs text-amber-700/80 font-medium leading-relaxed">
                {user.prenom} est disponible pour accompagner les étudiants et jeunes alumni.
              </p>
            </div>
          </div>
        )}

        {/* ── GRILLE PRINCIPALE ───────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* COLONNE GAUCHE */}
          <div className="md:col-span-4 space-y-8">
            <div className="anim-fade-up d3 card-hover bg-white p-6 rounded-3xl shadow-xl shadow-gray-200/40 border border-gray-100/80">
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                <i className="fa-solid fa-address-book text-[#800020] text-xs" /> Informations
              </h3>
              <div className="space-y-4">
                {[
                  { label: 'Email universitaire', value: user.email },
                  { label: 'Téléphone', value: user.telephone || 'Non renseigné' },
                  { label: 'Localisation', value: user.ville || 'Paris, France' },
                ].map(({ label, value }) => (
                  <div key={label} className="p-3 bg-gray-50 rounded-xl">
                    <p className="text-[9px] font-black text-gray-400 uppercase mb-0.5">{label}</p>
                    <p className="text-xs font-bold text-gray-800 truncate">{value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="anim-fade-up d4 card-hover bg-white p-6 rounded-3xl shadow-xl shadow-gray-200/40 border border-gray-100/80 space-y-4">
              <div className="flex justify-between items-center border-b border-gray-50 pb-3">
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em]">
                  Réseaux & Documents
                </h3>
                <button
                  onClick={() => {
                    setShowPopup('social')
                    setStep(1)
                    setErrorMessage(null)
                    setTempData({})
                  }}
                  className="w-7 h-7 bg-[#4ADE80] hover:bg-[#3bc26f] text-white rounded-lg flex items-center justify-center transition-all shadow-sm"
                >
                  <i className="fa-solid fa-plus text-xs" />
                </button>
              </div>
              {user.socialLinks?.length > 0 ? (
                <div className="grid grid-cols-4 gap-4 justify-items-center pt-2">
                  {user.socialLinks.map((link: any, i: number) => {
                    const meta = iconsList.find((x) => x.icon === link.icon)
                    return (
                      <div key={i} className="relative group">
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            backgroundColor: meta?.bg || '#F1F5F9',
                            color: meta?.color || '#475569',
                          }}
                          className="w-11 h-11 rounded-xl flex items-center justify-center text-lg hover:scale-110 transition-all shadow-sm relative"
                        >
                          <i className={link.icon} />
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1 bg-gray-900 text-white text-[9px] rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none font-bold shadow-md whitespace-nowrap z-30">
                            {link.label}
                          </div>
                        </a>
                        <button
                          onClick={() => handleDeleteItem('socialLinks', i)}
                          className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-white shadow-sm hover:bg-red-500 hover:text-white border border-gray-100 rounded-full flex items-center justify-center text-[8px] text-gray-400 transition-colors"
                        >
                          ✕
                        </button>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-center text-xs text-gray-400 italic py-4">
                  Aucun document ou lien enregistré.
                </p>
              )}
            </div>
          </div>

          {/* COLONNE DROITE */}
          <div className="md:col-span-8 space-y-8">
            <section className="anim-fade-up d3 card-hover bg-white p-6 rounded-3xl shadow-xl shadow-gray-200/40 border border-gray-100/80">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <i className="fa-solid fa-user text-[#800020]" /> À propos de moi
                </h3>
                {user.bio && (
                  <button
                    onClick={() => setShowPopup('bio')}
                    className="text-xs text-gray-400 hover:text-[#800020] transition-colors"
                  >
                    <i className="fa-solid fa-pen-to-square mr-1" /> Modifier
                  </button>
                )}
              </div>
              {user.bio ? (
                <div
                  className="text-sm text-gray-600 leading-relaxed bg-gray-50 p-5 rounded-2xl border border-gray-100 min-h-[60px] prose prose-sm max-w-none break-words"
                  dangerouslySetInnerHTML={{ __html: user.bio }}
                />
              ) : (
                <div className="text-center py-8 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                  <button
                    onClick={() => setShowPopup('bio')}
                    className="bg-[#4ADE80] hover:bg-[#3bc26f] text-white px-5 py-2.5 rounded-xl font-bold uppercase text-[9px] tracking-wider transition-colors shadow-sm"
                  >
                    + Ajouter un résumé
                  </button>
                </div>
              )}
            </section>

            <section className="anim-fade-up d4 card-hover bg-white p-6 rounded-3xl shadow-xl shadow-gray-200/40 border border-gray-100/80">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <i className="fa-solid fa-briefcase text-[#800020]" /> Parcours Professionnel
                </h3>
                <button
                  onClick={() => {
                    setTempData({ isCurrent: false })
                    setShowPopup('exp')
                    setErrorMessage(null)
                  }}
                  className="bg-[#4ADE80] hover:bg-[#3bc26f] text-white px-3 py-1.5 rounded-lg font-bold uppercase text-[9px] tracking-wider transition-colors"
                >
                  + Ajouter
                </button>
              </div>
              {user.experiences?.length > 0 ? (
                <div className="space-y-4">
                  {user.experiences.map((exp: any, i: number) => (
                    <div
                      key={i}
                      className="flex justify-between items-start p-4 bg-gray-50/50 rounded-2xl border border-gray-100 group hover:bg-gray-50 transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-black text-gray-900 uppercase text-xs tracking-tight">
                            {exp.poste}
                          </p>
                          {exp.typeContrat && (
                            <span className="bg-gray-200/80 text-gray-700 font-black text-[8px] px-1.5 py-0.5 rounded uppercase tracking-wide">
                              {exp.typeContrat}
                            </span>
                          )}
                          {exp.isCurrent && (
                            <span className="bg-emerald-100 text-emerald-800 font-bold text-[8px] px-1.5 py-0.5 rounded uppercase">
                              Actuel
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-600 font-bold">
                          {exp.entreprise}{' '}
                          {exp.localite && (
                            <span className="text-gray-400 font-medium ml-1">
                              📍 {exp.localite}
                            </span>
                          )}
                        </p>
                        <p className="text-[9px] text-gray-400 font-black uppercase tracking-wider">
                          <i className="fa-regular fa-calendar-days mr-1" /> {exp.dateDebut} —{' '}
                          {exp.isCurrent ? 'Présent' : exp.dateFin || '---'}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDeleteItem('experiences', i)}
                        className="p-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <i className="fa-solid fa-trash-can text-xs" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400 italic bg-gray-50 p-4 rounded-xl text-center">
                  Aucune expérience enregistrée.
                </p>
              )}
            </section>

            <section className="anim-fade-up d5 card-hover bg-white p-6 rounded-3xl shadow-xl shadow-gray-200/40 border border-gray-100/80">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <i className="fa-solid fa-graduation-cap text-[#800020]" /> Formations & Cursus
                </h3>
                <button
                  onClick={() => {
                    setTempData({ isENC: true, statutObtention: "J'ai obtenu mon diplôme" })
                    setShowPopup('form')
                    setErrorMessage(null)
                  }}
                  className="bg-[#4ADE80] hover:bg-[#3bc26f] text-white px-3 py-1.5 rounded-lg font-bold uppercase text-[9px] tracking-wider transition-colors"
                >
                  + Ajouter
                </button>
              </div>
              <div className="space-y-4">
                {user.formations?.map((form: any, i: number) => (
                  <div
                    key={i}
                    className="flex justify-between items-start p-4 bg-gray-50/50 rounded-2xl border border-gray-100 group hover:bg-gray-50 transition-all"
                  >
                    <div className="flex gap-4">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center text-base shadow-inner ${form.isENC ? 'bg-[#800020] text-white' : 'bg-zinc-100 text-[#800020]'}`}
                      >
                        <i className={form.isENC ? 'fa-solid fa-award' : 'fa-solid fa-landmark'} />
                      </div>
                      <div>
                        <p className="font-black text-gray-900 text-xs uppercase tracking-tight">
                          {form.nom}
                        </p>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">
                          {form.etablissement}
                          {form.campus
                            ? ` • ${form.campus}`
                            : form.localiteEtablissement
                              ? ` • ${form.localiteEtablissement}`
                              : ''}
                        </p>
                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider">
                          Promotion : {form.annee}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteItem('formations', i)}
                      className="p-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <i className="fa-solid fa-trash-can text-xs" />
                    </button>
                  </div>
                ))}
              </div>
            </section>

            <section className="anim-fade-up d6 card-hover bg-white p-6 rounded-3xl shadow-xl shadow-gray-200/40 border border-gray-100/80">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <i className="fa-solid fa-heart text-[#800020]" /> Centres d'intérêt
                </h3>
                <button
                  onClick={() => {
                    setTempData({ nom: '' })
                    setShowPopup('interet')
                    setErrorMessage(null)
                  }}
                  className="w-7 h-7 bg-[#4ADE80] hover:bg-[#3bc26f] text-white rounded-lg flex items-center justify-center transition-transform shadow-sm"
                >
                  <i className="fa-solid fa-plus text-xs" />
                </button>
              </div>
              <div className="flex flex-wrap gap-2.5">
                {user.interets?.length > 0 ? (
                  user.interets.map((int: any, i: number) => (
                    <div
                      key={i}
                      className="px-3 py-1.5 bg-gray-50 text-gray-800 rounded-xl font-bold text-[9px] uppercase flex items-center gap-2 border border-gray-100"
                    >
                      <span>{int.nom}</span>
                      <button
                        onClick={() => handleDeleteItem('interets', i)}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <i className="fa-solid fa-xmark text-xs" />
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-400 text-xs italic">Aucun centre d'intérêt renseigné.</p>
                )}
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* ================================================================= */}
      {/* POPUPS                                                            */}
      {/* ================================================================= */}
      {showPopup && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-md flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden border border-gray-100">
            {/* Header popup */}
            <div className="bg-gray-50 p-5 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xs font-black text-gray-900 uppercase tracking-wider">
                {showPopup === 'cropAvatar'
                  ? 'Ajuster votre photo'
                  : showPopup === 'social'
                    ? 'Réseaux & Fichiers joints'
                    : showPopup === 'bio'
                      ? 'Éditeur de biographie'
                      : showPopup === 'exp'
                        ? 'Parcours professionnel'
                        : showPopup === 'form'
                          ? 'Formation & Cursus'
                          : "Centre d'intérêt"}
              </h2>
              <button
                onClick={() => {
                  setShowPopup(null)
                  setAvatarPreview(null)
                  setErrorMessage(null)
                }}
                className="text-gray-400 hover:text-red-500"
              >
                <i className="fa-solid fa-circle-xmark text-lg" />
              </button>
            </div>

            <div className="p-6 max-h-[75vh] overflow-y-auto space-y-4">
              {errorMessage && (
                <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-xs font-bold flex items-center gap-2">
                  <i className="fa-solid fa-triangle-exclamation" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* ── RECADRAGE AVATAR ──────────────────────────────────────────── */}
              {showPopup === 'cropAvatar' && (
                <div className="space-y-6 text-center">
                  <div className="w-48 h-48 rounded-3xl mx-auto overflow-hidden bg-gray-100 border-2 border-gray-200 shadow-inner">
                    <div
                      style={{
                        width: '100%',
                        height: '100%',
                        transform: `scale(${zoom}) rotate(${rotation}deg) scaleX(${flipH ? -1 : 1}) scaleY(${flipV ? -1 : 1})`,
                        transition: 'transform 0.15s ease-out',
                      }}
                    >
                      {avatarPreview && (
                        <img
                          src={avatarPreview}
                          className="w-full h-full object-cover"
                          alt="Aperçu"
                        />
                      )}
                    </div>
                  </div>

                  <div className="flex justify-center gap-3">
                    {[
                      {
                        icon: 'fa-rotate-left',
                        action: () => setRotation((r) => r - 90),
                        title: 'Rotation gauche',
                      },
                      {
                        icon: 'fa-rotate-right',
                        action: () => setRotation((r) => r + 90),
                        title: 'Rotation droite',
                      },
                      {
                        icon: 'fa-arrows-left-right',
                        action: () => setFlipH((v) => !v),
                        title: 'Miroir horizontal',
                      },
                      {
                        icon: 'fa-arrows-up-down',
                        action: () => setFlipV((v) => !v),
                        title: 'Miroir vertical',
                      },
                    ].map(({ icon, action, title }) => (
                      <button
                        key={icon}
                        onClick={action}
                        type="button"
                        title={title}
                        className="w-9 h-9 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs transition-colors"
                      >
                        <i className={`fa-solid ${icon}`} />
                      </button>
                    ))}
                  </div>

                  <div className="space-y-1 px-4">
                    <div className="flex justify-between text-[10px] font-black text-gray-400 uppercase tracking-wider">
                      <span>Zoom</span>
                      <span>{Math.round(zoom * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="3"
                      step="0.05"
                      value={zoom}
                      onChange={(e) => setZoom(parseFloat(e.target.value))}
                      className="w-full accent-gray-900"
                    />
                  </div>

                  <button
                    onClick={saveCroppedAvatar}
                    className="w-full py-3.5 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-bold uppercase text-xs tracking-wider transition-colors"
                  >
                    <i className="fa-solid fa-check mr-2" />
                    Valider la photo de profil
                  </button>
                </div>
              )}

              {/* ── BIOGRAPHIE WYSIWYG ───────────────────────────────────────── */}
              {showPopup === 'bio' && (
                <div className="space-y-4">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
                    Mettez en forme votre présentation :
                  </p>

                  <div className="flex flex-wrap gap-1.5 p-2.5 bg-gray-100 rounded-xl border border-gray-200 items-center">
                    {[
                      { cmd: 'bold', label: 'B', cls: 'font-bold' },
                      { cmd: 'italic', label: 'I', cls: 'italic' },
                      { cmd: 'underline', label: 'U', cls: 'underline' },
                      { cmd: 'strikeThrough', label: 'S', cls: 'line-through' },
                    ].map(({ cmd, label, cls }) => (
                      <button
                        key={cmd}
                        onMouseDown={(e) => {
                          e.preventDefault()
                          execEditorCommand(cmd)
                        }}
                        type="button"
                        className={`w-8 h-8 ${cls} bg-white rounded border border-gray-200 text-xs hover:bg-gray-50 hover:border-gray-400 transition-all`}
                      >
                        {label}
                      </button>
                    ))}

                    <div className="w-px bg-gray-300 self-stretch mx-0.5" />

                    <button
                      onMouseDown={(e) => {
                        e.preventDefault()
                        execEditorCommand('insertUnorderedList')
                      }}
                      type="button"
                      className="w-8 h-8 bg-white rounded border border-gray-200 text-xs hover:bg-gray-50 transition-all"
                    >
                      <i className="fa-solid fa-list-ul" />
                    </button>
                    <button
                      onMouseDown={(e) => {
                        e.preventDefault()
                        execEditorCommand('insertOrderedList')
                      }}
                      type="button"
                      className="w-8 h-8 bg-white rounded border border-gray-200 text-xs hover:bg-gray-50 transition-all"
                    >
                      <i className="fa-solid fa-list-ol" />
                    </button>

                    <div className="w-px bg-gray-300 self-stretch mx-0.5" />

                    {quickColors.map(({ color, label }) => (
                      <button
                        key={color}
                        onMouseDown={(e) => {
                          e.preventDefault()
                          execEditorCommand('foreColor', color)
                        }}
                        type="button"
                        title={label}
                        className="w-5 h-5 rounded-full border-2 border-white shadow-sm hover:scale-125 transition-transform flex-shrink-0"
                        style={{ backgroundColor: color }}
                      />
                    ))}

                    {/* Palette infinie — couleur texte */}
                    <div
                      className="relative w-6 h-6 rounded-full overflow-hidden border-2 border-white shadow-sm cursor-pointer hover:scale-125 transition-transform flex-shrink-0"
                      title="Couleur personnalisée"
                    >
                      <input
                        type="color"
                        ref={colorInputRef}
                        defaultValue="#000000"
                        onChange={handleColorPickerChange}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                        style={{ transform: 'scale(2)' }}
                      />
                      <div
                        className="w-full h-full pointer-events-none"
                        style={{
                          background: 'conic-gradient(red,yellow,lime,cyan,blue,magenta,red)',
                        }}
                      />
                    </div>

                    {/* Palette infinie — surlignage */}
                    <div
                      className="relative w-6 h-6 rounded-full overflow-hidden border-2 border-white shadow-sm cursor-pointer hover:scale-125 transition-transform flex-shrink-0"
                      title="Surlignage"
                    >
                      <input
                        type="color"
                        defaultValue="#FFFF00"
                        onChange={handleHighlightPickerChange}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                        style={{ transform: 'scale(2)' }}
                      />
                      <div
                        className="w-full h-full pointer-events-none flex items-center justify-center"
                        style={{ background: 'linear-gradient(135deg,#FFFF00,#FF6EC7,#00BFFF)' }}
                      >
                        <i className="fa-solid fa-highlighter text-[7px] text-gray-700/60 pointer-events-none" />
                      </div>
                    </div>

                    <div className="w-px bg-gray-300 self-stretch mx-0.5" />

                    <button
                      onMouseDown={(e) => {
                        e.preventDefault()
                        execEditorCommand('removeFormat')
                      }}
                      type="button"
                      title="Effacer le formatage"
                      className="w-8 h-8 bg-white rounded border border-gray-200 text-xs text-red-400 hover:bg-red-50 hover:border-red-200 transition-all ml-auto"
                    >
                      <i className="fa-solid fa-eraser" />
                    </button>
                  </div>

                  <div
                    ref={editorRef}
                    contentEditable
                    suppressContentEditableWarning
                    className="w-full min-h-[180px] p-4 bg-white border border-gray-200 rounded-2xl text-sm outline-none focus:border-[#800020] focus:ring-1 focus:ring-[#800020] overflow-y-auto prose prose-sm"
                    style={{ lineHeight: '1.6' }}
                  />

                  <button
                    onClick={handleSaveBio}
                    className="w-full py-3 bg-[#800020] hover:bg-[#600018] text-white rounded-xl font-bold uppercase text-xs tracking-wider transition-colors shadow-md"
                  >
                    <i className="fa-solid fa-floppy-disk mr-2" />
                    Sauvegarder la biographie
                  </button>
                </div>
              )}

              {/* ── RÉSEAUX & FICHIERS ── */}
              {showPopup === 'social' && (
                <div className="space-y-4">
                  {step === 1 && (
                    <div className="space-y-3">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
                        Étape 1 — Sélectionnez le type
                      </p>
                      <div className="grid grid-cols-4 gap-3 max-h-[260px] overflow-y-auto p-1 bg-gray-50 rounded-2xl border border-gray-100">
                        {iconsList.map((item) => (
                          <button
                            key={item.name}
                            type="button"
                            onClick={() => {
                              setTempData({ icon: item.icon, isFile: item.isFile })
                              setStep(2)
                            }}
                            className="p-3 bg-white rounded-xl border border-gray-200 hover:border-[#800020] flex flex-col items-center gap-1.5 transition-all"
                          >
                            <i className={`${item.icon} text-lg`} style={{ color: item.color }} />
                            <span className="text-[9px] font-bold text-gray-500 truncate w-full text-center">
                              {item.name}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {step === 2 && (
                    <div className="space-y-3">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
                        Étape 2 — Donnez un nom
                      </p>
                      <div className="flex gap-2">
                        <input
                          className="flex-1 p-3 border border-gray-200 rounded-xl text-xs font-semibold outline-none focus:border-gray-900"
                          placeholder="Ex: Mon CV, Portfolio Webflow…"
                          value={tempData.label || ''}
                          onChange={(e) =>
                            setTempData((p: any) => ({ ...p, label: e.target.value }))
                          }
                        />
                        <button
                          onClick={() => setStep(3)}
                          disabled={!tempData.label}
                          type="button"
                          className="bg-gray-900 text-white px-4 rounded-xl font-bold text-xs uppercase disabled:opacity-50"
                        >
                          Suivant
                        </button>
                      </div>
                    </div>
                  )}

                  {step === 3 && (
                    <div className="space-y-4">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
                        Étape 3 — {tempData.isFile ? 'Importer un fichier' : 'Renseigner le lien'}
                      </p>

                      {/* MODE FICHIER */}
                      {tempData.isFile && (
                        <div className="space-y-3">
                          <div
                            onClick={() => !isUploading && documentInputRef.current?.click()}
                            className={`p-6 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-2 transition-colors ${
                              isUploading
                                ? 'border-blue-200 bg-blue-50/50 cursor-wait'
                                : tempData.fileName
                                  ? 'border-emerald-300 bg-emerald-50/50 cursor-pointer'
                                  : 'border-gray-200 bg-gray-50/50 hover:bg-gray-100 cursor-pointer hover:border-[#800020]'
                            }`}
                          >
                            {isUploading ? (
                              <>
                                <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                                <span className="text-xs font-bold text-blue-600">
                                  Envoi en cours…
                                </span>
                              </>
                            ) : tempData.url ? (
                              <>
                                <i className="fa-solid fa-circle-check text-2xl text-emerald-500" />
                                <span className="text-xs font-bold text-emerald-700 text-center">
                                  {tempData.fileName}
                                </span>
                                <span className="text-[10px] text-emerald-600">Fichier chargé</span>
                              </>
                            ) : (
                              <>
                                <i className="fa-solid fa-file-arrow-up text-2xl text-[#800020]" />
                                <span className="text-xs font-bold text-gray-700 text-center">
                                  Cliquez pour sélectionner le fichier local
                                </span>
                                <span className="text-[10px] text-gray-400">
                                  PDF, Word ou Image — max 5 Mo
                                </span>
                              </>
                            )}
                          </div>

                          {tempData.fileName && !isUploading && (
                            <button
                              type="button"
                              onClick={() => documentInputRef.current?.click()}
                              className="w-full py-2 border border-gray-200 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-50 transition-colors"
                            >
                              <i className="fa-solid fa-arrow-rotate-right mr-2" />
                              Changer de fichier
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() =>
                              handleSave({ socialLinks: [...(user.socialLinks || []), tempData] })
                            }
                            disabled={!tempData.url || isUploading}
                            className="w-full py-3 bg-[#4ADE80] hover:bg-[#3bc26f] text-white rounded-xl font-bold uppercase text-xs tracking-wider disabled:opacity-40 transition-colors"
                          >
                            <i className="fa-solid fa-floppy-disk mr-2" />
                            Sauvegarder le fichier
                          </button>
                        </div>
                      )}

                      {/* MODE LIEN */}
                      {!tempData.isFile && (
                        <div className="space-y-3">
                          <input
                            className="w-full p-3 border border-gray-200 rounded-xl text-xs font-semibold outline-none focus:border-gray-900"
                            placeholder="https://linkedin.com/in/username"
                            value={tempData.url || ''}
                            onChange={(e) =>
                              setTempData((p: any) => ({ ...p, url: e.target.value }))
                            }
                          />
                          <button
                            type="button"
                            onClick={() =>
                              handleSave({ socialLinks: [...(user.socialLinks || []), tempData] })
                            }
                            disabled={!tempData.url}
                            className="w-full py-3 bg-[#4ADE80] hover:bg-[#3bc26f] text-white rounded-xl font-bold uppercase text-xs tracking-wider disabled:opacity-40 transition-colors"
                          >
                            <i className="fa-solid fa-floppy-disk mr-2" />
                            Enregistrer le lien
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* ── EXPÉRIENCES ──────────────────────────────────────────────── */}
              {showPopup === 'exp' && (
                <div className="space-y-3 text-xs font-semibold text-gray-600">
                  {[
                    { key: 'poste', label: 'Intitulé du poste *', placeholder: 'Développeur web…' },
                    { key: 'entreprise', label: 'Entreprise *', placeholder: 'Google France' },
                    {
                      key: 'localite',
                      label: 'Ville / Localisation *',
                      placeholder: 'Paris, Remote…',
                    },
                  ].map(({ key, label, placeholder }) => (
                    <div key={key}>
                      <label className="block mb-1 text-gray-500">{label}</label>
                      <input
                        className="w-full p-3 border border-gray-200 rounded-xl outline-none text-xs focus:border-gray-900"
                        placeholder={placeholder}
                        onChange={(e) => setTempData((p: any) => ({ ...p, [key]: e.target.value }))}
                      />
                    </div>
                  ))}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block mb-1 text-gray-500">Mois/Année Début *</label>
                      <input
                        className="w-full p-3 border border-gray-200 rounded-xl text-center text-xs"
                        placeholder="09/2025"
                        onChange={(e) =>
                          setTempData((p: any) => ({ ...p, dateDebut: e.target.value }))
                        }
                      />
                    </div>
                    <div>
                      <label className="block mb-1 text-gray-500">Mois/Année Fin</label>
                      <input
                        className="w-full p-3 border border-gray-200 rounded-xl text-center text-xs"
                        placeholder="En cours"
                        onChange={(e) =>
                          setTempData((p: any) => ({ ...p, dateFin: e.target.value }))
                        }
                      />
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      handleSave({ experiences: [...(user.experiences || []), tempData] }, 'exp')
                    }
                    className="w-full py-3 bg-gray-900 text-white rounded-xl font-bold uppercase tracking-wider text-xs"
                  >
                    Sauvegarder l'expérience
                  </button>
                </div>
              )}

              {/* ── FORMATIONS ───────────────────────────────────────────────── */}
              {showPopup === 'form' && (
                <div className="space-y-3 text-xs font-semibold text-gray-600">
                  <div className="p-3 bg-gray-50 rounded-xl flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={tempData.isENC === true}
                        onChange={() =>
                          setTempData({
                            isENC: true,
                            nom: '',
                            annee: '',
                            etablissement: 'ENC Bessières',
                            campus: 'ENC Bessières',
                          })
                        }
                        className="accent-gray-900"
                      />
                      <span>ENC Bessières</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={tempData.isENC === false}
                        onChange={() =>
                          setTempData({ isENC: false, nom: '', annee: '', etablissement: '' })
                        }
                        className="accent-gray-900"
                      />
                      <span>Autre école</span>
                    </label>
                  </div>
                  {tempData.isENC ? (
                    <div>
                      <label className="block mb-1 text-gray-500">Cursus dispensé *</label>
                      <select
                        className="w-full p-3 border bg-white border-gray-200 rounded-xl text-xs"
                        onChange={(e) => setTempData((p: any) => ({ ...p, nom: e.target.value }))}
                      >
                        <option value="">Sélectionnez une filière</option>
                        {Object.entries(diplomaHierarchy).map(([cat, items]) => (
                          <optgroup key={cat} label={cat}>
                            {items.map((name) => (
                              <option key={name} value={name}>
                                {name}
                              </option>
                            ))}
                          </optgroup>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div>
                      <label className="block mb-1 text-gray-500">
                        Nom de la formation externe *
                      </label>
                      <input
                        className="w-full p-3 border border-gray-200 rounded-xl text-xs"
                        placeholder="Master, Licence…"
                        onChange={(e) => setTempData((p: any) => ({ ...p, nom: e.target.value }))}
                      />
                    </div>
                  )}
                  <div>
                    <label className="block mb-1 text-gray-500">
                      Année d'obtention / promotion *
                    </label>
                    <input
                      className="w-full p-3 border border-gray-200 rounded-xl text-xs"
                      placeholder="Ex: 2026"
                      onChange={(e) => setTempData((p: any) => ({ ...p, annee: e.target.value }))}
                    />
                  </div>
                  <button
                    onClick={() =>
                      handleSave({ formations: [...(user.formations || []), tempData] }, 'form')
                    }
                    className="w-full py-3 bg-gray-900 text-white rounded-xl font-bold uppercase tracking-wider text-xs"
                  >
                    Ajouter au cursus
                  </button>
                </div>
              )}

              {/* ── INTÉRÊTS ─────────────────────────────────────────────────── */}
              {showPopup === 'interet' && (
                <div className="space-y-3">
                  <input
                    placeholder="Ex: Cyber sécurité, Guitare, Gaming…"
                    className="w-full p-3 border border-gray-200 rounded-xl text-xs font-semibold outline-none focus:border-gray-900"
                    onChange={(e) => setTempData({ nom: e.target.value })}
                  />
                  <button
                    onClick={() =>
                      handleSave({ interets: [...(user.interets || []), tempData] }, 'interet')
                    }
                    className="w-full py-3 bg-gray-900 text-white rounded-xl font-bold uppercase tracking-wider text-xs"
                  >
                    Ajouter
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
