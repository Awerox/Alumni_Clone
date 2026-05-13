import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

// Import de tes collections
import { Alumni } from './collections/Alumni'
import { Jobs } from './collections/Jobs'
import { Groups } from './collections/Groups'
import { Media } from './collections/Media'
import { Users } from './collections/Users'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    // C'est ici que tu définis qui est l'administrateur principal
    user: Users.slug, 
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  // L'ordre peut influencer la priorité des cookies, on garde Users en premier 
  // car c'est la collection de l'admin
  collections: [
    Users, 
    Alumni, // Ta collection avec auth: true
    Media, 
    Jobs, 
    Groups
  ],
  editor: lexicalEditor(),
  // Assure-toi d'avoir un PAYLOAD_SECRET dans ton fichier .env
  secret: process.env.PAYLOAD_SECRET || 'VOTRE_SECRET_DE_SECOURS_TRES_LONG',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL || '',
    },
  }),
  sharp,
  plugins: [],
})