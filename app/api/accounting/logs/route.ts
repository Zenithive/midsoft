import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function GET() {
  const db = getDb()
  const logs = db.prepare('SELECT * FROM accounting_sync_log ORDER BY synced_at DESC').all()
  return NextResponse.json(logs ?? [])
}
