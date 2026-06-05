import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'
import { cloudinaryStorage } from 'payload-storage-cloudinary'

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

// 🎯 SÉCURISATION DU BUILD : On vérifie si TOUTES les clés sont présentes
const cloudName = process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_NAME
const apiKey = process.env.CLOUDINARY_API_KEY
const apiSecret = process.env.CLOUDINARY_API_SECRET

const isCloudinaryReady = Boolean(cloudName && apiKey && apiSecret)

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [
    Users,
    {
      ...Alumni,
      auth: {
        ...(typeof Alumni.auth === 'object' ? Alumni.auth : {}),
        tokenExpiration: 60 * 60 * 24 * 7,
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
    // 🎯 FIX CRASH : On n'exécute l'instanciation QUE si les variables sont validées.
    // Sinon, on passe un tableau vide, ce qui évite l'erreur d'initialisation au build.
    ...(isCloudinaryReady 
      ? [
          (cloudinaryStorage as any)({
            collections: {
              media: true,
            },
            config: {
              cloud_name: cloudName,
              api_key: apiKey,
              api_secret: apiSecret,
            },
          })
        ]
      : [])
  ],
})