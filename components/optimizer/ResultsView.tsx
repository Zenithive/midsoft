'use client'

import { useState } from 'react'
import { CheckCircle, TrendingDown, Clock, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

interface RouteStats {
  totalDistanceKm: number
  estimatedDurationMins: number
  stopCount: number
}

interface JobSequenceItem {
  order: number
  job: {
    id: number
    customer_name: string
    address: string
    type: string
    skip_size: number
  }
  estimatedArrival: string
  distanceFromPrevKm: number
}

interface OptimisationResult {
  routeId: number
  before: RouteStats
  after: RouteStats
  sequence: JobSequenceItem[]
  improvement: number
}

interface Props {
  result: OptimisationResult
  yardId: number
  driverId: number
  vehicleId: number
  onConfirmed: () => void
}

export function ResultsView({ result, yardId, driverId, vehicleId, onConfirmed }: Props) {
  const [confirming, setConfirming] = useState(false)

  async function handleConfirm() {
    setConfirming(true)
    try {
      const sequence = result.sequence.map(item => ({ jobId: item.job.id, order: item.order }))
      const res = await fetch('/api/routes/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ yardId, driverId, vehicleId, sequence }),
      })
      if (!res.ok) {
        const err = await res.json()
        toast.error(err.error || 'Failed to confirm route')
        return
      }
      toast.success('Route confirmed and assigned!')
      onConfirmed()
    } catch {
      toast.error('Network error')
    } finally {
      setConfirming(false)
    }
  }

  const distSaved = result.before.totalDistanceKm - result.after.totalDistanceKm

  return (
    <div className="space-y-6">
      {/* Improvement badge */}
      <div className="flex items-center gap-3">
        <Badge className="bg-green-100 text-green-800 text-base px-4 py-1">
          <TrendingDown className="h-4 w-4 mr-1" />
          {result.improvement.toFixed(1)}% improvement
        </Badge>
        <span className="text-sm text-slate-500">{distSaved.toFixed(1)} km saved</span>
      </div>

      {/* Before / After stats table */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Metric', before: 'Before', after: 'After', isHeader: true },
          { label: 'Distance', before: `${result.before.totalDistanceKm.toFixed(1)} km`, after: `${result.after.totalDistanceKm.toFixed(1)} km`, isHeader: false },
          { label: 'Duration', before: `${result.before.estimatedDurationMins} min`, after: `${result.after.estimatedDurationMins} min`, isHeader: false },
          { label: 'Stops', before: `${result.before.stopCount}`, after: `${result.after.stopCount}`, isHeader: false },
        ].map((row, i) => (
          <div key={i} className={`contents ${row.isHeader ? 'font-semibold' : ''}`}>
            <div className={`p-3 rounded-l-lg ${row.isHeader ? 'bg-slate-200 font-semibold' : 'bg-slate-50'}`}>{row.label}</div>
            <div className={`p-3 ${row.isHeader ? 'bg-slate-200 font-semibold' : 'bg-red-50 text-red-700'}`}>{row.before}</div>
            <div className={`p-3 rounded-r-lg ${row.isHeader ? 'bg-slate-200 font-semibold' : 'bg-green-50 text-green-700'}`}>{row.after}</div>
          </div>
        ))}
      </div>

      {/* Sequence list */}
      <div>
        <h3 className="font-semibold text-sm text-slate-700 mb-3">Optimised Sequence</h3>
        <div className="space-y-2">
          {result.sequence.map((item) => (
            <div key={item.order} className="flex items-start gap-3 p-3 bg-white border border-slate-200 rounded-lg">
              <div className="w-7 h-7 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold flex-shrink-0">
                {item.order}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm">{item.job.customer_name}</div>
                <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                  <MapPin className="h-3 w-3" />
                  <span className="truncate">{item.job.address}</span>
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs bg-slate-100 px-2 py-0.5 rounded">{item.job.type}</span>
                  <span className="text-xs bg-slate-100 px-2 py-0.5 rounded">{item.job.skip_size}yd</span>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="flex items-center gap-1 text-xs text-slate-600">
                  <Clock className="h-3 w-3" />
                  {item.estimatedArrival}
                </div>
                <div className="text-xs text-slate-400 mt-0.5">+{item.distanceFromPrevKm.toFixed(1)} km</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Confirm button */}
      <Button onClick={handleConfirm} disabled={confirming} className="w-full bg-green-600 hover:bg-green-700">
        <CheckCircle className="h-4 w-4 mr-2" />
        {confirming ? 'Confirming...' : 'Confirm & Assign Route'}
      </Button>
    </div>
  )
}
