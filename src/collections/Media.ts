import type { CollectionConfig } from 'payload'

export const Media: CollectionConfig = {
  slug: 'media',
  upload: true, // Active le stockage de fichiers
  access: {
    // Tout le monde peut lire et afficher les fichiers médias (photos de profil, documents)
    read: () => true,
    
    // Seuls les utilisateurs authentifiés sur la plateforme peuvent téléverser un fichier
    create: ({ req: { user } }) => !!user,
    
    // Seuls les utilisateurs authentifiés peuvent modifier ou supprimer un média
    update: ({ req: { user } }) => !!user,
    delete: ({ req: { user } }) => !!user,
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: false, // Passé à false pour éviter de bloquer les téléversements automatiques d'avatars
    },
  ],
}