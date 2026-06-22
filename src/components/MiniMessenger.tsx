'use client'
import React, { useState, useEffect, useRef, useCallback } from 'react'
import { usePathname } from 'next/navigation'

interface OnlineUser { id: string; name: string; prenom: string; nom: string }
interface DirectoryUser {
  id: string
  prenom: string
  nom: string
  lastMessageText?: string
  lastMessageTime?: string
  _rawTimestamp?: number
  lastSeen?: string | null
}
interface ChatMessage {
  id?: string
  user: string
  text: string
  time: string
  from?: string
  to?: string
  createdAt?: string
}

const seenKey = (myId: string, otherId: string) => `mp_seen_${myId}_${otherId}`
const getLastViewed = (myId: string, otherId: string) => {
  try { return Number(localStorage.getItem(seenKey(myId, otherId)) || 0) } catch { return 0 }
}
const markViewed = (myId: string, otherId: string) => {
  try { localStorage.setItem(seenKey(myId, otherId), String(Date.now())) } catch {}
}

export default function MiniMessenger() {
  const pathname = usePathname()
  const [me, setMe] = useState<any>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [miniTab, setMiniTab] = useState<'public' | 'private'>('public')
  const [connState, setConnState] = useState<'connecting' | 'connected' | 'reconnecting'>('connecting')

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [directMessages, setDirectMessages] = useState<ChatMessage[]>([])
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([])
  const [allUsers, setAllUsers] = useState<DirectoryUser[]>([])
  const [searchQ, setSearchQ] = useState('')
  const [activeChatUser, setActiveChatUser] = useState<OnlineUser | DirectoryUser | null>(null)

  const [typedPublic, setTypedPublic] = useState('')
  const [typedPrivate, setTypedPrivate] = useState('')
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [unreadTick, setUnreadTick] = useState(0)

  const publicEndRef = useRef<HTMLDivElement>(null)
  const privateEndRef = useRef<HTMLDivElement>(null)

  const meRef = useRef<any>(null)
  const activeChatUserRef = useRef<OnlineUser | DirectoryUser | null>(null)
  const eventSourceRef = useRef<EventSource | null>(null)
  const reconnectTimerRef = useRef<any>(null)
  const stoppedRef = useRef(false)

  useEffect(() => { meRef.current = me }, [me])
  useEffect(() => { activeChatUserRef.current = activeChatUser }, [activeChatUser])

  const loadInitialData = useCallback(async () => {
    try {
      const [userRes, publicChatRes, allUsersRes, mpRes] = await Promise.all([
        fetch('/api/alumni/me', { credentials: 'include' }),
        fetch('/api/public-messages?limit=30&sort=createdAt', { credentials: 'include' }),
        fetch('/api/alumni?limit=100&sort=nom', { credentials: 'include' }),
        fetch('/api/mp?all=1', { credentials: 'include' }),
      ])
      const [userData, publicChatData, allUsersData, mpData] = await Promise.all([
        userRes.json(), publicChatRes.json(), allUsersRes.json(), mpRes.json(),
      ])

      const currentMe = userData?.user || null
      if (currentMe) { setMe(currentMe); meRef.current = currentMe }

      if (publicChatData?.docs) {
        setChatMessages(publicChatData.docs.map((doc: any) => ({
          id: String(doc.id), user: doc.user, text: doc.text || doc.message || '', time: doc.time,
          from: doc.from ? String(typeof doc.from === 'object' ? doc.from.id : doc.from) : undefined,
          createdAt: doc.createdAt,
        })))
      }

      if (allUsersData?.docs && currentMe) {
        const contacts: DirectoryUser[] = allUsersData.docs
          .filter((u: any) => String(u.id) !== String(currentMe.id))
          .map((u: any) => ({ id: String(u.id), prenom: u.prenom, nom: u.nom, lastSeen: u.lastSeen || null }))

        if (mpData?.docs) {
          mpData.docs.forEach((m: any) => {
            const fId = String(typeof m.from === 'object' ? m.from?.id : m.from)
            const tId = String(typeof m.to === 'object' ? m.to?.id : m.to)
            const otherId = fId === String(currentMe.id) ? tId : fId
            const contact = contacts.find((c) => c.id === otherId)
            if (contact && !contact.lastMessageTime) {
              contact.lastMessageText = m.message || '📁 Fichier partagé'
              contact.lastMessageTime = new Date(m.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
              contact._rawTimestamp = new Date(m.createdAt).getTime()
            }
          })
        }
        contacts.sort((a, b) => (b._rawTimestamp || 0) - (a._rawTimestamp || 0))
        setAllUsers(contacts)
      }
    } catch (err) {
      console.error('Erreur initialisation MiniMessenger:', err)
    }
  }, [])

  useEffect(() => { loadInitialData() }, [loadInitialData])

  // ── Connexion SSE fiable (DB-backed), uniquement quand le widget est ouvert ──
  // ⚠️ Important pour le coût Vercel : avant, cette connexion s'ouvrait dès que
  // l'utilisateur était connecté, sur N'IMPORTE QUELLE page, et restait active en
  // permanence (boucle de polling toutes les ~2-3s, tant que l'onglet est ouvert).
  // Comme ce composant est monté globalement, ça revenait à faire tourner un flux
  // temps réel en continu pour chaque visiteur connecté, sur chaque page — même
  // sans jamais ouvrir la messagerie. Désormais la connexion ne s'établit que
  // lorsque le widget est ouvert, et se referme dès qu'il est réduit.
  useEffect(() => {
    if (!me?.id || !isOpen) {
      if (eventSourceRef.current) { eventSourceRef.current.close(); eventSourceRef.current = null }
      return
    }
    stoppedRef.current = false

    const connect = () => {
      if (eventSourceRef.current) eventSourceRef.current.close()
      setConnState('connecting')
      const es = new EventSource('/api/chat/stream')
      eventSourceRef.current = es

      es.onmessage = (event) => {
        const data = JSON.parse(event.data)
        const currentMe = meRef.current
        const currentActiveChatUser = activeChatUserRef.current

        if (data.type === 'connected') {
          setConnState('connected')
        } else if (data.type === 'reconnect') {
          es.close()
          if (!stoppedRef.current) connect()
        } else if (data.type === 'presence-full') {
          setOnlineUsers((data.users as OnlineUser[]).filter((u) => String(u.id) !== String(currentMe?.id)))
        } else if (data.type === 'msg-public') {
          if (String(data.from) === String(currentMe?.id)) return
          setChatMessages((prev) => (prev.some((m) => m.id === data.id) ? prev : [...prev, data]))
        } else if (data.type === 'msg-prive') {
          if (!currentMe) return
          const myId = String(currentMe.id)
          const fromId = String(data.from)
          const toId = String(data.to)
          if (toId !== myId && fromId !== myId) return
          const otherId = fromId === myId ? toId : fromId

          setAllUsers((prev) => {
            const exists = prev.some((u) => u.id === otherId)
            const next = exists
              ? prev.map((u) => u.id === otherId ? { ...u, lastMessageText: data.text, lastMessageTime: new Date(data.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }), _rawTimestamp: Date.now() } : u)
              : [{ id: otherId, prenom: data.fromPrenom || '?', nom: data.fromNom || '', lastMessageText: data.text, lastMessageTime: new Date(data.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }), _rawTimestamp: Date.now() }, ...prev]
            const idx = next.findIndex((u) => u.id === otherId)
            if (idx > 0) { const [c] = next.splice(idx, 1); return [c, ...next] }
            return next
          })
          setUnreadTick((t) => t + 1)

          if (fromId === myId) return
          const activeUser = currentActiveChatUser
          if (activeUser && String(activeUser.id) === otherId) {
            setDirectMessages((prev) => (prev.some((m) => m.id === data.id) ? prev : [...prev, data]))
            markViewed(myId, otherId)
          }
        }
      }

      es.onerror = () => {
        setConnState('reconnecting')
        es.close()
        if (!stoppedRef.current) reconnectTimerRef.current = setTimeout(connect, 2000)
      }
    }

    connect()
    return () => {
      stoppedRef.current = true
      eventSourceRef.current?.close()
      eventSourceRef.current = null
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current)
    }
  }, [me?.id, isOpen])

  // ── Quand le widget est fermé : pas de flux temps réel, mais on rafraîchit
  // quand même le badge de non-lus à intervalle peu fréquent (une seule requête
  // légère, sans rapport avec le coût d'un flux SSE permanent) ───────────────
  useEffect(() => {
    if (!me?.id || isOpen) return
    const refresh = async () => {
      try {
        const res = await fetch('/api/mp?all=1', { credentials: 'include' })
        const data = await res.json()
        if (!data?.docs) return
        setAllUsers((prev) => {
          const map = new Map(prev.map((u) => [u.id, u]))
          data.docs.forEach((m: any) => {
            const fId = String(typeof m.from === 'object' ? m.from?.id : m.from)
            const tId = String(typeof m.to === 'object' ? m.to?.id : m.to)
            const otherId = fId === String(me.id) ? tId : fId
            const ts = new Date(m.createdAt).getTime()
            const existing = map.get(otherId)
            if (existing && (!existing._rawTimestamp || ts > existing._rawTimestamp)) {
              map.set(otherId, { ...existing, lastMessageText: m.message || '📁 Fichier partagé', lastMessageTime: new Date(m.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }), _rawTimestamp: ts })
            }
          })
          return Array.from(map.values())
        })
      } catch {}
    }
    const interval = setInterval(refresh, 60_000)
    return () => clearInterval(interval)
  }, [me?.id, isOpen])

  useEffect(() => {
    if (isOpen && miniTab === 'public') publicEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages, isOpen, miniTab])

  useEffect(() => {
    if (isOpen && activeChatUser) privateEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [directMessages, activeChatUser, isOpen])

  const loadPrivateHistory = useCallback(async (otherUser: OnlineUser | DirectoryUser) => {
    if (!meRef.current) return
    setLoadingHistory(true)
    try {
      const res = await fetch(`/api/mp?with=${otherUser.id}`, { credentials: 'include' })
      const data = await res.json()
      if (data?.docs) {
        const me = meRef.current
        setDirectMessages(data.docs.map((doc: any) => {
          const fromId = String(typeof doc.from === 'object' ? doc.from?.id : doc.from)
          return {
            id: String(doc.id),
            user: fromId === String(me.id) ? `${me.prenom} ${me.nom}` : `${otherUser.prenom} ${otherUser.nom}`,
            text: doc.message || '', time: new Date(doc.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
            from: fromId, to: String(typeof doc.to === 'object' ? doc.to?.id : doc.to), createdAt: doc.createdAt,
          }
        }))
      }
    } catch (err) { console.error(err) }
    finally { setLoadingHistory(false) }
  }, [])

  const handleSelectUser = useCallback((user: OnlineUser | DirectoryUser) => {
    setActiveChatUser(user)
    activeChatUserRef.current = user
    setDirectMessages([])
    loadPrivateHistory(user)
    if (meRef.current) markViewed(String(meRef.current.id), String(user.id))
    setUnreadTick((t) => t + 1)
  }, [loadPrivateHistory])

  const handleSendPublic = async (e: React.FormEvent) => {
    e.preventDefault()
    const me = meRef.current
    if (!typedPublic.trim() || !me) return
    const time = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    const text = typedPublic.trim()
    setChatMessages((prev) => [...prev, { user: `${me.prenom} ${me.nom}`, text, time, from: String(me.id) }])
    setTypedPublic('')
    try {
      await fetch('/api/chat/stream', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'msg-public', text }),
      })
    } catch (err) { console.error(err) }
  }

  const handleSendPrivate = async (e: React.FormEvent) => {
    e.preventDefault()
    const me = meRef.current
    const activeUser = activeChatUserRef.current
    if (!typedPrivate.trim() || !activeUser || !me) return
    const now = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    const text = typedPrivate
    setDirectMessages((prev) => [...prev, { user: `${me.prenom} ${me.nom}`, text, time: now, from: String(me.id), to: String(activeUser.id), createdAt: new Date().toISOString() }])
    setTypedPrivate('')
    try {
      await fetch('/api/mp', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ to: activeUser.id, message: text }),
      })
    } catch (err) { console.error(err) }
  }

  if (!me || pathname?.startsWith('/messages')) return null

  const filteredUsers = allUsers.filter((u) => `${u.prenom} ${u.nom}`.toLowerCase().includes(searchQ.toLowerCase()))
  const unreadCount = allUsers.filter((u) => u._rawTimestamp && u._rawTimestamp > getLastViewed(me.id, u.id)).length
  // unreadTick force un recalcul de unreadCount après chaque event SSE / sélection — sans l'utiliser directement
  void unreadTick

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans flex flex-col items-end gap-3 select-none text-left">
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        .mm-anim { animation: fadeUp 0.2s ease both; }
      `}</style>

      {isOpen && (
        <div className="mm-anim w-80 h-112 bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.14)] border border-gray-150 flex flex-col overflow-hidden">

          {/* Header */}
          <div className="bg-white px-4 py-3 flex justify-between items-center border-b border-gray-100">
            <div className="flex items-center gap-2">
              {activeChatUser ? (
                <div className="flex items-center gap-2 text-[13px] font-bold text-gray-800">
                  <button onClick={() => { setActiveChatUser(null); activeChatUserRef.current = null }}
                    className="hover:text-[#800020] text-sm font-bold cursor-pointer transition-colors pr-1">
                    <i className="fa-solid fa-chevron-left text-xs" />
                  </button>
                  <div className="w-7 h-7 rounded-full bg-[#800020]/5 text-[#800020] font-semibold text-[11px] flex items-center justify-center border border-[#800020]/10 uppercase">
                    {activeChatUser.prenom[0]}{activeChatUser.nom[0]}
                  </div>
                  <span className="truncate max-w-[120px]">{activeChatUser.prenom} {activeChatUser.nom}</span>
                  {onlineUsers.some((u) => u.id === String(activeChatUser.id)) && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  )}
                </div>
              ) : (
                <div className="flex bg-gray-100/80 p-0.5 rounded-lg font-medium text-[11px]">
                  <button onClick={() => setMiniTab('public')}
                    className={`px-3 py-1 rounded-md transition-all cursor-pointer ${miniTab === 'public' ? 'bg-white text-[#800020] shadow-xs font-semibold' : 'text-gray-500 hover:text-gray-900'}`}>
                    Canal public
                  </button>
                  <button onClick={() => setMiniTab('private')}
                    className={`px-3 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${miniTab === 'private' ? 'bg-white text-[#800020] shadow-xs font-semibold' : 'text-gray-500 hover:text-gray-900'}`}>
                    Privés
                    {unreadCount > 0 && <span className="w-1.5 h-1.5 rounded-full bg-[#800020]" />}
                  </button>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span title={connState === 'connected' ? 'Connecté en direct' : 'Reconnexion...'}
                className={`w-1.5 h-1.5 rounded-full ${connState === 'connected' ? 'bg-emerald-500' : 'bg-amber-400 animate-pulse'}`} />
              <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer transition-colors p-1">
                <i className="fa-solid fa-minus text-xs" />
              </button>
            </div>
          </div>

          {/* Corps */}
          <div className="flex-1 overflow-y-auto bg-white p-4 flex flex-col justify-between h-full">

            {/* CANAL PUBLIC */}
            {miniTab === 'public' && !activeChatUser && (
              <div className="flex flex-col h-full justify-between space-y-3">
                <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 max-h-[315px] scrollbar-none">
                  {chatMessages.map((msg, idx) => {
                    const isMe = String(msg.from) === String(me.id)
                    return (
                      <div key={msg.id || idx} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                        {!isMe && <span className="text-[9px] font-medium text-gray-400 mb-0.5 pl-1">{msg.user}</span>}
                        <div className={`px-3 py-2 max-w-[85%] text-[13px] leading-normal rounded-2xl ${isMe ? 'bg-[#800020] text-white rounded-br-xs' : 'bg-gray-100 text-gray-800 rounded-bl-xs'}`}>
                          {msg.text}
                        </div>
                      </div>
                    )
                  })}
                  <div ref={publicEndRef} />
                </div>
                <form onSubmit={handleSendPublic} className="pt-2 border-t border-gray-100 flex gap-2 items-center">
                  <input type="text" placeholder="Votre message..." value={typedPublic} onChange={(e) => setTypedPublic(e.target.value)}
                    className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-[13px] outline-none focus:border-[#800020]/40 focus:bg-white transition-all placeholder-gray-400" />
                  <button type="submit" className="text-[#800020] hover:text-[#600018] p-2 transition-colors cursor-pointer text-sm">
                    <i className="fa-solid fa-paper-plane" />
                  </button>
                </form>
              </div>
            )}

            {/* LISTE DES CONTACTS */}
            {miniTab === 'private' && !activeChatUser && (
              <div className="flex flex-col h-full">
                <input type="text" placeholder="Rechercher un membre..." value={searchQ} onChange={(e) => setSearchQ(e.target.value)}
                  className="mb-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-[12px] outline-none focus:border-[#800020]/40 focus:bg-white transition-all placeholder-gray-400" />
                <div className="space-y-1 overflow-y-auto flex-1 pr-1 max-h-[340px]">
                  {filteredUsers.map((user) => {
                    const isOnline = onlineUsers.some((u) => String(u.id) === String(user.id))
                    const isUnread = !!user._rawTimestamp && user._rawTimestamp > getLastViewed(me.id, user.id)
                    return (
                      <div key={user.id} onClick={() => handleSelectUser(user)}
                        className="p-2 rounded-xl flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-all group">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="relative flex-shrink-0">
                            <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-600 font-semibold text-[11px] flex items-center justify-center uppercase border border-gray-200/60">
                              {user.prenom[0]}{user.nom[0]}
                            </div>
                            {isOnline && <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 border-2 border-white" />}
                          </div>
                          <div className="min-w-0">
                            <span className={`text-[13px] truncate block group-hover:text-gray-900 ${isUnread ? 'font-black text-gray-900' : 'font-medium text-gray-700'}`}>
                              {user.prenom} {user.nom}
                            </span>
                            {user.lastMessageText && (
                              <span className="text-[10px] text-gray-400 truncate block max-w-[140px]">{user.lastMessageText}</span>
                            )}
                          </div>
                        </div>
                        {isUnread ? <span className="w-2 h-2 rounded-full bg-[#800020] flex-shrink-0" /> :
                          <i className="fa-solid fa-chevron-right text-[10px] text-gray-300 opacity-0 group-hover:opacity-100 transition-all pr-1" />}
                      </div>
                    )
                  })}
                  {filteredUsers.length === 0 && <p className="text-[11px] text-gray-400 italic text-center pt-6">Aucun membre trouvé</p>}
                </div>
              </div>
            )}

            {/* CONVERSATION PRIVÉE */}
            {activeChatUser && (
              <div className="flex flex-col h-full justify-between space-y-3">
                <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 max-h-[315px] scrollbar-none">
                  {loadingHistory ? (
                    <div className="flex items-center justify-center h-full pt-12 text-[11px] font-medium text-gray-400 animate-pulse">Chargement...</div>
                  ) : directMessages.length === 0 ? (
                    <div className="text-center pt-12 text-[12px] text-gray-400 italic">Aucun échange pour le moment.</div>
                  ) : (
                    directMessages.map((msg, i) => {
                      const isMe = String(msg.from) === String(me.id)
                      return (
                        <div key={msg.id || i} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                          <div className={`px-3 py-2 max-w-[85%] text-[13px] leading-normal rounded-2xl ${isMe ? 'bg-[#800020] text-white rounded-br-xs' : 'bg-gray-100 text-gray-800 rounded-bl-xs'}`}>
                            {msg.text}
                          </div>
                        </div>
                      )
                    })
                  )}
                  <div ref={privateEndRef} />
                </div>
                <form onSubmit={handleSendPrivate} className="pt-2 border-t border-gray-100 flex gap-2 items-center">
                  <input type="text" placeholder={`Message à ${activeChatUser.prenom}...`} value={typedPrivate} onChange={(e) => setTypedPrivate(e.target.value)}
                    className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-[13px] outline-none focus:border-[#800020]/40 focus:bg-white transition-all placeholder-gray-400" />
                  <button type="submit" className="text-[#800020] hover:text-[#600018] p-2 transition-colors cursor-pointer text-sm">
                    <i className="fa-solid fa-paper-plane" />
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      {/* BOUTON FLOTTANT */}
      {!isOpen && (
        <button onClick={() => setIsOpen(true)}
          className="w-12 h-12 bg-white text-[#800020] border border-gray-200/80 rounded-full flex items-center justify-center shadow-[0_4px_20px_rgba(0,0,0,0.08)] hover:shadow-[0_4px_24px_rgba(128,0,32,0.18)] transition-all duration-300 hover:scale-105 cursor-pointer relative group">
          <i className="fa-regular fa-comment-dots text-lg group-hover:scale-105 transition-transform" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-[#800020] rounded-full border-2 border-white shadow-xs flex items-center justify-center text-[9px] font-black text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      )}
    </div>
  )
}
