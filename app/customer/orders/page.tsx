'use client'

import { useEffect, useState } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'

const CUSTOMER_ID = 1

export default function OrdersPage() {
  const [bookings, setBookings] = useState<any[]>([])
  const [invoices, setInvoices] = useState<any[]>([])

  useEffect(() => {
    Promise.all([
      fetch(`/api/bookings?customerId=${CUSTOMER_ID}`).then(r => r.json()),
      fetch(`/api/invoices?customerId=${CUSTOMER_ID}`).then(r => r.json()),
    ]).then(([b, i]) => { setBookings(b); setInvoices(i) })
  }, [])

  return (
    <div className="max-w-3xl mx-auto p-8 space-y-8">
      <h1 className="text-2xl font-bold">My Orders</h1>

      <div>
        <h2 className="font-semibold text-slate-700 mb-3">Bookings</h2>
        <Table>
          <TableHeader>
            <TableRow><TableHead>Date</TableHead><TableHead>Type</TableHead><TableHead>Skip Size</TableHead><TableHead>Status</TableHead></TableRow>
          </TableHeader>
          <TableBody>
            {bookings.map(b => (
              <TableRow key={b.id}>
                <TableCell>{b.booking_date}</TableCell>
                <TableCell className="capitalize">{b.job_type.replace('_',' ')}</TableCell>
                <TableCell>{b.skip_size}yd</TableCell>
                <TableCell><span className="text-xs bg-slate-100 px-2 py-0.5 rounded capitalize">{b.status}</span></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div>
        <h2 className="font-semibold text-slate-700 mb-3">Invoices</h2>
        <Table>
          <TableHeader>
            <TableRow><TableHead>Issued</TableHead><TableHead>Amount</TableHead><TableHead>VAT</TableHead><TableHead>Total</TableHead><TableHead>Due</TableHead><TableHead>Status</TableHead><TableHead></TableHead></TableRow>
          </TableHeader>
          <TableBody>
            {invoices.map(inv => (
              <TableRow key={inv.id}>
                <TableCell>{inv.issued_date}</TableCell>
                <TableCell>£{inv.amount_gbp}</TableCell>
                <TableCell>£{inv.vat_gbp}</TableCell>
                <TableCell className="font-medium">£{inv.total_gbp}</TableCell>
                <TableCell>{inv.due_date}</TableCell>
                <TableCell><span className="text-xs bg-slate-100 px-2 py-0.5 rounded capitalize">{inv.status}</span></TableCell>
                <TableCell>{['draft','sent','overdue'].includes(inv.status) && <Button size="sm" variant="outline" className="text-green-600 border-green-600">Pay Now</Button>}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
