'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

const STATUSES = ['all', 'not_required', 'applied', 'approved', 'rejected', 'expired']

export default function PermitsPage() {
  const [rows, setRows] = useState<any[]>([])
  const [status, setStatus] = useState('all')
  const [authority, setAuthority] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  const load = async () => {
    const params = new URLSearchParams()
    if (status !== 'all') params.set('status', status)
    if (authority) params.set('local_authority', authority)
    if (from) params.set('from', from)
    if (to) params.set('to', to)
    const data = await fetch(`/api/permits?${params.toString()}`).then((r) => r.json())
    setRows(data)
  }

  useEffect(() => { load() }, [status, authority, from, to])

  async function updatePermit(row: any, patch: any) {
    await fetch(`/api/permits/${row.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...row, ...patch }),
    })

    if (patch.status === 'approved' && row.job_id) {
      // Badge is driven by joined permit status in jobs API.
    }

    load()
  }

  const badgeClass = (value: string) => {
    if (value === 'approved') return 'bg-emerald-100 text-emerald-700'
    if (value === 'applied') return 'bg-amber-100 text-amber-700'
    if (value === 'rejected' || value === 'expired') return 'bg-red-100 text-red-700'
    return 'bg-slate-100 text-slate-700'
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Permit Management</h1>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
        <select className="border rounded px-2" value={status} onChange={(e) => setStatus(e.target.value)}>
          {STATUSES.map((option) => <option key={option} value={option}>{option}</option>)}
        </select>
        <Input placeholder="Local authority" value={authority} onChange={(e) => setAuthority(e.target.value)} />
        <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        <Button variant="outline" onClick={load}>Refresh</Button>
      </div>

      <Table>
        <TableHeader><TableRow><TableHead>Permit Ref</TableHead><TableHead>Job Ref</TableHead><TableHead>Customer</TableHead><TableHead>Address</TableHead><TableHead>Local Authority</TableHead><TableHead>Applied</TableHead><TableHead>Start</TableHead><TableHead>End</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id}>
              <TableCell>
                <Input defaultValue={row.permit_reference || ''} onBlur={(e) => updatePermit(row, { permit_reference: e.target.value || null })} />
              </TableCell>
              <TableCell>#{row.job_ref || row.job_id || '-'}</TableCell>
              <TableCell>{row.customer_name || '-'}</TableCell>
              <TableCell>{row.site_address || '-'}</TableCell>
              <TableCell>
                <Input defaultValue={row.local_authority || ''} onBlur={(e) => updatePermit(row, { local_authority: e.target.value || null })} />
              </TableCell>
              <TableCell>{row.application_date || '-'}</TableCell>
              <TableCell><Input type="date" defaultValue={row.start_date || ''} onBlur={(e) => updatePermit(row, { start_date: e.target.value || null })} /></TableCell>
              <TableCell><Input type="date" defaultValue={row.end_date || ''} onBlur={(e) => updatePermit(row, { end_date: e.target.value || null })} /></TableCell>
              <TableCell>
                <select className={`text-xs px-2 py-1 rounded ${badgeClass(row.status)}`} value={row.status} onChange={(e) => updatePermit(row, { status: e.target.value })}>
                  {STATUSES.filter((s) => s !== 'all').map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
