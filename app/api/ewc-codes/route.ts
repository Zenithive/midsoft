import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const query = searchParams.get('q')?.trim()
  const activeOnly = searchParams.get('active') === '1'

  const db = getDb()
  const clauses: string[] = []
  const params: unknown[] = []
  if (query) {
    clauses.push('(code LIKE ? OR description LIKE ?)')
    params.push(`%${query}%`, `%${query}%`)
  }
  if (activeOnly) clauses.push('is_active = 1')
  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : ''
  const rows = db.prepare(`SELECT * FROM ewc_codes ${where} ORDER BY code ASC`).all(...params)
  return NextResponse.json(rows)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const db = getDb()
  const result = db.prepare(`
    INSERT INTO ewc_codes (code, description, hazardous, is_active)
    VALUES (?, ?, ?, ?)
  `).run(body.code, body.description, Number(body.hazardous ?? 0), Number(body.is_active ?? 1))

  return NextResponse.json({ success: true, id: result.lastInsertRowid })
}
