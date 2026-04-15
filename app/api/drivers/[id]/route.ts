import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const driverId = Number(id)
  const body = await req.json()
  const { status } = body

  const validStatuses = ['available', 'on_shift', 'off_duty']
  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  const db = getDb()
  db.prepare('UPDATE drivers SET status = ? WHERE id = ?').run(status, driverId)

  return NextResponse.json({ success: true })
}