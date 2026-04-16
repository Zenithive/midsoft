import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const customerId = searchParams.get('customerId')

  const db = getDb()
  const conditions: string[] = []
  const params: unknown[] = []

  if (customerId) { conditions.push('customer_id = ?'); params.push(Number(customerId)) }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
  const bookings = db.prepare(`SELECT * FROM bookings ${where}`).all(...params)

  return NextResponse.json(bookings ?? [])
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { customerId, yardId, bookingDate, jobType, skipSize, preferredTimeSlot, notes } = body

  // Validate skip size
  const validSizes = [2, 4, 6, 8, 10, 12, 14, 16]
  if (!validSizes.includes(skipSize)) {
    return NextResponse.json({ error: 'Invalid skip size' }, { status: 400 })
  }

  const db = getDb()
  const customer = db.prepare('SELECT on_stop FROM customers WHERE id = ?').get(Number(customerId)) as { on_stop?: number } | undefined
  if (Number(customer?.on_stop ?? 0) === 1) {
    return NextResponse.json({ error: 'This account is on stop. New jobs cannot be created.' }, { status: 400 })
  }

  const result = db.prepare(`
    INSERT INTO bookings (customer_id, yard_id, booking_date, job_type, skip_size, preferred_time_slot, status, notes, created_at)
    VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, datetime('now'))
  `).run(customerId, yardId, bookingDate, jobType, skipSize, preferredTimeSlot, notes)

  return NextResponse.json({ success: true, id: result.lastInsertRowid })
}