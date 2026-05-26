import type { CollectionConfig } from 'payload'

export const Discussions: CollectionConfig = {
  slug: 'discussions',
  admin: {
    useAsTitle: 'titre',
    group: 'Communauté',
  },
  access: {
    read: () => true,
    create: ({ req: { user } }) => !!user,
    update: ({ req: { user } }) => !!user,
    delete: ({ req: { user } }) => user?.collection === 'users',
  },
  fields: [
    { name: 'titre', type: 'text', required: true, label: 'Sujet de discussion' },
    { name: 'contenu', type: 'textarea', required: true, label: 'Message principal' },
    {
      name: 'auteur',
      type: 'relationship',
      relationTo: 'alumni',
      required: true,
      admin: { position: 'sidebar' },
    },
    {
      name: 'commentaires',
      type: 'array',
      label: 'Commentaires / Réponses',
      fields: [
        {
          name: 'auteur',
          type: 'relationship',
          relationTo: 'alumni',
          required: true,
        },
        { name: 'message', type: 'textarea', required: true },
        { name: 'createdAt', type: 'date', defaultValue: () => new Date().toISOString() },
      ],
    },
  ],
}
export default Discussions