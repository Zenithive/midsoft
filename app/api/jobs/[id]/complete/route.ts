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

  return NextResponse.json({ success: true })
}