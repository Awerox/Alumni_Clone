import { CollectionConfig } from 'payload'

export const PublicMessages: CollectionConfig = {
  slug: 'public-messages',
  access: {
    read: () => true,
    create: () => true,
  },
  fields: [
    { name: 'user', type: 'text', required: true },
    { name: 'text', type: 'text', required: true },
    { name: 'time', type: 'text', required: true },
  ],
}