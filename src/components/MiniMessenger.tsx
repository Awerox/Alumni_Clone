'use client'
import React, { useState, useEffect, useRef, useCallback } from 'react'

interface OnlineUser { id: string; name: string; prenom: string; nom: string }
interface DirectoryUser { id: string; prenom: string; nom: string }
interface ChatMessage { user: string; text: string; time: string; from?: string; to?: string }

export default function MiniMessenger() {
  const [me, setMe] = useState<any>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [miniTab, setMiniTab] = useState<'public' | 'private'>('public')

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [directMessages, setDirectMessages] = useState<ChatMessage[]>([])
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([])
  const [allUsers, setAllUsers] = useState<DirectoryUser[]>([])
  const [activeChatUser, setActiveChatUser] = useState<OnlineUser | DirectoryUser | null>(null)

  const [typedPublic, setTypedPublic] = useState('')
  const [typedPrivate, setTypedPrivate] = useState('')
  const [loadingHistory, setLoadingHistory] = useState(false)

  const publicEndRef = useRef<HTMLDivElement>(null)
  const privateEndRef = useRef<HTMLDivElement>(null)

  // ✅ Refs pour éviter que le SSE se recrée à chaque render
  const meRef = useRef<any>(null)
  const activeChatUserRef = useRef<OnlineUser | DirectoryUser | null>(null)
  const eventSourceRef = useRef<EventSource | null>(null)

  // Synchroniser les refs
  useEffect(() => { meRef.current = me }, [me])
  useEffect(() => { activeChatUserRef.current = activeChatUser }, [activeChatUser])

  // ── Chargement initial parallélisé ────────────────────────────────────
  const loadInitialData = useCallback(async () => {
    try {
      // ✅ Promise.all : fetches parallèles au lieu de séquentiels
      const [userRes, publicChatRes, allUsersRes] = await Promise.all([
        fetch('/api/alumni/me', { credentials: 'include' }),
        fetch('/api/public-messages?limit=30&sort=createdAt', { credentials: 'include' }),
        fetch('/api/alumni?limit=100&sort=nom', { credentials: 'include' }),
      ])

      const [userData, publicChatData, allUsersData] = await Promise.all([
        userRes.json(),
        publicChatRes.json(),
        allUsersRes.json(),
      ])

      const currentMe = userData?.user || null
      if (currentMe) {
        setMe(currentMe)
        meRef.current = currentMe
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
        setAllUsers(allUsersData.docs.filter((u: any) => String(u.id) !== String(currentMe.id)))
      }
    } catch (err) {
      console.error('Erreur initialisation MiniMessenger:', err)
    }
  }, [])

  useEffect(() => { loadInitialData() }, [loadInitialData])

  // ── SSE : connexion stable, ne se recrée que quand me.id change ───────
  useEffect(() => {
    if (!me?.id) return

    // Fermer la connexion précédente si elle existe
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
    }

    const es = new EventSource(
      `/api/chat/stream?userId=${me.id}&name=${encodeURIComponent(me.prenom + ' ' + me.nom)}`
    )
    eventSourceRef.current = es

    es.onmessage = (event) => {
      const data = JSON.parse(event.data)
      const currentMe = meRef.current
      const currentActiveChatUser = activeChatUserRef.current

      if (data.type === 'presence-full') {
        setOnlineUsers((data.users as OnlineUser[]).filter((u) => String(u.id) !== String(currentMe?.id)))

      } else if (data.type === 'msg-public') {
        // ✅ Anti-doublon : ignorer les messages de soi-même (déjà ajoutés en optimistic)
        if (String(data.from) === String(currentMe?.id)) return
        setChatMessages((prev) => {
          const isDuplicate = prev.some(
            (m) => m.from === data.from && m.text === data.text && m.time === data.time
          )
          if (isDuplicate) return prev
          return [...prev, data]
        })

      } else if (data.type === 'msg-prive') {
        if (!currentMe) return
        const myId = String(currentMe.id)
        if (String(data.to) !== myId && String(data.from) !== myId) return

        // ✅ Utiliser la ref pour éviter la dépendance dans useEffect
        const activeUser = currentActiveChatUser
        if (
          activeUser &&
          (String(data.from) === String(activeUser.id) || String(data.to) === String(activeUser.id))
        ) {
          // ✅ Anti-doublon MP : ignorer si on est l'expéditeur (déjà ajouté en optimistic)
          if (String(data.from) === myId) return
          setDirectMessages((prev) => {
            const exists = prev.some(
              (m) => m.from === data.from && m.text === data.text && m.time === data.time
            )
            if (exists) return prev
            return [...prev, {
              user: data.user,
              text: data.text,
              time: data.time,
              from: String(data.from),
              to: String(data.to),
            }]
          })
        }
      }
    }

    es.onerror = () => {
      // Reconnexion automatique gérée par le navigateur
    }

    return () => {
      es.close()
      eventSourceRef.current = null
    }
  }, [me?.id]) // ✅ Seulement me.id — pas activeChatUser

  // ── Scroll automatique ────────────────────────────────────────────────
  useEffect(() => {
    if (isOpen && miniTab === 'public') {
      publicEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [chatMessages, isOpen, miniTab])

  useEffect(() => {
    if (isOpen && activeChatUser) {
      privateEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [directMessages, activeChatUser, isOpen])

  // ── Charger historique MP ─────────────────────────────────────────────
  const loadPrivateHistory = useCallback(async (otherUser: OnlineUser | DirectoryUser) => {
    if (!meRef.current) return
    setLoadingHistory(true)
    try {
      const res = await fetch(`/api/mp?with=${otherUser.id}`, { credentials: 'include' })
      const data = await res.json()
      if (data?.docs) {
        const me = meRef.current
        const history = data.docs.map((doc: any) => {
          const fromId = String(typeof doc.from === 'object' ? doc.from?.id : doc.from)
          const userName = fromId === String(me.id)
            ? `${me.prenom} ${me.nom}`
            : `${otherUser.prenom} ${otherUser.nom}`
          return {
            user: userName,
            text: doc.message || '',
            time: new Date(doc.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
            from: fromId,
            to: String(typeof doc.to === 'object' ? doc.to?.id : doc.to),
          }
        })
        setDirectMessages(history)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingHistory(false)
    }
  }, [])

  const handleSelectUser = useCallback((user: OnlineUser | DirectoryUser) => {
    setActiveChatUser(user)
    activeChatUserRef.current = user
    setDirectMessages([])
    loadPrivateHistory(user)
  }, [loadPrivateHistory])

  // ── Envoi message public ──────────────────────────────────────────────
  const handleSendPublic = async (e: React.FormEvent) => {
    e.preventDefault()
    const me = meRef.current
    if (!typedPublic.trim() || !me) return

    const time = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    const msgData = {
      type: 'msg-public',
      user: `${me.prenom} ${me.nom}`,
      text: typedPublic,
      time,
      from: String(me.id),
    }

    // ✅ Optimistic update immédiat
    setChatMessages((prev) => [...prev, { user: msgData.user, text: msgData.text, time: msgData.time, from: msgData.from }])
    setTypedPublic('')

    try {
      await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(msgData),
      })
    } catch (err) { console.error(err) }
  }

  // ── Envoi message privé ───────────────────────────────────────────────
  const handleSendPrivate = async (e: React.FormEvent) => {
    e.preventDefault()
    const me = meRef.current
    const activeUser = activeChatUserRef.current
    if (!typedPrivate.trim() || !activeUser || !me) return

    const now = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    const textToSend = typedPrivate

    // ✅ Optimistic update immédiat
    setDirectMessages((prev) => [...prev, {
      user: `${me.prenom} ${me.nom}`,
      text: textToSend,
      time: now,
      from: String(me.id),
      to: String(activeUser.id),
    }])
    setTypedPrivate('')

    try {
      await fetch('/api/mp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ to: activeUser.id, message: textToSend }),
      })
    } catch (err) { console.error(err) }
  }

  if (!me) return null

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans flex flex-col items-end gap-3 select-none text-left">

      {/* ==================== FENÊTRE PRINCIPALE ==================== */}
      {isOpen && (
        <div className="w-80 h-112 bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-150 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">

          {/* Header */}
          <div className="bg-white px-4 py-3 flex justify-between items-center border-b border-gray-100">
            <div className="flex items-center gap-2">
              {activeChatUser ? (
                <div className="flex items-center gap-2 text-[13px] font-bold text-gray-800">
                  <button
                    onClick={() => { setActiveChatUser(null); activeChatUserRef.current = null }}
                    className="hover:text-enc text-sm font-bold cursor-pointer transition-colors pr-1"
                  >
                    <i className="fa-solid fa-chevron-left text-xs" />
                  </button>
                  <div className="w-7 h-7 rounded-full bg-enc/5 text-enc font-semibold text-[11px] flex items-center justify-center border border-enc/10 uppercase">
                    {activeChatUser.prenom[0]}{activeChatUser.nom[0]}
                  </div>
                  <span className="truncate max-w-[140px]">{activeChatUser.prenom} {activeChatUser.nom}</span>
                </div>
              ) : (
                <div className="flex bg-gray-100/80 p-0.5 rounded-lg font-medium text-[11px]">
                  <button
                    onClick={() => setMiniTab('public')}
                    className={`px-3 py-1 rounded-md transition-all cursor-pointer ${miniTab === 'public' ? 'bg-white text-gray-900 shadow-xs font-semibold' : 'text-gray-500 hover:text-gray-900'}`}
                  >
                    Canal public
                  </button>
                  <button
                    onClick={() => setMiniTab('private')}
                    className={`px-3 py-1 rounded-md transition-all cursor-pointer ${miniTab === 'private' ? 'bg-white text-gray-900 shadow-xs font-semibold' : 'text-gray-500 hover:text-gray-900'}`}
                  >
                    Messages privés
                  </button>
                </div>
              )}
            </div>
            <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer transition-colors p-1">
              <i className="fa-solid fa-minus text-xs" />
            </button>
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
                      <div key={idx} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                        {!isMe && <span className="text-[9px] font-medium text-gray-400 mb-0.5 pl-1">{msg.user}</span>}
                        <div className={`px-3 py-2 max-w-[85%] text-[13px] leading-normal rounded-2xl ${isMe ? 'bg-enc text-white rounded-br-xs' : 'bg-gray-100 text-gray-800 rounded-bl-xs'}`}>
                          {msg.text}
                        </div>
                      </div>
                    )
                  })}
                  <div ref={publicEndRef} />
                </div>
                <form onSubmit={handleSendPublic} className="pt-2 border-t border-gray-100 flex gap-2 items-center">
                  <input
                    type="text"
                    placeholder="Votre message..."
                    value={typedPublic}
                    onChange={(e) => setTypedPublic(e.target.value)}
                    className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-[13px] outline-none focus:border-enc/40 focus:bg-white transition-all placeholder-gray-400"
                  />
                  <button type="submit" className="text-enc hover:text-[#66001a] p-2 transition-colors cursor-pointer text-sm">
                    <i className="fa-solid fa-paper-plane" />
                  </button>
                </form>
              </div>
            )}

            {/* LISTE DES CONTACTS */}
            {miniTab === 'private' && !activeChatUser && (
              <div className="space-y-1 overflow-y-auto h-full pr-1 max-h-[370px]">
                {allUsers.map((user) => {
                  const isOnline = onlineUsers.some((u) => String(u.id) === String(user.id))
                  return (
                    <div
                      key={user.id}
                      onClick={() => handleSelectUser(user)}
                      className="p-2 rounded-xl flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-all group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="relative flex-shrink-0">
                          <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-600 font-semibold text-[11px] flex items-center justify-center uppercase border border-gray-200/60">
                            {user.prenom[0]}{user.nom[0]}
                          </div>
                          {isOnline && <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 border-2 border-white" />}
                        </div>
                        <span className="text-[13px] font-medium text-gray-700 truncate group-hover:text-gray-900">
                          {user.prenom} {user.nom}
                        </span>
                      </div>
                      <i className="fa-solid fa-chevron-right text-[10px] text-gray-300 opacity-0 group-hover:opacity-100 transition-all pr-1" />
                    </div>
                  )
                })}
              </div>
            )}

            {/* CONVERSATION PRIVÉE */}
            {activeChatUser && (
              <div className="flex flex-col h-full justify-between space-y-3">
                <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 max-h-[315px] scrollbar-none">
                  {loadingHistory ? (
                    <div className="flex items-center justify-center h-full pt-12 text-[11px] font-medium text-gray-400 animate-pulse">
                      Chargement...
                    </div>
                  ) : directMessages.length === 0 ? (
                    <div className="text-center pt-12 text-[12px] text-gray-400 italic">
                      Aucun échange pour le moment.
                    </div>
                  ) : (
                    directMessages.map((msg, i) => {
                      const isMe = String(msg.from) === String(me.id)
                      return (
                        <div key={i} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                          <div className={`px-3 py-2 max-w-[85%] text-[13px] leading-normal rounded-2xl ${isMe ? 'bg-enc text-white rounded-br-xs' : 'bg-gray-100 text-gray-800 rounded-bl-xs'}`}>
                            {msg.text}
                          </div>
                        </div>
                      )
                    })
                  )}
                  <div ref={privateEndRef} />
                </div>
                <form onSubmit={handleSendPrivate} className="pt-2 border-t border-gray-100 flex gap-2 items-center">
                  <input
                    type="text"
                    placeholder={`Message à ${activeChatUser.prenom}...`}
                    value={typedPrivate}
                    onChange={(e) => setTypedPrivate(e.target.value)}
                    className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-[13px] outline-none focus:border-enc/40 focus:bg-white transition-all placeholder-gray-400"
                  />
                  <button type="submit" className="text-enc hover:text-[#66001a] p-2 transition-colors cursor-pointer text-sm">
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
        <button
          onClick={() => setIsOpen(true)}
          className="w-12 h-12 bg-white text-enc border border-gray-200/80 rounded-full flex items-center justify-center shadow-[0_4px_20px_rgba(0,0,0,0.08)] hover:shadow-[0_4px_24px_rgba(128,0,32,0.15)] transition-all duration-300 hover:scale-105 cursor-pointer relative group"
        >
          <i className="fa-regular fa-comment-dots text-lg group-hover:scale-105 transition-transform" />
          {onlineUsers.length > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white shadow-xs animate-pulse" />
          )}
        </button>
      )}
    </div>
  )
}
