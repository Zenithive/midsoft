'use client'

import { useEffect, useMemo } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix default icon paths broken by webpack
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const STATUS_COLORS: Record<string, string> = {
  pending: '#6b7280',
  assigned: '#3b82f6',
  in_progress: '#f97316',
  completed: '#22c55e',
  cancelled: '#ef4444',
}

function createJobIcon(status: string) {
  const color = STATUS_COLORS[status] || '#6b7280'
  return L.divIcon({
    className: '',
    html: `<div style="width:14px;height:14px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,0.4)"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  })
}

function createYardIcon() {
  return L.divIcon({
    className: '',
    html: `<div style="width:28px;height:28px;border-radius:4px;background:#1e293b;border:2px solid white;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 4px rgba(0,0,0,0.4);font-size:14px">🏭</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  })
}

function createTruckIcon() {
  return L.divIcon({
    className: '',
    html: `<div style="width:24px;height:24px;border-radius:50%;background:#0ea5e9;border:2px solid white;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 4px rgba(0,0,0,0.4);font-size:12px;animation:pulse 2s infinite">🚛</div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  })
}

interface Job {
  id: number
  lat: number
  lng: number
  status: string
  customer_name: string
  address: string
  skip_size: number
  type: string
}

interface GpsPosition {
  id: number
  driver_id: number
  vehicle_id: number
  lat: number
  lng: number
  speed_kmh: number
  heading: number
}

interface Yard {
  id: number
  name: string
  lat: number
  lng: number
}

interface Route {
  id: number
  job_ids: string
}

interface Props {
  jobs: Job[]
  gpsPositions: GpsPosition[]
  yards: Yard[]
  onJobPinClick?: (job: Job) => void
  skipsOnSite?: Array<{
    id: number
    customer_name: string
    site_address: string
    site_lat: number
    site_lng: number
    days_on_site: number
    skip_size_yards: number | null
  }>
}

function createSkipIcon(daysOnSite: number) {
  let color = '#16a34a'
  if (daysOnSite >= 30) color = '#dc2626'
  else if (daysOnSite >= 14) color = '#d97706'

  return L.divIcon({
    className: '',
    html: `<div style="width:20px;height:20px;border-radius:4px;background:${color};border:2px solid white;display:flex;align-items:center;justify-content:center;box-shadow:0 1px 3px rgba(0,0,0,0.4);font-size:11px">🗑</div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  })
}

function MapBounds({ yards }: { yards: Yard[] }) {
  const map = useMap()
  useEffect(() => {
    if (yards.length > 0) {
      const bounds = L.latLngBounds(yards.map(y => [y.lat, y.lng]))
      map.fitBounds(bounds, { padding: [50, 50] })
    }
  }, [map, yards])
  return null
}

export default function DispatcherMapInner({ jobs, gpsPositions, yards, onJobPinClick, skipsOnSite = [] }: Props) {
  const center: [number, number] = yards.length > 0
    ? [yards[0].lat, yards[0].lng]
    : [51.5, -0.1]

  const yardIcon = useMemo(() => createYardIcon(), [])
  const truckIcon = useMemo(() => createTruckIcon(), [])

  return (
    <MapContainer
      center={center}
      zoom={11}
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {yards.length > 0 && <MapBounds yards={yards} />}

      {/* Yard markers */}
      {yards.map(yard => (
        <Marker key={`yard-${yard.id}`} position={[yard.lat, yard.lng]} icon={yardIcon}>
          <Popup>
            <div className="font-semibold">{yard.name}</div>
            <div className="text-xs text-gray-500">Yard</div>
          </Popup>
        </Marker>
      ))}

      {/* Job pins */}
      {jobs.map(job => (
        <Marker
          key={`job-${job.id}`}
          position={[job.lat, job.lng]}
          icon={createJobIcon(job.status)}
          eventHandlers={{ click: () => onJobPinClick?.(job) }}
        >
          <Popup>
            <div className="min-w-[180px]">
              <div className="font-semibold text-sm">{job.customer_name}</div>
              <div className="text-xs text-gray-500 mt-1">{job.address}</div>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">{job.type}</span>
                <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">{job.skip_size}yd</span>
              </div>
              <div className="mt-1">
                <span
                  className="text-xs px-2 py-0.5 rounded text-white"
                  style={{ background: STATUS_COLORS[job.status] || '#6b7280' }}
                >
                  {job.status.replace('_', ' ')}
                </span>
              </div>
            </div>
          </Popup>
        </Marker>
      ))}

      {/* GPS truck markers */}
      {gpsPositions.map(pos => (
        <Marker
          key={`truck-${pos.driver_id}`}
          position={[pos.lat, pos.lng]}
          icon={truckIcon}
        >
          <Popup>
            <div className="text-xs">
              <div className="font-semibold">Driver #{pos.driver_id}</div>
              <div>Speed: {Math.round(pos.speed_kmh)} km/h</div>
              <div>Heading: {Math.round(pos.heading)}°</div>
            </div>
          </Popup>
        </Marker>
      ))}

      {/* Skips-on-site markers */}
      {skipsOnSite.map(skip => (
        <Marker
          key={`skip-on-site-${skip.id}`}
          position={[Number(skip.site_lat), Number(skip.site_lng)]}
          icon={createSkipIcon(Number(skip.days_on_site || 0))}
        >
          <Popup>
            <div className="min-w-[200px] text-xs">
              <div className="font-semibold">{skip.customer_name}</div>
              <div className="text-gray-500 mt-1">{skip.site_address}</div>
              <div className="mt-1">{skip.skip_size_yards || '-'}yd • {skip.days_on_site} days on site</div>
              <div className="flex gap-2 mt-2">
                <a className="underline" href={`/admin/bookings?agreement_id=${skip.id}&type=collection`}>Schedule Collection</a>
                <a className="underline" href={`/admin/bookings?agreement_id=${skip.id}&type=exchange`}>Schedule Exchange</a>
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
