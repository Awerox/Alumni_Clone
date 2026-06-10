// collections/Media.ts
import type { CollectionConfig } from 'payload'
import path from 'path'

export const Media: CollectionConfig = {
  slug: 'media',
  upload: {
    staticDir: path.resolve(process.cwd(), 'media'),
    disableLocalStorage: true,
  },
  access: {
    read:   () => true,
    create: () => true,
    update: ({ req: { user } }) => !!user,
    delete: ({ req: { user } }) => !!user,
  },
  fields: [
    { name: 'alt', type: 'text', required: false },
  ],
}

export default Media