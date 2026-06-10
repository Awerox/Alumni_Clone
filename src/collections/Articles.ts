// collections/Articles.ts
import type { CollectionConfig } from 'payload'

export const ARTICLE_CATEGORIES = [
  { label: "Vie de l'établissement", value: 'vie_etablissement' },
  { label: "Portraits d'anciens",    value: 'portraits_anciens' },
  { label: 'International',          value: 'international' },
  { label: 'Événements',             value: 'evenements' },
  { label: 'Insertion professionnelle', value: 'insertion_pro' },
  { label: 'Orientation',            value: 'orientation' },
  { label: 'Boîte à outils',         value: 'boite_outils' },
  { label: 'Bons plans',             value: 'bons_plans' },
]

const Articles: CollectionConfig = {
  slug: 'articles',
  admin: {
    useAsTitle: 'titre',
    group: 'Contenu',
    defaultColumns: ['titre', 'categorie', 'statut', 'datePublication', 'auteur', 'createdAt'],
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
    // contenu stocké en HTML (généré par Tiptap côté frontend)
    { name: 'contenu',     type: 'textarea', required: true, label: "Contenu HTML de l'article" },
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
      defaultValue: 'brouillon',
      label: 'Statut',
      options: [
        { label: 'Publié',                   value: 'publie' },
        { label: 'Brouillon',                value: 'brouillon' },
        { label: 'Publication planifiée',    value: 'planifie' },
        { label: 'En attente de validation', value: 'attente' },
      ],
    },
    {
      // Date/heure de publication planifiée
      // Si statut = 'planifie' et datePublication <= now → publié automatiquement à la lecture
      name: 'datePublication',
      type: 'date',
      label: 'Date de publication planifiée',
      admin: {
        date: { pickerAppearance: 'dayAndTime' },
        description: 'Laisser vide pour publier immédiatement. Utilisé uniquement si statut = "Publication planifiée".',
        condition: (data) => data?.statut === 'planifie',
      },
    },
    {
      name: 'couverture',
      type: 'upload',
      relationTo: 'media',
      required: true,
      label: 'Photo de couverture',
    },
    {
      name: 'pieceJointe',
      type: 'upload',
      relationTo: 'media',
      label: 'Pièce jointe (PDF, document…)',
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