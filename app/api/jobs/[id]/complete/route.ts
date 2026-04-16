import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const jobId = Number(id)
  const body = await req.json()
  const { signature, photoBase64, notes, wasteType, weightKg, disposalSite } = body

  const db = getDb()

  // Validate job exists and is in_progress
  const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(jobId) as any
  if (!job) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 })
  }
  if (job.status !== 'in_progress') {
    return NextResponse.json({ error: 'Job must be in_progress to complete' }, { status: 400 })
  }

  // Validate signature
  if (!signature || signature.trim() === '') {
    return NextResponse.json({ error: 'Signature is required' }, { status: 400 })
  }

  // Update job
  db.prepare(`UPDATE jobs SET status = 'completed', completed_at = datetime('now') WHERE id = ?`).run(jobId)

  // Keep agreement on-site flags in sync with completed job type
  if (job.agreement_id) {
    if (job.type === 'delivery') {
      db.prepare(`
        UPDATE agreements
        SET skip_currently_on_site = 1, skip_delivered_date = date('now')
        WHERE id = ?
      `).run(job.agreement_id)
    } else if (job.type === 'collection') {
      db.prepare(`
        UPDATE agreements
        SET skip_currently_on_site = 0, skip_delivered_date = NULL
        WHERE id = ?
      `).run(job.agreement_id)
    } else if (job.type === 'exchange') {
      db.prepare(`
        UPDATE agreements
        SET skip_currently_on_site = 1, skip_delivered_date = date('now')
        WHERE id = ?
      `).run(job.agreement_id)
    }
  }

  // Insert job event
  db.prepare(`INSERT INTO job_events (job_id, driver_id, event_type, payload, created_at) VALUES (?, ?, ?, ?, datetime('now'))`).run(
    jobId,
    job.driver_id,
    'signature_captured',
    JSON.stringify({ signature, notes })
  )

  // Insert waste record if data provided
  if (wasteType && weightKg && disposalSite) {
    db.prepare(`INSERT INTO waste_records (job_id, vehicle_id, waste_type, weight_kg, disposal_site, created_at) VALUES (?, ?, ?, ?, ?, datetime('now'))`).run(
      jobId,
      job.vehicle_id,
      wasteType,
      weightKg,
      disposalSite
    )
  }

  // Auto-invoice cash jobs when completed
  const enrichedJob = db.prepare(`
    SELECT j.*, a.customer_id, c.customer_type
    FROM jobs j
    LEFT JOIN agreements a ON a.id = j.agreement_id
    LEFT JOIN customers c ON c.id = a.customer_id
    WHERE j.id = ?
  `).get(jobId) as any

  if (enrichedJob?.customer_id && enrichedJob.customer_type === 'cash' && !enrichedJob.invoice_id) {
    const status = Number(enrichedJob.is_paid) === 1 ? 'paid' : 'sent'
    const issuedDate = new Date().toISOString().split('T')[0]
    const dueDate = status === 'paid' ? issuedDate : issuedDate
    const invoiceResult = db.prepare(`
      INSERT INTO invoices (customer_id, job_id, amount_gbp, vat_gbp, total_gbp, status, issued_date, due_date, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      enrichedJob.customer_id,
      enrichedJob.id,
      Number(enrichedJob.price_gbp ?? 0),
      Number(enrichedJob.vat_gbp ?? 0),
      Number(enrichedJob.total_gbp ?? 0),
      status,
      issuedDate,
      dueDate,
      'Auto-generated on cash job completion',
    )

    db.prepare('UPDATE jobs SET invoice_id = ?, invoiced = 1 WHERE id = ?').run(invoiceResult.lastInsertRowid, enrichedJob.id)
  }

  return NextResponse.json({ success: true })
}