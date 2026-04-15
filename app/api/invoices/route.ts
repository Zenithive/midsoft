import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const customerId = searchParams.get('customerId')

  const db = getDb()
  const conditions: string[] = []
  const params: unknown[] = []

  if (customerId) { conditions.push('customer_id = ?'); params.push(Number(customerId)) }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
  const invoices = db.prepare(`SELECT * FROM invoices ${where}`).all(...params)

  return NextResponse.json(invoices ?? [])
}