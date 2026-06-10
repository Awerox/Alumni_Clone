// app/api/media/route.ts
// Route custom pour uploader vers Cloudinary puis créer le doc dans Payload

import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || '',
  api_key:    process.env.CLOUDINARY_API_KEY || '',
  api_secret: process.env.CLOUDINARY_API_SECRET || '',
})

async function uploadToCloudinary(buffer: Buffer, filename: string): Promise<{
  url: string
  publicId: string
}> {
  return new Promise((resolve, reject) => {
    const publicId = `media/${filename.replace(/\.[^/.]+$/, '')}`
    const stream = cloudinary.uploader.upload_stream(
      { resource_type: 'auto', public_id: publicId, overwrite: true },
      (error, result) => {
        if (error || !result) return reject(error ?? new Error('Cloudinary upload failed'))
        resolve({ url: result.secure_url, publicId: result.public_id })
      },
    )
    stream.end(buffer)
  })
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

    // 1. Lire le fichier en buffer
    const buffer = Buffer.from(await file.arrayBuffer())
    const filename = file.name
    const mimeType = file.type
    const filesize = buffer.length

    // 2. Upload vers Cloudinary
    const { url, publicId } = await uploadToCloudinary(buffer, filename)

    // 3. Créer le document Media dans Payload avec l'URL Cloudinary
    const doc = await payload.create({
      collection: 'media',
      overrideAccess: true,
      data: {
        alt,
        url,
        filename,
        mimeType,
        filesize,
      } as any,
      // On passe le fichier pour que Payload génère les métadonnées (width, height)
      file: {
        data: buffer,
        name: filename,
        mimetype: mimeType,
        size: filesize,
      },
    })

    // 4. Mettre à jour l'URL avec celle de Cloudinary (Payload peut l'écraser)
    const updated = await payload.update({
      collection: 'media',
      id: doc.id,
      overrideAccess: true,
      data: { url } as any,
    })

    return NextResponse.json({ doc: { ...updated, url } })
  } catch (err: any) {
    console.error('[POST /api/media]', err)
    return NextResponse.json({ error: err.message || 'Erreur serveur' }, { status: 500 })
  }
}