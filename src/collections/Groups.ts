import type { CollectionConfig } from 'payload'

export const Groups: CollectionConfig = {
  slug: 'groups',
  admin: {
    useAsTitle: 'titre',
    defaultColumns: ['titre', 'slug', 'categorie', 'isPublic', 'createdAt'],
  },
  // 🔐 Configuration des accès (Sécurité et conformité pour ton examen BTS SIO)
  access: {
    read: () => true, // Tout le monde peut voir et lister les groupes
    create: ({ req: { user } }) => !!user, // Seuls les utilisateurs connectés (Alumni ou User) peuvent créer un groupe
    update: ({ req: { user } }) => !!user, // Nécessaire pour permettre aux membres de rejoindre/quitter le groupe
    delete: ({ req: { user } }) => {
      if (!user) return false
      if (user.collection === 'users') return true // Les administrateurs de la plateforme ont tous les droits
      return true // Permet aux utilisateurs connectés de gérer leurs suppressions si nécessaire
    },
  },
  // ⚡ Hooks pour automatiser et sécuriser la création du slug unique
  hooks: {
    beforeValidate: [
      ({ data }) => {
        if (data && !data.slug && data.titre) {
          data.slug = data.titre
            .toLowerCase()
            .normalize('NFD') // Supprime proprement les accents français (é, è, à...)
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-') // Remplace les espaces, caractères spéciaux et ponctuations par des tirets
            .replace(/(^-|-$)+/g, '') // Supprime les tirets résiduels au début et à la fin du slug
        }
        return data
      },
    ],
  },
  fields: [
    {
      name: 'titre',
      type: 'text',
      label: 'Nom du groupe',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      label: 'Slug (URL unique)',
      required: true,
      unique: true,
      admin: {
        description: 'Généré automatiquement à partir du titre si laissé vide.',
      },
    },
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
      admin: {
        description: 'Sélectionnez la thématique principale associée à ce cercle.',
      },
    },
    {
      name: 'description',
      type: 'textarea',
      label: 'Description du groupe',
      required: true,
    },
    {
      name: 'miniature',
      type: 'upload',
      relationTo: 'media', // Relation vers ta collection Media
      label: 'Miniature / Image carrée (Taille recommandée : 300 × 300)',
      required: true,
    },
    {
      name: 'banniere',
      type: 'upload',
      relationTo: 'media', // Deuxième relation média pour l'en-tête de la fiche de détail
      label: 'Image d’en-tête / Bannière (Taille recommandée : 800 × 480)',
      required: true,
    },
    {
      name: 'isPublic',
      type: 'checkbox',
      label: 'Groupe Public (Ouvert à tous)',
      defaultValue: true,
    },
    {
      name: 'membres',
      type: 'relationship',
      relationTo: 'alumni', // Lié à ton annuaire des membres
      hasMany: true, // Permet d'associer un tableau d'identifiants
      label: 'Membres inscrits',
    },
  ],
  timestamps: true, // Génère les métadonnées de suivi createdAt et updatedAt
}

export default Groups
