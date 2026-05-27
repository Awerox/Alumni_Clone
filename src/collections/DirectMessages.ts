import type { CollectionConfig } from 'payload'

export const DirectMessages: CollectionConfig = {
  slug: 'direct-messages',
  admin: {
    useAsTitle: 'message',
    group: 'Communauté',
    defaultColumns: ['from', 'to', 'message', 'createdAt'],
  },
  access: {
    // 🎯 CORRECTION FINALE : Retour d'une structure "or" ou d'un booléen strict via typage explicite de la fonction d'accès
    read: (args: any): any => {
      const user = args?.req?.user
      
      // Si pas d'utilisateur connecté : on bloque l'accès
      if (!user) return false
      
      // Si c'est un administrateur général : on donne un accès total
      if (user.collection === 'users') return true
      
      // Pour les membres Alumni : structure homogène stricte
      return {
        or: [
          { from: { equals: user.id } },
          { to: { equals: user.id } },
        ],
      }
    },
    create: (args: any) => !!args?.req?.user,
    update: () => false, // Non modifiable par souci d'authenticité
    delete: (args: any) => args?.req?.user?.collection === 'users',
  },
  fields: [
    {
      name: 'from',
      type: 'relationship',
      relationTo: 'alumni',
      required: true,
      label: 'Expéditeur',
    },
    {
      name: 'to',
      type: 'relationship',
      relationTo: 'alumni',
      required: true,
      label: 'Destinataire',
    },
    {
      name: 'message',
      type: 'textarea',
      required: true,
      label: 'Contenu du message',
    },
  ],
  timestamps: true,
}

export default DirectMessages