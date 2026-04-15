import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const yardId = searchParams.get('yardId')
  const db = getDb()
  const conditions: string[] = []
  const params: unknown[] = []
  if (yardId) { conditions.push('id = ?'); params.push(Number(yardId)) }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
  const yards = db.prepare(`SELECT * FROM yards ${where}`).all(...params)
  return NextResponse.json(yards ?? [])
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { name, address, lat, lng, serviceRadiusKm } = body
  if (!name || !address || lat == null || lng == null) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }
  const db = getDb()
  const result = db.prepare(`INSERT INTO yards (name, address, lat, lng, service_radius_km, skip_stock) VALUES (?, ?, ?, ?, ?, ?)`).run(name, address, lat, lng, serviceRadiusKm || 12, '{}')
  return NextResponse.json({ success: true, id: result.lastInsertRowid })
}
