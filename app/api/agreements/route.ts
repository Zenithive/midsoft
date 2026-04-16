import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const customerId = searchParams.get('customer_id')
  const status = searchParams.get('status')

  const db = getDb()
  const clauses: string[] = []
  const params: unknown[] = []

  if (customerId) {
    clauses.push('a.customer_id = ?')
    params.push(Number(customerId))
  }
  if (status) {
    clauses.push('a.status = ?')
    params.push(status)
  }

  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : ''
  const rows = db.prepare(`
    SELECT a.*, c.name as customer_name, c.account_number,
           s.name as service_name, s.skip_size_yards,
           e.code as ewc_code,
           y.name as yard_name,
           (SELECT MAX(j.scheduled_date) FROM jobs j WHERE j.agreement_id = a.id) as last_job_date
    FROM agreements a
    JOIN customers c ON c.id = a.customer_id
    LEFT JOIN services s ON s.id = a.service_id
    LEFT JOIN ewc_codes e ON e.id = a.default_ewc_code_id
    LEFT JOIN yards y ON y.id = a.yard_id
    ${where}
    ORDER BY a.created_at DESC
  `).all(...params)

  return NextResponse.json(rows)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const db = getDb()

  const result = db.prepare(`
    INSERT INTO agreements (
      customer_id, yard_id, site_name, site_address, site_lat, site_lng,
      service_id, default_ewc_code_id, standard_price_gbp, is_permanent_site,
      skip_currently_on_site, skip_delivered_date, notes, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    Number(body.customer_id),
    body.yard_id ?? null,
    body.site_name ?? null,
    body.site_address,
    body.site_lat ?? null,
    body.site_lng ?? null,
    body.service_id ?? null,
    body.default_ewc_code_id ?? null,
    Number(body.standard_price_gbp ?? 0),
    Number(body.is_permanent_site ?? 0),
    Number(body.skip_currently_on_site ?? 0),
    body.skip_delivered_date ?? null,
    body.notes ?? null,
    body.status ?? 'active',
  )

  return NextResponse.json({ success: true, id: result.lastInsertRowid })
}
