import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { optimise } from '@/lib/optimizer'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { yardId, vehicleId, driverId, date, constraints } = body

  const db = getDb()

  // Load yard
  const yard = db.prepare('SELECT * FROM yards WHERE id = ?').get(yardId) as any
  if (!yard) {
    return NextResponse.json({ error: 'Yard not found' }, { status: 404 })
  }

  // Load pending jobs for yard+date
  const jobs = db.prepare(`SELECT * FROM jobs WHERE yard_id = ? AND scheduled_date = ? AND status = 'pending'`).all(yardId, date) as any[]

  if (jobs.length === 0) {
    return NextResponse.json({ error: 'No pending jobs found for this yard and date' }, { status: 400 })
  }

  // Run optimisation
  const result = optimise(yard, jobs, constraints || {
    maxStops: 8,
    shiftEndTime: '17:00',
    avoidMotorways: false,
    prioritiseCommercial: false
  })

  return NextResponse.json(result)
}