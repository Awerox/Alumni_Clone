import React from 'react'
import { getPayload } from 'payload'
import configPromise from '@payload-config'

export default async function JobsPage() {
  const payload = await getPayload({ config: configPromise })
  const jobs = await payload.find({ collection: 'jobs', sort: '-createdAt' })

  return (
    <div className="bg-gray-50 min-h-screen py-10">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">Offres d'<span className="text-enc">Emploi & Stages</span></h1>
          <button className="bg-enc text-white px-4 py-2 rounded-lg font-bold text-sm">Poster une offre</button>
        </div>

        <div className="grid gap-4">
          {jobs.docs.map((job) => (
            <div key={job.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold text-gray-900">{job.titre}</h2>
                <p className="text-gray-500 text-sm">{job.entreprise} • {job.ville}</p>
                <div className="flex gap-2 mt-2">
                  <span className="px-2 py-1 bg-blue-50 text-blue-600 text-xs font-bold rounded uppercase">{job.typeContrat}</span>
                  <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded italic">{job.secteur}</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-enc font-bold">{job.remuneration || 'Non précisé'}</p>
                <button className="mt-3 text-sm font-bold text-gray-900 border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50">Détails</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}