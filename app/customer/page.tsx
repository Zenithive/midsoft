'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { JobCreationWizard } from '@/components/jobs/JobCreationWizard'

const CUSTOMER_ID = 1

export default function CustomerPage() {
  const [activeTab, setActiveTab] = useState<'book' | 'jobs'>('book')
  const [jobs, setJobs] = useState<any[]>([])

  useEffect(() => {
    async function load() {
      const agreements = await fetch(`/api/agreements?customer_id=${CUSTOMER_ID}&status=active`).then((r) => r.json())
      const agreementIds = new Set((agreements ?? []).map((a: any) => a.id))
      const allJobs = await fetch('/api/jobs').then((r) => r.json())
      setJobs((allJobs ?? []).filter((j: any) => agreementIds.has(j.agreement_id)))
    }
    load()
  }, [])

  const sortedJobs = useMemo(
    () => [...jobs].sort((a: any, b: any) => String(b.scheduled_date).localeCompare(String(a.scheduled_date))),
    [jobs],
  )

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold">Customer Portal</h1>
      <p className="text-sm text-slate-600">Create a new job or review your booked jobs.</p>

      <div className="flex gap-2">
        <Button variant={activeTab === 'book' ? 'default' : 'outline'} onClick={() => setActiveTab('book')}>Book a Job</Button>
        <Button variant={activeTab === 'jobs' ? 'default' : 'outline'} onClick={() => setActiveTab('jobs')}>My Booked Jobs</Button>
      </div>

      {activeTab === 'book' && (
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <JobCreationWizard
            customerId={CUSTOMER_ID}
            originLabel="Customer Portal"
            onSaved={async () => {
              const agreements = await fetch(`/api/agreements?customer_id=${CUSTOMER_ID}&status=active`).then((r) => r.json())
              const agreementIds = new Set((agreements ?? []).map((a: any) => a.id))
              const allJobs = await fetch('/api/jobs').then((r) => r.json())
              setJobs((allJobs ?? []).filter((j: any) => agreementIds.has(j.agreement_id)))
              setActiveTab('jobs')
            }}
          />
        </div>
      )}

      {activeTab === 'jobs' && (
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="text-lg font-semibold mb-3">My Booked Jobs</h2>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Job ID</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Price</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedJobs.map((job: any) => (
                <TableRow key={job.id}>
                  <TableCell>#{job.id}</TableCell>
                  <TableCell>{job.scheduled_date}</TableCell>
                  <TableCell className="capitalize">{String(job.type || '').replace('_', ' ')}</TableCell>
                  <TableCell className="capitalize">{String(job.status || '').replace('_', ' ')}</TableCell>
                  <TableCell>GBP {Number(job.total_gbp || 0).toFixed(2)}</TableCell>
                  <TableCell>
                    <Link className="underline text-sm" href={`/jobs/${job.id}`}>View</Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
