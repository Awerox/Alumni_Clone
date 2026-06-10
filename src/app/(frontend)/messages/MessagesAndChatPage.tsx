'use client'
import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'

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
  lastMessageText?: string
  lastMessageTime?: string
  _rawTimestamp?: number
  isPending?: boolean
}

export function MessagesAndChatPage() {
  const searchParams = useSearchParams()
  const [me, setMe] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<'forum' | 'chat' | 'mp'>('forum')

  const [discussions, setDiscussions] = useState<Discussion[]>([])
  const [selectedDiscussion, setSelectedDiscussion] = useState<Discussion | null>(null)
  const [loading, setLoading] = useState(true)
  const [newForumMessage, setNewForumMessage] = useState('')
  const [newTopicTitre, setNewTopicTitre] = useState('')
  const [newTopicContenu, setNewTopicContenu] = useState('')
  const [newTopicCategorie, setNewTopicCategorie] = useState('entraide')
  const [newTopicTags, setNewTopicTags] = useState('')
  const [showNewTopicModal, setShowNewTopicModal] = useState(false)

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [directMessages, setDirectMessages] = useState<ChatMessage[]>([])
  const [typedChatMessage, setTypedChatMessage] = useState('')
  const [typedPrivateMessage, setTypedPrivateMessage] = useState('')
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([])
  const [selectedUserForMP, setSelectedUserForMP] = useState<OnlineUser | DirectoryUser | null>(null)
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [allUsers, setAllUsers] = useState<DirectoryUser[]>([])

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [filePreview, setFilePreview] = useState<string | null>(null)
  const [isUploadingFile, setIsUploadingFile] = useState(false)

  const chatEndRef = useRef<HTMLDivElement>(null)
  const mpEndRef = useRef<HTMLDivElement>(null)
  const chatFileInputRef = useRef<HTMLInputElement>(null)

  // ✅ Refs stables pour le SSE — évitent de recréer la connexion
  const meRef = useRef<any>(null)
  const selectedUserForMPRef = useRef<OnlineUser | DirectoryUser | null>(null)
  const eventSourceRef = useRef<EventSource | null>(null)

  useEffect(() => { meRef.current = me }, [me])
  useEffect(() => { selectedUserForMPRef.current = selectedUserForMP }, [selectedUserForMP])

  const categoryBadges: Record<string, { label: string; cls: string }> = {
    entraide: { label: '💡 Entraide Cursus', cls: 'bg-amber-100 text-amber-800' },
    stages: { label: '💼 Stages & Alternances', cls: 'bg-emerald-100 text-emerald-800' },
    examens: { label: '📝 Prépa Examens / Oraux', cls: 'bg-rose-100 text-rose-800' },
    projets: { label: '🚀 Projets SLAM / SISR', cls: 'bg-blue-100 text-blue-800' },
    divers: { label: '☕ Café / Divers', cls: 'bg-purple-100 text-purple-800' },
  }

  // ── Chargement initial — tout en parallèle ────────────────────────────
  const loadInitialData = useCallback(async () => {
    try {
      // ✅ Promise.all : tous les fetches en parallèle
      const [userRes, discRes, allUsersRes, publicChatRes] = await Promise.all([
        fetch('/api/alumni/me', { credentials: 'include' }),
        fetch('/api/discussions?limit=50&sort=-createdAt'),
        fetch('/api/alumni?limit=100&sort=nom', { credentials: 'include' }),
        fetch('/api/public-messages?limit=50&sort=createdAt', { credentials: 'include' }),
      ])

      const [userData, discData, allUsersData, publicChatData] = await Promise.all([
        userRes.json(),
        discRes.json(),
        allUsersRes.json(),
        publicChatRes.json(),
      ])

      const currentMe = userData?.user || null
      if (currentMe) {
        setMe(currentMe)
        meRef.current = currentMe
      }

      if (discData?.docs) {
        setDiscussions(discData.docs)
        if (discData.docs.length > 0) setSelectedDiscussion(discData.docs[0])
      }

      if (publicChatData?.docs) {
        setChatMessages(publicChatData.docs.map((doc: any) => ({
          user: doc.user,
          text: doc.text || doc.message || '',
          time: doc.time,
          from: doc.from ? String(doc.from) : undefined,
        })))
      }

      if (allUsersData?.docs && currentMe) {
        const filteredContacts: DirectoryUser[] = allUsersData.docs.filter(
          (u: any) => String(u.id) !== String(currentMe.id)
        )

        // ✅ Charger toutes les conversations en une requête
        const mpRes = await fetch('/api/mp?all=1', { credentials: 'include' })
        const mpData = await mpRes.json()

        let activeConversations: DirectoryUser[] = []

        if (mpData?.docs) {
          filteredContacts.forEach((contact) => {
            const exchange = mpData.docs.filter((m: any) => {
              const fId = String(typeof m.from === 'object' ? m.from?.id : m.from)
              const tId = String(typeof m.to === 'object' ? m.to?.id : m.to)
              return (
                (fId === String(currentMe.id) && tId === String(contact.id)) ||
                (fId === String(contact.id) && tId === String(currentMe.id))
              )
            })
            if (exchange.length > 0) {
              const lastMsg = exchange[0]
              activeConversations.push({
                ...contact,
                lastMessageText: lastMsg.message || '📁 Fichier partagé',
                lastMessageTime: new Date(lastMsg.createdAt).toLocaleTimeString('fr-FR', {
                  hour: '2-digit', minute: '2-digit',
                }),
                _rawTimestamp: new Date(lastMsg.createdAt).getTime(),
              })
            }
          })
          activeConversations.sort((a, b) => (b._rawTimestamp || 0) - (a._rawTimestamp || 0))
        }

        // Gestion de l'URL ?userId=XXX
        const urlUserId = searchParams.get('userId')
        const urlPrenom = searchParams.get('prenom') || ''
        const urlNom = searchParams.get('nom') || ''

        if (urlUserId) {
          setActiveTab('mp')
          const alreadyInList = activeConversations.find((u) => String(u.id) === urlUserId)
          if (!alreadyInList) {
            const pendingUser: DirectoryUser = { id: urlUserId, prenom: urlPrenom, nom: urlNom, isPending: true }
            activeConversations = [pendingUser, ...activeConversations]
            setSelectedUserForMP(pendingUser)
            selectedUserForMPRef.current = pendingUser
            setDirectMessages([])
          } else {
            setSelectedUserForMP(alreadyInList)
            selectedUserForMPRef.current = alreadyInList
            loadHistoryDirect(urlUserId, currentMe, alreadyInList)
          }
        } else if (activeConversations.length > 0) {
          setSelectedUserForMP(activeConversations[0])
          selectedUserForMPRef.current = activeConversations[0]
          loadHistoryDirect(activeConversations[0].id, currentMe, activeConversations[0])
        }

        setAllUsers(activeConversations)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [searchParams])

  const loadHistoryDirect = async (uId: string, currentMe: any, contact: any) => {
    try {
      const resH = await fetch(`/api/mp?with=${uId}`, { credentials: 'include' })
      const dataH = await resH.json()
      if (dataH?.docs) {
        setDirectMessages(
          dataH.docs.map((doc: any) => {
            const fromId = String(typeof doc.from === 'object' ? doc.from?.id : doc.from)
            return {
              user: fromId === String(currentMe.id)
                ? `${currentMe.prenom} ${currentMe.nom}`
                : `${contact.prenom} ${contact.nom}`,
              text: doc.message || '',
              time: new Date(doc.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
              from: fromId,
              to: String(typeof doc.to === 'object' ? doc.to?.id : doc.to),
              fileUrl: (doc.file as any)?.url || null,
              fileName: (doc.file as any)?.filename || null,
            }
          }).reverse()
        )
      }
    } catch (e) { console.error(e) }
  }

  useEffect(() => { loadInitialData() }, [loadInitialData])

  useEffect(() => {
    if (!loading && typeof window !== 'undefined') {
      const urlUserId = searchParams.get('userId')
      if (urlUserId) return
      const savedTab = localStorage.getItem('messages_active_tab')
      if (savedTab === 'forum' || savedTab === 'chat' || savedTab === 'mp') {
        setActiveTab(savedTab as any)
      }
    }
  }, [loading, searchParams])

  const handleTabChange = (tab: 'forum' | 'chat' | 'mp') => {
    setActiveTab(tab)
    if (typeof window !== 'undefined') localStorage.setItem('messages_active_tab', tab)
  }

  const loadHistory = useCallback(async (otherUser: OnlineUser | DirectoryUser) => {
    if (!meRef.current) return
    setLoadingHistory(true)
    try {
      const res = await fetch(`/api/mp?with=${otherUser.id}`, { credentials: 'include' })
      const data = await res.json()
      if (data?.docs) {
        const me = meRef.current
        setDirectMessages(data.docs.map((doc: any) => {
          const fromId = String(typeof doc.from === 'object' ? doc.from?.id : doc.from)
          const fromUser = typeof doc.from === 'object' ? doc.from : null
          return {
            user: fromId === String(me.id)
              ? `${me.prenom} ${me.nom}`
              : fromUser ? `${fromUser.prenom} ${fromUser.nom}` : 'Inconnu',
            text: doc.message || '',
            time: new Date(doc.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
            from: fromId,
            to: String(typeof doc.to === 'object' ? doc.to?.id : doc.to),
            fileUrl: (doc.file as any)?.url || null,
            fileName: (doc.file as any)?.filename || null,
          }
        }).reverse())
      }
    } catch (err) { console.error(err) } finally { setLoadingHistory(false) }
  }, [])

  const handleSelectUserForMP = useCallback((user: OnlineUser | DirectoryUser) => {
    setSelectedUserForMP(user)
    selectedUserForMPRef.current = user
    setDirectMessages([])
    const asDirUser = user as DirectoryUser
    if (!asDirUser.isPending) loadHistory(user)
  }, [loadHistory])

  // ── SSE stable — dépendance seulement sur me.id ───────────────────────
  useEffect(() => {
    if (!me?.id) return

    if (eventSourceRef.current) eventSourceRef.current.close()

    const es = new EventSource(
      `/api/chat/stream?userId=${me.id}&name=${encodeURIComponent(me.prenom + ' ' + me.nom)}`
    )
    eventSourceRef.current = es

    es.onmessage = (event) => {
      const data = JSON.parse(event.data)
      const currentMe = meRef.current
      const currentSelectedUser = selectedUserForMPRef.current

      if (data.type === 'presence-full') {
        setOnlineUsers((data.users as OnlineUser[]).filter((u) => String(u.id) !== String(currentMe?.id)))

      } else if (data.type === 'msg-public') {
        // ✅ Ignorer ses propres messages (déjà en optimistic)
        if (String(data.from) === String(currentMe?.id)) return
        setChatMessages((prev) => {
          const isDuplicate = prev.some(
            (m) => m.from === data.from && m.text === data.text && m.time === data.time
          )
          return isDuplicate ? prev : [...prev, data]
        })

      } else if (data.type === 'msg-prive') {
        if (!currentMe) return
        const myId = String(currentMe.id)
        const fromId = String(data.from)
        const toId = String(data.to)
        if (toId !== myId && fromId !== myId) return

        const otherId = fromId === myId ? toId : fromId

        // Mettre à jour la liste des conversations
        setAllUsers((prev) => {
          const exists = prev.some((u) => String(u.id) === otherId)
          if (!exists) {
            return [{
              id: otherId,
              prenom: data.fromPrenom || '?',
              nom: data.fromNom || '',
              lastMessageText: data.text,
              lastMessageTime: data.time,
              _rawTimestamp: Date.now(),
            }, ...prev]
          }
          const updated = prev.map((u) =>
            String(u.id) === otherId
              ? { ...u, lastMessageText: data.text, lastMessageTime: data.time, isPending: false, _rawTimestamp: Date.now() }
              : u
          )
          const idx = updated.findIndex((u) => String(u.id) === otherId)
          if (idx > 0) {
            const [contact] = updated.splice(idx, 1)
            return [contact, ...updated]
          }
          return updated
        })

        // ✅ Ajouter dans la conversation active seulement si on est le destinataire
        // (l'expéditeur a déjà son message via optimistic update)
        if (fromId === myId) return

        if (currentSelectedUser && String(currentSelectedUser.id) === otherId) {
          setDirectMessages((prev) => {
            const exists = prev.some(
              (m) => m.from === fromId && m.text === data.text && m.time === data.time
            )
            if (exists) return prev
            return [...prev, {
              user: data.user,
              text: data.text,
              time: data.time,
              from: fromId,
              to: toId,
              fileUrl: data.fileUrl,
              fileName: data.fileName,
            }]
          })
        }
      }
    }

    return () => { es.close(); eventSourceRef.current = null }
  }, [me?.id]) // ✅ Seulement me.id

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
        body: JSON.stringify({
          titre: newTopicTitre, contenu: newTopicContenu,
          categorie: newTopicCategorie, tags: newTopicTags, auteur: me.id,
        }),
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

    // ✅ Optimistic update immédiat
    setChatMessages((prev) => [...prev, {
      user: `${me.prenom} ${me.nom}`,
      text: typedChatMessage,
      time: messageTime,
      from: String(me.id),
    }])
    const textToSend = typedChatMessage
    setTypedChatMessage('')

    try {
      await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'msg-public',
          user: `${me.prenom} ${me.nom}`,
          text: textToSend,
          time: messageTime,
          from: String(me.id),
        }),
      })
    } catch (err) { console.error(err) }
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

      const now = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
      const textToSend = typedPrivateMessage

      // ✅ Optimistic update avant le fetch
      setDirectMessages((prev) => [...prev, {
        user: `${me.prenom} ${me.nom}`,
        text: textToSend || '',
        time: now,
        from: String(me.id),
        to: String(selectedUserForMP.id),
        fileUrl: uploadedFileUrl,
        fileName: uploadedFileName,
      }])

      setAllUsers((prev) => {
        const filtered = prev.filter((u) => String(u.id) !== String(selectedUserForMP.id))
        const current = prev.find((u) => String(u.id) === String(selectedUserForMP.id))
        return [{
          ...(current || { id: selectedUserForMP.id, prenom: selectedUserForMP.prenom, nom: selectedUserForMP.nom }),
          lastMessageText: textToSend || '📁 Fichier partagé',
          lastMessageTime: now,
          isPending: false,
          _rawTimestamp: Date.now(),
        }, ...filtered]
      })

      setTypedPrivateMessage('')
      setSelectedFile(null)
      setFilePreview(null)
      if (chatFileInputRef.current) chatFileInputRef.current.value = ''

      await fetch('/api/mp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: selectedUserForMP.id,
          message: textToSend || '',
          fileId: uploadedFileId,
          fileUrl: uploadedFileUrl,
          fileName: uploadedFileName,
        }),
      })
    } catch (err) { console.error(err) } finally { setIsUploadingFile(false) }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-xs font-black text-gray-400 uppercase tracking-widest animate-pulse">Initialisation des canaux sécurisés...</div>
    </div>
  )

  return (
    <div className="bg-[#F8FAFC] min-h-screen font-sans text-left">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">

        {/* Tab Navigation */}
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
                  <div key={disc.id} onClick={() => setSelectedDiscussion(disc)}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${selectedDiscussion?.id === disc.id ? 'border-purple-200 bg-purple-50/40 shadow-3xs' : 'border-gray-100 hover:bg-gray-50'}`}>
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
                {chatMessages.map((msg, index) => {
                  const isMe = String(msg.from) === String(me?.id)
                  return (
                    <div key={index} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                      <div className="flex items-baseline gap-2 px-1">
                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-wide">{msg.user}</span>
                        <span className="text-[7px] text-gray-300 font-bold">{msg.time}</span>
                      </div>
                      <div className={`p-3 max-w-[80%] rounded-2xl text-xs font-medium ${isMe ? 'bg-gray-900 text-white rounded-br-none' : 'bg-gray-100 text-gray-800 rounded-bl-none'} shadow-3xs`}>
                        {msg.text}
                      </div>
                    </div>
                  )
                })}
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
            <div className="md:col-span-4 border-r border-gray-100 pr-2 overflow-y-auto space-y-1.5 h-full scrollbar-none">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest pb-2">Discussions en cours :</p>
              {allUsers.length > 0 ? allUsers.map((user) => {
                const isOnline = onlineUsers.some((u) => String(u.id) === String(user.id))
                const isSelected = selectedUserForMP?.id === user.id
                return (
                  <div key={user.id} onClick={() => handleSelectUserForMP(user)}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all flex items-center gap-3 ${isSelected ? 'border-emerald-200 bg-emerald-50/30' : 'border-gray-50 hover:bg-gray-50'}`}>
                    <div className="relative flex-shrink-0">
                      <div className="w-9 h-9 rounded-full bg-emerald-700 text-white font-black text-[9px] flex items-center justify-center uppercase">{user.prenom[0]}{user.nom[0]}</div>
                      <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 border-2 border-white rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-1">
                        <span className="text-xs font-black text-gray-800 truncate">{user.prenom} {user.nom}</span>
                        {user.lastMessageTime && !user.isPending && <span className="text-[8px] font-bold text-gray-400 whitespace-nowrap flex-shrink-0">{user.lastMessageTime}</span>}
                      </div>
                      {user.isPending ? (
                        <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md inline-block mt-0.5">Nouvelle conversation</span>
                      ) : user.lastMessageText ? (
                        <p className="text-[11px] text-gray-400 truncate font-medium mt-0.5">{user.lastMessageText}</p>
                      ) : null}
                    </div>
                  </div>
                )
              }) : <p className="text-xs text-gray-400 italic pt-4 pl-1">Aucune discussion ouverte.</p>}
            </div>

            <div className="md:col-span-8 flex flex-col justify-between h-full overflow-hidden">
              {selectedUserForMP ? (
                <>
                  <div className="border-b pb-3 flex flex-col text-left">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${onlineUsers.some((u) => String(u.id) === String(selectedUserForMP.id)) ? 'bg-emerald-500 animate-pulse' : 'bg-gray-300'}`} />
                      <h3 className="text-xs font-black text-gray-800 uppercase tracking-wider">Conversation avec {selectedUserForMP.prenom} {selectedUserForMP.nom}</h3>
                    </div>
                    {(selectedUserForMP as any).lastMessageText && !(selectedUserForMP as any).isPending && (
                      <p className="text-[11px] text-gray-400 mt-1 truncate max-w-[500px]">
                        <span className="font-bold text-gray-500">Dernier échange :</span> "{(selectedUserForMP as any).lastMessageText}"
                      </p>
                    )}
                  </div>

                  <div className="flex-1 overflow-y-auto py-4 space-y-3 pr-1">
                    {loadingHistory ? (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-[10px] text-gray-400 font-black uppercase tracking-widest animate-pulse">Chargement de la conversation...</div>
                      </div>
                    ) : directMessages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full gap-2 text-center">
                        <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-2xl">💬</div>
                        <p className="text-xs font-bold text-gray-500">Envoyez un premier message à {selectedUserForMP.prenom} !</p>
                      </div>
                    ) : directMessages.map((msg, index) => {
                      const isMe = String(msg.from) === String(me?.id)
                      return (
                        <div key={index} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                          <div className={`p-3 max-w-[80%] rounded-2xl text-xs font-medium shadow-3xs ${isMe ? 'bg-emerald-600 text-white rounded-br-none' : 'bg-gray-100 text-gray-800 rounded-bl-none'}`}>
                            {msg.text}
                            {msg.fileUrl && (
                              <div className="mt-2 pt-2 border-t border-white/20">
                                {msg.fileUrl.match(/\.(jpeg|jpg|gif|png)$/i) ? (
                                  <a href={msg.fileUrl} target="_blank" rel="noreferrer">
                                    <img src={msg.fileUrl} className="max-w-xs max-h-40 rounded-lg object-cover border border-black/10" alt="" />
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
                    })}
                    <div ref={mpEndRef} />
                  </div>

                  {selectedFile && (
                    <div className="p-3 bg-gray-50 border border-gray-200 border-b-0 rounded-t-xl flex items-center gap-3 text-left">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-gray-700 truncate">{selectedFile.name}</p>
                      </div>
                      <button type="button" onClick={() => { setSelectedFile(null); setFilePreview(null) }} className="text-gray-400 hover:text-red-500">
                        <i className="fa-solid fa-circle-xmark text-base" />
                      </button>
                    </div>
                  )}

                  <form onSubmit={handleSendPrivateMessage} className="pt-3 border-t border-gray-100 flex items-center gap-2">
                    <input type="file" ref={chatFileInputRef} onChange={handleChatFileChange} accept=".pdf,.doc,.docx,.png,.jpg,.jpeg" className="hidden" />
                    <button type="button" onClick={() => chatFileInputRef.current?.click()} className="w-10 h-10 bg-white border border-gray-200 rounded-xl flex items-center justify-center shadow-2xs">
                      <i className="fa-solid fa-paperclip text-sm" />
                    </button>
                    <input type="text" placeholder={`Message à ${selectedUserForMP.prenom}...`} value={typedPrivateMessage} onChange={(e) => setTypedPrivateMessage(e.target.value)} disabled={isUploadingFile} className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium outline-none focus:bg-white focus:border-emerald-500 shadow-3xs" />
                    <button type="submit" disabled={(!typedPrivateMessage.trim() && !selectedFile) || isUploadingFile} className="h-10 px-5 bg-emerald-600 text-white rounded-xl font-black text-[10px] uppercase tracking-wider flex items-center gap-2 shadow-2xs">
                      {isUploadingFile
                        ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        : <><span>Envoyer</span><i className="fa-solid fa-paper-plane" /></>
                      }
                    </button>
                  </form>
                </>
              ) : (
                <div className="h-full flex flex-col items-center justify-center gap-3 text-center">
                  <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center text-3xl">🔒</div>
                  <p className="text-xs font-bold text-gray-500">Aucune discussion ouverte</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* MODAL CREATION SUJET */}
      {showNewTopicModal && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden text-left animate-in fade-in duration-150">
            <div className="bg-gray-50 p-5 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xs font-black text-gray-900 uppercase tracking-wider">Créer un sujet de discussion</h2>
              <button onClick={() => setShowNewTopicModal(false)} className="text-gray-400 hover:text-red-500">✕</button>
            </div>
            <form onSubmit={handleCreateTopic} className="p-6 space-y-4 text-xs font-bold text-gray-500 uppercase tracking-wide">
              <div>
                <label className="block mb-1 text-gray-400">Titre du sujet *</label>
                <input type="text" required value={newTopicTitre} onChange={(e) => setNewTopicTitre(e.target.value)} className="w-full p-3 bg-white border border-gray-200 rounded-xl outline-none font-medium text-gray-800 normal-case focus:border-purple-500 shadow-2xs" />
              </div>
              <div>
                <label className="block mb-1 text-gray-400">Catégorie *</label>
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
                <label className="block mb-1 text-gray-400">Message principal *</label>
                <textarea required rows={4} value={newTopicContenu} onChange={(e) => setNewTopicContenu(e.target.value)} className="w-full p-3 bg-white border border-gray-200 rounded-xl outline-none font-medium text-gray-800 normal-case focus:border-purple-500 shadow-2xs" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowNewTopicModal(false)} className="flex-1 py-3 border border-gray-200 text-gray-500 rounded-xl font-black uppercase text-xs tracking-wider bg-white">Annuler</button>
                <button type="submit" className="flex-1 py-3 bg-purple-600 text-white rounded-xl font-black uppercase text-xs tracking-wider hover:bg-purple-700 shadow-sm">Lancer le sujet</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
