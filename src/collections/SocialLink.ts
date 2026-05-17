// src/collections/SocialLinks.ts
import type { CollectionConfig } from 'payload'

export const SocialLinks: CollectionConfig = {
  slug: 'social-links',
  admin: { useAsTitle: 'label' },
  fields: [
    { name: 'icon', type: 'text', required: true }, // Nom de l'icône FontAwesome
    { name: 'label', type: 'text', required: true }, // Titre (ex: Mon CV)
    { name: 'url', type: 'text' }, // Le lien
    { name: 'file', type: 'upload', relationTo: 'media' }, // Ou le fichier
    { name: 'owner', type: 'relationship', relationTo: 'alumni', required: true },
  ],
}