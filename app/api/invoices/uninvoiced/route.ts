import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const from = searchParams.get('from')
  const to = searchParams.get('to')
  const customerType = searchParams.get('customer_type')
  const yardId = searchParams.get('yard_id')

  const db = getDb()
  const clauses = ['j.invoiced = 0']
  const params: unknown[] = []

  if (from) {
    clauses.push('j.scheduled_date >= ?')
    params.push(from)
  }
  if (to) {
    clauses.push('j.scheduled_date <= ?')
    params.push(to)
  }
  if (customerType && customerType !== 'all') {
    clauses.push('c.customer_type = ?')
    params.push(customerType)
  }
  if (yardId && yardId !== 'all') {
    clauses.push('j.yard_id = ?')
    params.push(Number(yardId))
  }

  // Paid cash jobs are excluded from batch invoicing.
  clauses.push(`NOT (c.customer_type = 'cash' AND j.is_paid = 1)`)

  const rows = db.prepare(`
    SELECT j.*, c.name as customer_name, c.account_number, c.customer_type,
           c.do_not_invoice, c.batch_option,
           a.site_address,
           s.name as service_name
    FROM jobs j
    JOIN agreements a ON a.id = j.agreement_id
    JOIN customers c ON c.id = a.customer_id
    LEFT JOIN services s ON s.id = j.service_id
    WHERE ${clauses.join(' AND ')}
    ORDER BY c.name ASC, j.scheduled_date ASC
  `).all(...params)

  return NextResponse.json(rows)
}
