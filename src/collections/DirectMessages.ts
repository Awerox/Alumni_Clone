import type { CollectionConfig } from 'payload'

export const DirectMessages: CollectionConfig = {
  slug: 'direct-messages',
  admin: {
    useAsTitle: 'message',
    group: 'Communauté',
    defaultColumns: ['from', 'to', 'message', 'createdAt'],
  },
  access: {
    read: (args: any): any => {
      const user = args?.req?.user
      if (!user) return false
      // Administrateurs : accès total
      if (user.collection === 'users') return true
      // Alumni : uniquement leurs propres messages
      return {
        or: [
          { from: { equals: user.id } },
          { to: { equals: user.id } },
        ],
      }
    },
    create: (args: any) => !!args?.req?.user,
    update: () => false,
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
      required: false, // false pour permettre les messages avec fichier uniquement
      label: 'Contenu du message',
    },
    {
      name: 'file',
      type: 'upload',
      relationTo: 'media',
      label: 'Fichier joint / Image',
      required: false,
    },
  ],
  timestamps: true,
}

export default DirectMessages
