'use client'
import React, { useState, useEffect, useRef } from 'react'

interface OnlineUser { id: string; name: string; prenom: string; nom: string }
interface DirectoryUser { id: string; prenom: string; nom: string }
interface ChatMessage { user: string; text: string; time: string; from?: string; to?: string }

export default function MiniMessenger() {
  const [me, setMe] = useState<any>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [miniTab, setMiniTab] = useState<'public' | 'private'>('public')
  
  // États des messages et utilisateurs
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]) 
  const [directMessages, setDirectMessages] = useState<ChatMessage[]>([]) 
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([])
  const [allUsers, setAllUsers] = useState<DirectoryUser[]>([])
  const [activeChatUser, setActiveChatUser] = useState<OnlineUser | DirectoryUser | null>(null)
  
  // Zones de texte
  const [typedPublic, setTypedPublic] = useState('')
  const [typedPrivate, setTypedPrivate] = useState('')
  const [loadingHistory, setLoadingHistory] = useState(false)

  const publicEndRef = useRef<HTMLDivElement>(null)
  const privateEndRef = useRef<HTMLDivElement>(null)

  const loadInitialData = async () => {
    try {
      // 🎯 FIX 401 : Ajout de credentials: 'include' sur les appels d'initialisation
      const userRes = await fetch('/api/alumni/me', { credentials: 'include' })
      const userData = await userRes.json()
      if (userData?.user) setMe(userData.user)

      const allUsersRes = await fetch('/api/alumni?limit=100&sort=nom', { credentials: 'include' })
      const allUsersData = await allUsersRes.json()
      if (allUsersData?.docs && userData?.user) {
        const filteredContacts = allUsersData.docs.filter((u: any) => String(u.id) !== String(userData.user.id))
        setAllUsers(filteredContacts)
      }

      const publicChatRes = await fetch('/api/public-messages?limit=30&sort=createdAt', { credentials: 'include' })
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
      console.error('Erreur initialisation MiniMessenger:', err)
    }
  }

  useEffect(() => {
    loadInitialData()
  }, [])

  const loadPrivateHistory = async (otherUser: OnlineUser | DirectoryUser) => {
    if (!me) return
    setLoadingHistory(true)
    try {
      // 🎯 FIX 401 : Transmission des cookies d'authentification pour éviter le rejet du serveur
      const res = await fetch(`/api/mp?with=${otherUser.id}`, { credentials: 'include' })
      const data = await res.json()
      if (data?.docs) {
        const history = data.docs.map((doc: any) => {
          const fromId = String(typeof doc.from === 'object' ? doc.from?.id : doc.from)
          const userName = fromId === String(me.id) ? `${me.prenom} ${me.nom}` : `${otherUser.prenom} ${otherUser.nom}`
          return {
            user: userName,
            text: doc.message || '',
            time: new Date(doc.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
            from: fromId,
            to: String(typeof doc.to === 'object' ? doc.to?.id : doc.to)
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

  const handleSelectUser = (user: OnlineUser | DirectoryUser) => {
    setActiveChatUser(user)
    setDirectMessages([])
    loadPrivateHistory(user)
  }

  useEffect(() => {
    if (!me) return

    const eventSource = new EventSource(
      `/api/chat/stream?userId=${me.id}&name=${encodeURIComponent(me.prenom + ' ' + me.nom)}`
    )

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data)

      if (data.type === 'presence-full') {
        setOnlineUsers((data.users as OnlineUser[]).filter((u) => String(u.id) !== String(me.id)))
      } else if (data.type === 'msg-public') {
        setChatMessages((prev) => {
          const isDuplicate = prev.some((m) => m.user === data.user && m.text === data.text && m.time === data.time)
          if (isDuplicate) return prev
          return [...prev, data]
        })
      } else if (data.type === 'msg-prive') {
        if (String(data.to) === String(me.id) || String(data.from) === String(me.id)) {
          if (activeChatUser && (String(data.from) === String(activeChatUser.id) || String(data.to) === String(activeChatUser.id))) {
            setDirectMessages((prev) => {
              const exists = prev.some((m) => m.from === data.from && m.to === data.to && m.text === data.text && m.time === data.time)
              if (exists) return prev
              return [...prev, {
                user: data.user,
                text: data.text,
                time: data.time,
                from: String(data.from),
                to: String(data.to)
              }]
            })
          }
        }
      }
    }

    return () => eventSource.close()
  }, [me, activeChatUser])

  useEffect(() => { publicEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [chatMessages, isOpen, miniTab])
  useEffect(() => { privateEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [directMessages, activeChatUser])

  const handleSendPublic = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!typedPublic.trim() || !me) return

    const time = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    const msgData = { type: 'msg-public', user: `${me.prenom} ${me.nom}`, text: typedPublic, time, from: String(me.id) }

    setChatMessages((prev) => [...prev, msgData])
    setTypedPublic('')

    try {
      await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(msgData),
      })
    } catch (err) { console.error(err) }
  }

  const handleSendPrivate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!typedPrivate.trim() || !activeChatUser || !me) return

    const now = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    setDirectMessages((prev) => [...prev, {
      user: `${me.prenom} ${me.nom}`,
      text: typedPrivate,
      time: now,
      from: String(me.id),
      to: String(activeChatUser.id)
    }])

    const textToSend = typedPrivate
    setTypedPrivate('')

    try {
      // 🎯 FIX 401 : Ajout des credentials sur le POST de message privé
      await fetch('/api/mp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ to: activeChatUser.id, message: textToSend }),
      })
    } catch (err) { console.error(err) }
  }

  if (!me) return null

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans flex flex-col items-end gap-3 select-none text-left">
      
      {/* ==================== FENÊTRE PRINCIPALE ==================== */}
      {isOpen && (
        <div className="w-80 h-112 bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-150 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          
          {/* Header épuré moderne */}
          <div className="bg-white px-4 py-3 flex justify-between items-center border-b border-gray-100">
            <div className="flex items-center gap-2">
              {activeChatUser ? (
                <div className="flex items-center gap-2 text-[13px] font-bold text-gray-800">
                  <button onClick={() => setActiveChatUser(null)} className="hover:text-enc text-sm font-bold cursor-pointer transition-colors pr-1">
                    <i className="fa-solid fa-chevron-left text-xs" />
                  </button>
                  <div className="w-7 h-7 rounded-full bg-enc/5 text-enc font-semibold text-[11px] flex items-center justify-center border border-enc/10 uppercase">
                    {activeChatUser.prenom[0]}{activeChatUser.nom[0]}
                  </div>
                  <span className="truncate max-w-[140px]">{activeChatUser.prenom} {activeChatUser.nom}</span>
                </div>
              ) : (
                <div className="flex bg-gray-100/80 p-0.5 rounded-lg font-medium text-[11px]">
                  <button onClick={() => setMiniTab('public')} className={`px-3 py-1 rounded-md transition-all cursor-pointer ${miniTab === 'public' ? 'bg-white text-gray-900 shadow-xs font-semibold' : 'text-gray-500 hover:text-gray-900'}`}>Canal public</button>
                  <button onClick={() => setMiniTab('private')} className={`px-3 py-1 rounded-md transition-all cursor-pointer ${miniTab === 'private' ? 'bg-white text-gray-900 shadow-xs font-semibold' : 'text-gray-500 hover:text-gray-900'}`}>Messages privés</button>
                </div>
              )}
            </div>
            <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer transition-colors p-1">
              <i className="fa-solid fa-minus text-xs" />
            </button>
          </div>

          {/* Corps de la messagerie */}
          <div className="flex-1 overflow-y-auto bg-white p-4 flex flex-col justify-between h-full">
            
            {/* CANAL PUBLIC */}
            {miniTab === 'public' && !activeChatUser && (
              <div className="flex flex-col h-full justify-between space-y-3">
                <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 max-h-[315px] scrollbar-none">
                  {chatMessages.map((msg, idx) => {
                    const isMe = msg.user === `${me.prenom} ${me.nom}` || String(msg.from) === String(me.id)
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
                  <input type="text" placeholder="Votre message..." value={typedPublic} onChange={(e) => setTypedPublic(e.target.value)} className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-[13px] outline-none focus:border-enc/40 focus:bg-white transition-all placeholder-gray-400" />
                  <button type="submit" className="text-enc hover:text-[#66001a] p-2 transition-colors cursor-pointer text-sm">
                    <i className="fa-solid fa-paper-plane" />
                  </button>
                </form>
              </div>
            )}

            {/* LISTE DES CONTACTS PRIVÉS */}
            {miniTab === 'private' && !activeChatUser && (
              <div className="space-y-1 overflow-y-auto h-full pr-1 max-h-[370px]">
                {allUsers.map((user) => {
                  const isOnline = onlineUsers.some((u) => String(u.id) === String(user.id))
                  return (
                    <div key={user.id} onClick={() => handleSelectUser(user)} className="p-2 rounded-xl flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-all group">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="relative flex-shrink-0">
                          <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-600 font-semibold text-[11px] flex items-center justify-center uppercase border border-gray-200/60">
                            {user.prenom[0]}{user.nom[0]}
                          </div>
                          {isOnline && <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 border-2 border-white" />}
                        </div>
                        <span className="text-[13px] font-medium text-gray-700 truncate group-hover:text-gray-900">{user.prenom} {user.nom}</span>
                      </div>
                      <i className="fa-solid fa-chevron-right text-[10px] text-gray-300 opacity-0 group-hover:opacity-100 transition-all pr-1" />
                    </div>
                  )
                })}
              </div>
            )}

            {/* CONVERSATION PRIVÉE ACTIVE */}
            {activeChatUser && (
              <div className="flex flex-col h-full justify-between space-y-3">
                <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 max-h-[315px] scrollbar-none">
                  {loadingHistory ? (
                    <div className="flex items-center justify-center h-full pt-12 text-[11px] font-medium text-gray-400 animate-pulse">Chargement de la discussion...</div>
                  ) : directMessages.length === 0 ? (
                    <div className="text-center pt-12 text-[12px] text-gray-400 italic">Aucun échange pour le moment.</div>
                  ) : (
                    directMessages.map((msg, i) => {
                      const isMe = String(msg.from) === String(me.id) || msg.user === `${me.prenom} ${me.nom}`
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
                  <input type="text" placeholder={`Message à ${activeChatUser.prenom}...`} value={typedPrivate} onChange={(e) => setTypedPrivate(e.target.value)} className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-[13px] outline-none focus:border-enc/40 focus:bg-white transition-all placeholder-gray-400" />
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