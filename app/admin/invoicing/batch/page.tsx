'use client'

import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

function firstDayOfMonth() {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
}

export default function BatchInvoicingPage() {
  const [from, setFrom] = useState(firstDayOfMonth())
  const [to, setTo] = useState(new Date().toISOString().split('T')[0])
  const [customerType, setCustomerType] = useState('account')
  const [yardId, setYardId] = useState('all')
  const [rows, setRows] = useState<any[]>([])
  const [selected, setSelected] = useState<Record<number, boolean>>({})
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0])
  const [summary, setSummary] = useState<any>(null)

  async function refresh() {
    const params = new URLSearchParams({ from, to, customer_type: customerType, yard_id: yardId })
    const data = await fetch(`/api/invoices/uninvoiced?${params.toString()}`).then((r) => r.json())
    setRows(data)
    setSelected({})
    setSummary(null)
  }

  const grouped = useMemo(() => {
    const map = new Map<string, any[]>()
    rows.forEach((row) => {
      const key = `${row.customer_id}-${row.customer_name}`
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(row)
    })
    return Array.from(map.entries())
  }, [rows])

  const totals = useMemo(() => {
    const selectedRows = rows.filter((row) => selected[row.id])
    const ex = selectedRows.reduce((sum, row) => sum + Number(row.price_gbp || 0), 0)
    const vat = selectedRows.reduce((sum, row) => sum + Number(row.vat_gbp || 0), 0)
    const inc = selectedRows.reduce((sum, row) => sum + Number(row.total_gbp || 0), 0)
    return { count: selectedRows.length, ex, vat, inc }
  }, [rows, selected])

  async function generate() {
    const ids = rows.filter((row) => selected[row.id]).map((row) => row.id)
    if (!ids.length) return
    const result = await fetch('/api/invoices/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ job_ids: ids, invoice_date: invoiceDate }),
    }).then((r) => r.json())

    setSummary(result)
    refresh()
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Batch Invoice Run</h1>

      <div className="rounded-xl border border-slate-200 p-4 grid grid-cols-1 md:grid-cols-6 gap-2">
        <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        <select className="border rounded px-2" value={customerType} onChange={(e) => setCustomerType(e.target.value)}>
          <option value="account">Account Only</option>
          <option value="cash">Cash Only</option>
          <option value="all">Account and Cash</option>
        </select>
        <select className="border rounded px-2" value={yardId} onChange={(e) => setYardId(e.target.value)}>
          <option value="all">All Yards</option>
          <option value="1">Yard 1</option>
          <option value="2">Yard 2</option>
          <option value="3">Yard 3</option>
        </select>
        <Input type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} />
        <Button onClick={refresh}>Refresh</Button>
      </div>

      <div className="flex gap-2">
        <Button variant="outline" onClick={() => setSelected(Object.fromEntries(rows.map((row) => [row.id, true])))}>Select All</Button>
        <Button variant="outline" onClick={() => setSelected({})}>Deselect All</Button>
      </div>

      <Table>
        <TableHeader><TableRow><TableHead></TableHead><TableHead>Customer</TableHead><TableHead>Account</TableHead><TableHead>Site</TableHead><TableHead>Job Type</TableHead><TableHead>Date</TableHead><TableHead>Service</TableHead><TableHead>Ex VAT</TableHead><TableHead>VAT</TableHead><TableHead>Total</TableHead></TableRow></TableHeader>
        <TableBody>
          {grouped.map(([groupKey, groupRows]) => {
            const customerSubtotal = groupRows.reduce((sum, row) => sum + Number(row.total_gbp || 0), 0)
            return (
              <>
                <TableRow key={`${groupKey}-header`} className="bg-slate-50">
                  <TableCell colSpan={10} className="font-medium">{groupRows[0].customer_name} • {groupRows[0].account_number || '-'} • Subtotal £{customerSubtotal.toFixed(2)}</TableCell>
                </TableRow>
                {groupRows.map((row: any) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      {row.do_not_invoice ? <span className="text-xs bg-slate-200 px-2 py-1 rounded">Do Not Invoice</span> : (
                        <input type="checkbox" checked={Boolean(selected[row.id])} onChange={(e) => setSelected((prev) => ({ ...prev, [row.id]: e.target.checked }))} />
                      )}
                    </TableCell>
                    <TableCell>{row.customer_name}</TableCell>
                    <TableCell>{row.account_number || '-'}</TableCell>
                    <TableCell>{row.site_address || row.address}</TableCell>
                    <TableCell>{row.type}</TableCell>
                    <TableCell>{row.scheduled_date}</TableCell>
                    <TableCell>{row.service_name || '-'}</TableCell>
                    <TableCell>£{Number(row.price_gbp || 0).toFixed(2)}</TableCell>
                    <TableCell>£{Number(row.vat_gbp || 0).toFixed(2)}</TableCell>
                    <TableCell>£{Number(row.total_gbp || 0).toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </>
            )
          })}
          <TableRow className="bg-blue-50 font-semibold">
            <TableCell colSpan={7}>Grand Total ({totals.count} jobs selected)</TableCell>
            <TableCell>£{totals.ex.toFixed(2)}</TableCell>
            <TableCell>£{totals.vat.toFixed(2)}</TableCell>
            <TableCell>£{totals.inc.toFixed(2)}</TableCell>
          </TableRow>
        </TableBody>
      </Table>

      <div className="flex gap-2">
        <Button onClick={generate} disabled={!totals.count}>Generate Invoices</Button>
        <Button variant="outline" onClick={() => window.location.href = `/admin/invoicing`}>View Generated Invoices</Button>
      </div>

      {summary && (
        <div className="rounded border border-emerald-300 bg-emerald-50 p-3 text-sm">
          {summary.invoices_created} invoices created for {summary.customers?.length || 0} customers.
        </div>
      )}
    </div>
  )
}
