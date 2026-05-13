import type { CollectionConfig } from 'payload'

export const Jobs: CollectionConfig = {
  slug: 'jobs',
  admin: { useAsTitle: 'titre' },
  fields: [
    { name: 'titre', type: 'text', required: true, label: 'Nom du poste' }, // [cite: 163]
    { name: 'entreprise', type: 'text', required: true }, // [cite: 164]
    { name: 'ville', type: 'text', required: true }, // [cite: 165]
    {
      name: 'typeContrat',
      type: 'select',
      options: [
        { label: 'CDI', value: 'cdi' }, // [cite: 137]
        { label: 'CDD', value: 'cdd' },
        { label: 'Alternance', value: 'alternance' }, // [cite: 155]
        { label: 'Stage', value: 'stage' },
      ],
      required: true,
    },
    { name: 'secteur', type: 'text', label: "Secteur d'activité" }, // [cite: 167]
    { name: 'remuneration', type: 'text', label: 'Rémunération brute' }, // [cite: 169]
    { name: 'description', type: 'richText', required: true }, // [cite: 170]
    { name: 'dateLimite', type: 'date', label: 'Date limite de candidature' }, // [cite: 173]
    {
      name: 'posterPar',
      type: 'relationship',
      relationTo: 'alumni',
      required: true,
    },
  ],
}