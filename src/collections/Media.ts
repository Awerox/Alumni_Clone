// collections/Media.ts
// Cloudinary géré via hooks — pas de plugin externe requis

import type { CollectionConfig } from 'payload'
import path from 'path'
import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || '',
  api_key:    process.env.CLOUDINARY_API_KEY || '',
  api_secret: process.env.CLOUDINARY_API_SECRET || '',
})

async function uploadToCloudinary(buffer: Buffer, filename: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const publicId = `media/${filename.replace(/\.[^/.]+$/, '')}`
    const stream = cloudinary.uploader.upload_stream(
      { resource_type: 'auto', public_id: publicId, overwrite: true },
      (error, result) => {
        if (error || !result) return reject(error ?? new Error('Upload failed'))
        resolve(result.secure_url)
      },
    )
    stream.end(buffer)
  })
}

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
    afterChange: [
      async ({ doc, req, operation }) => {
        if (operation !== 'create') return doc
        if (!req.file?.data) return doc

        try {
          const url = await uploadToCloudinary(req.file.data, doc.filename)
          // Met à jour l'URL en base
          await req.payload.update({
            collection: 'media',
            id: doc.id,
            overrideAccess: true,
            data: { url } as any,
          })
          return { ...doc, url }
        } catch (err) {
          console.error('[Media] Cloudinary upload error:', err)
          return doc
        }
      },
    ],
    afterDelete: [
      async ({ doc }) => {
        try {
          const publicId = `media/${String(doc.filename).replace(/\.[^/.]+$/, '')}`
          await cloudinary.uploader.destroy(publicId)
        } catch (err) {
          console.error('[Media] Cloudinary delete error:', err)
        }
      },
    ],
  },
  fields: [
    { name: 'alt', type: 'text', required: false },
    // URL Cloudinary stockée ici après l'upload
    { name: 'url', type: 'text', admin: { readOnly: true } },
  ],
}

export default Media