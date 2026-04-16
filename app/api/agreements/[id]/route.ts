import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const db = getDb()

  db.prepare(`
    UPDATE agreements
    SET yard_id = ?,
        site_name = ?,
        site_address = ?,
        site_lat = ?,
        site_lng = ?,
        service_id = ?,
        default_ewc_code_id = ?,
        standard_price_gbp = ?,
        is_permanent_site = ?,
        skip_currently_on_site = ?,
        skip_delivered_date = ?,
        notes = ?,
        status = ?
    WHERE id = ?
  `).run(
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
    Number(id),
  )

  return NextResponse.json({ success: true })
}
