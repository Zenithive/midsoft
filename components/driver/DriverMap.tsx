'use client'

import { MapContainer, TileLayer, Marker, Circle } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const pulsingIcon = L.divIcon({
  className: '',
  html: `<div style="width:16px;height:16px;border-radius:50%;background:#3b82f6;border:3px solid white;box-shadow:0 0 0 4px rgba(59,130,246,0.3);animation:pulse 2s infinite"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
})

interface Props {
  gps: { lat: number; lng: number } | null
}

export default function DriverMap({ gps }: Props) {
  const center: [number, number] = gps ? [gps.lat, gps.lng] : [51.5, -0.1]

  return (
    <MapContainer center={center} zoom={14} style={{ height: '100%', width: '100%' }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {gps && (
        <>
          <Marker position={[gps.lat, gps.lng]} icon={pulsingIcon} />
          <Circle center={[gps.lat, gps.lng]} radius={50} color="#3b82f6" fillOpacity={0.1} />
        </>
      )}
    </MapContainer>
  )
}
