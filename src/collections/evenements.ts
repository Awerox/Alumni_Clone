import type { CollectionConfig } from 'payload'

export const Evenements: CollectionConfig = {
  slug: 'evenements',
  admin: {
    useAsTitle: 'nom',
    group: 'Contenu',
    defaultColumns: ['nom', 'categorie', 'dateDebut', 'statut'],
  },
  access: {
    read: () => true,
    create: ({ req: { user } }) => !!user,
    update: ({ req: { user } }) => {
      if (!user) return false
      if (user.collection === 'users') return true
      return { organisateur: { equals: user.id } }
    },
    delete: ({ req: { user } }) => {
      if (!user) return false
      if (user.collection === 'users') return true
      return { organisateur: { equals: user.id } }
    },
  },
  hooks: {
    beforeChange: [
      ({ req, operation, data }) => {
        if (operation === 'create' && req.user) {
          data.organisateur = req.user.id
        }
        return data
      },
    ],
  },
  fields: [
    { name: 'nom', type: 'text', required: true, label: "Nom de l'événement" },
    { name: 'slug', type: 'text', required: true, unique: true },
    {
      name: 'typeLocalisation',
      type: 'radio',
      required: true,
      defaultValue: 'presentiel',
      options: [
        { label: 'En présentiel', value: 'presentiel' },
        { label: 'En ligne', value: 'enligne' },
      ],
      label: "Localisation de l'événement",
    },
    { name: 'dateDebut', type: 'date', required: true, label: 'Date de début' },
    { name: 'dateFin', type: 'date', required: true, label: 'Date de fin' },
    {
      name: 'categorie',
      type: 'select',
      required: true,
      options: [
        { label: 'Conférence', value: 'conference' },
        { label: 'Réseautage', value: 'reseau' },
        { label: 'Formation', value: 'formation' },
        { label: 'Cérémonie de remise des diplômes', value: 'ceremonie' },
        { label: 'Gala', value: 'gala' },
        { label: 'Atelier', value: 'atelier' },
        { label: 'Table ronde', value: 'table_ronde' },
        { label: 'Webinaire', value: 'webinaire' },
        { label: 'Réunion annuelle', value: 'reunion' },
        { label: 'Journée portes ouvertes', value: 'jpo' },
        { label: 'Salon', value: 'salon' },
      ],
    },
    { name: 'description', type: 'richText', required: true, label: 'Description' },
    {
      name: 'modeInscription',
      type: 'radio',
      required: true,
      defaultValue: 'plateforme',
      options: [
        { label: 'Inscription via la plateforme', value: 'plateforme' },
        { label: "Lien d'inscription externe", value: 'externe' },
        { label: 'Événement sans inscription', value: 'libre' },
      ],
      label: 'Comment souhaitez-vous recevoir les inscriptions ?',
    },
    { name: 'lienExterne', type: 'text', label: "Lien d'inscription externe (Si applicable)" },
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
    {
      name: 'organisateur',
      type: 'relationship',
      relationTo: 'alumni',
      admin: { position: 'sidebar' },
    },

    // Système de suivi des participations (Relation multiple)
    {
      name: 'participants',
      type: 'relationship',
      relationTo: 'alumni',
      hasMany: true,
      label: 'Membres inscrits',
    },
  ],
}

export default Evenements