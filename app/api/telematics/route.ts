import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const vehicleId = searchParams.get('vehicleId')
  const driverId = searchParams.get('driverId')

  const db = getDb()
  const conditions: string[] = []
  const params: unknown[] = []

  if (vehicleId) { conditions.push('vehicle_id = ?'); params.push(Number(vehicleId)) }
  if (driverId) { conditions.push('driver_id = ?'); params.push(Number(driverId)) }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
  const events = db.prepare(`SELECT * FROM telematics_events ${where} ORDER BY timestamp DESC`).all(...params)

  return NextResponse.json(events ?? [])
}