'use client'

import { useEffect, useState } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

const EVENT_COLORS: Record<string, string> = {
  harsh_brake: 'bg-red-100 text-red-700',
  speeding: 'bg-orange-100 text-orange-700',
  idle_excess: 'bg-yellow-100 text-yellow-700',
  geofence_exit: 'bg-purple-100 text-purple-700',
  low_fuel: 'bg-blue-100 text-blue-700',
}

export default function TelematicsPage() {
  const [events, setEvents] = useState<any[]>([])
  const [vehicles, setVehicles] = useState<any[]>([])
  const [drivers, setDrivers] = useState<any[]>([])
  const [filterType, setFilterType] = useState('all')

  useEffect(() => {
    Promise.all([
      fetch('/api/telematics').then(r => r.json()),
      fetch('/api/vehicles').then(r => r.json()),
      fetch('/api/drivers').then(r => r.json()),
    ]).then(([e, v, d]) => { setEvents(e); setVehicles(v); setDrivers(d) })
  }, [])

  const vehicleName = (id: number) => vehicles.find(v => v.id === id)?.registration || `#${id}`
  const driverName = (id: number) => drivers.find(d => d.id === id)?.name || `#${id}`

  // Driver scores
  const scores = drivers.map(d => {
    const driverEvents = events.filter(e => e.driver_id === d.id)
    const deductions = driverEvents.filter(e => ['harsh_brake','speeding'].includes(e.event_type)).length
    return { ...d, score: Math.max(0, 100 - deductions * 10) }
  }).filter(d => events.some(e => e.driver_id === d.id)).sort((a, b) => b.score - a.score)

  const filtered = filterType === 'all' ? events : events.filter(e => e.event_type === filterType)

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Fleet Telematics</h1>

      {/* Driver score cards */}
      <div>
        <h2 className="font-semibold text-slate-700 mb-3">Driver Safety Scores</h2>
        <div className="flex flex-wrap gap-3">
          {scores.map(d => (
            <div key={d.id} className="bg-white border border-slate-200 rounded-lg p-4 flex items-center gap-3 min-w-[180px]">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold ${d.score >= 80 ? 'bg-green-100 text-green-700' : d.score >= 60 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                {d.score}
              </div>
              <div>
                <div className="font-medium text-sm">{d.name}</div>
                <div className="text-xs text-slate-500">Score</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Events feed */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-slate-700">Events Feed</h2>
          <Select value={filterType} onValueChange={v => setFilterType(v ?? 'all')}>
            <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Events</SelectItem>
              <SelectItem value="harsh_brake">Harsh Brake</SelectItem>
              <SelectItem value="speeding">Speeding</SelectItem>
              <SelectItem value="idle_excess">Idle Excess</SelectItem>
              <SelectItem value="geofence_exit">Geofence Exit</SelectItem>
              <SelectItem value="low_fuel">Low Fuel</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Table>
          <TableHeader>
            <TableRow><TableHead>Event</TableHead><TableHead>Driver</TableHead><TableHead>Vehicle</TableHead><TableHead>Speed</TableHead><TableHead>Location</TableHead><TableHead>Time</TableHead></TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(e => (
              <TableRow key={e.id}>
                <TableCell><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${EVENT_COLORS[e.event_type] || ''}`}>{e.event_type.replace('_',' ')}</span></TableCell>
                <TableCell>{driverName(e.driver_id)}</TableCell>
                <TableCell>{vehicleName(e.vehicle_id)}</TableCell>
                <TableCell>{e.speed_kmh} km/h</TableCell>
                <TableCell className="text-xs text-slate-500">{e.lat.toFixed(4)}, {e.lng.toFixed(4)}</TableCell>
                <TableCell className="text-xs text-slate-500">{new Date(e.timestamp).toLocaleString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
