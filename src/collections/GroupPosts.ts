// src/collections/GroupPosts.ts
import type { CollectionConfig } from 'payload'

export const GroupPosts: CollectionConfig = {
  slug: 'group-posts',
  admin: {
    useAsTitle: 'content',
    group: 'Communauté',
    defaultColumns: ['group', 'author', 'createdAt'],
  },
  access: {
    read: () => true,
    create: ({ req: { user } }) => !!user,
    update: ({ req: { user } }) => {
      if (!user) return false
      if ((user as any).collection === 'users') return true
      return { author: { equals: user.id } }
    },
    delete: ({ req: { user } }) => {
      if (!user) return false
      if ((user as any).collection === 'users') return true
      return { author: { equals: user.id } }
    },
  },
  fields: [
    {
      name: 'group',
      type: 'relationship',
      relationTo: 'groups',
      required: true,
      label: 'Groupe',
      admin: { position: 'sidebar' },
    },
    {
      name: 'author',
      type: 'relationship',
      relationTo: 'alumni',
      required: true,
      label: 'Auteur',
      admin: { position: 'sidebar' },
    },
    {
      name: 'content',
      type: 'textarea',
      label: 'Contenu du post',
      required: false,
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      label: 'Image jointe',
      required: false,
    },
    {
      name: 'type',
      type: 'select',
      label: 'Type de publication',
      defaultValue: 'post',
      options: [
        { label: 'Post', value: 'post' },
        { label: 'Annonce', value: 'annonce' },
        { label: 'Événement', value: 'evenement' },
      ],
    },
  ],
  timestamps: true,
}

export default GroupPosts