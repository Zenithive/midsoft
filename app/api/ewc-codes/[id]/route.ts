import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const db = getDb()

  db.prepare(`
    UPDATE ewc_codes
    SET code = ?, description = ?, hazardous = ?, is_active = ?
    WHERE id = ?
  `).run(body.code, body.description, Number(body.hazardous ?? 0), Number(body.is_active ?? 1), Number(id))

  return NextResponse.json({ success: true })
}
