import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { generateAccountNumber } from '@/lib/domain'

function parseTruthy(value: unknown) {
  const normalized = String(value ?? '').toLowerCase().trim()
  return normalized === '1' || normalized === 'true' || normalized === 'yes'
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const rows = Array.isArray(body.rows) ? body.rows : []
  const db = getDb()

  const errors: Array<{ row: number; reason: string; data: any }> = []
  let imported = 0
  let skipped = 0

  const existingAccountNumbers = new Set(
    (db.prepare('SELECT account_number FROM customers WHERE account_number IS NOT NULL').all() as Array<{ account_number: string }>).map((r) => r.account_number)
  )

  rows.forEach((row: any, index: number) => {
    const name = String(row.name ?? '').trim()
    const postcode = String(row.postcode ?? '').trim()
    const customerType = String(row.customer_type ?? 'account').trim()
    const accountNumber = String(row.account_number ?? '').trim()

    if (!name || !postcode) {
      errors.push({ row: index + 1, reason: 'Missing required fields (name/postcode)', data: row })
      skipped += 1
      return
    }
    if (!['account', 'cash'].includes(customerType)) {
      errors.push({ row: index + 1, reason: 'Invalid customer_type', data: row })
      skipped += 1
      return
    }
    if (accountNumber && existingAccountNumbers.has(accountNumber)) {
      errors.push({ row: index + 1, reason: 'Duplicate account number', data: row })
      skipped += 1
      return
    }

    const rowCount = db.prepare('SELECT COUNT(*) as count FROM customers').get() as { count: number }
    const generated = accountNumber || generateAccountNumber(name, rowCount.count + 1)
    existingAccountNumbers.add(generated)

    db.prepare(`
      INSERT INTO customers (
        name, email, phone, address, lat, lng, account_type,
        customer_type, account_number, postcode, address_line1, address_line2, town, county,
        phone_main, phone_mobile, contact_email, invoice_email,
        payment_terms_days, payment_method, invoice_method,
        on_stop, po_mandatory, notes, imported_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).run(
      name,
      row.email ?? row.contact_email ?? '',
      row.phone_main ?? row.phone ?? '',
      [row.address_line1, row.address_line2, row.town, row.county, postcode].filter(Boolean).join(', '),
      51.5,
      -0.1,
      'commercial',
      customerType,
      generated,
      postcode,
      row.address_line1 ?? '',
      row.address_line2 ?? null,
      row.town ?? null,
      row.county ?? null,
      row.phone_main ?? row.phone ?? null,
      row.phone_mobile ?? null,
      row.contact_email ?? row.email ?? null,
      row.invoice_email ?? null,
      Number(row.payment_terms_days ?? 30),
      row.payment_method ?? (customerType === 'cash' ? 'cash' : 'bacs'),
      row.invoice_method ?? 'email',
      parseTruthy(row.on_stop) ? 1 : 0,
      parseTruthy(row.po_mandatory) ? 1 : 0,
      row.notes ?? null,
    )

    imported += 1
  })

  return NextResponse.json({ imported, skipped, errors })
}
