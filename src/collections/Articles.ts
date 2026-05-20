import type { CollectionConfig } from 'payload'

export const Articles: CollectionConfig = {
  slug: 'articles',
  admin: {
    useAsTitle: 'titre',
    group: 'Contenu',
    defaultColumns: ['titre', 'categorie', 'statut', 'createdAt'],
  },
  access: {
    read: () => true, // Tout le monde peut lire les articles
    create: ({ req: { user } }) => !!user, // Il faut être connecté
    update: ({ req: { user } }) => {
      if (!user) return false
      if (user.collection === 'users') return true // L'admin peut tout modifier
      return { auteur: { equals: user.id } } // Un utilisateur modifie ses propres articles
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
    { name: 'titre', type: 'text', required: true, label: "Titre de l'article" },
    { name: 'slug', type: 'text', required: true, unique: true },
    { name: 'description', type: 'textarea', required: true, label: 'Description courte (Card)' },
    { name: 'contenu', type: 'richText', required: true, label: "Contenu de l'article" },
    {
      name: 'categorie',
      type: 'select',
      required: true,
      options: [
        { label: "Vie de l'établissement", value: 'vie_etablissement' },
        { label: "Portraits d'anciens", value: 'portraits_anciens' },
        { label: 'International', value: 'international' },
        { label: 'Événements', value: 'evenements' },
      ],
    },
    {
      name: 'statut',
      type: 'select',
      defaultValue: 'publie',
      options: [
        { label: 'Publié', value: 'publie' },
        { label: 'Brouillon', value: 'brouillon' },
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
    { name: 'auteur', type: 'relationship', relationTo: 'alumni', admin: { position: 'sidebar' } },
  ],
}

export default Articles
