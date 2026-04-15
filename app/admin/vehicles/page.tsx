'use client'

import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Toaster } from '@/components/ui/sonner'

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<any[]>([])
  const [yards, setYards] = useState<any[]>([])
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ yardId: '', registration: '', type: 'skip_lorry', capacityTonnes: '', maxSkips: '' })

  async function load() {
    const [v, y] = await Promise.all([fetch('/api/vehicles').then(r => r.json()), fetch('/api/yards').then(r => r.json())])
    setVehicles(v); setYards(y)
    if (y.length && !form.yardId) setForm(f => ({...f, yardId: String(y[0].id)}))
  }

  useEffect(() => { load() }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const res = await fetch('/api/vehicles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ yardId: Number(form.yardId), registration: form.registration, type: form.type, capacityTonnes: Number(form.capacityTonnes), maxSkips: Number(form.maxSkips) }),
    })
    if (res.ok) { toast.success('Vehicle added'); setOpen(false); load() }
    else toast.error('Failed to add vehicle')
  }

  const yardName = (id: number) => yards.find(y => y.id === id)?.name || id

  return (
    <div className="p-6 space-y-4">
      <Toaster />
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Vehicles</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button><Plus className="h-4 w-4 mr-2" />Add Vehicle</Button>} />
          <DialogContent>
            <DialogHeader><DialogTitle>Add Vehicle</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-1">
                <Label>Yard</Label>
                <Select value={form.yardId} onValueChange={v => setForm(f => ({...f, yardId: v ?? ''}))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{yards.map(y => <SelectItem key={y.id} value={String(y.id)}>{y.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Type</Label>
                <Select value={form.type} onValueChange={v => setForm(f => ({...f, type: v ?? 'skip_lorry'}))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="skip_lorry">Skip Lorry</SelectItem>
                    <SelectItem value="flatbed">Flatbed</SelectItem>
                    <SelectItem value="tipper">Tipper</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {[['registration','Registration'],['capacityTonnes','Capacity (tonnes)'],['maxSkips','Max Skips']].map(([k,l]) => (
                <div key={k} className="space-y-1">
                  <Label>{l}</Label>
                  <Input value={(form as any)[k]} onChange={e => setForm(f => ({...f, [k]: e.target.value}))} required />
                </div>
              ))}
              <Button type="submit" className="w-full">Save</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <Table>
        <TableHeader>
          <TableRow><TableHead>Registration</TableHead><TableHead>Yard</TableHead><TableHead>Type</TableHead><TableHead>Capacity</TableHead><TableHead>Max Skips</TableHead><TableHead>Status</TableHead></TableRow>
        </TableHeader>
        <TableBody>
          {vehicles.map(v => (
            <TableRow key={v.id}>
              <TableCell className="font-medium">{v.registration}</TableCell>
              <TableCell>{yardName(v.yard_id)}</TableCell>
              <TableCell>{v.type.replace('_',' ')}</TableCell>
              <TableCell>{v.capacity_tonnes}t</TableCell>
              <TableCell>{v.max_skips}</TableCell>
              <TableCell><span className="text-xs bg-slate-100 px-2 py-0.5 rounded">{v.status.replace('_',' ')}</span></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
