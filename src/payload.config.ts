import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'
import { v2 as cloudinary } from 'cloudinary'
import { cloudStoragePlugin } from '@payloadcms/plugin-cloud-storage'

// Import de tes collections d'origine
import { Alumni } from './collections/Alumni'
import { Jobs } from './collections/Jobs'
import Groups from './collections/Groups'
import { Media } from './collections/Media'
import { Users } from './collections/Users'
import { SocialLinks } from './collections/SocialLink'
import Articles from './collections/Articles'
import Offres from './collections/Offres'
import Posts from './collections/Posts'
import Discussions from './collections/Discussion'
import Evenements from './collections/evenements'
import DirectMessages from './collections/DirectMessages' 
import { PublicMessages } from './collections/PublicMessages'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

// ─── ☁️ CONFIGURATION ET ADAPTER PERSONNALISÉ CLOUDINARY ───────────────────

// Harmonisation du nom de la variable pour Vercel / Cloudinary
const cloudName = process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_NAME || ''

cloudinary.config({
  cloud_name: cloudName,
  api_key: process.env.CLOUDINARY_API_KEY || '',
  api_secret: process.env.CLOUDINARY_API_SECRET || '',
})

const customCloudinaryAdapter = {
  name: 'cloudinary-adapter',
  
  // Upload vers Cloudinary
  async handleUpload({ file }: any) {
    try {
      const uploadResult = await new Promise<any>((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            resource_type: 'auto',
            folder: 'media', // Crée ou utilise le dossier "media" sur Cloudinary
            overwrite: false,
            use_filename: true,
          },
          (error, result) => {
            if (error || !result) return reject(error ?? new Error('Pas de résultat Cloudinary'))
            resolve(result)
          },
        )
        stream.end(file.buffer)
      })

      // On met à jour les métadonnées pour Payload
      file.filename = uploadResult.public_id
      file.mimeType = uploadResult.format
      file.filesize = uploadResult.bytes
    } catch (err) {
      console.error('Cloudinary upload error:', err)
      throw err
    }
  },

  // Suppression depuis Cloudinary
  async handleDelete({ filename }: any) {
    try {
      await cloudinary.uploader.destroy(filename)
    } catch (err) {
      console.error('Cloudinary delete error:', err)
    }
  },

  // Handler statique (Requis par l'interface d'adapter de Payload)
  staticHandler() {
    return new Response('Served by Cloudinary', { status: 200 })
  },
}

// ─── 🏗️ CONFIGURATION GÉNÉRALE PAYLOAD v3 ───────────────────────────────────

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [
    Users,
    
    // 🎯 RECONNAISSANCE & ENRICHISSEMENT DIRECT DE LA COLLECTION ALUMNI
    {
      ...Alumni,
      auth: {
        ...(typeof Alumni.auth === 'object' ? Alumni.auth : {}),
        tokenExpiration: 60 * 60 * 24 * 7,  // Session active pendant 7 jours
        cookieName: 'payload-alumni-token',
        cookies: {
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'Lax',
        },
      } as any,
      
      fields: [
        ...(Alumni.fields || []),
        {
          name: 'subGoogle',
          type: 'text',
          admin: { readOnly: true, position: 'sidebar' },
        },
        {
          name: 'subLinkedin',
          type: 'text',
          admin: { readOnly: true, position: 'sidebar' },
        },
      ],
    },
    Media,
    Jobs,
    Groups,
    SocialLinks,
    Articles,
    Posts,
    Offres,
    Evenements,
    Discussions,
    DirectMessages, 
    PublicMessages, 
  ],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '1234567890abcdef1234567890abcdef',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL || '',
    },
  }),
  sharp,
  plugins: [
    // L'adapter cloud ne s'active en production que si les clés Cloudinary sont renseignées
    cloudName && cloudStoragePlugin({
      collections: {
        media: {
          adapter: customCloudinaryAdapter as any,
          disableLocalStorage: true, // Bloque l'écriture locale (impératif pour le Read-Only de Vercel)
          generateFileURL: ({ filename }) => {
            // Utilise l'outil de génération d'URL natif du SDK Cloudinary
            return cloudinary.url(filename, {
              secure: true,
              fetch_format: 'auto',
              quality: 'auto',
            })
          },
        },
      },
    }),
  ].filter(Boolean) as any,
})