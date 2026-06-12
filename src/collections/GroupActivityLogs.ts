import type { CollectionConfig } from 'payload'

export const GroupActivityLogs: CollectionConfig = {
  slug: 'group-activity-logs',
  admin: {
    useAsTitle: 'champ',
    defaultColumns: ['groupe', 'utilisateur', 'champ', 'createdAt'],
  },
  access: {
    read: ({ req }) => !!req.user,
    create: () => true,
    update: () => false,
    delete: ({ req }) => (req.user as any)?.collection === 'users',
  },
  fields: [
    {
      name: 'groupe',
      type: 'relationship',
      relationTo: 'groups',
      required: true,
      index: true,
    },
    {
      name: 'utilisateur',
      type: 'relationship',
      relationTo: 'alumni',
      label: 'Modifié par',
    },
    {
      name: 'champ',
      type: 'text',
      required: true,
      label: 'Champ modifié',
    },
    {
      name: 'ancienneValeur',
      type: 'text',
      label: 'Ancienne valeur',
    },
    {
      name: 'nouvelleValeur',
      type: 'text',
      label: 'Nouvelle valeur',
    },
  ],
  timestamps: true,
}

export default GroupActivityLogs