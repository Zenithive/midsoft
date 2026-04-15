import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function GET(req: NextRequest) {
  const db = getDb()
  
  const data = db.prepare(`
    SELECT strftime('%Y-%m', issued_date) as period, SUM(total_gbp) as revenue 
    FROM invoices 
    WHERE status = 'paid' AND issued_date >= date('now', '-12 months')
    GROUP BY strftime('%Y-%m', issued_date)
    ORDER BY period
  `).all()

  return NextResponse.json(data ?? [])
}