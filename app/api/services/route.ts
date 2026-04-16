import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const activeOnly = searchParams.get('active') === '1'
  const db = getDb()
  const where = activeOnly ? 'WHERE s.is_active = 1' : ''
  const rows = db.prepare(`
    SELECT s.*, e.code as ewc_code, e.description as ewc_description
    FROM services s
    LEFT JOIN ewc_codes e ON e.id = s.default_ewc_code_id
    ${where}
    ORDER BY s.name ASC
  `).all()
  return NextResponse.json(rows)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const db = getDb()
  const result = db.prepare(`
    INSERT INTO services (name, container_type, skip_size_yards, default_price_gbp, default_ewc_code_id, vat_rate, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    body.name,
    body.container_type ?? null,
    body.skip_size_yards ?? null,
    Number(body.default_price_gbp ?? 0),
    body.default_ewc_code_id ?? null,
    Number(body.vat_rate ?? 20),
    Number(body.is_active ?? 1),
  )
  return NextResponse.json({ success: true, id: result.lastInsertRowid })
}
