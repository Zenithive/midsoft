'use client'

import { useState } from 'react'
import { MapPin, Package, ChevronDown, ChevronUp, Navigation } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Job {
  id: number
  customer_name: string
  address: string
  lat: number
  lng: number
  skip_size: number
  type: string
  notes: string | null
  status: string
  scheduled_time: string | null
}

interface Props {
  job: Job
  onComplete: (job: Job) => void
}

export function JobCard({ job, onComplete }: Props) {
  const [expanded, setExpanded] = useState(false)

  const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${job.lat},${job.lng}`

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      <button className="w-full p-4 text-left flex items-start justify-between" onClick={() => setExpanded(!expanded)}>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm">{job.customer_name}</div>
          <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
            <MapPin className="h-3 w-3" /><span className="truncate">{job.address}</span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs bg-slate-100 px-2 py-0.5 rounded">{job.type}</span>
            <span className="text-xs bg-slate-100 px-2 py-0.5 rounded flex items-center gap-1"><Package className="h-3 w-3" />{job.skip_size}yd</span>
            {job.scheduled_time && <span className="text-xs text-slate-400">{job.scheduled_time}</span>}
          </div>
        </div>
        {expanded ? <ChevronUp className="h-4 w-4 text-slate-400 flex-shrink-0 mt-1" /> : <ChevronDown className="h-4 w-4 text-slate-400 flex-shrink-0 mt-1" />}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-slate-100 pt-3">
          {job.notes && <p className="text-xs text-slate-600 bg-amber-50 p-2 rounded">{job.notes}</p>}
          <div className="flex gap-2">
            <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="flex-1">
              <Button variant="outline" size="sm" className="w-full">
                <Navigation className="h-3 w-3 mr-1" />Navigate
              </Button>
            </a>
            {job.status === 'in_progress' && (
              <Button size="sm" className="flex-1 bg-green-600 hover:bg-green-700" onClick={() => onComplete(job)}>
                Complete Job
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
