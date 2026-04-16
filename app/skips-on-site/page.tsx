'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

const SkipsMap = dynamic(async () => {
  const leaflet = await import('react-leaflet')
  return function MapView({ rows }: { rows: any[] }) {
    const { MapContainer, TileLayer, Marker, Popup } = leaflet
    const center: [number, number] = rows.length ? [Number(rows[0].site_lat), Number(rows[0].site_lng)] : [51.5, -0.1]
    return (
      <MapContainer center={center} zoom={10} style={{ height: 420, width: '100%' }}>
        <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {rows.map((row) => (
          <Marker key={row.id} position={[Number(row.site_lat), Number(row.site_lng)]}>
            <Popup>
              <div className="text-xs">
                <div className="font-semibold">{row.customer_name}</div>
                <div>{row.site_address}</div>
                <div>{row.skip_size_yards || '-'}yd • {row.days_on_site} days</div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    )
  }
}, { ssr: false })

export default function SkipsOnSitePage() {
  const [rows, setRows] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [yard, setYard] = useState('all')
  const [daysFilter, setDaysFilter] = useState('all')
  const [showMap, setShowMap] = useState(false)

  async function load() {
    const params = new URLSearchParams()
    if (yard !== 'all') params.set('yard_id', yard)
    const data = await fetch(`/api/skips-on-site?${params.toString()}`).then((r) => r.json())
    setRows(data)
  }

  useEffect(() => { load() }, [yard])

  const filtered = useMemo(() => rows.filter((row) => {
    const q = search.toLowerCase()
    const queryMatch = !q || `${row.site_address} ${row.customer_name} ${row.postcode || ''}`.toLowerCase().includes(q)
    const days = Number(row.days_on_site || 0)
    const dayMatch = daysFilter === 'all' || (daysFilter === '7' && days >= 7) || (daysFilter === '14' && days >= 14) || (daysFilter === '30' && days >= 30)
    return queryMatch && dayMatch
  }), [rows, search, daysFilter])

  const stats = useMemo(() => ({
    total: filtered.length,
    dueCollection: filtered.filter((row) => Number(row.days_on_site || 0) >= 30).length,
    permanent: filtered.filter((row) => Number(row.is_permanent_site) === 1).length,
  }), [filtered])

  const badgeClass = (days: number) => {
    if (days >= 30) return 'text-red-700 bg-red-100'
    if (days >= 14) return 'text-amber-700 bg-amber-100'
    return 'text-emerald-700 bg-emerald-100'
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Skips On Site</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        <div className="rounded border border-slate-200 p-3">Total skips on site: <strong>{stats.total}</strong></div>
        <div className="rounded border border-slate-200 p-3">Due for collection (30+ days): <strong>{stats.dueCollection}</strong></div>
        <div className="rounded border border-slate-200 p-3">Permanent sites: <strong>{stats.permanent}</strong></div>
      </div>

      <Input placeholder="Search by address, postcode, or customer name" value={search} onChange={(e) => setSearch(e.target.value)} />

      <div className="flex gap-2">
        <select className="border rounded px-2" value={yard} onChange={(e) => setYard(e.target.value)}>
          <option value="all">All Yards</option>
          <option value="1">Yard 1</option>
          <option value="2">Yard 2</option>
          <option value="3">Yard 3</option>
        </select>
        <select className="border rounded px-2" value={daysFilter} onChange={(e) => setDaysFilter(e.target.value)}>
          <option value="all">Days on Site: All</option>
          <option value="7">7+ days</option>
          <option value="14">14+ days</option>
          <option value="30">30+ days</option>
        </select>
        <Button variant="outline" onClick={() => setShowMap((v) => !v)}>{showMap ? 'Show Table' : 'Show Map'}</Button>
      </div>

      {showMap ? (
        <div className="rounded border border-slate-200 overflow-hidden">
          <SkipsMap rows={filtered.filter((row) => row.site_lat && row.site_lng)} />
        </div>
      ) : (
        <Table>
          <TableHeader><TableRow><TableHead>Customer</TableHead><TableHead>Site Address</TableHead><TableHead>Skip Size</TableHead><TableHead>Days on Site</TableHead><TableHead>Yard</TableHead><TableHead>Last Job Date</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
          <TableBody>
            {filtered.map((row) => {
              const days = Number(row.days_on_site || 0)
              return (
                <TableRow key={row.id}>
                  <TableCell><Link className="underline" href={`/admin/customers/${row.customer_id}`}>{row.customer_name}</Link></TableCell>
                  <TableCell>{row.site_address}</TableCell>
                  <TableCell>{row.skip_size_yards || '-'}yd</TableCell>
                  <TableCell><span className={`text-xs px-2 py-1 rounded ${badgeClass(days)}`}>{days} days</span></TableCell>
                  <TableCell>{row.yard_name || '-'}</TableCell>
                  <TableCell>{row.last_job_date || '-'}</TableCell>
                  <TableCell className="flex gap-1">
                    <Link href={`/admin/bookings?agreement_id=${row.id}&type=collection`}><Button size="sm" variant="outline">Collect</Button></Link>
                    <Link href={`/admin/bookings?agreement_id=${row.id}&type=exchange`}><Button size="sm" variant="outline">Exchange</Button></Link>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
