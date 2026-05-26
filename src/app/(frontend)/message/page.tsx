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
  auteur: { id: string; prenom: string; nom: string }
  commentaires?: Commentaire[]
  createdAt: string
}

interface ChatMessage {
  user: string
  text: string
  time: string
}

export default function MessagesAndChatPage() {
  const [me, setMe] = useState<any>(null)
  const [discussions, setDiscussions] = useState<Discussion[]>([])
  const [selectedDiscussion, setSelectedDiscussion] = useState<Discussion | null>(null)
  const [loadingForum, setLoadingForum] = useState(true)

  // Inputs formulaires
  const [newForumMessage, setNewForumMessage] = useState('')
  const [newTopicTitre, setNewTopicTitre] = useState('')
  const [newTopicContenu, setNewTopicContenu] = useState('')
  const [showNewTopicModal, setShowNewTopicModal] = useState(false)

  // États Chat Temps Réel (WebSockets)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [typedChatMessage, setTypedChatMessage] = useState('')
  const [onlineUsers, setOnlineUsers] = useState<string[]>([])
  const socketRef = useRef<WebSocket | null>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)

  // 1. Charger l'utilisateur et les discussions du Forum
  const loadForumData = async () => {
    try {
      const userRes = await fetch('/api/alumni/me')
      const userData = await userRes.json()
      if (userData?.user) setMe(userData.user)

      const discRes = await fetch('/api/discussions?limit=50&sort=-createdAt')
      const discData = await discRes.json()
      if (discData?.docs) {
        setDiscussions(discData.docs)
        if (discData.docs.length > 0 && !selectedDiscussion) {
          setSelectedDiscussion(discData.docs[0])
        }
      }
    } catch (err) {
      console.error(err)
    } finally {
      // 🎯 CORRECTION : Utilisation de la fonction d'état au lieu de l'assignation par égalité
      setLoadingForum(false)
    }
  }

  useEffect(() => {
    loadForumData()
  }, [])

  // 2. Connexion WebSocket pour le Chat en direct
  useEffect(() => {
    if (!me) return

    // Simulation de connexion WS (À remplacer par l'adresse de votre serveur WS de prod ex: ws://localhost:4000)
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const wsUrl = `${protocol}//${window.location.host}/api/chat/ws`
    
    // Fallback de simulation si la route WS n'est pas supportée par l'hébergeur cloud restrictif
    setOnlineUsers(['Alex Xu', 'Marie Dubois', 'Thomas Wright'])

    return () => {
      if (socketRef.current) socketRef.current.close()
    }
  }, [me])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  // Envoyer une réponse sur le Forum
  const handleSendForumComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newForumMessage.trim() || !selectedDiscussion) return

    try {
      const res = await fetch('/api/forum', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          discussionId: selectedDiscussion.id,
          message: newForumMessage,
        }),
      })

      if (res.ok) {
        setNewForumMessage('')
        // Recharger les discussions pour voir le message apparaître
        const discRes = await fetch('/api/discussions?limit=50&sort=-createdAt')
        const discData = await discRes.json()
        if (discData?.docs) {
          setDiscussions(discData.docs)
          const updated = discData.docs.find((d: any) => d.id === selectedDiscussion.id)
          if (updated) setSelectedDiscussion(updated)
        }
      }
    } catch (err) {
      console.error(err)
    }
  }

  // Créer un nouveau sujet sur le Forum
  const handleCreateTopic = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTopicTitre.trim() || !newTopicContenu.trim() || !me) return

    try {
      const res = await fetch('/api/discussions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titre: newTopicTitre,
          contenu: newTopicContenu,
          auteur: me.id,
        }),
      })

      if (res.ok) {
        setNewTopicTitre('')
        setNewTopicContenu('')
        setShowNewTopicModal(false)
        loadForumData()
      }
    } catch (err) {
      console.error(err)
    }
  }

  // Envoyer un message instantané sur le Chat
  const handleSendLiveChatMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!typedChatMessage.trim() || !me) return

    const newMsg: ChatMessage = {
      user: `${me.prenom} ${me.nom}`,
      text: typedChatMessage,
      time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    }

    setChatMessages((prev) => [...prev, newMsg])
    setTypedChatMessage('')

    // Simulation de réponse automatique d'un membre en ligne pour tester l'interface temps réel
    setTimeout(() => {
      setChatMessages((prev) => [
        ...prev,
        {
          user: 'Marie Dubois',
          text: `Salut ${me.prenom} ! Je viens de voir ton message en ligne.`,
          time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        },
      ])
    }, 1200)
  }

  if (loadingForum) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 font-sans">
        <div className="text-xs font-black text-gray-400 uppercase tracking-widest animate-pulse">
          Ouverture des canaux de communication...
        </div>
      </div>
    )
  }

  return (
    <div className="bg-[#F8FAFC] min-h-screen font-sans text-left">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-120px)] min-h-[600px]">
        
        {/* ================================================================= */}
        {/* 👈 PARTIE GAUCHE : LE FORUM DE DISCUSSION (8 COLONNES)            */}
        {/* ================================================================= */}
        <div className="lg:col-span-8 bg-white border border-gray-200 rounded-3xl p-6 shadow-xs flex flex-col justify-between overflow-hidden">
          <div className="flex justify-between items-center border-b border-gray-100 pb-4 flex-shrink-0">
            <div>
              <h2 className="text-base font-black text-gray-900 uppercase tracking-tight flex items-center gap-2">
                🏛️ Forum de Discussion
              </h2>
              <p className="text-[11px] text-gray-400 font-medium mt-0.5">Posez vos questions et échangez avec l'ENC Bessières.</p>
            </div>
            <button
              onClick={() => setShowNewTopicModal(true)}
              className="bg-purple-600 hover:bg-purple-700 text-white font-black uppercase text-[10px] tracking-wider px-4 py-2.5 rounded-xl shadow-xs transition-all cursor-pointer"
            >
              ＋ Nouveau Sujet
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1 overflow-hidden pt-4">
            {/* Liste latérale des sujets */}
            <div className="border-r border-gray-100 pr-2 overflow-y-auto space-y-2 max-h-full">
              {discussions.map((disc) => (
                <div
                  key={disc.id}
                  onClick={() => setSelectedDiscussion(disc)}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                    selectedDiscussion?.id === disc.id
                      ? 'border-purple-200 bg-purple-50/40 shadow-3xs'
                      : 'border-gray-100 hover:bg-gray-50'
                  }`}
                >
                  <h4 className="text-xs font-black text-gray-800 line-clamp-1 leading-tight">{disc.titre}</h4>
                  <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">Par {disc.auteur?.prenom || 'Alumni'}</p>
                </div>
              ))}
            </div>

            {/* Fenêtre de lecture et réponses du sujet sélectionné */}
            <div className="md:col-span-2 flex flex-col justify-between h-full overflow-hidden">
              {selectedDiscussion ? (
                <>
                  {/* Fil de discussion */}
                  <div className="flex-1 overflow-y-auto pr-1 space-y-4 max-h-[70%]">
                    <div className="bg-gray-50 border border-gray-100 p-4 rounded-2xl">
                      <span className="text-[9px] font-black uppercase tracking-wider text-purple-600 bg-purple-50 px-2 py-0.5 rounded-md">Sujet principal</span>
                      <h3 className="text-sm font-black text-gray-900 mt-2 leading-snug">{selectedDiscussion.titre}</h3>
                      <p className="text-xs text-gray-600 font-medium mt-1 leading-relaxed whitespace-pre-wrap">{selectedDiscussion.contenu}</p>
                    </div>

                    {/* Commentaires */}
                    <div className="space-y-2 pt-2">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">💬 Réponses</p>
                      {selectedDiscussion.commentaires && selectedDiscussion.commentaires.length > 0 ? (
                        selectedDiscussion.commentaires.map((comment, idx) => (
                          <div key={idx} className="bg-white border border-gray-100 p-3 rounded-xl shadow-3xs text-xs font-medium text-gray-700">
                            <div className="flex justify-between text-[9px] font-black text-gray-400 uppercase tracking-wide mb-1">
                              <span>{comment.auteur?.prenom} {comment.auteur?.nom}</span>
                              <span>{new Date(comment.createdAt).toLocaleDateString('fr-FR')}</span>
                            </div>
                            <p className="leading-relaxed text-gray-600">{comment.message}</p>
                          </div>
                        ))
                      ) : (
                        <p className="text-center text-[11px] text-gray-400 italic py-4">Pas encore de réponse sur ce sujet. Soyez le premier !</p>
                      )}
                    </div>
                  </div>

                  {/* Formulaire d'envoi de réponse */}
                  <form onSubmit={handleSendForumComment} className="border-t border-gray-100 pt-3 flex gap-2 flex-shrink-0">
                    <input
                      type="text"
                      placeholder="Écrire une réponse publique..."
                      value={newForumMessage}
                      onChange={(e) => setNewForumMessage(e.target.value)}
                      className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium outline-none focus:bg-white focus:border-purple-500 shadow-3xs"
                    />
                    <button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white px-4 rounded-xl font-black text-[10px] uppercase tracking-wider cursor-pointer">
                      Répondre
                    </button>
                  </form>
                </>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-400 text-xs font-bold italic">Sélectionnez un sujet à afficher</div>
              )}
            </div>
          </div>
        </div>

        {/* ================================================================= */}
        {/* 👉 PARTIE DROITE : LE CHAT LIVE DIRECT TIME (4 COLONNES)            */}
        {/* ================================================================= */}
        <div className="lg:col-span-4 bg-white border border-gray-200 rounded-3xl p-5 shadow-xs flex flex-col justify-between overflow-hidden">
          <div className="border-b border-gray-100 pb-3 flex-shrink-0 text-left">
            <h2 className="text-sm font-black text-gray-900 uppercase tracking-tight flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" /> Chat en Direct
            </h2>
            
            {/* Trombinoscope des membres connectés en ligne */}
            <div className="flex items-center gap-1.5 mt-2.5 overflow-x-auto pb-1">
              {onlineUsers.map((u, i) => (
                <div key={i} className="flex-shrink-0 relative group cursor-pointer" title={`${u} est en ligne`}>
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 text-white text-[9px] font-black flex items-center justify-center uppercase tracking-tighter border-2 border-white shadow-3xs">
                    {u.split(' ').map(n => n[0]).join('')}
                  </div>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white absolute bottom-0 right-0" />
                </div>
              ))}
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-wide pl-1">+{onlineUsers.length} en ligne</span>
            </div>
          </div>

          {/* Corps d'affichage des bulles de messages instannées */}
          <div className="flex-1 overflow-y-auto py-4 space-y-3 max-h-full pr-1 text-xs">
            {chatMessages.length > 0 ? (
              chatMessages.map((msg, index) => {
                const isMe = me && msg.user === `${me.prenom} ${me.nom}`
                return (
                  <div key={index} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} space-y-0.5`}>
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-wide px-1">{msg.user}</span>
                    <div className={`p-3 max-w-[85%] rounded-2xl font-medium leading-relaxed shadow-3xs ${
                      isMe ? 'bg-gray-900 text-white rounded-br-none' : 'bg-gray-100 text-gray-800 rounded-bl-none'
                    }`}>
                      {msg.text}
                    </div>
                    <span className="text-[8px] text-gray-400 px-1 font-bold">{msg.time}</span>
                  </div>
                )
              })
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 gap-2">
                <span className="text-2xl">💬</span>
                <p className="text-[11px] font-bold">Salon de discussion en direct ouvert.</p>
                <p className="text-[10px] text-gray-300">Envoyez un message pour démarrer la discussion temps réel.</p>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Formulaire d'envoi Chat live */}
          <form onSubmit={handleSendLiveChatMessage} className="border-t border-gray-100 pt-3 flex gap-2 flex-shrink-0">
            <input
              type="text"
              placeholder="Écrire un message en direct..."
              value={typedChatMessage}
              onChange={(e) => setTypedChatMessage(e.target.value)}
              className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium outline-none focus:bg-white focus:border-gray-900 shadow-3xs"
            />
            <button type="submit" className="bg-gray-900 hover:bg-gray-800 text-white px-4 rounded-xl flex items-center justify-center cursor-pointer">
              <i className="fa-solid fa-paper-plane text-xs" />
            </button>
          </form>
        </div>

      </div>

      {/* MODAL : AJOUTER UN NOUVEAU SUJET AU FORUM */}
      {showNewTopicModal && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden border border-gray-100 animate-in fade-in duration-200 text-left">
            <div className="bg-gray-50 p-5 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xs font-black text-gray-900 uppercase tracking-wider">Créer un sujet de discussion</h2>
              <button onClick={() => setShowNewTopicModal(false)} className="text-gray-400 hover:text-red-500 cursor-pointer">✕</button>
            </div>
            <form onSubmit={handleCreateTopic} className="p-6 space-y-4 text-xs font-bold text-gray-500 uppercase tracking-wide">
              <div>
                <label className="block mb-1">Titre du sujet</label>
                <input type="text" required value={newTopicTitre} onChange={(e) => setNewTopicTitre(e.target.value)} className="w-full p-3 bg-white border border-gray-200 rounded-xl outline-none focus:border-purple-500 normal-case font-medium text-gray-800" placeholder="Ex: Conseils pour l'oral de BTS Cursus SIO" />
              </div>
              <div>
                <label className="block mb-1">Message de description</label>
                <textarea required rows={4} value={newTopicContenu} onChange={(e) => setNewTopicContenu(e.target.value)} className="w-full p-3 bg-white border border-gray-200 rounded-xl outline-none focus:border-purple-500 normal-case font-medium text-gray-800 leading-relaxed" placeholder="Détaillez votre question ou le thème de discussion..." />
              </div>
              <button type="submit" className="w-full py-3.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-black uppercase text-xs tracking-wider transition-colors shadow-sm cursor-pointer">
                Lancer la discussion
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}