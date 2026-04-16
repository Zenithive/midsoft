import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function GET(req: NextRequest) {
  const db = getDb()

  const totalJobs = db.prepare('SELECT COUNT(*) as count FROM jobs').get() as any
  const completedJobs = db.prepare("SELECT COUNT(*) as count FROM jobs WHERE status = 'completed'").get() as any
  const totalRevenue = db.prepare("SELECT SUM(total_gbp) as total FROM invoices WHERE status = 'paid'").get() as any
  const totalDistance = db.prepare('SELECT SUM(total_distance_km) as total FROM routes').get() as any
  const activeDrivers = db.prepare("SELECT COUNT(*) as count FROM drivers WHERE status = 'on_shift'").get() as any

  return NextResponse.json({
    totalJobs: totalJobs.count,
    completedJobs: completedJobs.count,
    totalRevenue: totalRevenue.total || 0,
    totalDistanceKm: totalDistance.total || 0,
    activeDrivers: activeDrivers.count
  })
}