'use client'

import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'

export default function DriverDayPrintPage() {
  const params = useParams<{ id: string }>()
  const search = useSearchParams()
  const date = search.get('date') || new Date().toISOString().split('T')[0]
  const isPrint = search.get('print') === 'true'
  const driverId = Number(params.id)

  const [driver, setDriver] = useState<any>(null)
  const [jobs, setJobs] = useState<any[]>([])

  useEffect(() => {
    Promise.all([
      fetch('/api/drivers').then((r) => r.json()),
      fetch(`/api/jobs?driverId=${driverId}&date=${date}`).then((r) => r.json()),
    ]).then(([drivers, jobRows]) => {
      setDriver(drivers.find((d: any) => d.id === driverId))
      setJobs(jobRows)
    })
  }, [driverId, date])

  if (!driver) return <div className="p-6">Loading driver...</div>

  return (
    <div className="p-6 space-y-3">
      <div className={isPrint ? 'hidden print:block' : 'print:hidden'}>
        <Button onClick={() => window.location.href = `/admin/drivers/${driverId}?date=${date}&print=true`}>Print Day</Button>
      </div>

      <div className="rounded border border-slate-300 p-4">
        <h1 className="text-xl font-bold">Daily Driver Schedule</h1>
        <div>Driver: {driver.name}</div>
        <div>Vehicle: {jobs[0]?.vehicle_id || '-'}</div>
        <div>Yard: {driver.yard_id}</div>
        <div>Date: {date}</div>

        <ol className="list-decimal pl-5 mt-3 text-sm">
          {jobs
            .sort((a, b) => Number(a.sequence_order || 0) - Number(b.sequence_order || 0))
            .map((job) => (
              <li key={job.id} className="mb-1">
                {job.time_slot || '-'} • {job.customer_name} • {job.address} • {job.skip_size || '-'}yd • {job.type} • PO: {job.po_number || '-'} • {job.notes || '-'}
              </li>
            ))}
        </ol>

        <div className="mt-4 text-sm">Total jobs: {jobs.length} • Estimated total distance: {jobs[0]?.total_distance_km || '-'}</div>
      </div>

      {isPrint && <script dangerouslySetInnerHTML={{ __html: 'window.print()' }} />}
    </div>
  )
}
