import type { CollectionConfig } from 'payload'

export const Alumni: CollectionConfig = {
  slug: 'alumni',
  // Active l'authentification pour cette collection
  auth: true, 
  admin: {
    useAsTitle: 'nom',
    group: 'Utilisateurs',
    // On définit le champ à afficher dans les listes
    defaultColumns: ['prenom', 'nom', 'email', 'statut'],
  },
  // --- PROTECTION DU PANEL ADMIN ---
  access: {
    // CORRECTION : Autorise l'accès si un utilisateur est authentifié, 
    // quelle que soit sa collection (Users ou Alumni)
    admin: ({ req: { user } }) => {
      return Boolean(user)
    },
    // Tout le monde peut voir les profils (important pour l'annuaire)
    read: () => true,
    // Création libre (pour le formulaire d'inscription frontend)
    create: () => true,
    // CORRECTION : Un utilisateur peut modifier uniquement son propre profil
    update: ({ req: { user } }) => {
      if (!user) return false
      
      // Si c'est un administrateur (collection 'users'), il peut tout modifier
      if (user.collection === 'users') return true
      
      // Si c'est un alumni, il ne peut modifier que son propre ID
      return {
        id: {
          equals: user.id,
        },
      }
    },
    // Seul un admin peut supprimer un profil
    delete: ({ req: { user } }) => {
      return user?.collection === 'users'
    },
  },
  fields: [
    {
      type: 'row',
      fields: [
        {
          name: 'prenom',
          type: 'text',
          required: true,
          label: 'Prénom',
        },
        {
          name: 'nom',
          type: 'text',
          required: true,
          label: 'Nom',
        },
      ],
    },
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'community',
      options: [
        { label: 'Community', value: 'community' },
        { label: 'Recruteur', value: 'recruteur' },
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
    {
      name: 'promotion',
      type: 'number',
      admin: {
        placeholder: 'Ex: 2026',
      },
    },
    {
      name: 'diplome',
      type: 'text',
      label: 'Diplôme (ex: BTS SIO SLAM)',
    },
    {
      name: 'poste',
      type: 'text',
      label: 'Poste actuel',
    },
    {
      name: 'entreprise',
      type: 'text',
    },
    {
      name: 'ville',
      type: 'text',
    },
    {
      name: 'isMentor',
      type: 'checkbox',
      label: 'Volontaire pour le mentorat',
      defaultValue: false,
    },
    {
      name: 'photo',
      type: 'upload',
      relationTo: 'media',
    },
  ],
}