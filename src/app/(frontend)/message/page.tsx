'use client'
import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'

interface Commentaire {
  id?: string
  auteur: { id: string; prenom: string; nom: string }
  message: string
  createdAt: string
}

interface Discussion {
  id: string
  titre: string
  contenu: string
  categorie?: string
  tags?: string
  auteur: { id: string; prenom: string; nom: string }
  commentaires?: Commentaire[]
  createdAt: string
}

interface ChatMessage {
  user: string
  text: string
  time: string
  from?: string
  to?: string
  fileUrl?: string
  fileName?: string
}

interface OnlineUser {
  id: string
  name: string
  prenom: string
  nom: string
}

interface DirectoryUser {
  id: string
  prenom: string
  nom: string
}

export default function MessagesAndChatPage() {
  const [me, setMe] = useState<any>(null)
  
  // 🎯 FIX : Initialisation neutre pour éviter les conflits de rendu au rechargement
  const [activeTab, setActiveTab] = useState<'forum' | 'chat' | 'mp'>('forum')

  // Forum
  const [discussions, setDiscussions] = useState<Discussion[]>([])
  const [selectedDiscussion, setSelectedDiscussion] = useState<Discussion | null>(null)
  const [loading, setLoading] = useState(true)
  const [newForumMessage, setNewForumMessage] = useState('')
  const [newTopicTitre, setNewTopicTitre] = useState('')
  const [newTopicContenu, setNewTopicContenu] = useState('')
  const [newTopicCategorie, setNewTopicCategorie] = useState('entraide')
  const [newTopicTags, setNewTopicTags] = useState('')
  const [showNewTopicModal, setShowNewTopicModal] = useState(false)

  // Chat & MP
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [directMessages, setDirectMessages] = useState<ChatMessage[]>([])
  const [typedChatMessage, setTypedChatMessage] = useState('')
  const [typedPrivateMessage, setTypedPrivateMessage] = useState('')
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([])
  const [selectedUserForMP, setSelectedUserForMP] = useState<OnlineUser | DirectoryUser | null>(null)
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [allUsers, setAllUsers] = useState<DirectoryUser[]>([])

  // Multimedia
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [filePreview, setFilePreview] = useState<string | null>(null)
  const [isUploadingFile, setIsUploadingFile] = useState(false)

  const chatEndRef = useRef<HTMLDivElement>(null)
  const mpEndRef = useRef<HTMLDivElement>(null)
  const chatFileInputRef = useRef<HTMLInputElement>(null)

  const categoryBadges: Record<string, { label: string; cls: string }> = {
    entraide: { label: '💡 Entraide Cursus', cls: 'bg-amber-100 text-amber-800' },
    stages: { label: '💼 Stages & Alternances', cls: 'bg-emerald-100 text-emerald-800' },
    examens: { label: '📝 Prépa Examens / Oraux', cls: 'bg-rose-100 text-rose-800' },
    projets: { label: '🚀 Projets SLAM / SISR', cls: 'bg-blue-100 text-blue-800' },
    divers: { label: '☕ Café / Divers', cls: 'bg-purple-100 text-purple-800' },
  }

  // 1. Chargement initial de toutes les données du back-end
  const loadInitialData = async () => {
    try {
      const userRes = await fetch('/api/alumni/me')
      const userData = await userRes.json()
      if (userData?.user) setMe(userData.user)

      const borderRes = await fetch('/api/discussions?limit=50&sort=-createdAt')
      const discData = await borderRes.json()
      if (discData?.docs) {
        setDiscussions(discData.docs)
        if (discData.docs.length > 0) setSelectedDiscussion(discData.docs[0])
      }

      const allUsersRes = await fetch('/api/alumni?limit=100&sort=nom')
      const allUsersData = await allUsersRes.json()
      if (allUsersData?.docs && userData?.user) {
        const filteredContacts = allUsersData.docs.filter((u: any) => String(u.id) !== String(userData.user.id))
        setAllUsers(filteredContacts)
      }

      const publicChatRes = await fetch('/api/public-messages?limit=50&sort=createdAt')
      const publicChatData = await publicChatRes.json()
      if (publicChatData?.docs) {
        const history = publicChatData.docs.map((doc: any) => ({
          user: doc.user,
          text: doc.text || doc.message || '',
          time: doc.time,
          from: doc.from ? String(doc.from) : undefined
        }))
        setChatMessages(history)
      }
    } catch (err) {
      console.error(err)
    } finally {
      // 🎯 ÉTAPE 1 : Fin du chargement asynchrone initial
      setLoading(false)
    }
  }

  useEffect(() => { 
    loadInitialData() 
  }, [])

  // 🎯 ÉTAPE 2 : Récupération forcée de l'onglet mémorisé immédiatement APRÈS la fin de l'initialisation globale
  useEffect(() => {
    if (!loading && typeof window !== 'undefined') {
      const savedTab = localStorage.getItem('messages_active_tab')
      if (savedTab === 'forum' || savedTab === 'chat' || savedTab === 'mp') {
        setActiveTab(savedTab)
      }
    }
  }, [loading])

  // 🎯 ÉTAPE 3 : Sauvegarde instantanée en tâche de fond à chaque fois que l'utilisateur clique sur un onglet
  const handleTabChange = (tab: 'forum' | 'chat' | 'mp') => {
    setActiveTab(tab)
    if (typeof window !== 'undefined') {
      localStorage.setItem('messages_active_tab', tab)
    }
  }

  // Charger l'historique MP de la BDD
  const loadHistory = async (otherUser: OnlineUser | DirectoryUser) => {
    if (!me) return
    setLoadingHistory(true)
    try {
      const res = await fetch(`/api/mp?with=${otherUser.id}`)
      const data = await res.json()
      if (data?.docs) {
        const history: ChatMessage[] = data.docs.map((doc: any) => {
          const fromId = String(typeof doc.from === 'object' ? doc.from?.id : doc.from)
          const toId = String(typeof doc.to === 'object' ? doc.to?.id : doc.to)
          const fromUser = typeof doc.from === 'object' ? doc.from : null
          const userName = fromId === String(me.id) ? `${me.prenom} ${me.nom}` : fromUser ? `${fromUser.prenom} ${fromUser.nom}` : 'Inconnu'
          return {
            user: userName,
            text: doc.message || '',
            time: new Date(doc.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
            from: fromId,
            to: toId,
            fileUrl: doc.file?.url || null,
            fileName: doc.file?.filename || null,
          }
        })
        setDirectMessages(history)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingHistory(false)
    }
  }

  const handleSelectUserForMP = (user: OnlineUser | DirectoryUser) => {
    setSelectedUserForMP(user)
    setDirectMessages([])
    loadHistory(user)
  }

  // Établissement SSE Stream
  useEffect(() => {
    if (!me) return

    const eventSource = new EventSource(
      `/api/chat/stream?userId=${me.id}&name=${encodeURIComponent(me.prenom + ' ' + me.nom)}`
    )

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data)

      if (data.type === 'presence-full') {
        const filtrés: OnlineUser[] = (data.users as OnlineUser[]).filter((u) => String(u.id) !== String(me.id))
        setOnlineUsers(filtrés)
      } else if (data.type === 'presence') {
        const filtrés: OnlineUser[] = (data.users as any[])
          .filter((u: any) => (typeof u === 'object' ? u.name : u) !== `${me.prenom} ${me.nom}`)
          .map((u: any) => {
            if (typeof u === 'object' && u.id) return u as OnlineUser
            const parts = (u as string).split(' ')
            return { id: u, name: u, prenom: parts[0] || '', nom: parts[1] || '' }
          })
        setOnlineUsers(filtrés)
      } else if (data.type === 'msg-public') {
        setChatMessages((prev) => {
          const isDuplicate = prev.some((m) => m.user === data.user && m.text === data.text && m.time === data.time)
          if (isDuplicate) return prev
          return [...prev, data]
        })
      } else if (data.type === 'msg-prive') {
        if (String(data.to) === String(me.id) || String(data.from) === String(me.id)) {
          setDirectMessages((prev) => {
            const exists = prev.some((m) => m.from === data.from && m.to === data.to && m.text === data.text && m.time === data.time)
            if (exists) return prev
            return [...prev, {
              user: data.user,
              text: data.text,
              time: data.time,
              from: String(data.from),
              to: String(data.to),
              fileUrl: data.fileUrl,
              fileName: data.fileName,
            }]
          })
        }
      }
    }

    return () => eventSource.close()
  }, [me])

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [chatMessages])
  useEffect(() => { mpEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [directMessages, selectedUserForMP])

  const handleSendForumComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newForumMessage.trim() || !selectedDiscussion) return
    try {
      const res = await fetch('/api/forum', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ discussionId: selectedDiscussion.id, message: newForumMessage }),
      })
      if (res.ok) {
        setNewForumMessage('')
        const discRes = await fetch('/api/discussions?limit=50&sort=-createdAt')
        const discData = await discRes.json()
        if (discData?.docs) {
          setDiscussions(discData.docs)
          const updated = discData.docs.find((d: any) => d.id === selectedDiscussion.id)
          if (updated) setSelectedDiscussion(updated)
        }
      }
    } catch (err) { console.error(err) }
  }

  const handleCreateTopic = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTopicTitre.trim() || !newTopicContenu.trim() || !me) return
    try {
      const res = await fetch('/api/discussions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ titre: newTopicTitre, contenu: newTopicContenu, categorie: newTopicCategorie, tags: newTopicTags, auteur: me.id }),
      })
      if (res.ok) {
        setNewTopicTitre(''); setNewTopicContenu(''); setNewTopicCategorie('entraide'); setNewTopicTags('')
        setShowNewTopicModal(false); loadInitialData()
      }
    } catch (err) { console.error(err) }
  }

  const handleSendLiveChatMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!typedChatMessage.trim() || !me) return

    const messageTime = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    
    setChatMessages((prev) => [...prev, {
      user: `${me.prenom} ${me.nom}`,
      text: typedChatMessage,
      time: messageTime,
      from: String(me.id)
    }])

    try {
      await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          type: 'msg-public', 
          user: `${me.prenom} ${me.nom}`, 
          text: typedChatMessage, 
          time: messageTime,
          from: String(me.id)
        }),
      })
      setTypedChatMessage('')
    } catch (err) { 
      console.error(err) 
    }
  }

  const handleChatFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { alert('Fichier trop volumineux (max 5 Mo).'); return }
    setSelectedFile(file)
    setFilePreview(file.type.startsWith('image/') ? URL.createObjectURL(file) : null)
  }

  const handleSendPrivateMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!typedPrivateMessage.trim() && !selectedFile) return
    if (!selectedUserForMP || !me || isUploadingFile) return

    setIsUploadingFile(true)
    let uploadedFileId: string | undefined
    let uploadedFileUrl: string | undefined
    let uploadedFileName: string | undefined

    try {
      if (selectedFile) {
        const formData = new FormData()
        formData.append('file', selectedFile)
        formData.append('alt', `Fichier partagé par ${me.prenom}`)
        const uploadRes = await fetch('/api/media', { method: 'POST', body: formData })
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json()
          uploadedFileId = String(uploadData?.doc?.id)
          uploadedFileUrl = uploadData?.doc?.url
          uploadedFileName = selectedFile.name
        }
      }

      const res = await fetch('/api/mp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: selectedUserForMP.id,
          message: typedPrivateMessage || '',
          fileId: uploadedFileId,
          fileUrl: uploadedFileUrl,
          fileName: uploadedFileName,
        }),
      })

      if (res.ok) {
        const now = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
        setDirectMessages((prev) => [...prev, {
          user: `${me.prenom} ${me.nom}`,
          text: typedPrivateMessage || '',
          time: now,
          from: String(me.id),
          to: String(selectedUserForMP.id),
          fileUrl: uploadedFileUrl,
          fileName: uploadedFileName,
        }])
        setTypedPrivateMessage('')
        setSelectedFile(null)
        setFilePreview(null)
        if (chatFileInputRef.current) chatFileInputRef.current.value = ''
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsUploadingFile(false)
    }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-xs font-black text-gray-400 uppercase tracking-widest animate-pulse">Initialisation des canaux sécurisés...</div>
    </div>
  )

  return (
    <div className="bg-[#F8FAFC] min-h-screen font-sans text-left">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">

        {/* Tab Navigation 🎯 MODIFIÉ AVEC LE NOUVEL ÉCOUTEUR PERSISTANT */}
        <div className="flex bg-white p-1.5 border border-gray-200 rounded-2xl w-full max-w-md shadow-2xs font-black uppercase text-[10px] tracking-wider">
          <button onClick={() => handleTabChange('forum')} className={`flex-1 py-2.5 rounded-xl transition-all cursor-pointer ${activeTab === 'forum' ? 'bg-purple-600 text-white' : 'text-gray-500 hover:text-gray-800'}`}>🏛️ Forum</button>
          <button onClick={() => handleTabChange('chat')} className={`flex-1 py-2.5 rounded-xl transition-all cursor-pointer ${activeTab === 'chat' ? 'bg-gray-900 text-white' : 'text-gray-500 hover:text-gray-800'}`}>🟢 Chat en direct</button>
          <button onClick={() => handleTabChange('mp')} className={`flex-1 py-2.5 rounded-xl transition-all cursor-pointer ${activeTab === 'mp' ? 'bg-emerald-600 text-white' : 'text-gray-500 hover:text-gray-800'}`}>🔒 Messages Privés</button>
        </div>

        {/* ==================== FORUM ==================== */}
        {activeTab === 'forum' && (
          <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-xs grid grid-cols-1 md:grid-cols-12 gap-6 h-[550px] overflow-hidden">
            <div className="md:col-span-4 border-r border-gray-100 pr-2 flex flex-col justify-between h-full">
              <div className="space-y-2 overflow-y-auto flex-1">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Sujets récents</p>
                {discussions.map((disc) => (
                  <div key={disc.id} onClick={() => setSelectedDiscussion(disc)} className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${selectedDiscussion?.id === disc.id ? 'border-purple-200 bg-purple-50/40 shadow-3xs' : 'border-gray-100 hover:bg-gray-50'}`}>
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-xs font-black text-gray-800 line-clamp-1 leading-tight flex-1">{disc.titre}</h4>
                      {disc.categorie && categoryBadges[disc.categorie] && (
                        <span className={`text-[7px] font-black uppercase px-1 py-0.5 rounded-sm whitespace-nowrap ${categoryBadges[disc.categorie].cls}`}>{disc.categorie}</span>
                      )}
                    </div>
                    <p className="text-[9px] text-gray-400 font-bold uppercase mt-1">Par {disc.auteur?.prenom || 'Alumni'}</p>
                  </div>
                ))}
              </div>
              <button onClick={() => setShowNewTopicModal(true)} className="w-full bg-purple-600 hover:bg-purple-700 text-white font-black uppercase text-[10px] tracking-wider py-3 rounded-xl shadow-xs mt-4 cursor-pointer">＋ Créer un sujet personnalisé</button>
            </div>
            <div className="md:col-span-8 flex flex-col justify-between h-full overflow-hidden">
              {selectedDiscussion ? (
                <>
                  <div className="flex-1 overflow-y-auto pr-1 space-y-4 max-h-[85%]">
                    <div className="bg-gray-50 border border-gray-100 p-4 rounded-2xl space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[9px] font-black uppercase tracking-wider text-purple-600 bg-purple-50 px-2 py-0.5 rounded-md">Sujet principal</span>
                        {selectedDiscussion.categorie && categoryBadges[selectedDiscussion.categorie] && (
                          <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${categoryBadges[selectedDiscussion.categorie].cls}`}>{categoryBadges[selectedDiscussion.categorie].label}</span>
                        )}
                        {selectedDiscussion.tags && <span className="text-[9px] font-bold bg-gray-200 text-gray-600 px-2 py-0.5 rounded-md">🏷️ {selectedDiscussion.tags}</span>}
                      </div>
                      <h3 className="text-sm font-black text-gray-900 leading-snug">{selectedDiscussion.titre}</h3>
                      <p className="text-xs text-gray-600 font-medium leading-relaxed whitespace-pre-wrap">{selectedDiscussion.contenu}</p>
                    </div>
                    <div className="space-y-2">
                      {selectedDiscussion.commentaires?.map((comment, idx) => (
                        <div key={idx} className="bg-white border border-gray-100 p-3 rounded-xl text-xs font-medium text-gray-700 shadow-3xs">
                          <span className="text-[9px] font-black text-gray-400 block uppercase mb-1">{comment.auteur?.prenom} {comment.auteur?.nom}</span>
                          <p>{comment.message}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <form onSubmit={handleSendForumComment} className="pt-3 border-t border-gray-100 flex gap-2">
                    <input type="text" placeholder="Répondre publiquement..." value={newForumMessage} onChange={(e) => setNewForumMessage(e.target.value)} className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium outline-none focus:bg-white focus:border-purple-500 shadow-3xs" />
                    <button type="submit" className="bg-purple-600 text-white px-5 rounded-xl font-black text-[10px] uppercase cursor-pointer">Envoyer</button>
                  </form>
                </>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-400 text-xs italic">Sélectionnez une discussion</div>
              )}
            </div>
          </div>
        )}

        {/* ==================== CHAT EN DIRECT ==================== */}
        {activeTab === 'chat' && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 h-[550px]">
            <div className="md:col-span-8 bg-white border border-gray-200 rounded-3xl p-5 flex flex-col justify-between overflow-hidden h-full">
              <div className="flex-1 overflow-y-auto pr-1 space-y-3">
                {chatMessages.map((msg, index) => (
                  <div key={index} className={`flex flex-col ${msg.user === `${me?.prenom} ${me?.nom}` ? 'items-end' : 'items-start'}`}>
                    <div className="flex items-baseline gap-2 px-1">
                      <span className="text-[9px] font-black text-gray-400 uppercase tracking-wide">{msg.user}</span>
                      <span className="text-[7px] text-gray-300 font-bold">{msg.time}</span>
                    </div>
                    <div className={`p-3 max-w-[80%] rounded-2xl text-xs font-medium ${msg.user === `${me?.prenom} ${me?.nom}` ? 'bg-gray-900 text-white rounded-br-none' : 'bg-gray-100 text-gray-800 rounded-bl-none'} shadow-3xs`}>
                      {msg.text}
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
              <form onSubmit={handleSendLiveChatMessage} className="pt-3 border-t border-gray-100 flex gap-2">
                <input type="text" placeholder="Votre message instantané..." value={typedChatMessage} onChange={(e) => setTypedChatMessage(e.target.value)} className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium outline-none focus:bg-white shadow-3xs" />
                <button type="submit" className="bg-gray-900 text-white px-5 rounded-xl text-[10px] uppercase font-black cursor-pointer">Envoyer</button>
              </form>
            </div>
            <div className="md:col-span-4 bg-white border border-gray-200 rounded-3xl p-5 text-left space-y-3 h-full overflow-y-auto">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b pb-2">🟢 Connectés en ce moment</p>
              {onlineUsers.length > 0 ? onlineUsers.map((user, i) => (
                <div key={i} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-xl transition-all">
                  <div className="w-8 h-8 rounded-full bg-gray-900 text-white font-black text-[10px] flex items-center justify-center border-2 border-white shadow-3xs uppercase">{user.prenom[0]}{user.nom[0]}</div>
                  <span className="text-xs font-bold text-gray-700">{user.prenom} {user.nom}</span>
                </div>
              )) : <p className="text-xs text-gray-400 italic">Vous êtes le seul en ligne.</p>}
            </div>
          </div>
        )}

        {/* ==================== MESSAGES PRIVÉS ==================== */}
        {activeTab === 'mp' && (
          <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-xs grid grid-cols-1 md:grid-cols-12 gap-6 h-[550px] overflow-hidden">
            <div className="md:col-span-4 border-r border-gray-100 pr-2 overflow-y-auto space-y-2 h-full">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest pb-1">Boîte de réception :</p>
              {allUsers.length > 0 ? allUsers.map((user) => {
                const isOnline = onlineUsers.some((u) => String(u.id) === String(user.id))
                return (
                  <div key={user.id} onClick={() => handleSelectUserForMP(user)} className={`p-3 rounded-xl border text-left cursor-pointer transition-all flex items-center justify-between gap-3 ${selectedUserForMP?.id === user.id ? 'border-emerald-200 bg-emerald-50/30' : 'border-gray-50 hover:bg-gray-50'}`}>
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-7 h-7 rounded-full bg-emerald-700 text-white font-black text-[9px] flex items-center justify-center uppercase flex-shrink-0">{user.prenom[0]}{user.nom[0]}</div>
                      <span className="text-xs font-bold text-gray-800 truncate">{user.prenom} {user.nom}</span>
                    </div>
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${isOnline ? 'bg-emerald-500 shadow-xs' : 'bg-gray-300'}`} />
                  </div>
                )
              }) : <p className="text-xs text-gray-400 italic">Aucun contact trouvé.</p>}
            </div>

            <div className="md:col-span-8 flex flex-col justify-between h-full overflow-hidden">
              {selectedUserForMP ? (
                <>
                  <div className="border-b pb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${onlineUsers.some((u) => String(u.id) === String(selectedUserForMP.id)) ? 'bg-emerald-500 animate-pulse' : 'bg-gray-300'}`} />
                      <h3 className="text-xs font-black text-gray-800 uppercase tracking-wider">Conversation avec {selectedUserForMP.prenom} {selectedUserForMP.nom}</h3>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto py-4 space-y-3 pr-1">
                    {loadingHistory ? (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-[10px] text-gray-400 font-black uppercase tracking-widest animate-pulse">Chargement de la conversation...</div>
                      </div>
                    ) : directMessages.length === 0 ? (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-xs text-gray-400 italic">Aucun échange. Laissez un message !</p>
                      </div>
                    ) : (
                      directMessages.map((msg, index) => {
                        const isMe = String(msg.from) === String(me?.id)
                        return (
                          <div key={index} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                            <div className={`p-3 max-w-[80%] rounded-2xl text-xs font-medium shadow-3xs ${isMe ? 'bg-emerald-600 text-white rounded-br-none' : 'bg-gray-100 text-gray-800 rounded-bl-none'}`}>
                              {msg.text}
                              {msg.fileUrl && (
                                <div className="mt-2 pt-2 border-t border-white/20">
                                  {msg.fileUrl.match(/\.(jpeg|jpg|gif|png)$/i) ? (
                                    <a href={msg.fileUrl} target="_blank" rel="noreferrer">
                                      <img src={msg.fileUrl} className="max-w-xs max-h-40 rounded-lg object-cover border border-black/10 hover:opacity-90 transition-opacity" alt="Image partagée" />
                                    </a>
                                  ) : (
                                    <a href={msg.fileUrl} target="_blank" rel="noreferrer" className={`flex items-center gap-2 font-bold hover:underline ${isMe ? 'text-white' : 'text-emerald-700'}`}>
                                      <i className="fa-solid fa-file-arrow-down text-sm" />
                                      <span className="text-[11px] truncate max-w-[200px]">{msg.fileName || 'Télécharger'}</span>
                                    </a>
                                  )}
                                </div>
                              )}
                            </div>
                            <span className="text-[8px] text-gray-400 font-bold mt-0.5 px-1">{msg.time}</span>
                          </div>
                        )
                      })
                    )}
                    <div ref={mpEndRef} />
                  </div>

                  {selectedFile && (
                    <div className="p-3 bg-gray-50 border border-gray-200 border-b-0 rounded-t-xl flex items-center gap-3 text-left">
                      {filePreview ? (
                        <img src={filePreview} className="w-12 h-12 object-cover rounded-lg border border-gray-200" alt="Aperçu" />
                      ) : (
                        <div className="w-12 h-12 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center text-lg">
                          <i className="fa-solid fa-file-invoice" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-gray-700 truncate">{selectedFile.name}</p>
                        <p className="text-[10px] text-gray-400">{(selectedFile.size / 1024 / 1024).toFixed(2)} Mo</p>
                      </div>
                      <button type="button" onClick={() => { setSelectedFile(null); setFilePreview(null) }} className="text-gray-400 hover:text-red-500 cursor-pointer transition-colors">
                        <i className="fa-solid fa-circle-xmark text-base" />
                      </button>
                    </div>
                  )}

                  <form onSubmit={handleSendPrivateMessage} className="pt-3 border-t border-gray-100 flex items-center gap-2">
                    <input type="file" ref={chatFileInputRef} onChange={handleChatFileChange} accept=".pdf,.doc,.docx,.png,.jpg,.jpeg" className="hidden" />
                    <button type="button" onClick={() => chatFileInputRef.current?.click()} className="w-10 h-10 bg-white hover:bg-gray-50 text-gray-500 rounded-xl flex items-center justify-center border border-gray-200 transition-colors shadow-2xs cursor-pointer">
                      <i className="fa-solid fa-paperclip text-sm" />
                    </button>
                    <input type="text" placeholder={`Envoyer un message à ${selectedUserForMP.prenom}...`} value={typedPrivateMessage} onChange={(e) => setTypedPrivateMessage(e.target.value)} disabled={isUploadingFile} className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium outline-none focus:bg-white focus:border-emerald-500 shadow-3xs" />
                    <button type="submit" disabled={(!typedPrivateMessage.trim() && !selectedFile) || isUploadingFile} className="h-10 px-5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-xl font-black text-[10px] uppercase cursor-pointer tracking-wider flex items-center gap-2 transition-colors shadow-2xs">
                      {isUploadingFile ? (
                        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <><span>Envoyer</span><i className="fa-solid fa-paper-plane" /></>
                      )}
                    </button>
                  </form>
                </>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-400 text-xs italic">Sélectionnez un membre dans votre liste de contacts pour lire ou démarrer une conversation permanente.</div>
              )}
            </div>
          </div>
        )}

      </div>

      {/* MODAL FORUM */}
      {showNewTopicModal && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden border border-gray-100 text-left animate-in fade-in duration-150">
            <div className="bg-gray-50 p-5 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xs font-black text-gray-900 uppercase tracking-wider">Créer un sujet de discussion</h2>
              <button onClick={() => setShowNewTopicModal(false)} className="text-gray-400 hover:text-red-500 cursor-pointer">✕</button>
            </div>
            <form onSubmit={handleCreateTopic} className="p-6 space-y-4 text-xs font-bold text-gray-500 uppercase tracking-wide">
              <div>
                <label className="block mb-1 text-gray-400">Titre du sujet *</label>
                <input type="text" required value={newTopicTitre} onChange={(e) => setNewTopicTitre(e.target.value)} className="w-full p-3 bg-white border border-gray-200 rounded-xl outline-none font-medium text-gray-800 normal-case focus:border-purple-500 shadow-2xs" placeholder="Ex: REX Oral E4 - Spécialité SLAM" />
              </div>
              <div>
                <label className="block mb-1 text-gray-400">Catégorie Thématique *</label>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  {Object.entries(categoryBadges).map(([key, value]) => (
                    <label key={key} className={`p-2.5 border rounded-xl flex items-center gap-2 cursor-pointer transition-all normal-case font-bold text-gray-700 ${newTopicCategorie === key ? 'border-purple-500 bg-purple-50/50 shadow-3xs' : 'border-gray-200 bg-white hover:bg-white/50'}`}>
                      <input type="radio" name="category" value={key} checked={newTopicCategorie === key} onChange={() => setNewTopicCategorie(key)} className="accent-purple-600" />
                      <span>{value.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block mb-1 text-gray-400">Tags optionnels</label>
                <input type="text" value={newTopicTags} onChange={(e) => setNewTopicTags(e.target.value)} className="w-full p-3 bg-white border border-gray-200 rounded-xl outline-none font-medium text-gray-800 normal-case focus:border-purple-500 shadow-2xs" placeholder="Ex: #NextJS, #Java" />
              </div>
              <div>
                <label className="block mb-1 text-gray-400">Message principal *</label>
                <textarea required rows={4} value={newTopicContenu} onChange={(e) => setNewTopicContenu(e.target.value)} className="w-full p-3 bg-white border border-gray-200 rounded-xl outline-none font-medium text-gray-800 leading-relaxed normal-case focus:border-purple-500 shadow-2xs" placeholder="Décrivez votre fil de discussion..." />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowNewTopicModal(false)} className="flex-1 py-3 border border-gray-200 text-gray-500 rounded-xl font-black uppercase text-xs tracking-wider bg-white hover:bg-gray-50 cursor-pointer">Annuler</button>
                <button type="submit" className="flex-1 py-3 bg-purple-600 text-white rounded-xl font-black uppercase text-xs tracking-wider hover:bg-purple-700 transition-colors shadow-sm cursor-pointer">Lancer le sujet</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}