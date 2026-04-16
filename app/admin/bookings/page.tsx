'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { JobCreationWizard } from '@/components/jobs/JobCreationWizard'

export default function AdminBookingsPage() {
  const [jobs, setJobs] = useState<any[]>([])
  const [showCreateJob, setShowCreateJob] = useState(false)
  const [filter, setFilter] = useState('all')

  const load = () => fetch('/api/jobs').then(r => r.json()).then(setJobs)
  useEffect(() => { load() }, [])

  const filtered = filter === 'all' ? jobs : jobs.filter((j: any) => j.status === filter)

  return (
    <div className="p-6 space-y-6">
      {showCreateJob && (
        <section className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-semibold">Create Job</h2>
            <Button variant="outline" onClick={() => setShowCreateJob(false)}>Close</Button>
          </div>
          <JobCreationWizard
            originLabel="Admin Bookings"
            onSaved={() => {
              load()
              setShowCreateJob(false)
            }}
          />
        </section>
      )}

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Jobs Listing</h1>
        <Button onClick={() => setShowCreateJob(true)}>Add New Job</Button>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-slate-500">{filtered.length} jobs</div>
        <Select value={filter} onValueChange={v => setFilter(v ?? 'all')}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            {['all','pending','assigned','in_progress','completed','cancelled'].map(s => <SelectItem key={s} value={s} className="capitalize">{s.replace('_',' ')}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Table>
        <TableHeader>
          <TableRow><TableHead>ID</TableHead><TableHead>Customer</TableHead><TableHead>Date</TableHead><TableHead>Type</TableHead><TableHead>Skip</TableHead><TableHead>PO</TableHead><TableHead>Status</TableHead></TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((job: any) => (
            <TableRow key={job.id}>
              <TableCell>#{job.id}</TableCell>
              <TableCell>{job.customer_name}</TableCell>
              <TableCell>{job.scheduled_date}</TableCell>
              <TableCell className="capitalize">{String(job.type || '').replace('_',' ')}</TableCell>
              <TableCell>{job.skip_size}yd</TableCell>
              <TableCell>{job.po_number || '-'}</TableCell>
              <TableCell><span className="text-xs bg-slate-100 px-2 py-0.5 rounded capitalize">{String(job.status || '').replace('_',' ')}</span></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
