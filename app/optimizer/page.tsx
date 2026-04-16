'use client'

import { useEffect, useState } from 'react'
import { Play, Settings2, Calendar, MapPin, Truck, User, SlidersHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { ResultsView } from '@/components/optimizer/ResultsView'
import { toast } from 'sonner'
import { Toaster } from '@/components/ui/sonner'

function ControlSection({ icon: Icon, title, children }: { icon: React.ComponentType<any>; title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-md bg-blue-50 flex items-center justify-center">
          <Icon className="h-3.5 w-3.5 text-blue-600" />
        </div>
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</span>
      </div>
      {children}
    </div>
  )
}

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
      setYards(y); setDrivers(d); setVehicles(v)
      if (y.length) setSelectedYard(String(y[0].id))
      if (d.length) setSelectedDriver(String(d[0].id))
      if (v.length) setSelectedVehicle(String(v[0].id))
    })
  }, [])

  const filteredDrivers = selectedYard ? drivers.filter(d => String(d.yard_id) === selectedYard) : drivers
  const filteredVehicles = selectedYard ? vehicles.filter(v => String(v.yard_id) === selectedYard) : vehicles

  async function handleRunOptimisation() {
    if (!selectedYard || !selectedDriver || !selectedVehicle) {
      toast.error('Please select yard, driver and vehicle')
      return
    }
    setRunning(true); setResult(null)
    try {
      const res = await fetch('/api/routes/optimise', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          yardId: Number(selectedYard), driverId: Number(selectedDriver),
          vehicleId: Number(selectedVehicle), date: selectedDate,
          constraints: { maxStops: Number(maxStops), shiftEndTime, avoidMotorways, prioritiseCommercial },
        }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error || 'Optimisation failed'); return }
      setResult(data)
    } catch { toast.error('Network error') }
    finally { setRunning(false) }
  }

  return (
    <div className="flex h-[calc(100vh-56px)] overflow-hidden bg-slate-50">
      <Toaster />

      {/* Controls panel */}
      <div className="w-[300px] flex-shrink-0 bg-white border-r border-slate-200 flex flex-col overflow-y-auto">
        <div className="p-5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Settings2 className="h-5 w-5 text-slate-600" />
            <h2 className="font-bold text-slate-800">Route Controls</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">Configure and run route optimisation</p>
        </div>

        <div className="p-5 space-y-6 flex-1">
          <ControlSection icon={Calendar} title="Schedule">
            <div className="space-y-1">
              <Label className="text-xs text-slate-600">Date</Label>
              <Input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
                className="h-9 text-sm border-slate-200" />
            </div>
          </ControlSection>

          <ControlSection icon={MapPin} title="Location">
            <div className="space-y-1">
              <Label className="text-xs text-slate-600">Yard</Label>
              <Select value={selectedYard} onValueChange={v => setSelectedYard(v ?? '')}>
                <SelectTrigger className="h-9 text-sm border-slate-200"><SelectValue placeholder="Select yard" /></SelectTrigger>
                <SelectContent>{yards.map(y => <SelectItem key={y.id} value={String(y.id)}>{y.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </ControlSection>

          <ControlSection icon={Truck} title="Vehicle">
            <div className="space-y-1">
              <Label className="text-xs text-slate-600">Vehicle</Label>
              <Select value={selectedVehicle} onValueChange={v => setSelectedVehicle(v ?? '')}>
                <SelectTrigger className="h-9 text-sm border-slate-200"><SelectValue placeholder="Select vehicle" /></SelectTrigger>
                <SelectContent>{filteredVehicles.map(v => <SelectItem key={v.id} value={String(v.id)}>{v.registration} · {v.type.replace('_',' ')}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </ControlSection>

          <ControlSection icon={User} title="Driver">
            <div className="space-y-1">
              <Label className="text-xs text-slate-600">Driver</Label>
              <Select value={selectedDriver} onValueChange={v => setSelectedDriver(v ?? '')}>
                <SelectTrigger className="h-9 text-sm border-slate-200"><SelectValue placeholder="Select driver" /></SelectTrigger>
                <SelectContent>{filteredDrivers.map(d => <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </ControlSection>

          <ControlSection icon={SlidersHorizontal} title="Constraints">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-slate-600">Max Stops</Label>
                <Input type="number" min={1} max={20} value={maxStops} onChange={e => setMaxStops(e.target.value)}
                  className="h-9 text-sm border-slate-200" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-slate-600">Shift End</Label>
                <Input type="time" value={shiftEndTime} onChange={e => setShiftEndTime(e.target.value)}
                  className="h-9 text-sm border-slate-200" />
              </div>
            </div>
            <div className="space-y-2 pt-1">
              <label className="flex items-center gap-2.5 cursor-pointer group">
                <Checkbox checked={avoidMotorways} onCheckedChange={v => setAvoidMotorways(!!v)}
                  className="border-slate-300" />
                <span className="text-sm text-slate-600 group-hover:text-slate-800">Avoid Motorways</span>
              </label>
              <label className="flex items-center gap-2.5 cursor-pointer group">
                <Checkbox checked={prioritiseCommercial} onCheckedChange={v => setPrioritiseCommercial(!!v)}
                  className="border-slate-300" />
                <span className="text-sm text-slate-600 group-hover:text-slate-800">Prioritise Commercial</span>
              </label>
            </div>
          </ControlSection>
        </div>

        <div className="p-5 border-t border-slate-100">
          <Button onClick={handleRunOptimisation} disabled={running} className="w-full h-10 bg-blue-600 hover:bg-blue-700 font-semibold">
            <Play className="h-4 w-4 mr-2" />
            {running ? 'Optimising...' : 'Run Optimisation'}
          </Button>
        </div>
      </div>

      {/* Results panel */}
      <div className="flex-1 overflow-y-auto p-6">
        {!result && !running && (
          <div className="flex flex-col items-center justify-center h-full text-slate-400">
            <div className="w-20 h-20 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
              <Play className="h-8 w-8 opacity-30" />
            </div>
            <p className="font-medium text-slate-500">Ready to optimise</p>
            <p className="text-sm mt-1">Configure the controls and click Run Optimisation</p>
          </div>
        )}
        {running && (
          <div className="flex flex-col items-center justify-center h-full text-slate-400">
            <div className="w-16 h-16 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin mb-4" />
            <p className="text-sm font-medium text-slate-500">Running optimisation...</p>
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
