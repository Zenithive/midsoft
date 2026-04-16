import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const db = getDb()

  db.prepare(`
    UPDATE services
    SET name = ?,
        container_type = ?,
        skip_size_yards = ?,
        default_price_gbp = ?,
        default_ewc_code_id = ?,
        vat_rate = ?,
        is_active = ?
    WHERE id = ?
  `).run(
    body.name,
    body.container_type ?? null,
    body.skip_size_yards ?? null,
    Number(body.default_price_gbp ?? 0),
    body.default_ewc_code_id ?? null,
    Number(body.vat_rate ?? 20),
    Number(body.is_active ?? 1),
    Number(id),
  )

  return NextResponse.json({ success: true })
}
