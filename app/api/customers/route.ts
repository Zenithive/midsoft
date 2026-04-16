import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { generateAccountNumber, inferYardFromLatLng } from '@/lib/domain'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const query = searchParams.get('q')?.trim()
  const customerType = searchParams.get('customer_type')
  const onStop = searchParams.get('on_stop')
  const importedToday = searchParams.get('imported_today')

  const db = getDb()
  const clauses: string[] = []
  const params: unknown[] = []

  if (query) {
    if (query.startsWith('id:')) {
      const id = Number(query.slice(3))
      if (!Number.isNaN(id)) {
        clauses.push('id = ?')
        params.push(id)
      }
    } else {
      clauses.push('(name LIKE ? OR postcode LIKE ? OR account_number LIKE ?)')
      params.push(`%${query}%`, `%${query}%`, `%${query}%`)
    }
  }

  if (customerType && customerType !== 'all') {
    clauses.push('customer_type = ?')
    params.push(customerType)
  }

  if (onStop === '1') {
    clauses.push('on_stop = 1')
  }

  if (importedToday === '1') {
    clauses.push("date(imported_at) = date('now')")
  }

  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : ''
  const customers = db.prepare(`SELECT * FROM customers ${where} ORDER BY name ASC`).all(...params)
  return NextResponse.json(customers ?? [])
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const db = getDb()

  const name = String(body.name ?? '').trim()
  const postcode = String(body.postcode ?? '').trim()
  if (!name || !postcode) {
    return NextResponse.json({ error: 'Name and postcode are required' }, { status: 400 })
  }

  const lat = Number(body.lat ?? 51.5)
  const lng = Number(body.lng ?? -0.1)
  const customerType = body.customer_type === 'cash' ? 'cash' : 'account'

  const row = db.prepare('SELECT COUNT(*) as count FROM customers').get() as { count: number }
  const accountNumber = String(body.account_number ?? '').trim() || generateAccountNumber(name, row.count + 1)

  const result = db.prepare(`
    INSERT INTO customers (
      name, email, phone, address, lat, lng, account_type,
      customer_type, on_stop, do_not_invoice, po_mandatory, weigh_all_skip_jobs,
      payment_terms_days, credit_limit_gbp, batch_option, invoice_method, invoice_email,
      account_number, phone_main, phone_mobile, contact_email,
      address_line1, address_line2, town, county, postcode,
      payment_method, notes, send_to_accounts_system
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    name,
    String(body.email ?? ''),
    String(body.phone_main ?? body.phone ?? ''),
    String(body.address ?? `${body.address_line1 ?? ''}, ${postcode}`),
    lat,
    lng,
    body.account_type ?? 'commercial',
    customerType,
    Number(body.on_stop ?? 0),
    Number(body.do_not_invoice ?? 0),
    Number(body.po_mandatory ?? 0),
    Number(body.weigh_all_skip_jobs ?? 0),
    Number(body.payment_terms_days ?? 30),
    Number(body.credit_limit_gbp ?? 0),
    body.batch_option ?? (customerType === 'cash' ? 'cash' : 'account'),
    body.invoice_method ?? 'email',
    body.invoice_email ?? body.email ?? null,
    accountNumber,
    body.phone_main ?? body.phone ?? null,
    body.phone_mobile ?? null,
    body.contact_email ?? body.email ?? null,
    body.address_line1 ?? body.address ?? null,
    body.address_line2 ?? null,
    body.town ?? null,
    body.county ?? null,
    postcode,
    body.payment_method ?? (customerType === 'cash' ? 'cash' : 'bacs'),
    body.notes ?? null,
    Number(body.send_to_accounts_system ?? 0),
  )

  const customerId = Number(result.lastInsertRowid)

  if (Number(body.send_to_accounts_system ?? 0) === 1) {
    db.prepare(`
      INSERT INTO accounting_sync_log (provider, record_type, record_id, status, error_message)
      VALUES ('xero', 'invoice', ?, 'failed', 'Pending customer sync')
    `).run(customerId)
  }

  const defaultYard = Number(body.yard_id ?? inferYardFromLatLng(lat))
  if (body.create_default_agreement !== false) {
    db.prepare(`
      INSERT INTO agreements (
        customer_id, yard_id, site_name, site_address, site_lat, site_lng,
        service_id, default_ewc_code_id, standard_price_gbp, notes, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')
    `).run(
      customerId,
      defaultYard,
      body.site_name ?? 'Primary Site',
      String(body.address ?? `${body.address_line1 ?? ''}, ${postcode}`),
      lat,
      lng,
      body.service_id ?? null,
      body.default_ewc_code_id ?? null,
      Number(body.standard_price_gbp ?? 0),
      body.notes ?? null,
    )
  }

  return NextResponse.json({ success: true, id: customerId, account_number: accountNumber })
}