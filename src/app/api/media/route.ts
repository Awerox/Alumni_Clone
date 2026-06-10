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
    const timestamp = Date.now()
    const baseName = file.name.replace(/\.[^/.]+$/, '')
    const filename = `${baseName}-${timestamp}.${ext}`
    const publicId = `media/${baseName}-${timestamp}`
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

    // 2. INSERT SQL direct
    const doc = await payload.db.drizzle.execute(
      `INSERT INTO media (alt, url, filename, mime_type, filesize, updated_at, created_at)
       VALUES ('${alt.replace(/'/g, "''")}', '${cloudinaryUrl}', '${filename.replace(/'/g, "''")}', '${mimeType}', ${filesize}, NOW(), NOW())
       RETURNING id, alt, url, filename, mime_type, filesize`
    ) as any

    const row = doc.rows?.[0] || doc[0]

    return NextResponse.json({
      doc: {
        // FIX CLÉ : id retourné en Number — Payload relationship attend un entier,
        // pas une string. C'était la cause du "field is invalid: Photo de profil".
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