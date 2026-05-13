import type { CollectionConfig } from 'payload'

export const Media: CollectionConfig = {
  slug: 'media',
  upload: true, // Active le stockage de fichiers
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
    },
  ],
}