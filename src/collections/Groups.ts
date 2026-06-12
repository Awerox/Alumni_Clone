import type { CollectionConfig } from 'payload'

export const Groups: CollectionConfig = {
  slug: 'groups',
  admin: {
    useAsTitle: 'titre',
    defaultColumns: ['titre', 'categorie', 'isPublic', 'createdAt'],
  },
  access: {
    read: () => true,
    create: ({ req: { user } }) => !!user,
    update: ({ req: { user } }) => {
      if (!user) return false
      if ((user as any).collection === 'users') return true
      return { createur: { equals: user.id } }
    },
    delete: ({ req: { user } }) => {
      if (!user) return false
      if ((user as any).collection === 'users') return true
      return { createur: { equals: user.id } }
    },
  },
  hooks: {
    beforeValidate: [
      ({ data }) => {
        if (!data) return data
        if (!data.slug && data.titre) {
          data.slug = data.titre
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)+/g, '')
        }
        if (data.slug) {
          data.slug = String(data.slug)
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)+/g, '')
        }
        return data
      },
    ],
    beforeChange: [
      ({ req, operation, data }) => {
        if (operation === 'create' && req.user && (req.user as any).collection === 'alumni') {
          data.createur = req.user.id
        }
        return data
      },
    ],
    afterChange: [
      async ({ doc, previousDoc, req, operation }) => {
        if (operation !== 'update' || !previousDoc) return doc
        if (!req.user) return doc

        const payload = req.payload
        const userId = Number((req.user as any).id)

        const TEXT_FIELDS: Record<string, string> = {
          titre: 'Titre',
          description: 'Description',
          categorie: 'Catégorie',
          restrictDiplome: 'Restriction diplôme',
          restrictCampus: 'Restriction campus',
          restrictCategorie: 'Restriction catégorie',
          restrictPromotion: 'Restriction promotion',
        }
        const CATEGORIE_LABELS: Record<string, string> = {
          academique: 'Académique',
          culturel: 'Culturel',
          artistique: 'Artistique',
          sportif: 'Sportif',
          environnement: 'Environnement',
          solidarite: 'Solidarité',
          professionnel: 'Professionnel',
          loisir: 'Loisir',
          autre: 'Autre',
        }
        const MEDIA_FIELDS: Record<string, string> = {
          miniature: 'Photo du groupe',
          banniere: 'Bannière',
        }

        const logs: { champ: string; ancienneValeur: string; nouvelleValeur: string }[] = []

        // Champs texte / sélection
        for (const [field, label] of Object.entries(TEXT_FIELDS)) {
          const oldVal = (previousDoc as any)[field]
          const newVal = (doc as any)[field]
          if ((oldVal ?? '') !== (newVal ?? '')) {
            let oldStr = oldVal == null || oldVal === '' ? '(vide)' : String(oldVal)
            let newStr = newVal == null || newVal === '' ? '(vide)' : String(newVal)
            if (field === 'categorie') {
              oldStr = CATEGORIE_LABELS[oldStr] ?? oldStr
              newStr = CATEGORIE_LABELS[newStr] ?? newStr
            }
            logs.push({ champ: label, ancienneValeur: oldStr, nouvelleValeur: newStr })
          }
        }

        // Visibilité (isPublic)
        if (!!(previousDoc as any).isPublic !== !!(doc as any).isPublic) {
          logs.push({
            champ: 'Visibilité',
            ancienneValeur: (previousDoc as any).isPublic ? 'Public' : 'Privé',
            nouvelleValeur: (doc as any).isPublic ? 'Public' : 'Privé',
          })
        }

        // Champs média (photo, bannière)
        for (const [field, label] of Object.entries(MEDIA_FIELDS)) {
          const oldRaw = (previousDoc as any)[field]
          const newRaw = (doc as any)[field]
          const oldId = typeof oldRaw === 'object' && oldRaw !== null ? oldRaw.id : oldRaw
          const newId = typeof newRaw === 'object' && newRaw !== null ? newRaw.id : newRaw
          if (String(oldId ?? '') !== String(newId ?? '')) {
            logs.push({
              champ: label,
              ancienneValeur: oldId ? `media:${oldId}` : '(aucune)',
              nouvelleValeur: newId ? `media:${newId}` : '(aucune)',
            })
          }
        }

        for (const log of logs) {
          try {
            await payload.create({
              collection: 'group-activity-logs' as any,
              overrideAccess: true,
              data: {
                groupe: doc.id,
                utilisateur: userId,
                champ: log.champ,
                ancienneValeur: log.ancienneValeur,
                nouvelleValeur: log.nouvelleValeur,
              } as any,
            })
          } catch (err) {
            console.error('[Groups afterChange] impossible de créer le log:', err)
          }
        }

        return doc
      },
    ],
  },
  fields: [
    { name: 'titre', type: 'text', label: 'Nom du groupe', required: true },
    { name: 'slug', type: 'text', label: 'Slug (URL unique)', required: true, unique: true },
    {
      name: 'categorie',
      type: 'select',
      label: 'Catégorie du groupe',
      required: true,
      options: [
        { label: 'Académique',    value: 'academique' },
        { label: 'Culturel',      value: 'culturel' },
        { label: 'Artistique',    value: 'artistique' },
        { label: 'Sportif',       value: 'sportif' },
        { label: 'Environnement', value: 'environnement' },
        { label: 'Solidarité',    value: 'solidarite' },
        { label: 'Professionnel', value: 'professionnel' },
        { label: 'Loisir',        value: 'loisir' },
        { label: 'Autre',         value: 'autre' },
      ],
    },
    { name: 'description', type: 'textarea', label: 'Description du groupe', required: true },
    {
      name: 'miniature',
      type: 'upload',
      relationTo: 'media',
      label: 'Image Miniature',
      required: true,
    },
    {
      name: 'banniere',
      type: 'upload',
      relationTo: 'media',
      label: "Image d'en-tete / Banniere",
      required: true,
    },
    { name: 'isPublic', type: 'checkbox', label: 'Groupe Public', defaultValue: true },
    { name: 'restrictDiplome',   type: 'text', label: 'Restriction Diplome' },
    { name: 'restrictCampus',    type: 'text', label: 'Restriction Campus' },
    { name: 'restrictCategorie', type: 'text', label: 'Restriction Categorie' },
    { name: 'restrictPromotion', type: 'text', label: 'Restriction Promotion' },
    {
      name: 'membres',
      type: 'relationship',
      relationTo: 'alumni',
      hasMany: true,
      label: 'Membres inscrits',
    },
    {
      name: 'moderateurs',
      type: 'array',
      label: 'Modérateurs du groupe',
      labels: { singular: 'Modérateur', plural: 'Modérateurs' },
      admin: {
        description: 'Membres ayant des droits de modération sur ce groupe',
      },
      fields: [
        {
          name: 'membre',
          type: 'relationship',
          relationTo: 'alumni',
          required: true,
          label: 'Membre',
        },
        {
          name: 'canManageRequests',
          type: 'checkbox',
          label: "Peut g\u00e9rer les demandes d'acc\u00e8s",
          defaultValue: false,
        },
        {
          name: 'canManageMembers',
          type: 'checkbox',
          label: 'Peut g\u00e9rer les membres (exclure)',
          defaultValue: false,
        },
        {
          name: 'canEditGroup',
          type: 'checkbox',
          label: 'Peut modifier le groupe',
          defaultValue: false,
        },
      ],
    },
    {
      name: 'createur',
      type: 'relationship',
      relationTo: 'alumni',
      admin: {
        position: 'sidebar',
        description: 'Le createur du groupe (Attribue automatiquement)',
      },
    },
  ],
  timestamps: true,
}

export default Groups