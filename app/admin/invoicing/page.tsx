'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Toaster } from '@/components/ui/sonner'

export default function InvoicingPage() {
  const [invoices, setInvoices] = useState<any[]>([])
  const [filter, setFilter] = useState('all')

  async function load() { setInvoices(await fetch('/api/invoices').then(r => r.json())) }
  useEffect(() => { load() }, [])

  async function updateStatus(id: number, status: string) {
    await fetch(`/api/invoices/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) })
    toast.success(`Invoice marked as ${status}`)
    load()
  }

  const filtered = filter === 'all' ? invoices : invoices.filter(i => i.status === filter)

  return (
    <div className="p-6 space-y-4">
      <Toaster />
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Invoicing</h1>
        <div className="flex items-center gap-2">
          <Link href="/admin/invoicing/batch"><Button variant="outline">Batch Invoice Run</Button></Link>
          <Select value={filter} onValueChange={v => setFilter(v ?? 'all')}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>{['all','draft','sent','paid','overdue'].map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>
      <Table>
        <TableHeader>
          <TableRow><TableHead>ID</TableHead><TableHead>Customer</TableHead><TableHead>Amount</TableHead><TableHead>VAT</TableHead><TableHead>Total</TableHead><TableHead>Due</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead></TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map(inv => (
            <TableRow key={inv.id}>
              <TableCell>#{inv.id}</TableCell>
              <TableCell>#{inv.customer_id}</TableCell>
              <TableCell>£{inv.amount_gbp}</TableCell>
              <TableCell>£{inv.vat_gbp}</TableCell>
              <TableCell className="font-medium">£{inv.total_gbp}</TableCell>
              <TableCell>{inv.due_date}</TableCell>
              <TableCell><span className="text-xs bg-slate-100 px-2 py-0.5 rounded capitalize">{inv.status}</span></TableCell>
              <TableCell>
                <div className="flex gap-1">
                  {inv.status === 'draft' && <Button size="sm" variant="outline" onClick={() => updateStatus(inv.id, 'sent')}>Mark Sent</Button>}
                  {['draft','sent','overdue'].includes(inv.status) && <Button size="sm" variant="outline" onClick={() => updateStatus(inv.id, 'paid')}>Mark Paid</Button>}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
