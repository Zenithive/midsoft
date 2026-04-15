import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { provider, recordType, recordId } = body
  const validProviders = ['xero', 'quickbooks', 'sage']
  if (!validProviders.includes(provider)) return NextResponse.json({ error: 'Invalid provider' }, { status: 400 })
  const db = getDb()
  // Simulate sync — randomly succeed or fail for demo
  const success = Math.random() > 0.2
  db.prepare(`INSERT INTO accounting_sync_log (provider, record_type, record_id, synced_at, status, error_message) VALUES (?, ?, ?, datetime('now'), ?, ?)`).run(
    provider, recordType || 'invoice', recordId || 1, success ? 'success' : 'failed', success ? null : 'Simulated error'
  )
  return NextResponse.json({ success, provider })
}
