'use client'

import React, { useEffect, useState, useRef } from 'react'
import { MapContainer, TileLayer, useMap, CircleMarker, Popup } from 'react-leaflet'
import L from 'leaflet'
import Link from 'next/link'
import 'leaflet/dist/leaflet.css'

interface Alumnus {
  id: string
  prenom: string
  nom: string
  statut: string
  ville?: string | null
  poste?: string | null
  entreprise?: string | null
  photo?: any
  latitude?: string | number | null
  longitude?: string | number | null
}

interface CityGroup {
  ville: string
  lat: number
  lng: number
  members: Alumnus[]
}

// Cache géocodage pour éviter les requêtes répétées
const geocodeCache: Record<string, { lat: number; lng: number } | null> = {}

async function geocodeVille(ville: string): Promise<{ lat: number; lng: number } | null> {
  if (geocodeCache[ville] !== undefined) return geocodeCache[ville]
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(ville)}&countrycodes=fr&format=json&limit=1`,
      { headers: { 'Accept-Language': 'fr' } }
    )
    const data = await res.json()
    if (data?.[0]) {
      const result = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
      geocodeCache[ville] = result
      return result
    }
    // Fallback mondial si pas trouvé en France
    const res2 = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(ville)}&format=json&limit=1`,
      { headers: { 'Accept-Language': 'fr' } }
    )
    const data2 = await res2.json()
    if (data2?.[0]) {
      const result = { lat: parseFloat(data2[0].lat), lng: parseFloat(data2[0].lon) }
      geocodeCache[ville] = result
      return result
    }
  } catch {}
  geocodeCache[ville] = null
  return null
}

function FixMapSize() {
  const map = useMap()
  useEffect(() => {
    const t = setTimeout(() => map.invalidateSize(), 300)
    return () => clearTimeout(t)
  }, [map])
  return null
}

function MemberAvatar({ alumnus }: { alumnus: Alumnus }) {
  const photoUrl = alumnus.photo && typeof alumnus.photo === 'object' ? alumnus.photo.url : null
  const initials = `${alumnus.prenom?.[0] ?? ''}${alumnus.nom?.[0] ?? ''}`.toUpperCase()
  return (
    <div className="w-8 h-8 rounded-full overflow-hidden bg-[#800020] flex items-center justify-center flex-shrink-0 border-2 border-white shadow-sm">
      {photoUrl
        ? <img src={photoUrl} alt="" className="w-full h-full object-cover" />
        : <span className="text-white text-[10px] font-black">{initials}</span>
      }
    </div>
  )
}

