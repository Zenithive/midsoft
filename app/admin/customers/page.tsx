'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

const FILTERS = ['all', 'account', 'cash', 'on_stop']

export default function CustomersPage() {
  const [rows, setRows] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState('all')
  const [newCustomer, setNewCustomer] = useState<any>({
    customer_type: 'account',
    name: '',
    postcode: '',
    address_line1: '',
    email: '',
    phone_main: '',
    phone_mobile: '',
    on_stop: false,
    do_not_invoice: false,
    po_mandatory: false,
    weigh_all_skip_jobs: false,
    payment_terms_days: 30,
    payment_method: 'bacs',
    invoice_method: 'email',
    invoice_email: '',
    batch_option: 'account',
    send_to_accounts_system: false,
  })

  const load = async () => {
    const params = new URLSearchParams()
    if (search) params.set('q', search)
    if (activeFilter === 'account' || activeFilter === 'cash') params.set('customer_type', activeFilter)
    if (activeFilter === 'on_stop') params.set('on_stop', '1')
    const data = await fetch(`/api/customers?${params.toString()}`).then((r) => r.json())
    setRows(data)
  }

  useEffect(() => { load() }, [search, activeFilter])

  const filteredRows = useMemo(() => {
    if (activeFilter === 'on_stop') return rows.filter((r) => Number(r.on_stop) === 1)
    return rows
  }, [rows, activeFilter])

  async function createCustomer() {
    await fetch('/api/customers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...newCustomer,
        customer_type: newCustomer.customer_type,
        payment_terms_days: Number(newCustomer.payment_terms_days || 30),
        on_stop: Number(newCustomer.on_stop),
        do_not_invoice: Number(newCustomer.do_not_invoice),
        po_mandatory: Number(newCustomer.po_mandatory),
        weigh_all_skip_jobs: Number(newCustomer.weigh_all_skip_jobs),
        send_to_accounts_system: Number(newCustomer.send_to_accounts_system),
        create_default_agreement: true,
      }),
    })
    setNewCustomer({ ...newCustomer, name: '', postcode: '', address_line1: '', email: '', phone_main: '' })
    load()
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Customers</h1>
        <Link href="/admin/customers/import"><Button variant="outline">Customer Import</Button></Link>
      </div>

      <div className="flex gap-2">
        {FILTERS.map((filter) => (
          <Button key={filter} variant={activeFilter === filter ? 'default' : 'outline'} size="sm" onClick={() => setActiveFilter(filter)}>
            {filter === 'on_stop' ? 'On Stop' : filter[0].toUpperCase() + filter.slice(1)}
          </Button>
        ))}
      </div>

      <Input placeholder="Search by name, postcode or account number" value={search} onChange={(e) => setSearch(e.target.value)} />

      <div className="rounded-xl border border-slate-200 p-4 space-y-3">
        <h2 className="font-semibold">New Customer</h2>
        <div className="flex gap-2">
          <Button variant={newCustomer.customer_type === 'account' ? 'default' : 'outline'} size="sm" onClick={() => setNewCustomer((p: any) => ({ ...p, customer_type: 'account', payment_method: 'bacs' }))}>Account Customer</Button>
          <Button variant={newCustomer.customer_type === 'cash' ? 'default' : 'outline'} size="sm" onClick={() => setNewCustomer((p: any) => ({ ...p, customer_type: 'cash', payment_method: 'cash', batch_option: 'cash' }))}>Cash Customer</Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <Input placeholder="Name" value={newCustomer.name} onChange={(e) => setNewCustomer((p: any) => ({ ...p, name: e.target.value }))} />
          <Input placeholder="Postcode" value={newCustomer.postcode} onChange={(e) => setNewCustomer((p: any) => ({ ...p, postcode: e.target.value }))} />
          <Input placeholder="Address" value={newCustomer.address_line1} onChange={(e) => setNewCustomer((p: any) => ({ ...p, address_line1: e.target.value }))} />
          <Input placeholder="Email" value={newCustomer.email} onChange={(e) => setNewCustomer((p: any) => ({ ...p, email: e.target.value }))} />
          <Input placeholder="Phone main" value={newCustomer.phone_main} onChange={(e) => setNewCustomer((p: any) => ({ ...p, phone_main: e.target.value }))} />
          <Input placeholder="Phone mobile" value={newCustomer.phone_mobile} onChange={(e) => setNewCustomer((p: any) => ({ ...p, phone_mobile: e.target.value }))} />

          {newCustomer.customer_type === 'account' && (
            <>
              <Input placeholder="Payment terms days" type="number" value={newCustomer.payment_terms_days} onChange={(e) => setNewCustomer((p: any) => ({ ...p, payment_terms_days: e.target.value }))} />
              <Input placeholder="Invoice email" value={newCustomer.invoice_email} onChange={(e) => setNewCustomer((p: any) => ({ ...p, invoice_email: e.target.value }))} />
              <select className="border rounded px-2" value={newCustomer.batch_option} onChange={(e) => setNewCustomer((p: any) => ({ ...p, batch_option: e.target.value }))}>
                <option value="account">Batch: Account</option>
                <option value="cash">Batch: Cash</option>
                <option value="account_and_cash">Batch: Account and Cash</option>
              </select>
            </>
          )}
        </div>

        {newCustomer.customer_type === 'account' && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-sm">
            <label><input type="checkbox" checked={newCustomer.on_stop} onChange={(e) => setNewCustomer((p: any) => ({ ...p, on_stop: e.target.checked }))} /> On Stop</label>
            <label><input type="checkbox" checked={newCustomer.do_not_invoice} onChange={(e) => setNewCustomer((p: any) => ({ ...p, do_not_invoice: e.target.checked }))} /> Do Not Invoice</label>
            <label><input type="checkbox" checked={newCustomer.po_mandatory} onChange={(e) => setNewCustomer((p: any) => ({ ...p, po_mandatory: e.target.checked }))} /> PO Mandatory</label>
            <label><input type="checkbox" checked={newCustomer.weigh_all_skip_jobs} onChange={(e) => setNewCustomer((p: any) => ({ ...p, weigh_all_skip_jobs: e.target.checked }))} /> Weigh All Skip Jobs</label>
            <label><input type="checkbox" checked={newCustomer.send_to_accounts_system} onChange={(e) => setNewCustomer((p: any) => ({ ...p, send_to_accounts_system: e.target.checked }))} /> Send to accounts system</label>
          </div>
        )}

        <Button onClick={createCustomer}>Save Customer</Button>
      </div>

      <Table>
        <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Account Number</TableHead><TableHead>Type</TableHead><TableHead>Status</TableHead><TableHead>Postcode</TableHead></TableRow></TableHeader>
        <TableBody>
          {filteredRows.map((row) => (
            <TableRow key={row.id} className={Number(row.on_stop) === 1 ? 'border-l-4 border-l-red-500' : ''}>
              <TableCell><Link className="underline" href={`/admin/customers/${row.id}`}>{row.name}</Link></TableCell>
              <TableCell>{row.account_number || '-'}</TableCell>
              <TableCell>
                <span className={`text-xs px-2 py-1 rounded ${row.customer_type === 'cash' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                  {row.customer_type === 'cash' ? 'Cash' : 'Account'}
                </span>
              </TableCell>
              <TableCell>
                <span className={`text-xs px-2 py-1 rounded ${Number(row.on_stop) === 1 ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                  {Number(row.on_stop) === 1 ? 'On Stop' : 'Active'}
                </span>
              </TableCell>
              <TableCell>{row.postcode || '-'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
