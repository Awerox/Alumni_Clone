import type { CollectionConfig } from 'payload'

export const Alumni: CollectionConfig = {
  slug: 'alumni',
  auth: true, // Active l'authentification (email/password)
  admin: {
    useAsTitle: 'nom',
    group: 'Utilisateurs',
    defaultColumns: ['prenom', 'nom', 'email', 'statut'],
  },
  access: {
    admin: ({ req: { user } }) => Boolean(user),
    read: () => true,
    create: () => true,
    update: ({ req: { user } }) => {
      if (!user) return false
      if (user.collection === 'users') return true // L'admin peut tout modifier
      return { id: { equals: user.id } } // L'utilisateur modifie son propre profil
    },
  },
  fields: [
    // --- IDENTITÉ ---
    {
      type: 'row',
      fields: [
        { name: 'prenom', type: 'text', required: true },
        { name: 'nom', type: 'text', required: true },
      ],
    },
    {
      name: 'statut',
      type: 'select',
      defaultValue: 'etudiant',
      options: [
        { label: 'Étudiant', value: 'etudiant' },
        { label: 'Alumni', value: 'alumni' },
      ],
    },
    { name: 'bio', type: 'textarea', label: 'Résumé du profil' },

    // --- COORDONNÉES ---
    {
      type: 'row',
      fields: [
        { name: 'telephone', type: 'text', label: 'Numéro de téléphone' },
        { name: 'ville', type: 'text', label: 'Localisation (Ville)' },
      ],
    },

    // --- PARCOURS & PRO ---
    { name: 'diplome', type: 'text', label: 'Dernier diplôme à l\'ENC' },
    { name: 'promotion', type: 'number', label: 'Année de promotion' },
    {
      type: 'row',
      fields: [
        { name: 'poste', type: 'text', label: 'Poste actuel' },
        { name: 'entreprise', type: 'text', label: 'Entreprise actuelle' },
      ],
    },

    // --- EXPÉRIENCES PROFESSIONNELLES (Liste dynamique) ---
    {
      name: 'experiences',
      type: 'array',
      label: 'Historique des expériences',
      fields: [
        { name: 'poste', type: 'text', required: true, label: 'Fonction' },
        { name: 'entreprise', type: 'text', required: true, label: 'Entreprise' },
        { name: 'localite', type: 'text', required: true, label: 'Localisation' },
        { name: 'isCurrent', type: 'checkbox', label: 'J\'occupe actuellement cette fonction', defaultValue: false },
        { name: 'dateDebut', type: 'text', required: true, label: 'Date de début (MM/AAAA)' },
        { name: 'dateFin', type: 'text', label: 'Date de fin (MM/AAAA)' },
        { name: 'description', type: 'textarea', label: 'Description des missions' },
        // Informations complémentaires / Statistiques
        { name: 'matchFormation', type: 'checkbox', label: 'Cet emploi correspond à mon domaine de formation', defaultValue: false },
        { name: 'secteur', type: 'text', label: 'Secteur d\'activité de l\'entreprise' },
        { name: 'typeContrat', type: 'text', label: 'Type de contrat' },
        { name: 'isCadre', type: 'checkbox', label: 'Statut cadre', defaultValue: false },
        { name: 'remuneration', type: 'text', label: 'Rémunération annuelle brute' },
        { name: 'provenanceEmploi', type: 'text', label: 'Comment avez-vous trouvé cet emploi ?' },
      ],
    },

    // --- FORMATIONS (Liste dynamique) ---
    {
      name: 'formations',
      type: 'array',
      label: 'Parcours scolaire',
      fields: [
        { name: 'nom', type: 'text', required: true },
        { name: 'etablissement', type: 'text', required: true },
        { name: 'annee', type: 'text', label: 'Année d\'obtention' },
        { name: 'isENC', type: 'checkbox', label: 'Diplôme de l\'ENC ?', defaultValue: false },
      ],
    },

    // --- CENTRES D'INTÉRÊT ---
    {
      name: 'interets',
      type: 'array',
      label: 'Centres d\'intérêt',
      fields: [
        { name: 'nom', type: 'text', required: true },
      ],
    },

    // --- CV, PORTFOLIO & RÉSEAUX SOCIAUX (JSON pour plus de flexibilité) ---
    {
      name: 'socialLinks',
      type: 'json',
      label: 'Liens externes (CV, Portfolio, Réseaux)',
      admin: {
        description: 'Stocke les icônes, labels et URLs/IDs de fichiers.',
      },
    },

    // --- MÉDIAS & PARAMÈTRES ---
    { name: 'photo', type: 'upload', relationTo: 'media', label: 'Photo de profil' },
    { name: 'isMentor', type: 'checkbox', label: 'Membre Mentor', defaultValue: false },
    
    // Champs pour les réseaux sociaux fixes (Sidebar)
    { name: 'linkedin', type: 'text', label: 'Lien LinkedIn' },
    { name: 'instagram', type: 'text', label: 'Lien Instagram' },
  ],
}