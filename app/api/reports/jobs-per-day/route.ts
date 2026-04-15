import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function GET(req: NextRequest) {
  const db = getDb()
  
  const data = db.prepare(`
    SELECT scheduled_date as date, COUNT(*) as count 
    FROM jobs 
    WHERE scheduled_date >= date('now', '-30 days')
    GROUP BY scheduled_date 
    ORDER BY scheduled_date
  `).all()

  return NextResponse.json(data ?? [])
}