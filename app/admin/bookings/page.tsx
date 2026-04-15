'use client'

import { useEffect, useState } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<any[]>([])
  const [filter, setFilter] = useState('all')

  useEffect(() => { fetch('/api/bookings').then(r => r.json()).then(setBookings) }, [])

  const filtered = filter === 'all' ? bookings : bookings.filter(b => b.status === filter)

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Bookings</h1>
        <Select value={filter} onValueChange={v => setFilter(v ?? 'all')}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            {['all','pending','confirmed','scheduled','completed','cancelled'].map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <Table>
        <TableHeader>
          <TableRow><TableHead>ID</TableHead><TableHead>Customer</TableHead><TableHead>Date</TableHead><TableHead>Type</TableHead><TableHead>Skip</TableHead><TableHead>Status</TableHead></TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map(b => (
            <TableRow key={b.id}>
              <TableCell>#{b.id}</TableCell>
              <TableCell>#{b.customer_id}</TableCell>
              <TableCell>{b.booking_date}</TableCell>
              <TableCell className="capitalize">{b.job_type.replace('_',' ')}</TableCell>
              <TableCell>{b.skip_size}yd</TableCell>
              <TableCell><span className="text-xs bg-slate-100 px-2 py-0.5 rounded capitalize">{b.status}</span></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
