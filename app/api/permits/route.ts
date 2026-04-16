import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const status = searchParams.get('status')
  const authority = searchParams.get('local_authority')
  const from = searchParams.get('from')
  const to = searchParams.get('to')

  const db = getDb()
  const clauses: string[] = []
  const params: unknown[] = []

  if (status && status !== 'all') {
    clauses.push('p.status = ?')
    params.push(status)
  }
  if (authority) {
    clauses.push('p.local_authority LIKE ?')
    params.push(`%${authority}%`)
  }
  if (from) {
    clauses.push('p.start_date >= ?')
    params.push(from)
  }
  if (to) {
    clauses.push('p.end_date <= ?')
    params.push(to)
  }

  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : ''
  const rows = db.prepare(`
    SELECT p.*, j.id as job_ref, c.name as customer_name
    FROM permits p
    LEFT JOIN jobs j ON j.id = p.job_id
    LEFT JOIN customers c ON c.id = p.customer_id
    ${where}
    ORDER BY p.created_at DESC
  `).all(...params)

  return NextResponse.json(rows)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const db = getDb()

  const result = db.prepare(`
    INSERT INTO permits (
      job_id, customer_id, site_address, local_authority, permit_type,
      application_date, start_date, end_date, status, permit_reference, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    body.job_id ?? null,
    body.customer_id ?? null,
    body.site_address ?? null,
    body.local_authority ?? null,
    body.permit_type ?? 'skip_on_highway',
    body.application_date ?? new Date().toISOString().split('T')[0],
    body.start_date ?? null,
    body.end_date ?? null,
    body.status ?? 'not_required',
    body.permit_reference ?? null,
    body.notes ?? null,
  )

  if (body.job_id) {
    db.prepare('UPDATE jobs SET permit_id = ?, highway_placement = 1 WHERE id = ?').run(result.lastInsertRowid, Number(body.job_id))
  }

  return NextResponse.json({ success: true, id: result.lastInsertRowid })
}
