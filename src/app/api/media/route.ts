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
const filename = `${file.name.replace(/\.[^/.]+$/, '')}-${Date.now()}.${ext}`
    const mimeType = file.type
    const filesize = buffer.length

    // 1. Upload vers Cloudinary d'abord
    const cloudinaryUrl = await new Promise<string>((resolve, reject) => {
      const publicId = `media/${filename.replace(/\.[^/.]+$/, '')}-${Date.now()}`
      const stream = cloudinary.uploader.upload_stream(
        { resource_type: 'auto', public_id: publicId, overwrite: false },
        (error, result) => {
          if (error || !result) return reject(error ?? new Error('Cloudinary upload failed'))
          resolve(result.secure_url)
        },
      )
      stream.end(buffer)
    })

    // 2. Créer le doc Media dans Payload SANS passer le fichier
    // On injecte directement l'URL Cloudinary via SQL pour contourner
    // le système de fichiers local de Payload
    const doc = await payload.db.drizzle.execute(
  `INSERT INTO media (alt, url, filename, mime_type, filesize, updated_at, created_at)
   VALUES ('${alt.replace(/'/g, "''")}', '${cloudinaryUrl}', '${filename.replace(/'/g, "''")}', '${mimeType}', ${filesize}, NOW(), NOW())
   RETURNING id, alt, url, filename, mime_type, filesize`
) as any

    const row = doc.rows?.[0] || doc[0]

    return NextResponse.json({
      doc: {
        id: row.id,
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