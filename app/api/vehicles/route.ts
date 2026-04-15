import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

const VALID_TYPES = ['skip_lorry', 'flatbed', 'tipper']

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const yardId = searchParams.get('yardId')
  const db = getDb()
  const conditions: string[] = []
  const params: unknown[] = []
  if (yardId) { conditions.push('yard_id = ?'); params.push(Number(yardId)) }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
  const vehicles = db.prepare(`SELECT * FROM vehicles ${where}`).all(...params)
  return NextResponse.json(vehicles ?? [])
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { yardId, registration, type, capacityTonnes, maxSkips } = body
  if (!yardId || !registration || !type || !capacityTonnes || !maxSkips) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }
  if (!VALID_TYPES.includes(type)) {
    return NextResponse.json({ error: 'Invalid vehicle type' }, { status: 400 })
  }
  const db = getDb()
  const result = db.prepare(`INSERT INTO vehicles (yard_id, registration, type, capacity_tonnes, max_skips, status) VALUES (?, ?, ?, ?, ?, 'available')`).run(yardId, registration, type, capacityTonnes, maxSkips)
  return NextResponse.json({ success: true, id: result.lastInsertRowid })
}
