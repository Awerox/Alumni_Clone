import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

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
import { GroupRequests } from './collections/GroupRequests'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

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
        ...(typeof Alumni.auth === 'object' && Alumni.auth !== null ? Alumni.auth : {}),
        tokenExpiration: 60 * 60 * 24 * 7,
        cookieName: 'payload-alumni-token',
        cookies: {
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'Lax' as const,
        },
      } as any,
      fields: [
        ...(Alumni.fields || []),
        { name: 'subGoogle',   type: 'text', admin: { readOnly: true, position: 'sidebar' } },
        { name: 'subLinkedin', type: 'text', admin: { readOnly: true, position: 'sidebar' } },
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
    GroupRequests,
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
  plugins: [],
})