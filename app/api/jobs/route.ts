import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const date = searchParams.get('date')
  const yardId = searchParams.get('yardId')
  const status = searchParams.get('status')
  const driverId = searchParams.get('driverId')

  const db = getDb()
  const conditions: string[] = []
  const params: unknown[] = []

  if (date) { conditions.push('scheduled_date = ?'); params.push(date) }
  if (yardId) { conditions.push('yard_id = ?'); params.push(Number(yardId)) }
  if (status) { conditions.push('status = ?'); params.push(status) }
  if (driverId) { conditions.push('driver_id = ?'); params.push(Number(driverId)) }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
  const jobs = db.prepare(`SELECT * FROM jobs ${where} ORDER BY sequence_order ASC, scheduled_time ASC`).all(...params)

  return NextResponse.json(jobs ?? [])
}
