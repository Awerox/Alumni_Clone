import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

// Import de tes collections (Correction de l'import de Groups qui est en export default)
import { Alumni } from './collections/Alumni'
import { Jobs } from './collections/Jobs'
import Groups from './collections/Groups' // Correct : pas d'accolades car c'est un export default
import { Media } from './collections/Media'
import { Users } from './collections/Users'
import { SocialLinks } from './collections/SocialLink'
import Articles from './collections/Articles'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    // C'est ici que tu définis qui est l'administrateur principal du back-office
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  // L'ordre influence la priorité : Users reste en premier pour la gestion admin
  collections: [
    Users,
    Alumni, // Ta collection membres avec auth: true
    Media,
    Jobs,
    Groups, // Ta nouvelle collection groupes est maintenant parfaitement déclarée
    SocialLinks,
    Articles,
  ],
  editor: lexicalEditor(),
  // Assure-toi d'avoir ton PAYLOAD_SECRET configuré dans ton fichier .env
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
