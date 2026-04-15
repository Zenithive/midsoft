import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const yardId = searchParams.get('yardId')
  const db = getDb()
  const conditions: string[] = []
  const params: unknown[] = []
  if (yardId) { conditions.push('yard_id = ?'); params.push(Number(yardId)) }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
  const skips = db.prepare(`SELECT * FROM skips ${where} ORDER BY yard_id, size_yards`).all(...params)
  return NextResponse.json(skips ?? [])
}
