import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const yardId = searchParams.get('yardId')
  const db = getDb()
  const conditions: string[] = []
  const params: unknown[] = []
  if (yardId) { conditions.push('yard_id = ?'); params.push(Number(yardId)) }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
  const drivers = db.prepare(`SELECT * FROM drivers ${where}`).all(...params)
  return NextResponse.json(drivers ?? [])
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { yardId, name, phone, licenceClass, shiftStart, shiftEnd } = body
  if (!yardId || !name || !phone || !licenceClass) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }
  const db = getDb()
  const result = db.prepare(`INSERT INTO drivers (yard_id, name, phone, licence_class, shift_start, shift_end, status) VALUES (?, ?, ?, ?, ?, ?, 'available')`).run(yardId, name, phone, licenceClass, shiftStart || '08:00', shiftEnd || '17:00')
  return NextResponse.json({ success: true, id: result.lastInsertRowid })
}
