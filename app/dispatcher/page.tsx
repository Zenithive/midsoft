'use client'

import { useEffect, useState, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { JobList } from '@/components/dispatcher/JobList'

const DispatcherMap = dynamic(() => import('@/components/dispatcher/DispatcherMapInner'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center bg-slate-100 rounded-lg">
      <div className="text-slate-500 text-sm">Loading map...</div>
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

export default function DispatcherPage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [gpsPositions, setGpsPositions] = useState<GpsPosition[]>([])
  const [yards, setYards] = useState<Yard[]>([])
  const [loading, setLoading] = useState(true)

  const today = new Date().toISOString().split('T')[0]

  // Initial data load
  useEffect(() => {
    Promise.all([
      fetch(`/api/jobs?date=${today}`).then(r => r.json()),
      fetch('/api/yards').then(r => r.json()),
      fetch('/api/gps').then(r => r.json()),
    ]).then(([jobsData, yardsData, gpsData]) => {
      setJobs(jobsData)
      setYards(yardsData)
      setGpsPositions(gpsData)
      setLoading(false)
    }).catch(console.error)
  }, [today])

  // GPS polling every 5 seconds
  useEffect(() => {
    const poll = async () => {
      try {
        const res = await fetch('/api/gps')
        const data = await res.json()
        setGpsPositions(data)
      } catch (e) {
        console.error(e)
      }
    }
    const interval = setInterval(poll, 5000)
    return () => clearInterval(interval)
  }, [])

  // Memoised data for map
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
      <div className="flex items-center justify-center h-full">
        <div className="text-slate-500">Loading dispatcher dashboard...</div>
      </div>
    )
  }

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left panel — job list */}
      <div className="w-96 flex-shrink-0 border-r border-slate-200 flex flex-col overflow-hidden bg-slate-50">
        <JobList jobs={memoJobs} onReorder={handleReorder} />
      </div>

      {/* Right panel — map */}
      <div className="flex-1 p-4">
        <DispatcherMap
          jobs={memoJobs}
          gpsPositions={memoGps}
          yards={yards}
        />
      </div>
    </div>
  )
}
