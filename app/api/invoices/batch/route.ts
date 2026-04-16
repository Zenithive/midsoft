import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const jobIds = Array.isArray(body.job_ids) ? body.job_ids.map(Number).filter(Boolean) : []
  const invoiceDate = String(body.invoice_date ?? new Date().toISOString().split('T')[0])

  if (!jobIds.length) {
    return NextResponse.json({ error: 'No jobs selected' }, { status: 400 })
  }

  const db = getDb()
  const placeholders = jobIds.map(() => '?').join(',')
  const jobs = db.prepare(`
    SELECT j.id, j.price_gbp, j.vat_gbp, j.total_gbp, a.customer_id
    FROM jobs j
    JOIN agreements a ON a.id = j.agreement_id
    JOIN customers c ON c.id = a.customer_id
    WHERE j.id IN (${placeholders}) AND j.invoiced = 0 AND c.do_not_invoice = 0
  `).all(...jobIds) as Array<any>

  const grouped = new Map<number, Array<any>>()
  for (const job of jobs) {
    if (!grouped.has(job.customer_id)) grouped.set(job.customer_id, [])
    grouped.get(job.customer_id)!.push(job)
  }

  const results: Array<{ customer_id: number; invoice_id: number; jobs: number }> = []

  const run = db.transaction(() => {
    grouped.forEach((customerJobs, customerId) => {
      const amount = customerJobs.reduce((sum, j) => sum + Number(j.price_gbp ?? 0), 0)
      const vat = customerJobs.reduce((sum, j) => sum + Number(j.vat_gbp ?? 0), 0)
      const total = customerJobs.reduce((sum, j) => sum + Number(j.total_gbp ?? 0), 0)
      const dueDate = new Date(invoiceDate)
      dueDate.setDate(dueDate.getDate() + 30)

      const invoiceResult = db.prepare(`
        INSERT INTO invoices (customer_id, job_id, amount_gbp, vat_gbp, total_gbp, status, issued_date, due_date, notes)
        VALUES (?, NULL, ?, ?, ?, 'draft', ?, ?, ?)
      `).run(
        customerId,
        Number(amount.toFixed(2)),
        Number(vat.toFixed(2)),
        Number(total.toFixed(2)),
        invoiceDate,
        dueDate.toISOString().split('T')[0],
        `Batch invoice for ${customerJobs.length} jobs`,
      )

      const invoiceId = Number(invoiceResult.lastInsertRowid)
      const ids = customerJobs.map((job) => Number(job.id))
      const idPlaceholders = ids.map(() => '?').join(',')
      db.prepare(`UPDATE jobs SET invoiced = 1, invoice_id = ? WHERE id IN (${idPlaceholders})`).run(invoiceId, ...ids)

      results.push({ customer_id: customerId, invoice_id: invoiceId, jobs: customerJobs.length })
    })
  })

  run()

  return NextResponse.json({
    success: true,
    invoices_created: results.length,
    customers: results,
  })
}
