import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const db = getDb()

  const rows = db.prepare(`
    SELECT j.*, d.name as driver_name, s.name as service_name
    FROM jobs j
    LEFT JOIN drivers d ON d.id = j.driver_id
    LEFT JOIN services s ON s.id = j.service_id
    WHERE j.agreement_id = ?
    ORDER BY j.scheduled_date DESC, j.id DESC
  `).all(Number(id))

  return NextResponse.json(rows)
}
