// app/api/media/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || '',
  api_key:    process.env.CLOUDINARY_API_KEY || '',
  api_secret: process.env.CLOUDINARY_API_SECRET || '',
})

/** Slugifie un nom de fichier pour Cloudinary :
 *  - retire l'extension
 *  - remplace tout caractère non alphanumérique par un tiret
 *  - collapse les tirets multiples
 *  - limite à 60 chars pour éviter les URLs trop longues
 */
function slugifyFilename(name: string): string {
  return name
    .replace(/\.[^/.]+$/, '')           // retire l'extension
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')        // remplace espaces, accents, &, etc. par -
    .replace(/^-+|-+$/g, '')            // retire les tirets en début/fin
    .slice(0, 60)                        // limite la longueur
    || 'file'                            // fallback si tout a été retiré
}

export async function POST(req: NextRequest) {
  try {
    const payload = await getPayload({ config: configPromise })
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const alt = (formData.get('alt') as string) || ''

    if (!file) {
      return NextResponse.json({ error: 'Fichier manquant' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const ext = file.name.split('.').pop() || 'jpg'
    const timestamp = Date.now()

    // FIX CLÉ : slugifier le nom avant de construire public_id
    // "Mob Psycho Exercise GIF - Discover & Share GIFs" → "mob-psycho-exercise-gif-discover-share-gifs"
    const slugBase = slugifyFilename(file.name)
    const filename = `${slugBase}-${timestamp}.${ext}`
    const publicId = `media/${slugBase}-${timestamp}`   // aucun espace ni caractère interdit

    const mimeType = file.type
    const filesize = buffer.length

    // 1. Upload Cloudinary
    const cloudinaryUrl = await new Promise<string>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { resource_type: 'auto', public_id: publicId, overwrite: false },
        (error, result) => {
          if (error || !result) return reject(error ?? new Error('Cloudinary upload failed'))
          resolve(result.secure_url)
        },
      )
      stream.end(buffer)
    })

    // 2. INSERT SQL direct (bypass Payload filesystem)
    const doc = await payload.db.drizzle.execute(
      `INSERT INTO media (alt, url, filename, mime_type, filesize, updated_at, created_at)
       VALUES ('${alt.replace(/'/g, "''")}', '${cloudinaryUrl}', '${filename.replace(/'/g, "''")}', '${mimeType}', ${filesize}, NOW(), NOW())
       RETURNING id, alt, url, filename, mime_type, filesize`
    ) as any

    const row = doc.rows?.[0] || doc[0]

    return NextResponse.json({
      doc: {
        id: Number(row.id),
        alt: row.alt,
        url: row.url || cloudinaryUrl,
        filename: row.filename,
        mimeType: row.mime_type,
        filesize: row.filesize,
      }
    })
  } catch (err: any) {
    console.error('[POST /api/media]', err)
    return NextResponse.json({ error: err.message || 'Erreur serveur' }, { status: 500 })
  }
}