import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function GET(req: NextRequest) {
  const db = getDb()
  
  const data = db.prepare(`
    SELECT date, SUM(total_distance_km) as totalDistanceKm 
    FROM routes 
    WHERE date >= date('now', '-30 days')
    GROUP BY date 
    ORDER BY date
  `).all()

  return NextResponse.json(data ?? [])
}