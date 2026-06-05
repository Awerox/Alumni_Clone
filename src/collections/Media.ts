import type { CollectionConfig } from 'payload'
import path from 'path'

export const Media: CollectionConfig = {
  slug: 'media',
  upload: {
    staticDir: path.resolve(process.cwd(), 'media'),
    disableLocalStorage: true, // ✅ Ajouté : Cloudinary gère le stockage
  },
  access: {
    read: () => true,
    // 🎯 FIX : Autorise la création de l'image de profil par l'API de callback lors de l'inscription
    create: () => true,
    update: ({ req: { user } }) => !!user,
    delete: ({ req: { user } }) => !!user,
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: false,
    },
  ],
}

export default Media