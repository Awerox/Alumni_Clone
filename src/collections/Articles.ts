// collections/Articles.ts
// 🎯 Pour ajouter une catégorie : ajouter un objet { label: '...', value: '...' }
// dans le tableau ARTICLE_CATEGORIES ci-dessous, et mettre à jour catLabels
// dans les pages frontend (blog/page.tsx, page.tsx).

import type { CollectionConfig } from 'payload'

// ─── Catégories centralisées ───────────────────────────────────────────────
// ✅ C'est ici et uniquement ici qu'on ajoute/modifie les catégories
export const ARTICLE_CATEGORIES = [
  { label: "Vie de l'établissement", value: 'vie_etablissement' },
  { label: "Portraits d'anciens",    value: 'portraits_anciens' },
  { label: 'International',          value: 'international' },
  { label: 'Événements',             value: 'evenements' },
  { label: 'Insertion professionnelle', value: 'insertion_pro' },
  { label: 'Orientation',            value: 'orientation' },
  { label: "Boîte à outils",         value: 'boite_outils' },
  { label: 'Bons plans',             value: 'bons_plans' },
]

const Articles: CollectionConfig = {
  slug: 'articles',
  admin: {
    useAsTitle: 'titre',
    group: 'Contenu',
    defaultColumns: ['titre', 'categorie', 'statut', 'auteur', 'createdAt'],
  },
  access: {
    read: () => true,
    create: ({ req: { user } }) => !!user,
    update: ({ req: { user } }) => {
      if (!user) return false
      if (user.collection === 'users') return true
      return { auteur: { equals: user.id } }
    },
    delete: ({ req: { user } }) => {
      if (!user) return false
      if (user.collection === 'users') return true
      return { auteur: { equals: user.id } }
    },
  },
  hooks: {
    beforeChange: [
      ({ req, operation, data }) => {
        if (operation === 'create' && req.user) {
          data.auteur = req.user.id
        }
        return data
      },
    ],
  },
  fields: [
    { name: 'titre',       type: 'text',     required: true, label: "Titre de l'article" },
    { name: 'slug',        type: 'text',     required: true, unique: true, label: 'Slug URL' },
    { name: 'description', type: 'textarea', required: true, label: 'Description courte (carte)' },
    { name: 'contenu',     type: 'richText', required: true, label: "Contenu de l'article" },
    {
      name: 'categorie',
      type: 'select',
      required: true,
      label: 'Catégorie',
      options: ARTICLE_CATEGORIES,
    },
    {
      name: 'statut',
      type: 'select',
      defaultValue: 'publie',
      label: 'Statut',
      options: [
        { label: 'Publié',                  value: 'publie' },
        { label: 'Brouillon',               value: 'brouillon' },
        { label: 'En attente de validation', value: 'attente' },
      ],
    },
    {
      name: 'couverture',
      type: 'upload',
      relationTo: 'media',
      required: true,
      label: 'Photo de couverture',
    },
    {
      name: 'auteur',
      type: 'relationship',
      relationTo: 'alumni',
      label: 'Auteur',
      admin: { position: 'sidebar' },
    },
  ],
}

export default Articles