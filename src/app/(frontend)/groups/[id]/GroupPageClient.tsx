'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'

interface MemberData {
  id: string
  prenom: string
  nom: string
  photoUrl: string | null
  diplome: string | null
  promotion: string | null
  isCreator: boolean
  isModerator: boolean
  canBeRemoved: boolean
}

interface CreatorData {
  id: string
  prenom: string
  nom: string
  photoUrl: string | null
  diplome: string | null
  promotion: string | null
}

interface Post {
  id: string
  content: string
  type: 'post' | 'annonce' | 'evenement'
  image?: { url: string } | null
  author: {
    id: string
    prenom: string
    nom: string
    photo?: { url: string } | null
  }
  createdAt: string
}

interface Props {
  groupId: string
  groupDescription: string | null
  currentUserId: string | null
  isMember: boolean
  isCreator: boolean
  canManageMembers: boolean
  canManageRequests: boolean
  canEditGroup: boolean
  pendingCount: number
  membersData: MemberData[]
  creatorObj: CreatorData | null
  catLabel: string | null
  groupInfo: { isPublic: boolean; createdAt: string; memberCount: number }

}

const TYPE_BADGES: Record<string, { label: string; cls: string }> = {
  annonce: { label: '📢 Annonce', cls: 'bg-amber-100 text-amber-800 border border-amber-200' },
  evenement: { label: '📅 Événement', cls: 'bg-blue-100 text-blue-800 border border-blue-200' },
  post: { label: '', cls: '' },
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const min = Math.floor(diff / 60000)
  const h = Math.floor(diff / 3600000)
  const d = Math.floor(diff / 86400000)
  if (min < 2) return 'À l\'instant'
  if (min < 60) return `Il y a ${min} min`
  if (h < 24) return `Il y a ${h}h`
  if (d === 1) return 'Hier'
  if (d < 7) return `Il y a ${d} jours`
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

export default function GroupPageClient({
  groupId, groupDescription, currentUserId, isMember, isCreator,
  canManageMembers, canManageRequests, canEditGroup, pendingCount,
  membersData, creatorObj, catLabel, groupInfo,
}: Props) {
  const [activeTab, setActiveTab] = useState<'feed' | 'members'>('feed')
  const [posts, setPosts] = useState<Post[]>([])
  const [loadingPosts, setLoadingPosts] = useState(true)
  const [postText, setPostText] = useState('')
  const [postType, setPostType] = useState<'post' | 'annonce' | 'evenement'>('post')
  const [sending, setSending] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [filePreview, setFilePreview] = useState<string | null>(null)
  const [searchMember, setSearchMember] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  // Animations
  const [visible, setVisible] = useState(false)
  useEffect(() => { setTimeout(() => setVisible(true), 50) }, [])

  const canPost = isMember || isCreator

  // Charger les posts
  const loadPosts = async () => {
    setLoadingPosts(true)
    try {
      const res = await fetch(`/api/group-posts?groupId=${groupId}`, { credentials: 'include' })
      const data = await res.json()
      setPosts(data.docs || [])
    } catch (e) { console.error(e) }
    finally { setLoadingPosts(false) }
  }

  useEffect(() => { loadPosts() }, [groupId])

  // Envoyer un post
  const handleSendPost = async (e: React.FormEvent) => {
    e.preventDefault()
    if ((!postText.trim() && !selectedFile) || sending) return
    setSending(true)

    let imageId: string | undefined
    try {
      if (selectedFile) {
        const form = new FormData()
        form.append('file', selectedFile)
        form.append('alt', `Post image`)
        const uploadRes = await fetch('/api/media', { method: 'POST', body: form })
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json()
          imageId = String(uploadData?.doc?.id)
        }
      }

      const res = await fetch('/api/group-posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ groupId, content: postText, type: postType, imageId }),
      })

      if (res.ok) {
        setPostText('')
        setPostType('post')
        setSelectedFile(null)
        setFilePreview(null)
        if (fileRef.current) fileRef.current.value = ''
        await loadPosts()
      }
    } catch (e) { console.error(e) }
    finally { setSending(false) }
  }

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Supprimer ce post ?')) return
    await fetch(`/api/group-posts?postId=${postId}`, { method: 'DELETE', credentials: 'include' })
    setPosts(prev => prev.filter(p => p.id !== postId))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { alert('Max 5 Mo'); return }
    setSelectedFile(file)
    setFilePreview(file.type.startsWith('image/') ? URL.createObjectURL(file) : null)
  }

  const filteredMembers = membersData.filter(m =>
    `${m.prenom} ${m.nom}`.toLowerCase().includes(searchMember.toLowerCase())
  )

  const animBase = `transition-all duration-500 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`

  return (
    <>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
        @keyframes scaleIn { from { opacity:0; transform:scale(0.96); } to { opacity:1; transform:scale(1); } }
        .anim-fade-up { animation: fadeUp 0.45s ease both; }
        .anim-fade-in { animation: fadeIn 0.35s ease both; }
        .anim-scale-in { animation: scaleIn 0.35s ease both; }
        .d1 { animation-delay: 0.05s; } .d2 { animation-delay: 0.1s; }
        .d3 { animation-delay: 0.15s; } .d4 { animation-delay: 0.2s; }
        .d5 { animation-delay: 0.25s; } .d6 { animation-delay: 0.3s; }
        .card-hover { transition: box-shadow 0.2s, transform 0.2s; }
        .card-hover:hover { box-shadow: 0 8px 24px rgba(0,0,0,0.08); transform: translateY(-1px); }
        .tab-active { position: relative; }
        .tab-active::after { content:''; position:absolute; bottom:-1px; left:0; right:0; height:2px; background:#f59e0b; border-radius:2px 2px 0 0; }
      `}</style>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── COLONNE PRINCIPALE ── */}
        <div className="lg:col-span-2 space-y-4">

          {/* Onglets */}
          <div className="anim-fade-in bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-xs">
            <div className="flex border-b border-gray-100">
              <button
                onClick={() => setActiveTab('feed')}
                className={`flex-1 py-4 text-xs font-black uppercase tracking-widest transition-colors cursor-pointer ${activeTab === 'feed' ? 'tab-active text-amber-600 bg-amber-50/50' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-50'}`}
              >
                ⚡ Fil d'actualité
              </button>
              <button
                onClick={() => setActiveTab('members')}
                className={`flex-1 py-4 text-xs font-black uppercase tracking-widest transition-colors cursor-pointer ${activeTab === 'members' ? 'tab-active text-amber-600 bg-amber-50/50' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-50'}`}
              >
                👥 Membres · <span className={activeTab === 'members' ? 'text-amber-500' : ''}>{membersData.length}</span>
              </button>
            </div>

            {/* ── ONGLET FIL D'ACTUALITÉ ── */}
            {activeTab === 'feed' && (
              <div className="p-4 space-y-4">

                {/* Zone de publication */}
                {canPost ? (
                  <div className="anim-scale-in bg-gray-50 border border-gray-200 rounded-2xl p-4 space-y-3">
                    {/* Sélecteur de type */}
                    <div className="flex gap-2">
                      {(['post', 'annonce', 'evenement'] as const).map((t) => (
                        <button key={t} onClick={() => setPostType(t)}
                          className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${postType === t ? 'bg-amber-500 text-gray-900 shadow-sm' : 'bg-white border border-gray-200 text-gray-500 hover:border-amber-300'}`}>
                          {t === 'post' ? '✏️ Post' : t === 'annonce' ? '📢 Annonce' : '📅 Événement'}
                        </button>
                      ))}
                    </div>

                    <textarea
                      value={postText}
                      onChange={(e) => setPostText(e.target.value)}
                      placeholder="Partagez quelque chose avec le groupe..."
                      rows={3}
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-800 outline-none focus:border-amber-400 resize-none placeholder-gray-400 transition-colors"
                    />

                    {filePreview && (
                      <div className="relative inline-block">
                        <img src={filePreview} className="h-32 rounded-xl object-cover border border-gray-200" alt="" />
                        <button onClick={() => { setSelectedFile(null); setFilePreview(null) }}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600 cursor-pointer">✕</button>
                      </div>
                    )}
                    {selectedFile && !filePreview && (
                      <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-600">
                        <i className="fa-solid fa-file text-gray-400" /> {selectedFile.name}
                        <button onClick={() => setSelectedFile(null)} className="ml-auto text-red-400 hover:text-red-600 cursor-pointer">✕</button>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex gap-2">
                        <input ref={fileRef} type="file" accept="image/*,.pdf,.doc,.docx" className="hidden" onChange={handleFileChange} />
                        <button onClick={() => fileRef.current?.click()}
                          className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 rounded-xl text-[10px] font-black text-gray-500 hover:border-amber-300 hover:text-amber-600 transition-colors cursor-pointer">
                          <i className="fa-solid fa-image text-xs" /> Photo
                        </button>
                      </div>
                      <button onClick={handleSendPost} disabled={(!postText.trim() && !selectedFile) || sending}
                        className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-gray-900 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all shadow-sm cursor-pointer">
                        {sending ? <div className="w-3 h-3 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" /> : <i className="fa-solid fa-paper-plane text-xs" />}
                        Publier
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4 text-xs text-gray-400 font-medium bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                    Rejoignez le groupe pour publier
                  </div>
                )}

                {/* Liste des posts */}
                {loadingPosts ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map(n => (
                      <div key={n} className="bg-gray-50 rounded-2xl p-5 animate-pulse space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gray-200 flex-shrink-0" />
                          <div className="space-y-1.5 flex-1">
                            <div className="h-2.5 bg-gray-200 rounded-full w-1/3" />
                            <div className="h-2 bg-gray-100 rounded-full w-1/4" />
                          </div>
                        </div>
                        <div className="h-2.5 bg-gray-200 rounded-full w-full" />
                        <div className="h-2.5 bg-gray-100 rounded-full w-3/4" />
                      </div>
                    ))}
                  </div>
                ) : posts.length === 0 ? (
                  <div className="text-center py-12 space-y-2">
                    <div className="text-4xl">✨</div>
                    <p className="text-sm font-bold text-gray-500">Aucune publication pour l'instant</p>
                    {canPost && <p className="text-xs text-gray-400">Soyez le premier à partager quelque chose !</p>}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {posts.map((post, i) => {
                      const badge = TYPE_BADGES[post.type]
                      const isAuthor = currentUserId && String(post.author?.id) === currentUserId
                      const initials = ((post.author?.prenom?.[0] ?? '') + (post.author?.nom?.[0] ?? '')).toUpperCase() || '?'
                      return (
                        <div key={post.id}
                          className="anim-fade-up card-hover bg-white border border-gray-100 rounded-2xl p-5 space-y-3 shadow-xs"
                          style={{ animationDelay: `${i * 0.04}s` }}>
                          {/* Header post */}
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              {post.author?.photo?.url ? (
                                <img src={post.author.photo.url} className="w-9 h-9 rounded-full object-cover flex-shrink-0 ring-2 ring-gray-100" alt="" />
                              ) : (
                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-xs font-black flex-shrink-0">
                                  {initials}
                                </div>
                              )}
                              <div className="min-w-0">
                                <p className="text-sm font-black text-gray-900 truncate">
                                  {[post.author?.prenom, post.author?.nom].filter(Boolean).join(' ') || 'Membre'}
                                </p>
                                <p className="text-[10px] text-gray-400 font-medium">{timeAgo(post.createdAt)}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {badge.label && (
                                <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${badge.cls}`}>
                                  {badge.label}
                                </span>
                              )}
                              {isAuthor && (
                                <button onClick={() => handleDeletePost(post.id)}
                                  className="text-gray-300 hover:text-red-400 transition-colors text-xs cursor-pointer">
                                  <i className="fa-solid fa-trash" />
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Contenu */}
                          {post.content && (
                            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{post.content}</p>
                          )}

                          {/* Image */}
                          {post.image?.url && (
                            <a href={post.image.url} target="_blank" rel="noreferrer">
                              <img src={post.image.url} className="w-full max-h-80 object-cover rounded-xl border border-gray-100" alt="" />
                            </a>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ── ONGLET MEMBRES ── */}
            {activeTab === 'members' && (
              <div className="p-4 space-y-3">
                {/* Recherche */}
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Rechercher un membre..."
                    value={searchMember}
                    onChange={(e) => setSearchMember(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-800 outline-none focus:border-amber-400 transition-colors placeholder-gray-400"
                  />
                  <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
                </div>

                {filteredMembers.length === 0 ? (
                  <div className="text-center py-8 text-xs text-gray-400 font-medium">Aucun membre trouvé</div>
                ) : (
                  <div className="space-y-1">
                    {filteredMembers.map((m, i) => (
                      <div key={m.id}
                        className="anim-fade-up flex items-center gap-3 p-3 rounded-xl hover:bg-amber-50/50 transition-colors group cursor-default"
                        style={{ animationDelay: `${i * 0.03}s` }}>
                        {m.photoUrl ? (
                          <img src={m.photoUrl} className="w-10 h-10 rounded-full object-cover flex-shrink-0 ring-2 ring-gray-100 group-hover:ring-amber-200 transition-all" alt="" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-sm font-black flex-shrink-0">
                            {((m.prenom[0] ?? '') + (m.nom[0] ?? '')).toUpperCase() || '?'}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <Link href={`/profile/${m.id}`}
                              className="text-sm font-bold text-gray-900 hover:text-amber-600 transition-colors truncate">
                              {m.prenom} {m.nom}
                            </Link>
                            {m.isCreator && (
                              <span className="text-[8px] font-black text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full uppercase">créateur</span>
                            )}
                            {m.isModerator && (
                              <span className="text-[8px] font-black text-indigo-600 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded-full uppercase">modérateur</span>
                            )}
                          </div>
                          {(m.diplome || m.promotion) && (
                            <p className="text-[10px] text-gray-400 font-medium truncate">
                              {m.diplome}{m.promotion ? ` · Promo ${m.promotion}` : ''}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Link href={`/profile/${m.id}`}
                            className="text-[10px] font-black text-gray-400 hover:text-amber-600 transition-colors opacity-0 group-hover:opacity-100">
                            Voir →
                          </Link>
                          {m.canBeRemoved && (
                            <button
                              onClick={async () => {
                                if (!confirm(`Retirer ${m.prenom} ${m.nom} du groupe ?`)) return
                                await fetch(`/api/groups/${groupId}/remove-member`, {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  credentials: 'include',
                                  body: JSON.stringify({ memberId: m.id }),
                                })
                                window.location.reload()
                              }}
                              className="text-[10px] font-black text-gray-300 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer">
                              <i className="fa-solid fa-user-minus" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── SIDEBAR ── */}
        <div className="space-y-4">

          {/* Actions membre */}
          <div className="anim-fade-up d1">
            {isMember && !isCreator && (
              <button
                onClick={async () => {
                  await fetch(`/api/groups/${groupId}/leave`, { method: 'POST', credentials: 'include' })
                  window.location.reload()
                }}
                className="w-full py-2.5 bg-white border border-gray-200 hover:border-red-300 hover:bg-red-50 text-gray-600 hover:text-red-600 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer">
                Quitter le groupe
              </button>
            )}
            {!isMember && !isCreator && currentUserId && groupInfo.isPublic && (
              <button
                onClick={async () => {
                  await fetch(`/api/groups/${groupId}/join`, { method: 'POST', credentials: 'include' })
                  window.location.reload()
                }}
                className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-gray-900 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-sm hover:-translate-y-0.5 cursor-pointer">
                ✦ Rejoindre le groupe
              </button>
            )}
          </div>

          {/* À propos */}
          {groupDescription && (
            <div className="anim-fade-up d2 card-hover bg-white border border-gray-200 rounded-2xl shadow-xs overflow-hidden">
              <div className="bg-gray-900 px-5 py-3">
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">À propos</p>
              </div>
              <div className="p-5">
                <div className="text-sm text-gray-600 leading-relaxed prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: groupDescription }} />
              </div>
            </div>
          )}

          {/* Infos */}
          <div className="anim-fade-up d3 card-hover bg-white border border-gray-200 rounded-2xl shadow-xs overflow-hidden">
            <div className="bg-gray-900 px-5 py-3">
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Informations</p>
            </div>
            <div className="p-5 space-y-3">
              {[
                { icon: '🏷️', label: 'Catégorie', val: catLabel ?? '—' },
                { icon: '👥', label: 'Membres', val: `${groupInfo.memberCount} membre${groupInfo.memberCount !== 1 ? 's' : ''}` },
                { icon: '📅', label: 'Créé le', val: new Date(groupInfo.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) },
                { icon: groupInfo.isPublic ? '🌐' : '🔒', label: 'Visibilité', val: groupInfo.isPublic ? 'Groupe public' : 'Groupe privé' },
              ].map(({ icon, label, val }) => (
                <div key={label} className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0 text-sm">{icon}</div>
                  <div>
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-wider">{label}</p>
                    <p className="text-xs font-bold text-gray-900">{val}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Créateur */}
          {creatorObj && (
            <div className="anim-fade-up d4 card-hover bg-white border border-gray-200 rounded-2xl shadow-xs overflow-hidden">
              <div className="bg-gray-900 px-5 py-3">
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Créateur</p>
              </div>
              <div className="p-4">
                <Link href={`/profile/${creatorObj.id}`} className="flex items-center gap-3 group">
                  {creatorObj.photoUrl ? (
                    <img src={creatorObj.photoUrl} className="h-11 w-11 rounded-full object-cover ring-2 ring-amber-200 flex-shrink-0 group-hover:ring-amber-400 transition-all" alt="" />
                  ) : (
                    <div className="h-11 w-11 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-black flex-shrink-0">
                      {((creatorObj.prenom[0] ?? '') + (creatorObj.nom[0] ?? '')).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-black text-gray-900 truncate group-hover:text-amber-600 transition-colors">
                      {creatorObj.prenom} {creatorObj.nom}
                    </p>
                    {creatorObj.diplome && (
                      <p className="text-[10px] text-gray-400 font-medium truncate">
                        {creatorObj.diplome}{creatorObj.promotion ? ` · Promo ${creatorObj.promotion}` : ''}
                      </p>
                    )}
                  </div>
                  <i className="fa-solid fa-arrow-right text-[10px] text-gray-300 ml-auto group-hover:text-amber-500 transition-colors" />
                </Link>
              </div>
            </div>
          )}

          {/* Actions admin */}
          {(canEditGroup || canManageRequests) && (
            <div className="anim-fade-up d5 space-y-2">
              {canEditGroup && (
                <Link href={`/groups/${groupId}/edit`}
                  className="flex items-center justify-center gap-2 w-full py-3 bg-gray-900 hover:bg-gray-800 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-sm hover:-translate-y-0.5">
                  ⚙️ Modifier le groupe
                </Link>
              )}
              {canManageRequests && (
                <Link href={`/groups/${groupId}/requests`}
                  className="flex items-center justify-center gap-2 w-full py-3 bg-white border border-gray-200 hover:bg-amber-50 hover:border-amber-300 text-gray-700 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all">
                  🔔 Gérer les demandes
                  {pendingCount > 0 && (
                    <span className="bg-amber-400 text-gray-900 text-[9px] font-black px-1.5 py-0.5 rounded-full">{pendingCount}</span>
                  )}
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
