import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const { status } = body
  const valid = ['draft', 'sent', 'paid', 'overdue']
  if (!valid.includes(status)) return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  const db = getDb()
  db.prepare('UPDATE invoices SET status = ? WHERE id = ?').run(status, Number(id))
  return NextResponse.json({ success: true })
}
