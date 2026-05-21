import type { CollectionConfig } from 'payload'

export const Offres: CollectionConfig = {
  slug: 'offres',
  admin: {
    useAsTitle: 'poste',
    group: 'Opportunités',
    defaultColumns: ['poste', 'entreprise', 'typeContrat', 'statut', 'createdAt'],
  },
  access: {
    read: () => true,
    create: ({ req: { user } }) => !!user,
    update: () => true,
    delete: () => true,
  },
  hooks: {
    beforeChange: [
      ({ req, operation, data }) => {
        if (operation === 'create' && req.user) data.recruteur = req.user.id
        return data
      },
    ],
  },
  fields: [
    { name: 'poste', type: 'text', required: true, label: 'Intitulé du poste' },
    { name: 'entreprise', type: 'text', required: true, label: 'Entreprise / EIRL' },
    {
      name: 'typeContrat',
      type: 'select',
      required: true,
      options: [
        { label: 'CDI', value: 'CDI' },
        { label: 'CDD', value: 'CDD' },
        { label: 'Alternance', value: 'Alternance' },
        { label: 'Stage', value: 'Stage' },
        { label: 'Indépendant', value: 'Independant' },
      ],
    },
    { name: 'localisation', type: 'text', defaultValue: 'PARIS' },
    { name: 'description', type: 'textarea', label: 'Détails ou lien de candidature' },

    // ✅ CHAMP MANQUANT — Ajouté pour corriger le QueryError
    {
      name: 'statut',
      type: 'select',
      defaultValue: 'publie',
      label: "Statut de l'annonce",
      options: [
        { label: 'Publié', value: 'publie' },
        { label: 'Brouillon', value: 'brouillon' },
      ],
      admin: { position: 'sidebar' },
    },

    // Champs supplémentaires envoyés par le formulaire
    { name: 'secteur', type: 'text', label: "Secteur d'activité" },
    { name: 'remuneration', type: 'text', label: 'Rémunération' },
    { name: 'experience', type: 'text', label: 'Expérience requise' },
    { name: 'dateDebut', type: 'date', label: 'Date de début' },
    { name: 'dateLimite', type: 'date', label: 'Date limite de candidature' },
    { name: 'logo', type: 'upload', relationTo: 'media', label: 'Logo entreprise' },
    { name: 'documentJoint', type: 'upload', relationTo: 'media', label: 'Pièce jointe' },

    // Champs de restriction de visibilité
    {
      name: 'restreindreDiplomes',
      type: 'select',
      hasMany: true,
      label: 'Restreindre aux diplômes',
      options: [
        { label: 'BTS', value: 'bts' },
        { label: 'DCG3', value: 'dcg3' },
        { label: 'Prépa', value: 'prepa' },
      ],
    },
    {
      name: 'restreindreCampus',
      type: 'select',
      hasMany: true,
      label: 'Restreindre aux campus',
      options: [
        { label: 'ENC Bessières', value: 'enc_bessieres' },
        { label: 'ENC Bessières Apprentissage', value: 'enc_bessieres_apprentissage' },
      ],
    },
    {
      name: 'restreindrePromotions',
      type: 'select',
      hasMany: true,
      label: 'Restreindre aux promotions',
      options: ['2026', '2027', '2028', '2029', '2030', '2031'].map((y) => ({
        label: y,
        value: y,
      })),
    },

    {
      name: 'recruteur',
      type: 'relationship',
      relationTo: 'alumni',
      admin: { position: 'sidebar' },
    },
  ],
}

export default Offres
