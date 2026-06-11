import type { CollectionConfig } from 'payload'

export const Groups: CollectionConfig = {
  slug: 'groups',
  admin: {
    useAsTitle: 'titre',
    defaultColumns: ['titre', 'categorie', 'isPublic', 'createdAt'],
  },
  access: {
    read: () => true,
    create: ({ req: { user } }) => !!user,
    update: ({ req: { user } }) => {
      if (!user) return false
      if (user.collection === 'users') return true
      return { createur: { equals: user.id } }
    },
    delete: ({ req: { user } }) => {
      if (!user) return false
      if (user.collection === 'users') return true
      return { createur: { equals: user.id } }
    },
  },
  hooks: {
    beforeValidate: [
      ({ data }) => {
        if (data && !data.slug && data.titre) {
          data.slug = data.titre
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)+/g, '')
        }
        return data
      },
    ],
    beforeChange: [
      ({ req, operation, data }) => {
        if (operation === 'create' && req.user && req.user.collection === 'alumni') {
          data.createur = req.user.id
        }
        return data
      },
    ],
  },
  fields: [
    { name: 'titre', type: 'text', label: 'Nom du groupe', required: true },
    { name: 'slug', type: 'text', label: 'Slug (URL unique)', required: true, unique: true },
    {
      name: 'categorie',
      type: 'select',
      label: 'Catégorie du groupe',
      required: true,
      options: [
        { label: 'Académique',    value: 'academique' },
        { label: 'Culturel',      value: 'culturel' },
        { label: 'Artistique',    value: 'artistique' },
        { label: 'Sportif',       value: 'sportif' },
        { label: 'Environnement', value: 'environnement' },
        { label: 'Solidarité',    value: 'solidarite' },
        { label: 'Professionnel', value: 'professionnel' },
        { label: 'Loisir',        value: 'loisir' },
        { label: 'Autre',         value: 'autre' },
      ],
    },
    { name: 'description', type: 'textarea', label: 'Description du groupe', required: true },
    {
      name: 'miniature',
      type: 'upload',
      relationTo: 'media',
      label: 'Image Miniature',
      required: true,
    },
    {
      name: 'banniere',
      type: 'upload',
      relationTo: 'media',
      label: "Image d'en-tête / Bannière",
      required: true,
    },
    { name: 'isPublic', type: 'checkbox', label: 'Groupe Public', defaultValue: true },
    { name: 'restrictDiplome',   type: 'text', label: 'Restriction Diplôme' },
    { name: 'restrictCampus',    type: 'text', label: 'Restriction Campus' },
    { name: 'restrictCategorie', type: 'text', label: 'Restriction Catégorie' },
    { name: 'restrictPromotion', type: 'text', label: 'Restriction Promotion' },
    {
      name: 'membres',
      type: 'relationship',
      relationTo: 'alumni',
      hasMany: true,
      label: 'Membres inscrits',
    },
    {
      name: 'createur',
      type: 'relationship',
      relationTo: 'alumni',
      admin: {
        position: 'sidebar',
        description: 'Le créateur du groupe (Attribué automatiquement)',
      },
    },
  ],
  timestamps: true,
}

export default Groups