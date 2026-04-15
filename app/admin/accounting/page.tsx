'use client'

import { useEffect, useState } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Toaster } from '@/components/ui/sonner'

export default function AccountingPage() {
  const [logs, setLogs] = useState<any[]>([])

  async function load() {
    const db_logs = await fetch('/api/accounting/logs').then(r => r.json()).catch(() => [])
    setLogs(db_logs)
  }

  useEffect(() => { load() }, [])

  async function syncToXero() {
    const res = await fetch('/api/accounting/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider: 'xero', recordType: 'invoice', recordId: 1 }),
    })
    const data = await res.json()
    toast[data.success ? 'success' : 'error'](data.success ? 'Synced to Xero' : 'Sync failed')
    load()
  }

  return (
    <div className="p-6 space-y-4">
      <Toaster />
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Accounting Sync</h1>
        <Button onClick={syncToXero} className="bg-blue-600 hover:bg-blue-700">Sync to Xero</Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow><TableHead>Provider</TableHead><TableHead>Type</TableHead><TableHead>Record ID</TableHead><TableHead>Synced At</TableHead><TableHead>Status</TableHead><TableHead>Error</TableHead></TableRow>
        </TableHeader>
        <TableBody>
          {logs.map((l: any) => (
            <TableRow key={l.id}>
              <TableCell className="capitalize">{l.provider}</TableCell>
              <TableCell>{l.record_type}</TableCell>
              <TableCell>#{l.record_id}</TableCell>
              <TableCell className="text-xs">{new Date(l.synced_at).toLocaleString()}</TableCell>
              <TableCell><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${l.status === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{l.status}</span></TableCell>
              <TableCell className="text-xs text-red-500">{l.error_message || '—'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
