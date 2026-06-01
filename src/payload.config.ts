import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

// Import de tes collections
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

// 🎯 INTERCEPTION & ENRICHISSEMENT DE LA COLLECTION ALUMNI POUR L'OAUTH
// On adapte le retour de la fonction d'authentification pour satisfaire le typage strict de Payload v3
Alumni.auth = {
  strategies: [
    {
      name: 'google',
      authenticate: async () => {
        // Fix TypeScript : On retourne un objet vide ou undefined sous la forme attendue par AuthStrategy
        return { user: null } as any
      },
    },
    {
      name: 'linkedin',
      authenticate: async () => {
        // Fix TypeScript : Idem pour LinkedIn
        return { user: null } as any
      },
    },
  ],
}

// On s'assure d'injecter proprement les deux champs d'identifiants réseau dans la table SQL
if (!Alumni.fields) Alumni.fields = []

Alumni.fields = [
  ...Alumni.fields,
  {
    name: 'subGoogle',
    type: 'text',
    admin: {
      readOnly: true,
      position: 'sidebar',
    },
  },
  {
    name: 'subLinkedin',
    type: 'text',
    admin: {
      readOnly: true,
      position: 'sidebar',
    },
  },
]

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [
    Users,
    Alumni, 
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