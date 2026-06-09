'use client'
import React, { useState, useRef } from 'react'

// Liste d'emojis courants
const EMOJI_LIST = [
  '😊','😂','❤️','👍','🎉','🔥','💪','✅','🚀','💡',
  '😍','🙏','😎','🤔','👏','😅','💯','🎯','⭐','😢',
  '😡','🤝','🌟','📢','💼','🎓','🏆','📅','💬','🤗',
]

export default function PublishBox({
  userPrenom,
  userNom,
}: {
  userPrenom: string
  userNom: string
}) {
  const [contenu, setContenu] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Insère l'emoji à la position du curseur
  const insertEmoji = (emoji: string) => {
    const textarea = textareaRef.current
    if (!textarea) {
      setContenu((prev) => (prev + emoji).slice(0, 500))
      return
    }
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const newText = (contenu.slice(0, start) + emoji + contenu.slice(end)).slice(0, 500)
    setContenu(newText)
    setShowEmojiPicker(false)
    // Replace cursor after emoji
    setTimeout(() => {
      textarea.selectionStart = start + emoji.length
      textarea.selectionEnd = start + emoji.length
      textarea.focus()
    }, 0)
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      setError('Image trop lourde (max 5 Mo)')
      return
    }
    if (!file.type.startsWith('image/')) {
      setError('Seules les images sont acceptées')
      return
    }
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
    setError('')
  }

  const removeImage = () => {
    setImageFile(null)
    setImagePreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!contenu.trim() && !imageFile) return
    setLoading(true)
    setError('')

    try {
      let imageId: number | null = null

      // Upload de l'image si présente
      if (imageFile) {
        setUploadingImage(true)
        const formData = new FormData()
        formData.append('file', imageFile)
        formData.append('alt', `Image de ${userPrenom} ${userNom}`)

        const uploadRes = await fetch('/api/media', {
          method: 'POST',
          body: formData,
          credentials: 'include',
        })

        if (!uploadRes.ok) {
          throw new Error("Échec de l'upload de l'image")
        }

        const uploadData = await uploadRes.json()
        imageId = uploadData?.doc?.id || null
        setUploadingImage(false)
      }

      const res = await fetch('/api/alumni-posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          contenu: contenu.trim(),
          ...(imageId ? { image: imageId } : {}),
        }),
      })

      if (res.ok) {
        setContenu('')
        setImageFile(null)
        setImagePreview(null)
        if (fileInputRef.current) fileInputRef.current.value = ''
        window.location.href = '/feed'
      } else {
        const data = await res.json()
        setError(data.error || 'Erreur lors de la publication.')
      }
    } catch (err: any) {
      setError(err.message || 'Erreur réseau.')
    } finally {
      setLoading(false)
      setUploadingImage(false)
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-2xs space-y-3 text-left relative">
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-full bg-purple-100 text-purple-700 font-black flex items-center justify-center uppercase text-xs">
          {userPrenom[0]}{userNom[0]}
        </div>
        <span className="text-xs font-black text-gray-700">{userPrenom} {userNom}</span>
      </div>

      <form onSubmit={handlePublish} className="space-y-3">
        <textarea
          ref={textareaRef}
          value={contenu}
          onChange={(e) => setContenu(e.target.value.slice(0, 500))}
          placeholder="Un déplacement prévu ? Une annonce à faire ? Écrivez ici un message à la communauté."
          className="w-full min-h-[60px] text-xs font-medium text-gray-600 outline-none resize-none placeholder-gray-400 bg-transparent"
        />

        {/* Aperçu image */}
        {imagePreview && (
          <div className="relative w-fit">
            <img
              src={imagePreview}
              alt="Aperçu"
              className="max-h-40 rounded-xl border border-gray-200 object-cover"
            />
            <button
              type="button"
              onClick={removeImage}
              className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-[10px] flex items-center justify-center hover:bg-red-600 transition-colors"
            >
              ✕
            </button>
          </div>
        )}

        {error && (
          <p className="text-[11px] text-red-500 font-bold bg-red-50 px-3 py-1.5 rounded-lg">
            {error}
          </p>
        )}

        <div className="flex justify-between items-center pt-2 border-t border-gray-100">
          <div className="flex gap-3 text-gray-400 text-sm relative">
            {/* Bouton emoji */}
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="hover:text-amber-500 transition-colors cursor-pointer"
              title="Ajouter un emoji"
            >
              😊
            </button>

            {/* Bouton image */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="hover:text-purple-500 transition-colors cursor-pointer"
              title="Ajouter une image"
            >
              🖼️
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageSelect}
            />

            {/* Picker emoji */}
            {showEmojiPicker && (
              <div className="absolute bottom-8 left-0 bg-white border border-gray-200 rounded-2xl shadow-xl p-3 z-50 w-56">
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Emojis</p>
                <div className="grid grid-cols-10 gap-1">
                  {EMOJI_LIST.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => insertEmoji(emoji)}
                      className="text-base hover:scale-125 transition-transform cursor-pointer p-0.5 rounded"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <span className={`text-[10px] font-bold ${contenu.length > 450 ? 'text-orange-400' : 'text-gray-400'}`}>
              {contenu.length}/500
            </span>
            <button
              type="submit"
              disabled={loading || uploadingImage || (!contenu.trim() && !imageFile)}
              className="px-4 py-1.5 bg-[#800020] hover:bg-opacity-90 disabled:opacity-40 text-white text-[10px] font-black uppercase rounded-xl transition-all tracking-wider"
            >
              {uploadingImage ? 'Upload...' : loading ? '...' : 'Poster'}
            </button>
          </div>
        </div>
      </form>

      {/* Ferme le picker si on clique ailleurs */}
      {showEmojiPicker && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowEmojiPicker(false)}
        />
      )}
    </div>
  )
}
