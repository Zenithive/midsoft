import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { computeVat } from '@/lib/domain'

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const db = getDb()
  const job = db.prepare(`
    SELECT j.*, a.customer_id, c.account_number, c.customer_type, c.po_mandatory, c.weigh_all_skip_jobs,
           s.name as service_name, s.skip_size_yards, e.code as ewc_code, e.description as ewc_description,
           p.status as permit_status
    FROM jobs j
    LEFT JOIN agreements a ON a.id = j.agreement_id
    LEFT JOIN customers c ON c.id = a.customer_id
    LEFT JOIN services s ON s.id = j.service_id
    LEFT JOIN ewc_codes e ON e.id = j.ewc_code_id
    LEFT JOIN permits p ON p.id = j.permit_id
    WHERE j.id = ?
  `).get(Number(id))

  if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 })
  return NextResponse.json(job)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const db = getDb()

  const current = db.prepare('SELECT * FROM jobs WHERE id = ?').get(Number(id)) as any
  if (!current) return NextResponse.json({ error: 'Job not found' }, { status: 404 })

  const price = Number(body.price_gbp ?? current.price_gbp ?? 0)
  const vatRate = Number(body.vat_rate ?? current.vat_rate ?? 20)
  const { vat, total } = computeVat(price, vatRate)

  db.prepare(`
    UPDATE jobs
    SET driver_id = COALESCE(?, driver_id),
        vehicle_id = COALESCE(?, vehicle_id),
        scheduled_date = COALESCE(?, scheduled_date),
        scheduled_time = COALESCE(?, scheduled_time),
        time_slot = COALESCE(?, time_slot),
        service_id = COALESCE(?, service_id),
        ewc_code_id = COALESCE(?, ewc_code_id),
        type = COALESCE(?, type),
        notes = COALESCE(?, notes),
        status = COALESCE(?, status),
        po_number = COALESCE(?, po_number),
        requested_by = COALESCE(?, requested_by),
        price_gbp = ?,
        vat_rate = ?,
        vat_gbp = ?,
        total_gbp = ?,
        payment_method = COALESCE(?, payment_method),
        is_paid = COALESCE(?, is_paid),
        paid_date = COALESCE(?, paid_date),
        weight_kg = COALESCE(?, weight_kg)
    WHERE id = ?
  `).run(
    body.driver_id ?? null,
    body.vehicle_id ?? null,
    body.scheduled_date ?? null,
    body.scheduled_time ?? null,
    body.time_slot ?? null,
    body.service_id ?? null,
    body.ewc_code_id ?? null,
    body.type ?? null,
    body.notes ?? null,
    body.status ?? null,
    body.po_number ?? null,
    body.requested_by ?? null,
    price,
    vatRate,
    vat,
    total,
    body.payment_method ?? null,
    body.is_paid ?? null,
    body.paid_date ?? null,
    body.weight_kg ?? null,
    Number(id),
  )

  return NextResponse.json({ success: true })
}
