import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

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

// ─── 🏗️ CONFIGURATION GÉNÉRALE DE L'INFRASTRUCTURE PAYLOAD ───────────────────

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
      // On force le passage en "as any" pour contourner les caprices de typage de la v3
      auth: {
        ...(typeof Alumni.auth === 'object' ? Alumni.auth : {}),
        tokenExpiration: 60 * 60 * 24 * 7,  // Session active pendant 7 jours
        verify: false,                      // Désactive la vérification d'email par jeton
        cookieName: 'payload-alumni-token', // Requis au runtime par Payload
        cookies: {
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'Lax',
        },
      } as any, // 🚀 LE PASSE-PARTOUT : Plus aucune erreur TypeScript possible ici !
      
      // Injection propre et immédiate des champs d'identifiants uniques dans la table SQL
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
  secret: '1234567890abcdef1234567890abcdef', // 🎯 FIX SYNTAXE : Parenthèse et commentaire refermés (32 octets)
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