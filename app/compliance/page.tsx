'use client'

import { useEffect, useState } from 'react'
import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

export default function CompliancePage() {
  const [records, setRecords] = useState<any[]>([])
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  useEffect(() => { fetch('/api/compliance').then(r => r.json()).then(setRecords) }, [])

  const filtered = records.filter(r => {
    if (from && r.scheduled_date < from) return false
    if (to && r.scheduled_date > to) return false
    return true
  })

  function exportCsv() {
    const headers = ['Job ID','Customer','Address','Date','Vehicle','Waste Type','Weight (kg)','Disposal Site','Transfer Note','Consignment Note']
    const rows = filtered.map(r => [r.job_id, r.customer_name, r.address, r.scheduled_date, r.registration, r.waste_type, r.weight_kg, r.disposal_site, r.transfer_note_number, r.consignment_note])
    const csv = [headers, ...rows].map(row => row.map(v => `"${v ?? ''}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'waste-records.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Compliance — Waste Records</h1>
        <Button variant="outline" onClick={exportCsv}><Download className="h-4 w-4 mr-2" />Export CSV</Button>
      </div>
      <div className="flex gap-3 items-center">
        <span className="text-sm text-slate-600">From:</span>
        <Input type="date" value={from} onChange={e => setFrom(e.target.value)} className="w-40" />
        <span className="text-sm text-slate-600">To:</span>
        <Input type="date" value={to} onChange={e => setTo(e.target.value)} className="w-40" />
      </div>
      <Table>
        <TableHeader>
          <TableRow><TableHead>Job</TableHead><TableHead>Customer</TableHead><TableHead>Vehicle</TableHead><TableHead>Waste Type</TableHead><TableHead>Weight</TableHead><TableHead>Disposal Site</TableHead><TableHead>Transfer Note</TableHead></TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map(r => (
            <TableRow key={r.id}>
              <TableCell>#{r.job_id}</TableCell>
              <TableCell>{r.customer_name}</TableCell>
              <TableCell>{r.registration}</TableCell>
              <TableCell>{r.waste_type}</TableCell>
              <TableCell>{r.weight_kg} kg</TableCell>
              <TableCell>{r.disposal_site}</TableCell>
              <TableCell>{r.transfer_note_number || '—'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
