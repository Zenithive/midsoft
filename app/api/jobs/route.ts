import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { computeVat } from '@/lib/domain'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const date = searchParams.get('date')
  const yardId = searchParams.get('yardId')
  const status = searchParams.get('status')
  const driverId = searchParams.get('driverId')

  const db = getDb()
  const conditions: string[] = []
  const params: unknown[] = []

  if (date) { conditions.push('scheduled_date = ?'); params.push(date) }
  if (yardId) { conditions.push('yard_id = ?'); params.push(Number(yardId)) }
  if (status) { conditions.push('status = ?'); params.push(status) }
  if (driverId) { conditions.push('driver_id = ?'); params.push(Number(driverId)) }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
  const jobs = db.prepare(`
    SELECT
      j.*, a.customer_id,
      c.customer_type,
      c.account_number,
      c.on_stop,
      c.po_mandatory,
      c.weigh_all_skip_jobs,
      c.do_not_invoice,
      s.name as service_name,
      s.skip_size_yards,
      e.code as ewc_code,
      p.status as permit_status
    FROM jobs j
    LEFT JOIN agreements a ON a.id = j.agreement_id
    LEFT JOIN customers c ON c.id = a.customer_id
    LEFT JOIN services s ON s.id = j.service_id
    LEFT JOIN ewc_codes e ON e.id = j.ewc_code_id
    LEFT JOIN permits p ON p.id = j.permit_id
    ${where}
    ORDER BY j.sequence_order ASC, j.scheduled_time ASC
  `).all(...params)

  return NextResponse.json(jobs ?? [])
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const db = getDb()

  const agreementId = Number(body.agreement_id)
  if (!agreementId) {
    return NextResponse.json({ error: 'agreement_id is required' }, { status: 400 })
  }

  const agreement = db.prepare(`
    SELECT a.*, c.id as customer_id, c.name as customer_name, c.phone as customer_phone, c.on_stop,
           c.po_mandatory, c.customer_type, c.weigh_all_skip_jobs
    FROM agreements a
    JOIN customers c ON c.id = a.customer_id
    WHERE a.id = ?
  `).get(agreementId) as any

  if (!agreement) {
    return NextResponse.json({ error: 'Agreement not found' }, { status: 404 })
  }

  if (Number(agreement.on_stop) === 1) {
    return NextResponse.json({ error: 'This account is on stop. New jobs cannot be created.' }, { status: 400 })
  }

  const poNumber = String(body.po_number ?? '').trim()
  if (Number(agreement.po_mandatory) === 1 && !poNumber) {
    return NextResponse.json({ error: `Purchase order number is required for ${agreement.customer_name}` }, { status: 400 })
  }

  const service = db.prepare('SELECT * FROM services WHERE id = ?').get(Number(body.service_id ?? agreement.service_id)) as any
  const ewcCodeId = Number(body.ewc_code_id ?? agreement.default_ewc_code_id ?? service?.default_ewc_code_id ?? 1)
  const serviceId = Number(body.service_id ?? agreement.service_id ?? service?.id ?? 1)
  const skipSize = Number(body.skip_size ?? service?.skip_size_yards ?? 8)
  const price = Number(body.price_gbp ?? agreement.standard_price_gbp ?? service?.default_price_gbp ?? 0)
  const vatRate = Number(body.vat_rate ?? service?.vat_rate ?? 20)
  const { vat, total } = computeVat(price, vatRate)
  const paymentMethod = String(body.payment_method ?? (agreement.customer_type === 'cash' ? 'cash' : 'account'))
  const isPaid = Number(body.is_paid ?? 0)
  const jobType = String(body.type ?? 'delivery')
  const timeSlot = String(body.time_slot ?? body.preferred_time_slot ?? 'Anytime')

  const result = db.prepare(`
    INSERT INTO jobs (
      booking_id, agreement_id, yard_id, driver_id, vehicle_id, type, status,
      customer_name, customer_phone, address, lat, lng, skip_size, notes,
      scheduled_date, scheduled_time, time_slot, sequence_order, route_id,
      service_id, ewc_code_id, price_gbp, vat_rate, vat_gbp, total_gbp,
      payment_method, is_paid, paid_date, invoiced, invoice_id,
      po_number, requested_by, weight_kg, highway_placement
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    body.booking_id ?? null,
    agreementId,
    Number(body.yard_id ?? agreement.yard_id ?? 1),
    body.driver_id ?? null,
    body.vehicle_id ?? null,
    jobType,
    body.status ?? 'pending',
    agreement.customer_name,
    agreement.customer_phone,
    body.address ?? agreement.site_address,
    Number(body.lat ?? agreement.site_lat ?? 51.5),
    Number(body.lng ?? agreement.site_lng ?? -0.1),
    skipSize,
    body.notes ?? null,
    body.scheduled_date,
    body.scheduled_time ?? null,
    timeSlot,
    Number(body.sequence_order ?? 0),
    body.route_id ?? null,
    serviceId,
    ewcCodeId,
    price,
    vatRate,
    vat,
    total,
    paymentMethod,
    isPaid,
    isPaid ? (body.paid_date ?? new Date().toISOString().split('T')[0]) : null,
    0,
    null,
    poNumber || null,
    body.requested_by ?? null,
    body.weight_kg ?? null,
    Number(body.highway_placement ?? 0),
  )

  let permitId: number | null = null
  if (Number(body.highway_placement ?? 0) === 1) {
    const permitResult = db.prepare(`
      INSERT INTO permits (
        job_id, customer_id, site_address, local_authority, permit_type,
        application_date, start_date, end_date, status, notes
      ) VALUES (?, ?, ?, ?, 'skip_on_highway', date('now'), ?, ?, 'applied', ?)
    `).run(
      result.lastInsertRowid,
      agreement.customer_id,
      body.address ?? agreement.site_address,
      body.local_authority ?? null,
      body.permit_start_date ?? body.scheduled_date,
      body.permit_end_date ?? body.scheduled_date,
      'Auto-created during job creation',
    )
    permitId = Number(permitResult.lastInsertRowid)
    db.prepare('UPDATE jobs SET permit_id = ? WHERE id = ?').run(permitId, result.lastInsertRowid)
  }

  return NextResponse.json({ success: true, id: result.lastInsertRowid, permit_id: permitId })
}
