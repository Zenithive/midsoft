import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { yardId, driverId, vehicleId, sequence } = body

  const db = getDb()

  // Validate all jobs belong to the yard
  const jobIds = sequence.map((item: any) => item.jobId)
  const jobs = db.prepare(`SELECT id, yard_id FROM jobs WHERE id IN (${jobIds.map(() => '?').join(',')})`).all(...jobIds) as any[]
  
  const invalidJobs = jobs.filter(job => job.yard_id !== yardId)
  if (invalidJobs.length > 0) {
    return NextResponse.json({ error: 'All jobs must belong to the same yard' }, { status: 400 })
  }

  // Update jobs
  const updateJob = db.prepare(`UPDATE jobs SET driver_id = ?, vehicle_id = ?, status = 'assigned', sequence_order = ? WHERE id = ?`)
  for (const item of sequence) {
    updateJob.run(driverId, vehicleId, item.order, item.jobId)
  }

  // Upsert route
  const routeId = Date.now() // Simple ID generation
  db.prepare(`INSERT OR REPLACE INTO routes (id, yard_id, date, driver_id, vehicle_id, status, job_ids, optimised_at) VALUES (?, ?, ?, ?, ?, 'optimised', ?, datetime('now'))`).run(
    routeId,
    yardId,
    new Date().toISOString().split('T')[0],
    driverId,
    vehicleId,
    JSON.stringify(jobIds)
  )

  return NextResponse.json({ success: true, routeId })
}