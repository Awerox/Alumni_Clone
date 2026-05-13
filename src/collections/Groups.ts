import type { CollectionConfig } from 'payload'

export const Groups: CollectionConfig = {
  slug: 'groups',
  admin: { useAsTitle: 'titre' },
  fields: [
    { name: 'titre', type: 'text', required: true }, // [cite: 259]
    { name: 'description', type: 'textarea', required: true }, // [cite: 263]
    { name: 'miniature', type: 'upload', relationTo: 'media' }, // [cite: 261]
    {
      name: 'membres',
      type: 'relationship',
      relationTo: 'alumni',
      hasMany: true,
    },
    {
      name: 'isPublic',
      type: 'checkbox',
      label: 'Groupe public', // [cite: 270]
      defaultValue: true,
    },
  ],
}