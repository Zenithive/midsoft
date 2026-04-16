'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Toaster } from '@/components/ui/sonner'

const STATUS_COLOR: Record<string, string> = {
  on_shift: 'bg-green-100 text-green-700',
  available: 'bg-blue-100 text-blue-700',
  off_duty: 'bg-gray-100 text-gray-600',
}

export default function DriversPage() {
  const [drivers, setDrivers] = useState<any[]>([])
  const [yards, setYards] = useState<any[]>([])
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ yardId: '', name: '', phone: '', licenceClass: '', shiftStart: '06:00', shiftEnd: '16:00' })

  async function load() {
    const [d, y] = await Promise.all([fetch('/api/drivers').then(r => r.json()), fetch('/api/yards').then(r => r.json())])
    setDrivers(d); setYards(y)
    if (y.length && !form.yardId) setForm(f => ({...f, yardId: String(y[0].id)}))
  }

  useEffect(() => { load() }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const res = await fetch('/api/drivers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ yardId: Number(form.yardId), name: form.name, phone: form.phone, licenceClass: form.licenceClass, shiftStart: form.shiftStart, shiftEnd: form.shiftEnd }),
    })
    if (res.ok) { toast.success('Driver added'); setOpen(false); load() }
    else toast.error('Failed to add driver')
  }

  const yardName = (id: number) => yards.find(y => y.id === id)?.name || id

  return (
    <div className="p-6 space-y-4">
      <Toaster />
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Drivers</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button><Plus className="h-4 w-4 mr-2" />Add Driver</Button>} />
          <DialogContent>
            <DialogHeader><DialogTitle>Add Driver</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-1">
                <Label>Yard</Label>
                <Select value={form.yardId} onValueChange={v => setForm(f => ({...f, yardId: v ?? ''}))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{yards.map(y => <SelectItem key={y.id} value={String(y.id)}>{y.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              {[['name','Name'],['phone','Phone'],['licenceClass','Licence Class']].map(([k,l]) => (
                <div key={k} className="space-y-1">
                  <Label>{l}</Label>
                  <Input value={(form as any)[k]} onChange={e => setForm(f => ({...f, [k]: e.target.value}))} required />
                </div>
              ))}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label>Shift Start</Label><Input type="time" value={form.shiftStart} onChange={e => setForm(f => ({...f, shiftStart: e.target.value}))} /></div>
                <div className="space-y-1"><Label>Shift End</Label><Input type="time" value={form.shiftEnd} onChange={e => setForm(f => ({...f, shiftEnd: e.target.value}))} /></div>
              </div>
              <Button type="submit" className="w-full">Save</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <Table>
        <TableHeader>
          <TableRow><TableHead>Name</TableHead><TableHead>Yard</TableHead><TableHead>Phone</TableHead><TableHead>Licence</TableHead><TableHead>Shift</TableHead><TableHead>Status</TableHead><TableHead></TableHead></TableRow>
        </TableHeader>
        <TableBody>
          {drivers.map(d => (
            <TableRow key={d.id}>
              <TableCell className="font-medium">{d.name}</TableCell>
              <TableCell>{yardName(d.yard_id)}</TableCell>
              <TableCell>{d.phone}</TableCell>
              <TableCell>{d.licence_class}</TableCell>
              <TableCell>{d.shift_start}–{d.shift_end}</TableCell>
              <TableCell><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[d.status] || ''}`}>{d.status.replace('_',' ')}</span></TableCell>
              <TableCell>
                <Link className="text-xs underline" href={`/admin/drivers/${d.id}`}>Daily schedule</Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
