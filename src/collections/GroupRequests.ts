import type { CollectionConfig } from 'payload'

export const GroupRequests: CollectionConfig = {
  slug: 'group-requests',
  admin: {
    useAsTitle: 'id',
    defaultColumns: ['groupe', 'demandeur', 'statut', 'createdAt'],
  },
  access: {
    // Lecture : le demandeur, le créateur du groupe, les admins du groupe, ou admin Payload
    read: ({ req: { user } }) => {
      if (!user) return false
      if ((user as any).collection === 'users') return true
      return true // filtrage fin côté query
    },
    create: ({ req: { user } }) => !!user,
    update: ({ req: { user } }) => {
      if (!user) return false
      if ((user as any).collection === 'users') return true
      return true // vérifié dans les hooks
    },
    delete: ({ req: { user } }) => {
      if (!user) return false
      return (user as any).collection === 'users'
    },
  },
  hooks: {
    beforeChange: [
      async ({ req, operation, data }) => {
        // À la création : assigne le demandeur automatiquement
        if (operation === 'create' && req.user && (req.user as any).collection === 'alumni') {
          data.demandeur = req.user.id
          data.statut = 'pending'
        }
        return data
      },
    ],
    afterChange: [
      async ({ req, doc, operation }) => {
        // Quand une demande est acceptée → ajouter le demandeur aux membres du groupe
        if (operation === 'update' && doc.statut === 'accepted') {
          try {
            const payload = req.payload
            const groupId = typeof doc.groupe === 'object' ? doc.groupe.id : doc.groupe
            const demandeurId = typeof doc.demandeur === 'object' ? doc.demandeur.id : doc.demandeur

            const group = await payload.findByID({
              collection: 'groups',
              id: groupId,
              depth: 0,
            })

            if (group) {
              const currentMembres = (group.membres as any[]) ?? []
              const memberIds = currentMembres.map((m: any) =>
                typeof m === 'object' ? m.id : m
              )

              if (!memberIds.includes(demandeurId)) {
                await payload.update({
                  collection: 'groups',
                  id: groupId,
                  overrideAccess: true,
                  data: {
                    membres: [...memberIds, demandeurId],
                  },
                })
              }
            }
          } catch (err) {
            console.error('[GroupRequests afterChange]', err)
          }
        }
      },
    ],
  },
  fields: [
    {
      name: 'groupe',
      type: 'relationship',
      relationTo: 'groups',
      required: true,
      label: 'Groupe',
    },
    {
      name: 'demandeur',
      type: 'relationship',
      relationTo: 'alumni',
      required: true,
      label: 'Demandeur',
      admin: {
        description: 'Assigné automatiquement à la création',
      },
    },
    {
      name: 'statut',
      type: 'select',
      required: true,
      defaultValue: 'pending',
      label: 'Statut',
      options: [
        { label: 'En attente', value: 'pending' },
        { label: 'Acceptée', value: 'accepted' },
        { label: 'Refusée', value: 'rejected' },
        { label: 'Retiré du groupe', value: 'removed' },
      ],
    },
    {
      name: 'message',
      type: 'textarea',
      label: 'Message de présentation',
      admin: {
        description: 'Optionnel — message laissé par le demandeur',
      },
    },
    {
      name: 'motif',
      type: 'textarea',
      label: 'Motif (refus ou retrait)',
      admin: {
        description: 'Optionnel — raison donnée par le modérateur',
      },
    },
    {
      name: 'moderateur',
      type: 'relationship',
      relationTo: 'alumni',
      label: 'Modérateur (action)',
      admin: {
        description: "Modérateur ayant accepté/refusé la demande ou retiré le membre",
      },
    },
  ],
  timestamps: true,
}

export default GroupRequests