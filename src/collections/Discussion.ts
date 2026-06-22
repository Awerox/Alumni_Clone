import type { CollectionConfig } from 'payload'

export const Discussions: CollectionConfig = {
  slug: 'discussions',
  admin: {
    useAsTitle: 'titre',
    group: 'Communauté',
  },
  access: {
    read: () => true,
    create: ({ req: { user } }) => !!user,
    // ⚠️ Sécurité : update était ouvert à n'importe quel utilisateur connecté, qui pouvait
    // donc réécrire le titre/contenu/auteur de la discussion de quelqu'un d'autre.
    // Restreint à l'auteur du sujet ou à un admin. L'ajout de commentaires ne passe plus
    // par payload.update() mais par une route dédiée (SQL direct, voir /api/forum).
    update: ({ req: { user } }) => {
      if (!user) return false
      if (user.collection === 'users') return true
      return { auteur: { equals: user.id } }
    },
    delete: ({ req: { user } }) => user?.collection === 'users',
  },
  fields: [
    { name: 'titre', type: 'text', required: true, label: 'Sujet de discussion' },
    { name: 'contenu', type: 'textarea', required: true, label: 'Message principal' },
    {
      name: 'categorie',
      type: 'select',
      defaultValue: 'divers',
      label: 'Catégorie',
      options: [
        { label: '💡 Entraide Cursus', value: 'entraide' },
        { label: '💼 Stages & Alternances', value: 'stages' },
        { label: '📝 Prépa Examens / Oraux', value: 'examens' },
        { label: '🚀 Projets SLAM / SISR', value: 'projets' },
        { label: '☕ Café / Divers', value: 'divers' },
      ],
    },
    { name: 'tags', type: 'text', label: 'Tags (séparés par des virgules)' },
    {
      name: 'auteur',
      type: 'relationship',
      relationTo: 'alumni',
      required: true,
      admin: { position: 'sidebar' },
    },
    {
      name: 'commentaires',
      type: 'array',
      label: 'Commentaires / Réponses',
      fields: [
        {
          name: 'auteur',
          type: 'relationship',
          relationTo: 'alumni',
          required: true,
        },
        { name: 'message', type: 'textarea', required: true },
        { name: 'createdAt', type: 'date', defaultValue: () => new Date().toISOString() },
      ],
    },
  ],
}
export default Discussions