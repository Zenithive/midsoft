'use client'

import { useEffect, useState, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { List, Map, RefreshCw } from 'lucide-react'
import { JobList } from '@/components/dispatcher/JobList'

const DispatcherMap = dynamic(() => import('@/components/dispatcher/DispatcherMapInner'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center bg-slate-100">
      <div className="flex flex-col items-center gap-3 text-slate-400">
        <div className="w-10 h-10 rounded-full border-4 border-slate-200 border-t-blue-500 animate-spin" />
        <span className="text-sm">Loading map...</span>
      </div>
    </div>
  ),
})

interface Job {
  id: number
  customer_name: string
  address: string
  status: string
  type: string
  skip_size: number
  scheduled_time: string | null
  sequence_order: number
  driver_id: number | null
  lat: number
  lng: number
}

interface GpsPosition {
  id: number
  driver_id: number
  vehicle_id: number
  lat: number
  lng: number
  speed_kmh: number
  heading: number
}

interface Yard {
  id: number
  name: string
  lat: number
  lng: number
}

type ViewMode = 'split' | 'list' | 'map'

export default function DispatcherPage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [gpsPositions, setGpsPositions] = useState<GpsPosition[]>([])
  const [yards, setYards] = useState<Yard[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>('split')
  const [lastRefresh, setLastRefresh] = useState(new Date())

  const today = new Date().toISOString().split('T')[0]

  async function loadData() {
    try {
      const [jobsData, yardsData, gpsData] = await Promise.all([
        fetch(`/api/jobs?date=${today}`).then(r => r.json()),
        fetch('/api/yards').then(r => r.json()),
        fetch('/api/gps').then(r => r.json()),
      ])
      setJobs(jobsData)
      setYards(yardsData)
      setGpsPositions(gpsData)
      setLastRefresh(new Date())
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [today])

  // GPS polling every 5 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const data = await fetch('/api/gps').then(r => r.json())
        setGpsPositions(data)
      } catch {}
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  const memoJobs = useMemo(() => jobs, [jobs])
  const memoGps = useMemo(() => gpsPositions, [gpsPositions])

  function handleReorder(reorderedJobs: Job[]) {
    setJobs(prev => {
      const reorderedIds = new Set(reorderedJobs.map(j => j.id))
      const unchanged = prev.filter(j => !reorderedIds.has(j.id))
      return [...unchanged, ...reorderedJobs].sort((a, b) => a.sequence_order - b.sequence_order)
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-56px)]">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <div className="w-10 h-10 rounded-full border-4 border-slate-200 border-t-blue-500 animate-spin" />
          <span className="text-sm">Loading dashboard...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-56px)] overflow-hidden">

      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-white border-b border-slate-100 flex-shrink-0">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <RefreshCw className="h-3 w-3" />
          <span>Updated {lastRefresh.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
          <span className="text-slate-200">·</span>
          <span>{jobs.length} jobs today</span>
        </div>

        {/* View toggle */}
        <div className="flex items-center bg-slate-100 rounded-lg p-0.5 gap-0.5">
          {([
            { mode: 'list' as ViewMode, icon: List,    label: 'List' },
            { mode: 'split' as ViewMode, icon: null,   label: 'Split' },
            { mode: 'map' as ViewMode,  icon: Map,     label: 'Map' },
          ]).map(({ mode, icon: Icon, label }) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all
                ${viewMode === mode
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
                }`}
            >
              {Icon && <Icon className="h-3.5 w-3.5" />}
              {!Icon && (
                <span className="flex gap-0.5">
                  <span className="w-2 h-3 bg-current rounded-sm opacity-70" />
                  <span className="w-3 h-3 bg-current rounded-sm" />
                </span>
              )}
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden">

        {/* List panel — shown in 'list' and 'split' */}
        {(viewMode === 'list' || viewMode === 'split') && (
          <div className={`flex flex-col overflow-hidden border-r border-slate-200
            ${viewMode === 'list' ? 'w-full' : 'w-[360px] flex-shrink-0'}`}
          >
            <JobList jobs={memoJobs} onReorder={handleReorder} />
          </div>
        )}

        {/* Map panel — shown in 'map' and 'split' */}
        {(viewMode === 'map' || viewMode === 'split') && (
          <div className="flex-1 relative">
            <DispatcherMap
              jobs={memoJobs}
              gpsPositions={memoGps}
              yards={yards}
            />
          </div>
        )}

      </div>
    </div>
  )
}
