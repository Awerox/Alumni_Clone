'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { MapContainer, TileLayer, useMap, useMapEvents } from 'react-leaflet'
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

interface CityPoint {
  ville: string
  lat: number
  lng: number
  members: Alumnus[]
}

interface ClusterPoint {
  lat: number
  lng: number
  count: number
  members: Alumnus[]
  cities: string[]
}

// ── Cache géocodage ───────────────────────────────────────────────────────────
const geocodeCache: Record<string, { lat: number; lng: number } | null> = {}

async function geocodeVille(ville: string): Promise<{ lat: number; lng: number } | null> {
  const key = ville.trim().toLowerCase()
  if (key in geocodeCache) return geocodeCache[key]
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(ville)}&countrycodes=fr&format=json&limit=1`
    const res = await fetch(url, { headers: { 'Accept-Language': 'fr' } })
    const data = await res.json()
    if (data?.[0]) {
      const r = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
      geocodeCache[key] = r
      return r
    }
    // Fallback mondial
    const res2 = await fetch(url.replace('countrycodes=fr&', ''), { headers: { 'Accept-Language': 'fr' } })
    const data2 = await res2.json()
    if (data2?.[0]) {
      const r = { lat: parseFloat(data2[0].lat), lng: parseFloat(data2[0].lon) }
      geocodeCache[key] = r
      return r
    }
  } catch {}
  geocodeCache[key] = null
  return null
}

// ── Clustering côté client ────────────────────────────────────────────────────
function clusterPoints(points: CityPoint[], zoom: number): ClusterPoint[] {
  // Distance de clustering selon le zoom
  const clusterDist = zoom >= 12 ? 0.01 : zoom >= 10 ? 0.05 : zoom >= 8 ? 0.2 : zoom >= 6 ? 0.8 : 3

  const used = new Set<number>()
  const clusters: ClusterPoint[] = []

  for (let i = 0; i < points.length; i++) {
    if (used.has(i)) continue
    const cluster: ClusterPoint = {
      lat: points[i].lat,
      lng: points[i].lng,
      count: points[i].members.length,
      members: [...points[i].members],
      cities: [points[i].ville],
    }
    for (let j = i + 1; j < points.length; j++) {
      if (used.has(j)) continue
      const dLat = Math.abs(points[j].lat - points[i].lat)
      const dLng = Math.abs(points[j].lng - points[i].lng)
      if (dLat < clusterDist && dLng < clusterDist) {
        cluster.count += points[j].members.length
        cluster.members.push(...points[j].members)
        cluster.cities.push(points[j].ville)
        // Centroïde pondéré
        cluster.lat = (cluster.lat * (cluster.count - points[j].members.length) + points[j].lat * points[j].members.length) / cluster.count
        cluster.lng = (cluster.lng * (cluster.count - points[j].members.length) + points[j].lng * points[j].members.length) / cluster.count
        used.add(j)
      }
    }
    used.add(i)
    clusters.push(cluster)
  }
  return clusters
}

// ── Composant carte interne ───────────────────────────────────────────────────
function MapContent({
  cityPoints,
  onSelectCluster,
}: {
  cityPoints: CityPoint[]
  onSelectCluster: (cluster: ClusterPoint | null) => void
}) {
  const map = useMap()
  const [clusters, setClusters] = useState<ClusterPoint[]>([])
  const [markersLayer] = useState(() => L.layerGroup())

  const rebuild = useCallback(() => {
    const zoom = map.getZoom()
    const newClusters = clusterPoints(cityPoints, zoom)
    setClusters(newClusters)

    markersLayer.clearLayers()

    newClusters.forEach((cl) => {
      const count = cl.count
      const r = Math.max(18, Math.min(10 + Math.sqrt(count) * 5, 48))

      // Couleur selon taille
      const bg = count >= 50 ? '#4a0010' : count >= 20 ? '#800020' : count >= 5 ? '#a0102a' : '#c0203a'
      const border = count >= 50 ? '#800020' : count >= 5 ? '#fca5a5' : '#fecdd3'

      const icon = L.divIcon({
        className: '',
        iconSize: [r * 2, r * 2],
        iconAnchor: [r, r],
        html: `
          <div style="
            width:${r * 2}px; height:${r * 2}px;
            background:${bg};
            border:2.5px solid ${border};
            border-radius:50%;
            display:flex; align-items:center; justify-content:center;
            cursor:pointer;
            box-shadow: 0 2px 12px rgba(128,0,32,0.4);
            transition: transform 0.15s;
          " onmouseenter="this.style.transform='scale(1.12)'" onmouseleave="this.style.transform='scale(1)'">
            <span style="color:white; font-size:${count > 99 ? 10 : 12}px; font-weight:900; font-family:sans-serif; line-height:1;">
              ${count}
            </span>
          </div>
        `,
      })

      const marker = L.marker([cl.lat, cl.lng], { icon })
      marker.on('click', () => onSelectCluster(cl))
      markersLayer.addLayer(marker)
    })
  }, [cityPoints, map, markersLayer, onSelectCluster])

  useEffect(() => {
    markersLayer.addTo(map)
    return () => { markersLayer.remove() }
  }, [map, markersLayer])

  useEffect(() => {
    setTimeout(() => { map.invalidateSize(); rebuild() }, 300)
  }, [cityPoints, rebuild])

  useMapEvents({
    zoomend: rebuild,
    moveend: rebuild,
  })

  return null
}

// ── Panneau latéral ───────────────────────────────────────────────────────────
function SidePanel({
  cluster,
  onClose,
}: {
  cluster: ClusterPoint | null
  onClose: () => void
}) {
  if (!cluster) return null

  return (
    <div
      className="absolute top-3 left-3 z-[1000] w-72 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden"
      style={{ animation: 'slideIn 0.25s ease', maxHeight: 'calc(100% - 24px)' }}
    >
      <style>{`@keyframes slideIn { from { opacity:0; transform:translateX(-12px); } to { opacity:1; transform:translateX(0); } }`}</style>

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#800020] text-white flex-shrink-0">
        <div>
          <p className="text-xs font-black uppercase tracking-wide truncate max-w-[180px]">
            {cluster.cities.length === 1 ? cluster.cities[0] : `${cluster.cities.length} villes`}
          </p>
          <p className="text-[10px] text-white/70 font-medium">
            {cluster.count} membre{cluster.count > 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={onClose}
          className="w-7 h-7 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 text-white text-xs font-black cursor-pointer transition-colors"
        >
          ✕
        </button>
      </div>

      {/* Liste membres */}
      <div className="overflow-y-auto" style={{ maxHeight: '420px' }}>
        {cluster.members.map((m) => {
          const photoUrl = m.photo && typeof m.photo === 'object' ? m.photo.url : null
          const initials = `${m.prenom?.[0] ?? ''}${m.nom?.[0] ?? ''}`.toUpperCase()
          return (
            <Link
              key={m.id}
              href={`/profile/${m.id}`}
              className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0 no-underline group"
            >
              {/* Avatar */}
              <div className="w-9 h-9 rounded-xl overflow-hidden bg-[#800020] flex items-center justify-center flex-shrink-0 border-2 border-gray-100">
                {photoUrl
                  ? <img src={photoUrl} alt="" className="w-full h-full object-cover" />
                  : <span className="text-white text-[11px] font-black">{initials}</span>
                }
              </div>
              {/* Infos */}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-black text-gray-900 truncate group-hover:text-[#800020] transition-colors">
                  {m.prenom} {m.nom}
                </p>
                <p className="text-[10px] text-gray-400 font-medium truncate">
                  {m.poste || (m.statut === 'alumni' ? 'Alumni' : 'Étudiant')}
                </p>
                {m.ville && (
                  <p className="text-[9px] text-gray-300 font-medium truncate">📍 {m.ville}</p>
                )}
              </div>
              {/* Badge */}
              <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full flex-shrink-0 ${m.statut === 'alumni' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                {m.statut === 'alumni' ? 'Alumni' : 'Étu.'}
              </span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

// ── Composant principal ───────────────────────────────────────────────────────
export default function DirectoryMap({ alumni }: { alumni: Alumnus[] }) {
  const [cityPoints, setCityPoints] = useState<CityPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [progress, setProgress] = useState(0)
  const [selectedCluster, setSelectedCluster] = useState<ClusterPoint | null>(null)

  useEffect(() => {
    let cancelled = false

    async function build() {
      setLoading(true)
      setProgress(0)

      // Grouper par ville
      const byVille: Record<string, Alumnus[]> = {}
      for (const a of alumni) {
        if (a.latitude && a.longitude) {
          const key = `__gps__${a.id}`
          byVille[key] = [a]
        } else if (a.ville?.trim()) {
          const k = a.ville.trim().toLowerCase()
          byVille[k] = byVille[k] || []
          byVille[k].push(a)
        }
      }

      const keys = Object.keys(byVille)
      const points: CityPoint[] = []
      let done = 0

      for (const key of keys) {
        if (cancelled) return
        const members = byVille[key]
        const first = members[0]

        if (key.startsWith('__gps__')) {
          points.push({
            ville: first.ville || 'Inconnu',
            lat: parseFloat(String(first.latitude)),
            lng: parseFloat(String(first.longitude)),
            members,
          })
        } else {
          const coords = await geocodeVille(first.ville!)
          if (coords) {
            points.push({ ville: first.ville!, lat: coords.lat, lng: coords.lng, members })
          }
          await new Promise(r => setTimeout(r, 110))
        }

        done++
        if (!cancelled) setProgress(Math.round(done / keys.length * 100))
      }

      if (!cancelled) {
        setCityPoints(points)
        setLoading(false)
      }
    }

    build()
    return () => { cancelled = true }
  }, [alumni])

  return (
    <div className="w-full h-[600px] rounded-3xl overflow-hidden border border-gray-200 shadow-sm relative bg-gray-900">

      {/* Overlay chargement */}
      {loading && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-gray-900/90 backdrop-blur-sm rounded-3xl">
          <div className="text-center space-y-4">
            <div className="text-3xl">🗺️</div>
            <p className="text-sm font-black text-white uppercase tracking-wider">Localisation des membres</p>
            <div className="w-52 h-1.5 bg-white/20 rounded-full overflow-hidden">
              <div className="h-full bg-[#800020] rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>
            <p className="text-xs text-white/50 font-medium">{progress}% · {cityPoints.length} villes trouvées</p>
          </div>
        </div>
      )}

      <MapContainer
        center={[46.8, 2.3]}
        zoom={6}
        style={{ height: '100%', width: '100%' }}
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {!loading && cityPoints.length > 0 && (
          <MapContent
            cityPoints={cityPoints}
            onSelectCluster={setSelectedCluster}
          />
        )}
      </MapContainer>

      {/* Panneau latéral */}
      <SidePanel cluster={selectedCluster} onClose={() => setSelectedCluster(null)} />

      {/* Légende */}
      {!loading && (
        <div className="absolute bottom-3 right-3 z-[1000] bg-white/90 backdrop-blur-sm rounded-xl px-3 py-2 shadow-sm border border-gray-100">
          <p className="text-[9px] font-black text-gray-500 uppercase tracking-wider mb-1.5">Membres par zone</p>
          <div className="flex items-center gap-2">
            {[{ color: '#c0203a', label: '1-4' }, { color: '#a0102a', label: '5-19' }, { color: '#800020', label: '20-49' }, { color: '#4a0010', label: '50+' }].map(({ color, label }) => (
              <div key={label} className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                <span className="text-[9px] text-gray-500 font-bold">{label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
