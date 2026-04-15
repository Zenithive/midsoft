import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const yardId = searchParams.get('yardId')

  const db = getDb()
  
  let query = `
    SELECT gps.* FROM gps_positions gps 
    JOIN drivers d ON d.id = gps.driver_id 
    WHERE d.status = 'on_shift' 
    AND gps.id IN (
      SELECT MAX(id) FROM gps_positions 
      GROUP BY driver_id
    )
  `
  const params: unknown[] = []

  if (yardId) {
    query += ' AND d.yard_id = ?'
    params.push(Number(yardId))
  }

  const positions = db.prepare(query).all(...params)
  return NextResponse.json(positions ?? [])
}