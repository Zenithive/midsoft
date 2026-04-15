import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function GET(req: NextRequest) {
  const db = getDb()
  const records = db.prepare(`
    SELECT wr.*, j.address, j.customer_name, j.scheduled_date, v.registration 
    FROM waste_records wr 
    JOIN jobs j ON j.id = wr.job_id 
    JOIN vehicles v ON v.id = wr.vehicle_id
  `).all()

  return NextResponse.json(records ?? [])
}