export default function DirectoryMap({ alumni }: { alumni: Alumnus[] }) {
  const [cityGroups, setCityGroups] = useState<CityGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    let cancelled = false

    async function buildCityGroups() {
      setLoading(true)

      // 1. Grouper par ville normalisée
      const byVille: Record<string, Alumnus[]> = {}
      for (const a of alumni) {
        // Priorité aux coordonnées GPS existantes
        if (a.latitude && a.longitude) {
          const key = `__gps_${a.id}`
          byVille[key] = byVille[key] || []
          byVille[key].push(a)
        } else if (a.ville?.trim()) {
          const key = a.ville.trim().toLowerCase()
          byVille[key] = byVille[key] || []
          byVille[key].push(a)
        }
      }

      const villes = Object.keys(byVille)
      const groups: CityGroup[] = []
      let done = 0

      for (const key of villes) {
        if (cancelled) return
        const members = byVille[key]
        const first = members[0]

        let lat: number, lng: number

        if (key.startsWith('__gps_')) {
          lat = parseFloat(String(first.latitude))
          lng = parseFloat(String(first.longitude))
        } else {
          const coords = await geocodeVille(first.ville!)
          if (!coords) { done++; setProgress(Math.round(done / villes.length * 100)); continue }
          lat = coords.lat
          lng = coords.lng
          // Petit délai pour respecter Nominatim (1 req/s)
          await new Promise(r => setTimeout(r, 120))
        }

        groups.push({ ville: first.ville || key, lat, lng, members })
        done++
        if (!cancelled) setProgress(Math.round(done / villes.length * 100))
      }

      if (!cancelled) {
        setCityGroups(groups)
        setLoading(false)
      }
    }

    buildCityGroups()
    return () => { cancelled = true }
  }, [alumni])

  return (
    <div className="w-full h-[600px] rounded-3xl overflow-hidden border border-gray-200 shadow-sm relative bg-gray-100">
      {/* Overlay chargement géocodage */}
      {loading && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm rounded-3xl">
          <div className="text-center space-y-3">
            <div className="text-2xl">🗺️</div>
            <p className="text-sm font-black text-gray-700 uppercase tracking-wider">Localisation des membres</p>
            <div className="w-48 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#800020] rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 font-medium">{progress}% · {cityGroups.length} villes trouvées</p>
          </div>
        </div>
      )}

      <MapContainer
        center={[46.8, 2.3]}
        zoom={6}
        className="w-full h-full"
        style={{ height: '100%', width: '100%' }}
        zoomControl={true}
      >
        {/* Tuiles sombres pour correspondre au style de la page */}
        <TileLayer
          attribution='&copy; <a href="https://www.maptiler.com">MapTiler</a> &copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          url="https://api.maptiler.com/maps/darkmatter/{z}/{x}/{y}.png?key=get_your_own_OpIi9ZULNHzrESv6T2vL"
          errorTileUrl="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FixMapSize />

        {cityGroups.map((group, i) => {
          const count = group.members.length
          // Taille du cercle selon le nombre de membres
          const radius = Math.min(6 + Math.sqrt(count) * 4, 32)

          return (
            <CircleMarker
              key={`${group.ville}-${i}`}
              center={[group.lat, group.lng]}
              radius={radius}
              pathOptions={{
                fillColor: '#800020',
                fillOpacity: count > 10 ? 0.85 : count > 3 ? 0.7 : 0.55,
                color: '#ffffff',
                weight: 1.5,
              }}
            >
              <Popup
                minWidth={240}
                maxWidth={280}
                className="directory-popup"
              >
                <div className="font-sans text-left" style={{ maxHeight: '320px', overflowY: 'auto' }}>
                  {/* Header ville */}
                  <div className="flex items-center gap-2 pb-2 mb-2 border-b border-gray-100 sticky top-0 bg-white">
                    <span className="text-base">📍</span>
                    <div>
                      <p className="text-xs font-black text-gray-900 uppercase tracking-wide">{group.ville}</p>
                      <p className="text-[10px] text-gray-400 font-medium">{count} membre{count > 1 ? 's' : ''}</p>
                    </div>
                  </div>

                  {/* Liste membres */}
                  <div className="space-y-2">
                    {group.members.map(m => {
                      return (
                        <Link
                          key={m.id}
                          href={`/profile/${m.id}`}
                          className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-gray-50 transition-colors group no-underline"
                        >
                          <MemberAvatar alumnus={m} />
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-black text-gray-900 truncate group-hover:text-[#800020] transition-colors">
                              {m.prenom} {m.nom}
                            </p>
                            <p className="text-[10px] text-gray-400 font-medium truncate">
                              {m.poste || (m.statut === 'alumni' ? 'Alumni' : 'Étudiant')}
                            </p>
                          </div>
                          <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full flex-shrink-0 ${m.statut === 'alumni' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                            {m.statut === 'alumni' ? 'Alumni' : 'Étu.'}
                          </span>
                        </Link>
                      )
                    })}
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          )
        })}
      </MapContainer>

      <style>{`
        .directory-popup .leaflet-popup-content-wrapper {
          border-radius: 16px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.15);
          border: 1px solid #f3f4f6;
          padding: 0;
          overflow: hidden;
        }
        .directory-popup .leaflet-popup-content {
          margin: 12px;
        }
        .directory-popup .leaflet-popup-tip {
          background: white;
        }
      `}</style>
    </div>
  )
}
