import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { haversineDistanceKm } from '@/lib/domain'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const lat = Number(searchParams.get('lat'))
  const lng = Number(searchParams.get('lng'))
  const radius = Number(searchParams.get('radius') ?? 2)

  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    return NextResponse.json({ error: 'lat and lng are required' }, { status: 400 })
  }

  const db = getDb()
  const rows = db.prepare(`
    SELECT a.id as agreement_id, a.site_address, a.site_lat, a.site_lng, a.skip_delivered_date,
           c.name as customer_name,
           s.name as service_name, s.skip_size_yards
    FROM agreements a
    JOIN customers c ON c.id = a.customer_id
    LEFT JOIN services s ON s.id = a.service_id
    WHERE a.skip_currently_on_site = 1
      AND a.site_lat IS NOT NULL
      AND a.site_lng IS NOT NULL
  `).all() as Array<any>

  const results = rows
    .map((row) => {
      const distance = haversineDistanceKm(lat, lng, Number(row.site_lat), Number(row.site_lng))
      const delivered = row.skip_delivered_date ? new Date(row.skip_delivered_date) : null
      const daysOnSite = delivered ? Math.max(0, Math.floor((Date.now() - delivered.getTime()) / 86400000)) : 0
      return { ...row, days_on_site: daysOnSite, distance_km: distance }
    })
    .filter((row) => row.distance_km <= radius)
    .sort((a, b) => a.distance_km - b.distance_km)

  return NextResponse.json(results)
}
