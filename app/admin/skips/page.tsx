'use client'

import { useEffect, useState } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

export default function SkipsPage() {
  const [skips, setSkips] = useState<any[]>([])
  const [yards, setYards] = useState<any[]>([])

  useEffect(() => {
    Promise.all([
      fetch('/api/skips').then(r => r.json()),
      fetch('/api/yards').then(r => r.json()),
    ]).then(([s, y]) => { setSkips(s); setYards(y) })
  }, [])

  const yardName = (id: number) => yards.find(y => y.id === id)?.name || id

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Skip Stock</h1>
      <Table>
        <TableHeader>
          <TableRow><TableHead>Yard</TableHead><TableHead>Size</TableHead><TableHead>Available</TableHead><TableHead>On Hire</TableHead></TableRow>
        </TableHeader>
        <TableBody>
          {skips.map(s => (
            <TableRow key={s.id} className={s.quantity_available < 3 ? 'bg-red-50' : ''}>
              <TableCell>{yardName(s.yard_id)}</TableCell>
              <TableCell>{s.size_yards}yd</TableCell>
              <TableCell className={s.quantity_available < 3 ? 'text-red-600 font-bold' : ''}>{s.quantity_available}</TableCell>
              <TableCell>{s.quantity_on_hire}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
