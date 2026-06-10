'use client'

import React, { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import Link from 'next/link'

// Styles graphiques indispensables de Leaflet et de MarkerCluster
import 'leaflet/dist/leaflet.css'
import 'leaflet.markercluster/dist/MarkerCluster.css'
import 'leaflet.markercluster/dist/MarkerCluster.Default.css'

// Configuration de l'icône de repère par défaut via CDN stable
const customIcon = L.icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
})

interface Alumnus {
  id: string
  prenom: string
  nom: string
  statut: string
  ville?: string | null
  poste?: string | null
  entreprise?: string | null
  latitude?: string | number | null
  longitude?: string | number | null
}

// 🛠️ COMPOSANT CORRECTEUR POUR RECALCULER LA GÉOMÉTRIE DE LA CARTE
function FixMapDisplay() {
  const map = useMap()

  useEffect(() => {
    // Petit délai pour s'assurer que le DOM Next.js a fini d'afficher le bloc HTML
    const timer = setTimeout(() => {
      map.invalidateSize()
    }, 300)

    return () => clearTimeout(timer)
  }, [map])

  return null
}

export default function DirectoryMap({ alumni }: { alumni: Alumnus[] }) {
  const [ClusterGroup, setClusterGroup] = useState<any>(null)

  // Chargement asynchrone dynamique de react-leaflet-markercluster pour éviter les crashs au build SSR
  useEffect(() => {
    import('react-leaflet-markercluster').then((mod) => {
      setClusterGroup(() => mod.default)
    })
  }, [])

  // Filtrage strict : on ne garde que les membres qui ont des coordonnées GPS valides
  const mappedAlumni = alumni.filter((a) => {
    if (!a.latitude || !a.longitude) return false
    const lat = parseFloat(a.latitude.toString())
    const lon = parseFloat(a.longitude.toString())
    return !isNaN(lat) && !isNaN(lon)
  })

  return (
    <div className="w-full h-[600px] rounded-3xl overflow-hidden border border-gray-200 shadow-sm relative z-10 bg-gray-100">
      <MapContainer
        center={[46.603354, 1.888334]} // Centrage par défaut sur la France
        zoom={6}
        className="w-full h-full"
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Déclenchement du correcteur de taille */}
        <FixMapDisplay />

        {/* Rendu des clusters de points une fois le module chargé en mémoire */}
        {ClusterGroup && (
          <ClusterGroup showCoverageOnHover={false} maxClusterRadius={40}>
            {mappedAlumni.map((alumnus) => {
              const lat = parseFloat(alumnus.latitude!.toString())
              const lon = parseFloat(alumnus.longitude!.toString())

              return (
                <Marker key={alumnus.id} position={[lat, lon]} icon={customIcon}>
                  <Popup>
                    <div className="text-left p-1 space-y-1 font-sans">
                      <p className="font-black text-gray-950 uppercase text-xs leading-none">
                        {alumnus.prenom} {alumnus.nom}
                      </p>
                      <span
                        className={`inline-block text-[8px] font-black uppercase px-1.5 py-0.5 rounded-sm mt-1 ${
                          alumnus.statut === 'alumni'
                            ? 'bg-amber-50 text-amber-700 border border-amber-100'
                            : 'bg-blue-50 text-blue-700 border border-blue-100'
                        }`}
                      >
                        {alumnus.statut === 'alumni' ? 'Alumni' : 'Étudiant'}
                      </span>
                      <p className="text-[11px] font-bold text-gray-700 !mt-2 leading-tight">
                        {alumnus.poste || 'Étudiant'}
                      </p>
                      {alumnus.entreprise && (
                        <p className="text-[10px] text-gray-400">🏢 {alumnus.entreprise}</p>
                      )}
                      <p className="text-[10px] text-gray-400 font-semibold">📍 {alumnus.ville}</p>
                      <Link
                        href={`/profile/${alumnus.id}`}
                        className="block text-center bg-enc text-white text-[10px] font-black uppercase tracking-wider py-2 px-3 rounded-lg !mt-3 no-underline hover:bg-opacity-90 transition-colors"
                      >
                        Voir le profil
                      </Link>
                    </div>
                  </Popup>
                </Marker>
              )
            })}
          </ClusterGroup>
        )}
      </MapContainer>
    </div>
  )
}
