import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function GET() {
  const db = getDb()

  const real = db.prepare(`
    SELECT date, SUM(total_distance_km) as totalDistanceKm 
    FROM routes 
    GROUP BY date 
    ORDER BY date
  `).all() as { date: string; totalDistanceKm: number }[]

  // Pad with 30 days of synthetic data
  const result: { date: string; totalDistanceKm: number }[] = []
  for (let i = 29; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().split('T')[0]
    const existing = real.find(r => r.date === dateStr)
    if (existing) {
      result.push(existing)
    } else {
      const seed = d.getDate() + d.getMonth() * 31
      const dow = d.getDay()
      const isWeekend = dow === 0 || dow === 6
      const km = isWeekend ? 15 + (seed % 20) : 40 + (seed % 50)
      result.push({ date: dateStr, totalDistanceKm: km })
    }
  }

  return NextResponse.json(result)
}
