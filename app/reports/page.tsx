'use client'

import { useEffect, useState } from 'react'
import { BarChart, Bar, LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useOption } from '@/components/layout/OptionContext'

export default function ReportsPage() {
  const { option } = useOption()
  const [jobsPerDay, setJobsPerDay] = useState<any[]>([])
  const [distance, setDistance] = useState<any[]>([])
  const [revenue, setRevenue] = useState<any[]>([])
  const [summary, setSummary] = useState<any>(null)

  useEffect(() => {
    Promise.all([
      fetch('/api/reports/jobs-per-day').then(r => r.json()),
      fetch('/api/reports/distance').then(r => r.json()),
      fetch('/api/reports/revenue').then(r => r.json()),
      fetch('/api/reports/summary').then(r => r.json()),
    ]).then(([j, d, r, s]) => { setJobsPerDay(j); setDistance(d); setRevenue(r); setSummary(s) })
  }, [])

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-2xl font-bold">Reports</h1>

      {summary && (
        <div className="grid grid-cols-5 gap-4">
          {[
            { label: 'Total Jobs', value: summary.totalJobs },
            { label: 'Completed', value: summary.completedJobs },
            { label: 'Revenue', value: `£${(summary.totalRevenue || 0).toFixed(0)}` },
            { label: 'Distance', value: `${(summary.totalDistanceKm || 0).toFixed(0)} km` },
            { label: 'Active Drivers', value: summary.activeDrivers },
          ].map(s => (
            <div key={s.label} className="bg-white border border-slate-200 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-slate-800">{s.value}</div>
              <div className="text-xs text-slate-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Jobs per day — available in both options */}
      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <h2 className="font-semibold mb-4">Jobs Completed Per Day</h2>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={jobsPerDay}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" fill="#3b82f6" radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Distance per route — available in both options */}
      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <h2 className="font-semibold mb-4">Total Distance Per Route</h2>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={distance}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="totalDistanceKm" stroke="#10b981" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Revenue — Option 3 only */}
      {option === 'option3' && (
        <div className="bg-white border border-slate-200 rounded-lg p-6">
          <h2 className="font-semibold mb-4">Revenue Per Period</h2>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={revenue}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" tick={{ fontSize: 11 }} />
              <YAxis />
              <Tooltip formatter={(v: any) => `£${v}`} />
              <Area type="monotone" dataKey="revenue" stroke="#8b5cf6" fill="#ede9fe" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
