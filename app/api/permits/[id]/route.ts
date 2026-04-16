import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const db = getDb()

  db.prepare(`
    UPDATE permits
    SET local_authority = ?,
        application_date = ?,
        start_date = ?,
        end_date = ?,
        status = ?,
        permit_reference = ?,
        notes = ?
    WHERE id = ?
  `).run(
    body.local_authority ?? null,
    body.application_date ?? null,
    body.start_date ?? null,
    body.end_date ?? null,
    body.status ?? 'not_required',
    body.permit_reference ?? null,
    body.notes ?? null,
    Number(id),
  )

  return NextResponse.json({ success: true })
}
