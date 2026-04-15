import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function GET(req: NextRequest) {
  const db = getDb()
  const customers = db.prepare('SELECT * FROM customers').all()
  return NextResponse.json(customers ?? [])
}