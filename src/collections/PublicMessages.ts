import { CollectionConfig } from 'payload'

export const PublicMessages: CollectionConfig = {
  slug: 'public-messages',
  admin: {
    useAsTitle: 'text',
    group: 'Communauté',
    defaultColumns: ['user', 'text', 'createdAt'],
  },
  access: {
    read: () => true,
    // ⚠️ Sécurité : create était ouvert à tout le monde, y compris non connecté.
    // Restreint aux membres authentifiés (la vérification fine + la modération du
    // contenu se font dans /api/chat/stream).
    create: ({ req: { user } }) => !!user,
    update: () => false,
    delete: ({ req: { user } }) => user?.collection === 'users',
  },
  fields: [
    // Nom affiché, dérivé côté serveur de l'identité authentifiée (jamais du client)
    { name: 'user', type: 'text', required: true },
    { name: 'text', type: 'text', required: true },
    { name: 'time', type: 'text', required: true },
    // ✅ Ajouté : relation réelle vers l'expéditeur (auparavant absente, donc l'identité
    // affichée n'était jamais vérifiable côté serveur)
    { name: 'from', type: 'relationship', relationTo: 'alumni', label: 'Expéditeur' },
  ],
}

export default PublicMessages
