import type { CollectionConfig } from 'payload'

export const Posts: CollectionConfig = {
  slug: 'posts',
  admin: {
    useAsTitle: 'contenu',
    group: 'Communauté',
    defaultColumns: ['auteur', 'createdAt'],
  },
  access: {
    read: () => true,
    create: ({ req: { user } }) => !!user,
    update: ({ req: { user } }) =>
      user?.collection === 'users' ? true : { auteur: { equals: user?.id } },
    delete: ({ req: { user } }) =>
      user?.collection === 'users' ? true : { auteur: { equals: user?.id } },
  },
  hooks: {
    beforeChange: [
      ({ req, operation, data }) => {
        if (operation === 'create' && req.user) data.auteur = req.user.id
        return data
      },
    ],
  },
  fields: [
    { name: 'contenu', type: 'textarea', required: true, label: 'Message (Max 500 car.)' },
    { name: 'image', type: 'upload', relationTo: 'media', label: 'Image jointe (Optionnel)' },
    {
      name: 'auteur',
      type: 'relationship',
      relationTo: 'alumni',
      required: true,
      admin: { position: 'sidebar' },
    },
  ],
}
export default Posts
