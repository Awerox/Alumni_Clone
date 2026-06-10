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
  hooks: {
    afterRead: [
      async ({ doc, req }) => {
        if (!doc?.filename) return doc
        if (doc.url?.startsWith('http')) return doc // ✅ déjà Cloudinary, rien à faire

        // Fallback SQL — ne devrait se déclencher que si Payload a recalculé l'url
        try {
          const result = await req.payload.db.drizzle.execute(
            `SELECT url FROM media WHERE id = ${doc.id} LIMIT 1`
          ) as any
          const row = result.rows?.[0] || result[0]
          if (row?.url) doc.url = row.url
        } catch (e) {
          console.error('[Media afterRead] Erreur SQL:', e)
        }

        return doc
      },
    ],
  },
  fields: [
    { name: 'alt', type: 'text', required: false },
    {
      name: 'url',
      type: 'text',
      admin: {
        readOnly: true,
        position: 'sidebar',
        description: 'URL Cloudinary (auto)',
      },
    },
  ],
}

export default Media