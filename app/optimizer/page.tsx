'use client'

import { useEffect, useState } from 'react'
import { Play, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { ResultsView } from '@/components/optimizer/ResultsView'
import { toast } from 'sonner'
import { Toaster } from '@/components/ui/sonner'

export default function OptimizerPage() {
  const [yards, setYards] = useState<any[]>([])
  const [drivers, setDrivers] = useState<any[]>([])
  const [vehicles, setVehicles] = useState<any[]>([])

  const [selectedYard, setSelectedYard] = useState('')
  const [selectedDriver, setSelectedDriver] = useState('')
  const [selectedVehicle, setSelectedVehicle] = useState('')
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [maxStops, setMaxStops] = useState('8')
  const [shiftEndTime, setShiftEndTime] = useState('17:00')
  const [avoidMotorways, setAvoidMotorways] = useState(false)
  const [prioritiseCommercial, setPrioritiseCommercial] = useState(false)

  const [running, setRunning] = useState(false)
  const [result, setResult] = useState<any>(null)

  useEffect(() => {
    Promise.all([
      fetch('/api/yards').then(r => r.json()),
      fetch('/api/drivers').then(r => r.json()),
      fetch('/api/vehicles').then(r => r.json()),
    ]).then(([y, d, v]) => {
      setYards(y)
      setDrivers(d)
      setVehicles(v)
      if (y.length) setSelectedYard(String(y[0].id))
      if (d.length) setSelectedDriver(String(d[0].id))
      if (v.length) setSelectedVehicle(String(v[0].id))
    })
  }, [])

  // Filter drivers/vehicles by yard
  const filteredDrivers = selectedYard ? drivers.filter(d => String(d.yard_id) === selectedYard) : drivers
  const filteredVehicles = selectedYard ? vehicles.filter(v => String(v.yard_id) === selectedYard) : vehicles

  async function handleRunOptimisation() {
    if (!selectedYard || !selectedDriver || !selectedVehicle) {
      toast.error('Please select yard, driver and vehicle')
      return
    }
    setRunning(true)
    setResult(null)
    try {
      const res = await fetch('/api/routes/optimise', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          yardId: Number(selectedYard),
          driverId: Number(selectedDriver),
          vehicleId: Number(selectedVehicle),
          date: selectedDate,
          constraints: {
            maxStops: Number(maxStops),
            shiftEndTime,
            avoidMotorways,
            prioritiseCommercial,
          },
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Optimisation failed')
        return
      }
      setResult(data)
    } catch {
      toast.error('Network error')
    } finally {
      setRunning(false)
    }
  }

  return (
    <div className="flex h-full overflow-hidden">
      <Toaster />
      {/* Controls panel */}
      <div className="w-80 flex-shrink-0 border-r border-slate-200 bg-slate-50 p-6 overflow-y-auto space-y-5">
        <div className="flex items-center gap-2 mb-2">
          <Settings className="h-5 w-5 text-slate-600" />
          <h2 className="font-semibold text-slate-800">Optimisation Controls</h2>
        </div>

        <div className="space-y-1">
          <Label>Date</Label>
          <Input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} />
        </div>

        <div className="space-y-1">
          <Label>Yard</Label>
          <Select value={selectedYard} onValueChange={v => setSelectedYard(v ?? '')}>
            <SelectTrigger><SelectValue placeholder="Select yard" /></SelectTrigger>
            <SelectContent>
              {yards.map(y => <SelectItem key={y.id} value={String(y.id)}>{y.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label>Vehicle</Label>
          <Select value={selectedVehicle} onValueChange={v => setSelectedVehicle(v ?? '')}>
            <SelectTrigger><SelectValue placeholder="Select vehicle" /></SelectTrigger>
            <SelectContent>
              {filteredVehicles.map(v => <SelectItem key={v.id} value={String(v.id)}>{v.registration} ({v.type})</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label>Driver</Label>
          <Select value={selectedDriver} onValueChange={v => setSelectedDriver(v ?? '')}>
            <SelectTrigger><SelectValue placeholder="Select driver" /></SelectTrigger>
            <SelectContent>
              {filteredDrivers.map(d => <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label>Max Stops</Label>
          <Input type="number" min={1} max={20} value={maxStops} onChange={e => setMaxStops(e.target.value)} />
        </div>

        <div className="space-y-1">
          <Label>Shift End Time</Label>
          <Input type="time" value={shiftEndTime} onChange={e => setShiftEndTime(e.target.value)} />
        </div>

        <div className="flex items-center gap-2">
          <Checkbox id="motorways" checked={avoidMotorways} onCheckedChange={v => setAvoidMotorways(!!v)} />
          <Label htmlFor="motorways">Avoid Motorways</Label>
        </div>

        <div className="flex items-center gap-2">
          <Checkbox id="commercial" checked={prioritiseCommercial} onCheckedChange={v => setPrioritiseCommercial(!!v)} />
          <Label htmlFor="commercial">Prioritise Commercial</Label>
        </div>

        <Button onClick={handleRunOptimisation} disabled={running} className="w-full">
          <Play className="h-4 w-4 mr-2" />
          {running ? 'Running...' : 'Run Optimisation'}
        </Button>
      </div>

      {/* Results panel */}
      <div className="flex-1 p-6 overflow-y-auto">
        {!result && !running && (
          <div className="flex flex-col items-center justify-center h-full text-slate-400">
            <Play className="h-12 w-12 mb-3 opacity-30" />
            <p className="text-sm">Configure the controls and run optimisation to see results</p>
          </div>
        )}
        {running && (
          <div className="flex items-center justify-center h-full text-slate-500">
            <div className="text-sm">Running optimisation...</div>
          </div>
        )}
        {result && (
          <ResultsView
            result={result}
            yardId={Number(selectedYard)}
            driverId={Number(selectedDriver)}
            vehicleId={Number(selectedVehicle)}
            onConfirmed={() => setResult(null)}
          />
        )}
      </div>
    </div>
  )
}
