'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Bell, ChevronRight, MapPin, Clock } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const PAGE_LABELS: Record<string, string> = {
  dispatcher: 'Dispatcher Dashboard',
  optimizer: 'Route Optimizer',
  driver: 'Driver View',
  customer: 'Customer Portal',
  admin: 'Admin Panel',
  reports: 'Reports',
  compliance: 'Compliance',
  telematics: 'Fleet Telematics',
}

export function Navbar() {
  const pathname = usePathname()
  const [currentTime, setCurrentTime] = useState(new Date())
  const [yards, setYards] = useState<any[]>([])
  const [selectedYard, setSelectedYard] = useState<string>('')

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    fetch('/api/yards').then(r => r.json()).then(data => {
      setYards(data)
      if (data.length > 0) setSelectedYard(data[0].id.toString())
    }).catch(console.error)
  }, [])

  const segments = pathname.split('/').filter(Boolean)
  const pageKey = segments[0] || 'home'
  const pageLabel = PAGE_LABELS[pageKey] || pageKey.charAt(0).toUpperCase() + pageKey.slice(1)

  const timeStr = currentTime.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  const dateStr = currentTime.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })

  return (
    <header className="h-14 bg-white border-b border-slate-100 px-6 flex items-center justify-between flex-shrink-0 shadow-sm">
      {/* Left: breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <span className="text-slate-400">Home</span>
        {segments.map((seg, i) => (
          <span key={i} className="flex items-center gap-2">
            <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
            <span className={i === segments.length - 1 ? 'text-slate-800 font-semibold' : 'text-slate-400'}>
              {PAGE_LABELS[seg] || seg.charAt(0).toUpperCase() + seg.slice(1)}
            </span>
          </span>
        ))}
      </div>

      {/* Right: controls */}
      <div className="flex items-center gap-3">
        {/* Date + time */}
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5">
          <Clock className="h-3.5 w-3.5 text-slate-400" />
          <span className="text-xs font-mono text-slate-600">{timeStr}</span>
          <span className="text-slate-300">·</span>
          <span className="text-xs text-slate-500">{dateStr}</span>
        </div>

        {/* Yard selector */}
        <div className="flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5 text-slate-400" />
          <Select value={selectedYard} onValueChange={v => setSelectedYard(v ?? '')}>
            <SelectTrigger className="h-8 w-44 text-xs border-slate-200 bg-slate-50 focus:ring-blue-500">
              <SelectValue placeholder="Select yard" />
            </SelectTrigger>
            <SelectContent>
              {yards.map(yard => (
                <SelectItem key={yard.id} value={yard.id.toString()} className="text-xs">
                  {yard.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Notifications */}
        <button className="relative w-8 h-8 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center hover:bg-slate-100 transition-colors">
          <Bell className="h-4 w-4 text-slate-500" />
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
            3
          </span>
        </button>
      </div>
    </header>
  )
}
