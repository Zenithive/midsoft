import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const yardId = searchParams.get('yard_id')
  const dateFrom = searchParams.get('date_from')
  const dateTo = searchParams.get('date_to')

  const db = getDb()

  const driverClauses: string[] = []
  const driverParams: unknown[] = []
  if (yardId && yardId !== 'all') {
    driverClauses.push('d.yard_id = ?')
    driverParams.push(Number(yardId))
  }

  const driverWhere = driverClauses.length ? `WHERE ${driverClauses.join(' AND ')}` : ''
  const drivers = db.prepare(`
    SELECT d.*, y.name as yard_name
    FROM drivers d
    JOIN yards y ON y.id = d.yard_id
    ${driverWhere}
    ORDER BY d.name ASC
  `).all(...driverParams)

  const jobClauses: string[] = []
  const jobParams: unknown[] = []
  if (yardId && yardId !== 'all') {
    jobClauses.push('j.yard_id = ?')
    jobParams.push(Number(yardId))
  }
  if (dateFrom) {
    jobClauses.push('j.scheduled_date >= ?')
    jobParams.push(dateFrom)
  }
  if (dateTo) {
    jobClauses.push('j.scheduled_date <= ?')
    jobParams.push(dateTo)
  }

  const jobWhere = jobClauses.length ? `WHERE ${jobClauses.join(' AND ')}` : ''
  const jobs = db.prepare(`
    SELECT j.*, a.customer_id, a.site_address, c.name as customer_name,
           s.name as service_name, s.skip_size_yards
    FROM jobs j
    LEFT JOIN agreements a ON a.id = j.agreement_id
    LEFT JOIN customers c ON c.id = a.customer_id
    LEFT JOIN services s ON s.id = j.service_id
    ${jobWhere}
    ORDER BY j.scheduled_date ASC, j.sequence_order ASC
  `).all(...jobParams)

  return NextResponse.json({ drivers, jobs })
}
