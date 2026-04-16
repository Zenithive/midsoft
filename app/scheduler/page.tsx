'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { addDays, format, startOfWeek } from 'date-fns'
import { Button } from '@/components/ui/button'

function JobCard({ job }: { job: any }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id: `job-${job.id}`, data: { job } })
  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined
  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes} className="rounded border border-slate-200 bg-white px-2 py-1 text-xs cursor-grab">
      <div className="font-medium truncate">{job.customer_name}</div>
      <div className="text-slate-500">{job.type} • {job.skip_size_yards || job.skip_size || '-'}yd</div>
    </div>
  )
}

function Cell({ id, children }: { id: string; children: React.ReactNode }) {
  const { isOver, setNodeRef } = useDroppable({ id })
  return <div ref={setNodeRef} className={`min-h-28 p-1 border border-slate-100 ${isOver ? 'bg-blue-50' : ''}`}>{children}</div>
}

export default function SchedulerPage() {
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }))
  const [yardId, setYardId] = useState('all')
  const [drivers, setDrivers] = useState<any[]>([])
  const [jobs, setJobs] = useState<any[]>([])
  const [showUnassigned, setShowUnassigned] = useState(true)
  const sensors = useSensors(useSensor(PointerSensor))

  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart])

  const range = useMemo(() => ({
    from: format(days[0], 'yyyy-MM-dd'),
    to: format(days[6], 'yyyy-MM-dd'),
  }), [days])

  async function load() {
    const params = new URLSearchParams({ yard_id: yardId, date_from: range.from, date_to: range.to })
    const data = await fetch(`/api/scheduler?${params.toString()}`).then((r) => r.json())
    setDrivers(data.drivers)
    setJobs(data.jobs)
  }

  useEffect(() => { load() }, [yardId, range.from, range.to])

  const grouped = useMemo(() => {
    const map: Record<string, any[]> = {}
    jobs.forEach((job) => {
      const key = `${job.driver_id || 'unassigned'}-${job.scheduled_date}`
      if (!map[key]) map[key] = []
      map[key].push(job)
    })
    return map
  }, [jobs])

  async function handleDragEnd(event: DragEndEvent) {
    const activeJob = event.active.data.current?.job
    const dropId = String(event.over?.id || '')
    if (!activeJob || !dropId.startsWith('cell-')) return

    const [, driverIdRaw, date] = dropId.split('|')
    const newDriverId = driverIdRaw === 'unassigned' ? null : Number(driverIdRaw)

    const previous = jobs
    setJobs((prev) => prev.map((job) => job.id === activeJob.id ? { ...job, driver_id: newDriverId, scheduled_date: date } : job))

    const response = await fetch(`/api/jobs/${activeJob.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ driver_id: newDriverId, scheduled_date: date }),
    }).then((r) => r.json())

    if (!response.success) {
      setJobs(previous)
      alert('Failed to update schedule. Changes have been rolled back.')
    }
  }

  const unassignedJobs = jobs.filter((job) => !job.driver_id && job.status === 'pending')

  function printDay(date: string) {
    window.open(`/scheduler?print=true&date=${date}&yard_id=${yardId}`, '_blank')
  }

  const isPrint = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('print') === 'true'
  const printDate = typeof window !== 'undefined' ? (new URLSearchParams(window.location.search).get('date') || range.from) : range.from

  if (isPrint) {
    const dayJobs = jobs.filter((job) => job.scheduled_date === printDate)
    const byDriver = new Map<number, any[]>()
    dayJobs.forEach((job) => {
      const driver = job.driver_id || -1
      if (!byDriver.has(driver)) byDriver.set(driver, [])
      byDriver.get(driver)!.push(job)
    })

    return (
      <div className="p-6 print:block">
        <h1 className="text-xl font-bold mb-3">Daily Driver Schedule • {printDate}</h1>
        {Array.from(byDriver.entries()).map(([driverId, driverJobs]) => {
          const driver = drivers.find((d) => d.id === driverId)
          return (
            <div key={driverId} className="mb-6 break-after-page">
              <h2 className="font-semibold">{driver?.name || 'Unassigned'} • {driver?.yard_name || '-'}</h2>
              <ol className="list-decimal pl-5 mt-2 text-sm">
                {driverJobs.sort((a, b) => Number(a.sequence_order || 0) - Number(b.sequence_order || 0)).map((job) => (
                  <li key={job.id} className="mb-1">
                    {job.time_slot || '-'} • {job.customer_name} • {job.site_address || job.address} • {job.type} • {job.skip_size_yards || job.skip_size || '-'}yd • PO: {job.po_number || '-'} • {job.notes || '-'}
                  </li>
                ))}
              </ol>
            </div>
          )
        })}
        <script dangerouslySetInnerHTML={{ __html: 'window.print()' }} />
      </div>
    )
  }

  return (
    <div className="p-4 space-y-3 print:hidden">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Scheduler</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setWeekStart(addDays(weekStart, -7))}>Prev Week</Button>
          <Button variant="outline" onClick={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}>Today</Button>
          <Button variant="outline" onClick={() => setWeekStart(addDays(weekStart, 7))}>Next Week</Button>
          <Button onClick={() => printDay(range.from)}>Print Day</Button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <select className="border rounded px-2" value={yardId} onChange={(e) => setYardId(e.target.value)}>
          <option value="all">All Yards</option>
          <option value="1">Yard 1</option>
          <option value="2">Yard 2</option>
          <option value="3">Yard 3</option>
        </select>
        <Button variant="outline" onClick={() => setShowUnassigned((v) => !v)}>{showUnassigned ? 'Hide' : 'Show'} Unassigned Jobs</Button>
      </div>

      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="grid" style={{ gridTemplateColumns: `220px repeat(7, minmax(160px,1fr))` }}>
          <div className="font-medium p-2 border">Driver</div>
          {days.map((day) => <div key={String(day)} className="font-medium p-2 border">{format(day, 'EEE dd MMM')}</div>)}

          {drivers.map((driver) => (
            <>
              <div key={`driver-${driver.id}`} className="p-2 border text-sm">
                <div className="font-medium">{driver.name}</div>
                <div className="text-xs text-slate-500">{driver.yard_name} • {driver.shift_start} - {driver.shift_end}</div>
              </div>
              {days.map((day) => {
                const date = format(day, 'yyyy-MM-dd')
                const cellId = `cell|${driver.id}|${date}`
                const cellJobs = grouped[`${driver.id}-${date}`] || []
                return (
                  <Cell key={`${driver.id}-${date}`} id={cellId}>
                    {cellJobs.map((job) => <JobCard key={job.id} job={job} />)}
                  </Cell>
                )
              })}
            </>
          ))}
        </div>

        {showUnassigned && (
          <div className="mt-4 rounded border border-slate-200 p-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Unassigned Jobs</h2>
              <Button variant="outline" size="sm">Auto-assign to optimiser</Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-2">
              {unassignedJobs.map((job) => <JobCard key={job.id} job={job} />)}
            </div>
          </div>
        )}
      </DndContext>
    </div>
  )
}
