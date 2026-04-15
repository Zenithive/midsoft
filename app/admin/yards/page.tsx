'use client'

import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Toaster } from '@/components/ui/sonner'

export default function YardsPage() {
  const [yards, setYards] = useState<any[]>([])
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ name: '', address: '', lat: '', lng: '', radius: '12' })

  async function load() {
    const data = await fetch('/api/yards').then(r => r.json())
    setYards(data)
  }

  useEffect(() => { load() }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const res = await fetch('/api/yards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: form.name, address: form.address, lat: Number(form.lat), lng: Number(form.lng), serviceRadiusKm: Number(form.radius) }),
    })
    if (res.ok) { toast.success('Yard added'); setOpen(false); load() }
    else toast.error('Failed to add yard')
  }

  return (
    <div className="p-6 space-y-4">
      <Toaster />
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Yards</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button><Plus className="h-4 w-4 mr-2" />Add Yard</Button>} />
          <DialogContent>
            <DialogHeader><DialogTitle>Add Yard</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-3">
              {[['name','Name'],['address','Address'],['lat','Latitude'],['lng','Longitude'],['radius','Service Radius (km)']].map(([k,l]) => (
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
          <TableRow>
            <TableHead>Name</TableHead><TableHead>Address</TableHead>
            <TableHead>Lat</TableHead><TableHead>Lng</TableHead>
            <TableHead>Radius (km)</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {yards.map(y => (
            <TableRow key={y.id}>
              <TableCell className="font-medium">{y.name}</TableCell>
              <TableCell>{y.address}</TableCell>
              <TableCell>{y.lat}</TableCell>
              <TableCell>{y.lng}</TableCell>
              <TableCell>{y.service_radius_km}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
