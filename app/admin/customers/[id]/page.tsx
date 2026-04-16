'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { JobCreationWizard } from '@/components/jobs/JobCreationWizard'

const TABS = ['details', 'agreements', 'jobs', 'invoices', 'notes']

export default function CustomerDetailPage() {
  const params = useParams<{ id: string }>()
  const customerId = Number(params.id)
  const [activeTab, setActiveTab] = useState('details')
  const [customer, setCustomer] = useState<any>(null)
  const [agreements, setAgreements] = useState<any[]>([])
  const [jobs, setJobs] = useState<any[]>([])
  const [invoices, setInvoices] = useState<any[]>([])
  const [newAgreement, setNewAgreement] = useState<any>({ site_name: '', site_address: '', service_id: '', default_ewc_code_id: '', standard_price_gbp: '', is_permanent_site: false, notes: '' })
  const [services, setServices] = useState<any[]>([])
  const [ewcCodes, setEwcCodes] = useState<any[]>([])
  const [notes, setNotes] = useState<any[]>([])
  const [newNote, setNewNote] = useState('')

  const load = async () => {
    const [customers, agreementRows, invoiceRows, serviceRows, ewcRows] = await Promise.all([
      fetch(`/api/customers?q=id:${customerId}`).then((r) => r.json()),
      fetch(`/api/agreements?customer_id=${customerId}`).then((r) => r.json()),
      fetch(`/api/invoices?customerId=${customerId}`).then((r) => r.json()),
      fetch('/api/services?active=1').then((r) => r.json()),
      fetch('/api/ewc-codes?active=1').then((r) => r.json()),
    ])

    setCustomer(customers.find((c: any) => c.id === customerId) ?? customers[0] ?? null)
    setAgreements(agreementRows)
    setInvoices(invoiceRows)
    setServices(serviceRows)
    setEwcCodes(ewcRows)

    if (agreementRows.length) {
      const ids = agreementRows.map((a: any) => a.id)
      const allJobs = await fetch('/api/jobs').then((r) => r.json())
      setJobs(allJobs.filter((job: any) => ids.includes(job.agreement_id)))
    }
  }

  useEffect(() => {
    load()
  }, [customerId])

  const sortedJobs = useMemo(() => [...jobs].sort((a, b) => String(b.scheduled_date).localeCompare(String(a.scheduled_date))), [jobs])

  async function createAgreement() {
    await fetch('/api/agreements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...newAgreement,
        customer_id: customerId,
        service_id: Number(newAgreement.service_id),
        default_ewc_code_id: Number(newAgreement.default_ewc_code_id),
        standard_price_gbp: Number(newAgreement.standard_price_gbp || 0),
        is_permanent_site: Number(newAgreement.is_permanent_site ? 1 : 0),
      }),
    })
    setNewAgreement({ site_name: '', site_address: '', service_id: '', default_ewc_code_id: '', standard_price_gbp: '', is_permanent_site: false, notes: '' })
    load()
  }

  function addNote() {
    const note = { id: Date.now(), text: newNote, at: new Date().toISOString() }
    setNotes((prev) => [note, ...prev])
    setNewNote('')
  }

  if (!customer) return <div className="p-6">Loading customer...</div>

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{customer.name}</h1>
        <Link href="/admin/customers"><Button variant="outline">Back to customers</Button></Link>
      </div>

      <div className="flex gap-2">
        {TABS.map((tab) => <Button key={tab} size="sm" variant={activeTab === tab ? 'default' : 'outline'} onClick={() => setActiveTab(tab)}>{tab[0].toUpperCase() + tab.slice(1)}</Button>)}
      </div>

      {activeTab === 'details' && (
        <div className="rounded border border-slate-200 p-4 grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
          <div><strong>Type:</strong> {customer.customer_type}</div>
          <div><strong>Status:</strong> {customer.on_stop ? 'On Stop' : 'Active'}</div>
          <div><strong>Account Number:</strong> {customer.account_number || '-'}</div>
          <div><strong>PO Mandatory:</strong> {customer.po_mandatory ? 'Yes' : 'No'}</div>
          <div><strong>Payment Terms:</strong> {customer.payment_terms_days || 30} days</div>
          <div><strong>Invoice Method:</strong> {customer.invoice_method || 'email'}</div>
          <div><strong>Email:</strong> {customer.email || '-'}</div>
          <div><strong>Invoice Email:</strong> {customer.invoice_email || '-'}</div>
          <div className="md:col-span-2"><strong>Address:</strong> {customer.address}</div>
        </div>
      )}

      {activeTab === 'agreements' && (
        <div className="space-y-4">
          <div className="rounded border border-slate-200 p-4 space-y-3">
            <h2 className="font-semibold">New Agreement</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <Input placeholder="Site name" value={newAgreement.site_name} onChange={(e) => setNewAgreement((p: any) => ({ ...p, site_name: e.target.value }))} />
              <Input placeholder="Site address" value={newAgreement.site_address} onChange={(e) => setNewAgreement((p: any) => ({ ...p, site_address: e.target.value }))} />
              <select className="border rounded px-2" value={newAgreement.service_id} onChange={(e) => {
                const svc = services.find((s) => String(s.id) === e.target.value)
                setNewAgreement((p: any) => ({ ...p, service_id: e.target.value, standard_price_gbp: svc?.default_price_gbp ?? p.standard_price_gbp, default_ewc_code_id: svc?.default_ewc_code_id ?? p.default_ewc_code_id }))
              }}>
                <option value="">Service</option>
                {services.map((svc) => <option key={svc.id} value={svc.id}>{svc.name}</option>)}
              </select>
              <select className="border rounded px-2" value={newAgreement.default_ewc_code_id} onChange={(e) => setNewAgreement((p: any) => ({ ...p, default_ewc_code_id: e.target.value }))}>
                <option value="">EWC Code</option>
                {ewcCodes.map((code) => <option key={code.id} value={code.id}>{code.code}</option>)}
              </select>
              <Input placeholder="Standard price" type="number" value={newAgreement.standard_price_gbp} onChange={(e) => setNewAgreement((p: any) => ({ ...p, standard_price_gbp: e.target.value }))} />
              <label className="text-sm"><input type="checkbox" checked={newAgreement.is_permanent_site} onChange={(e) => setNewAgreement((p: any) => ({ ...p, is_permanent_site: e.target.checked }))} /> Is Permanent Site</label>
            </div>
            <Button onClick={createAgreement}>Save Agreement</Button>
          </div>

          <Table>
            <TableHeader><TableRow><TableHead>Site</TableHead><TableHead>Address</TableHead><TableHead>Service</TableHead><TableHead>Default Price</TableHead><TableHead>EWC</TableHead><TableHead>Permanent</TableHead><TableHead>Skip On Site</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
            <TableBody>
              {agreements.map((agreement) => (
                <TableRow key={agreement.id}>
                  <TableCell>{agreement.site_name || 'Site'}</TableCell>
                  <TableCell>{agreement.site_address}</TableCell>
                  <TableCell>{agreement.service_name}</TableCell>
                  <TableCell>£{Number(agreement.standard_price_gbp || 0).toFixed(2)}</TableCell>
                  <TableCell>{agreement.ewc_code || '-'}</TableCell>
                  <TableCell>{agreement.is_permanent_site ? 'Yes' : 'No'}</TableCell>
                  <TableCell>{agreement.skip_currently_on_site ? <span className="text-xs px-2 py-1 rounded bg-emerald-100 text-emerald-700">On Site</span> : '-'}</TableCell>
                  <TableCell className="flex gap-1">
                    <Link href={`/admin/bookings?agreement_id=${agreement.id}`}><Button size="sm" variant="outline">New Job</Button></Link>
                    {agreement.skip_currently_on_site ? <Link href={`/admin/bookings?agreement_id=${agreement.id}&type=collection`}><Button size="sm" variant="outline">Collect</Button></Link> : null}
                    {agreement.skip_currently_on_site ? <Link href={`/admin/bookings?agreement_id=${agreement.id}&type=exchange`}><Button size="sm" variant="outline">Exchange</Button></Link> : null}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {agreements.length > 0 && (
            <div className="rounded border border-slate-200 p-4">
              <h3 className="font-semibold mb-2">Create Job for this Customer</h3>
              <JobCreationWizard customerId={customerId} originLabel="Customer Detail" onSaved={load} />
            </div>
          )}
        </div>
      )}

      {activeTab === 'jobs' && (
        <Table>
          <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Status</TableHead><TableHead>Driver</TableHead><TableHead>Type</TableHead><TableHead>Price</TableHead><TableHead>PO</TableHead><TableHead></TableHead></TableRow></TableHeader>
          <TableBody>
            {sortedJobs.map((job) => (
              <TableRow key={job.id}>
                <TableCell>{job.scheduled_date}</TableCell>
                <TableCell>{job.status}</TableCell>
                <TableCell>{job.driver_id || '-'}</TableCell>
                <TableCell>{job.type}</TableCell>
                <TableCell>£{Number(job.total_gbp || 0).toFixed(2)}</TableCell>
                <TableCell>{job.po_number || '-'}</TableCell>
                <TableCell><Link className="underline" href={`/jobs/${job.id}`}>Open</Link></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {activeTab === 'invoices' && (
        <Table>
          <TableHeader><TableRow><TableHead>ID</TableHead><TableHead>Issued</TableHead><TableHead>Status</TableHead><TableHead>Total</TableHead></TableRow></TableHeader>
          <TableBody>
            {invoices.map((invoice) => (
              <TableRow key={invoice.id}>
                <TableCell>#{invoice.id}</TableCell>
                <TableCell>{invoice.issued_date}</TableCell>
                <TableCell>{invoice.status}</TableCell>
                <TableCell>£{Number(invoice.total_gbp || 0).toFixed(2)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {activeTab === 'notes' && (
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input placeholder="Add note" value={newNote} onChange={(e) => setNewNote(e.target.value)} />
            <Button onClick={addNote} disabled={!newNote.trim()}>Add Note</Button>
          </div>
          <div className="space-y-2">
            {notes.map((note) => (
              <div key={note.id} className="rounded border border-slate-200 p-2 text-sm">
                <div>{note.text}</div>
                <div className="text-xs text-slate-500">{new Date(note.at).toLocaleString('en-GB')}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
