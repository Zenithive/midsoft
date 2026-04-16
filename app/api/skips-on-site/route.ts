import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const yardId = searchParams.get('yard_id')

  const db = getDb()
  const clauses = ['a.skip_currently_on_site = 1']
  const params: unknown[] = []
  if (yardId) {
    clauses.push('a.yard_id = ?')
    params.push(Number(yardId))
  }

  const rows = db.prepare(`
    SELECT a.*, c.name as customer_name, c.account_number,
           s.name as service_name, s.skip_size_yards,
           y.name as yard_name,
           (SELECT MAX(j.scheduled_date) FROM jobs j WHERE j.agreement_id = a.id) as last_job_date,
           CAST(julianday('now') - julianday(a.skip_delivered_date) AS INTEGER) as days_on_site
    FROM agreements a
    JOIN customers c ON c.id = a.customer_id
    LEFT JOIN services s ON s.id = a.service_id
    LEFT JOIN yards y ON y.id = a.yard_id
    WHERE ${clauses.join(' AND ')}
    ORDER BY days_on_site DESC
  `).all(...params)

  return NextResponse.json(rows)
}
