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
}

interface OnlineUser {
  id: string
  name: string
  prenom: string
  nom: string
}

export default function MessagesAndChatPage() {
  const [me, setMe] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<'forum' | 'chat' | 'mp'>('forum')
  
  // États Forum
  const [discussions, setDiscussions] = useState<Discussion[]>([])
  const [selectedDiscussion, setSelectedDiscussion] = useState<Discussion | null>(null)
  const [loading, setLoading] = useState(true)
  const [newForumMessage, setNewForumMessage] = useState('')
  
  // États de personnalisation avancée pour la création d'un sujet
  const [newTopicTitre, setNewTopicTitre] = useState('')
  const [newTopicContenu, setNewTopicContenu] = useState('')
  const [newTopicCategorie, setNewTopicCategorie] = useState('entraide')
  const [newTopicTags, setNewTopicTags] = useState('')
  const [showNewTopicModal, setShowNewTopicModal] = useState(false)

  // États Chat & MP Temps Réel Réel
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [directMessages, setDirectMessages] = useState<ChatMessage[]>([])
  const [typedChatMessage, setTypedChatMessage] = useState('')
  const [typedPrivateMessage, setTypedPrivateMessage] = useState('')
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([])
  const [selectedUserForMP, setSelectedUserForMP] = useState<OnlineUser | null>(null)

  const chatEndRef = useRef<HTMLDivElement>(null)
  const mpEndRef = useRef<HTMLDivElement>(null)

  // Mappers esthétiques pour les catégories du forum
  const categoryBadges: Record<string, { label: string; cls: string }> = {
    entraide: { label: '💡 Entraide Cursus', cls: 'bg-amber-100 text-amber-800' },
    stages: { label: '💼 Stages & Alternances', cls: 'bg-emerald-100 text-emerald-800' },
    examens: { label: '📝 Prépa Examens / Oraux', cls: 'bg-rose-100 text-rose-800' },
    projets: { label: '🚀 Projets SLAM / SISR', cls: 'bg-blue-100 text-blue-800' },
    divers: { label: '☕ Café / Divers', cls: 'bg-purple-100 text-purple-800' },
  }

  // 1. Chargement initial de la session et du Forum
  const loadInitialData = async () => {
    try {
      const userRes = await fetch('/api/alumni/me')
      const userData = await userRes.json()
      if (userData?.user) setMe(userData.user)

      const discRes = await fetch('/api/discussions?limit=50&sort=-createdAt')
      const discData = await discRes.json()
      if (discData?.docs) {
        setDiscussions(discData.docs)
        if (discData.docs.length > 0) setSelectedDiscussion(discData.docs[0])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadInitialData()
  }, [])

  // 2. Établissement du Flux SSE Temps Réel avec les connectés
  useEffect(() => {
    if (!me) return

    const eventSource = new EventSource(
      `/api/chat/stream?userId=${me.id}&name=${encodeURIComponent(me.prenom + ' ' + me.nom)}`
    )

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data)

      if (data.type === 'presence') {
        const filtrés: OnlineUser[] = data.users
          .map((u: any) => {
            if (typeof u === 'object') return u
            return { id: u, name: u, prenom: u.split(' ')[0], nom: u.split(' ')[1] || '' }
          })
          .filter((u: OnlineUser) => u.id !== me.id && u.name !== `${me.prenom} ${me.nom}`)
          
        setOnlineUsers(filtrés)
      } else if (data.type === 'msg-public') {
        setChatMessages((prev) => [...prev, data])
      } else if (data.type === 'msg-prive') {
        if (data.to === me.id || data.from === me.id) {
          setDirectMessages((prev) => [...prev, data])
        }
      }
    }

    return () => {
      eventSource.close()
    }
  }, [me])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  useEffect(() => {
    mpEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [directMessages])

  // Envoyer une réponse sur le Forum
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
    } catch (err) {
      console.error(err)
    }
  }

  // Créer un sujet de discussion personnalisé fonctionnel
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
          categorie: newTopicCategorie, // Donnée personnalisée passée à l'API
          tags: newTopicTags, // Donnée de mots-clés passée à l'API
          auteur: me.id 
        }),
      })

      if (res.ok) {
        setNewTopicTitre('')
        setNewTopicContenu('')
        setNewTopicCategorie('entraide')
        setNewTopicTags('')
        setShowNewTopicModal(false)
        loadInitialData()
      }
    } catch (err) {
      console.error(err)
    }
  }

  // Envoyer un message public sur le Chat en direct
  const handleSendLiveChatMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!typedChatMessage.trim() || !me) return

    try {
      await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'msg-public',
          user: `${me.prenom} ${me.nom}`,
          text: typedChatMessage,
          time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        }),
      })
      setTypedChatMessage('')
    } catch (err) {
      console.error(err)
    }
  }

  // Envoyer un message privé réel
  const handleSendPrivateMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!typedPrivateMessage.trim() || !selectedUserForMP || !me) return

    try {
      const res = await fetch('/api/mp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: selectedUserForMP.id,
          message: typedPrivateMessage,
        }),
      })
      if (res.ok) {
        setTypedPrivateMessage('')
      }
    } catch (err) {
      console.error(err)
    }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-xs font-black text-gray-400 uppercase tracking-widest animate-pulse">
        Initialisation des canaux sécurisés...
      </div>
    </div>
  )

  return (
    <div className="bg-[#F8FAFC] min-h-screen font-sans text-left">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        
        {/* Navigation des Onglets de l'Espace Communautaire */}
        <div className="flex bg-white p-1.5 border border-gray-200 rounded-2xl w-full max-w-md shadow-2xs font-black uppercase text-[10px] tracking-wider">
          <button onClick={() => setActiveTab('forum')} className={`flex-1 py-2.5 rounded-xl transition-all cursor-pointer ${activeTab === 'forum' ? 'bg-purple-600 text-white' : 'text-gray-500 hover:text-gray-800'}`}>
            🏛️ Forum
          </button>
          <button onClick={() => setActiveTab('chat')} className={`flex-1 py-2.5 rounded-xl transition-all cursor-pointer ${activeTab === 'chat' ? 'bg-gray-900 text-white' : 'text-gray-500 hover:text-gray-800'}`}>
            🟢 Chat en direct
          </button>
          <button onClick={() => setActiveTab('mp')} className={`flex-1 py-2.5 rounded-xl transition-all cursor-pointer ${activeTab === 'mp' ? 'bg-emerald-600 text-white' : 'text-gray-500 hover:text-gray-800'}`}>
            🔒 Messages Privés
          </button>
        </div>

        {/* ==================== 1. VUE FORUM ==================== */}
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
                        <span className={`text-[7px] font-black uppercase px-1 py-0.5 rounded-sm whitespace-nowrap ${categoryBadges[disc.categorie].cls}`}>
                          {disc.categorie}
                        </span>
                      )}
                    </div>
                    <p className="text-[9px] text-gray-400 font-bold uppercase mt-1">Par {disc.auteur?.prenom || 'Alumni'}</p>
                  </div>
                ))}
              </div>
              <button onClick={() => setShowNewTopicModal(true)} className="w-full bg-purple-600 hover:bg-purple-700 text-white font-black uppercase text-[10px] tracking-wider py-3 rounded-xl shadow-xs mt-4 cursor-pointer">
                ＋ Créer un sujet personnalisé
              </button>
            </div>

            <div className="md:col-span-8 flex flex-col justify-between h-full overflow-hidden">
              {selectedDiscussion ? (
                <>
                  <div className="flex-1 overflow-y-auto pr-1 space-y-4 max-h-[85%]">
                    <div className="bg-gray-50 border border-gray-100 p-4 rounded-2xl relative space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[9px] font-black uppercase tracking-wider text-purple-600 bg-purple-50 px-2 py-0.5 rounded-md">Sujet principal</span>
                        {selectedDiscussion.categorie && categoryBadges[selectedDiscussion.categorie] && (
                          <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${categoryBadges[selectedDiscussion.categorie].cls}`}>
                            {categoryBadges[selectedDiscussion.categorie].label}
                          </span>
                        )}
                        {selectedDiscussion.tags && (
                          <span className="text-[9px] font-bold bg-gray-200 text-gray-600 px-2 py-0.5 rounded-md">🏷️ {selectedDiscussion.tags}</span>
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

        {/* ==================== 2. VUE CHAT EN DIRECT ==================== */}
        {activeTab === 'chat' && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 h-[550px]">
            <div className="md:col-span-8 bg-white border border-gray-200 rounded-3xl p-5 flex flex-col justify-between overflow-hidden h-full">
              <div className="flex-1 overflow-y-auto pr-1 space-y-3">
                {chatMessages.map((msg, index) => (
                  <div key={index} className={`flex flex-col ${msg.user === `${me?.prenom} ${me?.nom}` ? 'items-end' : 'items-start'}`}>
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-wide px-1">{msg.user}</span>
                    <div className={`p-3 max-w-[80%] rounded-2xl text-xs font-medium ${msg.user === `${me?.prenom} ${me?.nom}` ? 'bg-gray-900 text-white rounded-br-none' : 'bg-gray-100 text-gray-800 rounded-bl-none'} shadow-3xs`}>{msg.text}</div>
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
                  <span className="text-xs font-bold text-gray-700">{user.name}</span>
                </div>
              )) : <p className="text-xs text-gray-400 italic">Vous êtes le seul en ligne.</p>}
            </div>
          </div>
        )}

        {/* ==================== 3. VUE MESSAGES PRIVÉS (MP) ==================== */}
        {activeTab === 'mp' && (
          <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-xs grid grid-cols-1 md:grid-cols-12 gap-6 h-[550px] overflow-hidden">
            <div className="md:col-span-4 border-r border-gray-100 pr-2 overflow-y-auto space-y-2 h-full">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest pb-1">Discuter en privé avec :</p>
              {onlineUsers.length > 0 ? onlineUsers.map((user, i) => (
                <div key={i} onClick={() => setSelectedUserForMP(user)} className={`p-3 rounded-xl border text-left cursor-pointer transition-all flex items-center gap-3 ${selectedUserForMP?.id === user.id ? 'border-emerald-200 bg-emerald-50/30' : 'border-gray-50 hover:bg-gray-50'}`}>
                  <div className="w-7 h-7 rounded-full bg-emerald-600 text-white font-black text-[9px] flex items-center justify-center uppercase">{user.prenom[0]}{user.nom[0]}</div>
                  <span className="text-xs font-bold text-gray-800">{user.name}</span>
                </div>
              )) : <p className="text-xs text-gray-400 italic">Aucun autre membre connecté pour chatter en privé.</p>}
            </div>

            <div className="md:col-span-8 flex flex-col justify-between h-full overflow-hidden">
              {selectedUserForMP ? (
                <>
                  <div className="border-b pb-2 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <h3 className="text-xs font-black text-gray-800 uppercase tracking-wider">Conversation avec {selectedUserForMP.name}</h3>
                  </div>
                  <div className="flex-1 overflow-y-auto py-4 space-y-3 pr-1">
                    {directMessages
                      .filter((m) => m.from === selectedUserForMP.id || m.to === selectedUserForMP.id)
                      .map((msg, index) => {
                        const isMe = msg.from === me?.id || msg.user === `${me?.prenom} ${me?.nom}`
                        return (
                          <div key={index} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                            <div className={`p-3 max-w-[80%] rounded-2xl text-xs font-medium shadow-3xs ${isMe ? 'bg-emerald-600 text-white rounded-br-none' : 'bg-gray-100 text-gray-800 rounded-bl-none'}`}>{msg.text}</div>
                            <span className="text-[8px] text-gray-400 font-bold mt-0.5 px-1">{msg.time}</span>
                          </div>
                        )
                      })}
                    <div ref={mpEndRef} />
                  </div>
                  <form onSubmit={handleSendPrivateMessage} className="pt-3 border-t border-gray-100 flex gap-2">
                    <input type="text" placeholder={`Envoyer un message sécurisé à ${selectedUserForMP.name}...`} value={typedPrivateMessage} onChange={(e) => setTypedPrivateMessage(e.target.value)} className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium outline-none focus:bg-white shadow-3xs" />
                    <button type="submit" className="bg-emerald-600 text-white px-5 rounded-xl font-black text-[10px] uppercase cursor-pointer">Sécurisé</button>
                  </form>
                </>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-400 text-xs italic">Sélectionnez un membre connecté à gauche pour démarrer une conversation secrète.</div>
              )}
            </div>
          </div>
        )}

      </div>

      {/* 🛠️ MODAL DE CRÉATION DE FORUM CUSTOMISÉ ET SÉCURISÉ */}
      {showNewTopicModal && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden border border-gray-100 text-left animate-in fade-in duration-150">
            <div className="bg-gray-50 p-5 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xs font-black text-gray-900 uppercase tracking-wider">Créer un sujet de discussion personnalisé</h2>
              <button onClick={() => setShowNewTopicModal(false)} className="text-gray-400 hover:text-red-500 cursor-pointer">✕</button>
            </div>
            <form onSubmit={handleCreateTopic} className="p-6 space-y-4 text-xs font-bold text-gray-500 uppercase tracking-wide">
              <div>
                <label className="block mb-1 text-gray-400">Titre du sujet *</label>
                <input type="text" required value={newTopicTitre} onChange={(e) => setNewTopicTitre(e.target.value)} className="w-full p-3 bg-white border border-gray-200 rounded-xl outline-none font-medium text-gray-800 normal-case focus:border-purple-500 shadow-2xs" placeholder="Ex: REX Oral E4 - Spécialité SLAM" />
              </div>

              {/* 🎨 Personnalisation : Choix de la catégorie Thématique */}
              <div>
                <label className="block mb-1 text-gray-400">Catégorie Thématique *</label>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  {Object.entries(categoryBadges).map(([key, value]) => (
                    <label 
                      key={key} 
                      className={`p-2.5 border rounded-xl flex items-center gap-2 cursor-pointer transition-all normal-case font-bold text-gray-700 ${newTopicCategorie === key ? 'border-purple-500 bg-purple-50/50 shadow-3xs' : 'border-gray-200 bg-white hover:bg-gray-50'}`}
                    >
                      <input 
                        type="radio" 
                        name="category" 
                        value={key} 
                        checked={newTopicCategorie === key} 
                        onChange={() => setNewTopicCategorie(key)} 
                        className="accent-purple-600" 
                      />
                      <span>{value.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* 🏷️ Personnalisation : Tags additionnels */}
              <div>
                <label className="block mb-1 text-gray-400">Tags / Mots-clés optionnels</label>
                <input type="text" value={newTopicTags} onChange={(e) => setNewTopicTags(e.target.value)} className="w-full p-3 bg-white border border-gray-200 rounded-xl outline-none font-medium text-gray-800 normal-case focus:border-purple-500 shadow-2xs" placeholder="Ex: #NextJS, #Java, #Stage" />
              </div>

              <div>
                <label className="block mb-1 text-gray-400">Message explicatif principal *</label>
                <textarea required rows={4} value={newTopicContenu} onChange={(e) => setNewTopicContenu(e.target.value)} className="w-full p-3 bg-white border border-gray-200 rounded-xl outline-none font-medium text-gray-800 leading-relaxed normal-case focus:border-purple-500 shadow-2xs" placeholder="Décrivez en détail l'objet de votre fil de discussion..." />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowNewTopicModal(false)} className="flex-1 py-3 border border-gray-200 text-gray-500 rounded-xl font-black uppercase text-xs tracking-wider bg-white hover:bg-gray-50 cursor-pointer">
                  Annuler
                </button>
                <button type="submit" className="flex-1 py-3 bg-purple-600 text-white rounded-xl font-black uppercase text-xs tracking-wider hover:bg-purple-700 transition-colors shadow-sm cursor-pointer">
                  Lancer le sujet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}