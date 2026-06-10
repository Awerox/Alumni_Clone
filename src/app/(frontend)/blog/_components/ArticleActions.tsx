// app/blog/_components/ArticleActions.tsx
'use client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useState } from 'react'

interface Props {
  articleId: number
  slug: string
  statut: string
  isOwner: boolean
}

export default function ArticleActions({ articleId, slug, statut, isOwner }: Props) {
  const router = useRouter()
  const [deleting, setDeleting] = useState(false)

  if (!isOwner) return null

  const handleDelete = async () => {
    if (!confirm('Supprimer définitivement cet article ?')) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/articles/${articleId}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (res.ok) {
        router.refresh()
      } else {
        const data = await res.json()
        alert(data.error || 'Erreur lors de la suppression')
      }
    } catch {
      alert('Erreur réseau')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="px-4 pb-4 flex gap-2">
      {/* Bouton Modifier — uniquement sur brouillons/planifiés/attente */}
      {statut !== 'publie' && (
        <Link
          href={`/blog/edit/${articleId}`}
          className="flex-1 text-center py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all border border-amber-200 hover:border-amber-400"
        >
          ✏️ Modifier
        </Link>
      )}

      {/* Bouton Supprimer — sur tous les articles de l'auteur */}
      <button
        onClick={handleDelete}
        disabled={deleting}
        className={`${statut !== 'publie' ? '' : 'flex-1'} text-center py-2 px-3 bg-red-50 hover:bg-red-100 text-red-600 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all border border-red-100 hover:border-red-300 disabled:opacity-50`}
      >
        {deleting ? '...' : '🗑️ Supprimer'}
      </button>
    </div>
  )
}