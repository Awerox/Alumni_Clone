import type { CollectionConfig } from 'payload'

export const Groups: CollectionConfig = {
  slug: 'groups',
  admin: {
    useAsTitle: 'titre',
    defaultColumns: ['titre', 'categorie', 'isPublic', 'createdAt'],
  },
  // 🔐 SÉCURITÉ : RESTRICTIONS D'ACCÈS
  access: {
    read: () => true, // Tout le monde peut voir les groupes
    create: ({ req: { user } }) => !!user, // Il faut être connecté pour créer

    // 🔥 SEUL LE CRÉATEUR (ou un Admin) PEUT MODIFIER LE GROUPE
    update: ({ req: { user } }) => {
      if (!user) return false
      if (user.collection === 'users') return true // Les Admins ont tous les droits
      return {
        createur: {
          equals: user.id, // Verrouille l'accès au créateur uniquement
        },
      }
    },

    // 🔥 SEUL LE CRÉATEUR (ou un Admin) PEUT SUPPRIMER LE GROUPE
    delete: ({ req: { user } }) => {
      if (!user) return false
      if (user.collection === 'users') return true
      return {
        createur: {
          equals: user.id,
        },
      }
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
    // 🤖 AUTOMATISATION : Enregistre l'ID de la personne qui crée le groupe
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
        { label: 'Projets Informatiques (SIO)', value: 'bts_sio' },
        { label: 'Entrepreneuriat & Startups', value: 'entrepreneuriat' },
        { label: 'Vie Étudiante & Associations', value: 'vie_etudiante' },
        { label: 'Entraide & Mentorat', value: 'entraide' },
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
      label: 'Image d’en-tête / Bannière',
      required: true,
    },
    { name: 'isPublic', type: 'checkbox', label: 'Groupe Public', defaultValue: true },

    // Champs de restriction
    { name: 'restrictDiplome', type: 'text', label: 'Restriction Diplôme' },
    { name: 'restrictCampus', type: 'text', label: 'Restriction Campus' },
    { name: 'restrictCategorie', type: 'text', label: 'Restriction Catégorie' },
    { name: 'restrictPromotion', type: 'text', label: 'Restriction Promotion' },

    {
      name: 'membres',
      type: 'relationship',
      relationTo: 'alumni',
      hasMany: true,
      label: 'Membres inscrits',
    },

    // 👤 NOUVEAU CHAMP : Stocke le propriétaire du groupe
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
