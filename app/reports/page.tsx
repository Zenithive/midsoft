'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { useOption } from '@/components/layout/OptionContext'
import { TrendingUp, Truck, CheckCircle2, MapPin, Users } from 'lucide-react'

// Load Recharts dynamically to avoid SSR issues
const BarChart = dynamic(() => import('recharts').then(m => m.BarChart), { ssr: false })
const Bar = dynamic(() => import('recharts').then(m => m.Bar), { ssr: false })
const LineChart = dynamic(() => import('recharts').then(m => m.LineChart), { ssr: false })
const Line = dynamic(() => import('recharts').then(m => m.Line), { ssr: false })
const AreaChart = dynamic(() => import('recharts').then(m => m.AreaChart), { ssr: false })
const Area = dynamic(() => import('recharts').then(m => m.Area), { ssr: false })
const XAxis = dynamic(() => import('recharts').then(m => m.XAxis), { ssr: false })
const YAxis = dynamic(() => import('recharts').then(m => m.YAxis), { ssr: false })
const CartesianGrid = dynamic(() => import('recharts').then(m => m.CartesianGrid), { ssr: false })
const Tooltip = dynamic(() => import('recharts').then(m => m.Tooltip), { ssr: false })
const ResponsiveContainer = dynamic(() => import('recharts').then(m => m.ResponsiveContainer), { ssr: false })

function StatCard({ label, value, icon: Icon, color }: {
  label: string; value: string | number; icon: React.ComponentType<any>; color: string
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 flex items-center gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <div className="text-2xl font-bold text-slate-800">{value}</div>
        <div className="text-xs text-slate-500 mt-0.5">{label}</div>
      </div>
    </div>
  )
}

function ChartCard({ title, subtitle, children, loading }: {
  title: string; subtitle?: string; children: React.ReactNode; loading: boolean
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <div className="mb-5">
        <h2 className="font-semibold text-slate-800">{title}</h2>
        {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
      </div>
      {loading ? (
        <div className="h-[260px] flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-4 border-slate-200 border-t-blue-500 animate-spin" />
        </div>
      ) : (
        <div style={{ width: '100%', height: 260 }}>
          {children}
        </div>
      )}
    </div>
  )
}

const fmtDate = (d: any) => {
  try { return new Date(String(d)).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) }
  catch { return String(d) }
}

export default function ReportsPage() {
  const { option } = useOption()
  const [jobsPerDay, setJobsPerDay] = useState<any[]>([])
  const [distance, setDistance] = useState<any[]>([])
  const [revenue, setRevenue] = useState<any[]>([])
  const [summary, setSummary] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/reports/jobs-per-day').then(r => r.json()),
      fetch('/api/reports/distance').then(r => r.json()),
      fetch('/api/reports/revenue').then(r => r.json()),
      fetch('/api/reports/summary').then(r => r.json()),
    ]).then(([j, d, r, s]) => {
      setJobsPerDay(j)
      setDistance(d)
      setRevenue(r)
      setSummary(s)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  return (
    <div className="p-6 space-y-6 max-w-7xl">
      <div>
        <h1 className="text-xl font-bold text-slate-800">Reports & Analytics</h1>
        <p className="text-sm text-slate-400 mt-0.5">Last 30 days operational overview</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard label="Total Jobs"     value={summary?.totalJobs ?? '—'}                                    icon={Truck}        color="bg-blue-50 text-blue-600" />
        <StatCard label="Completed"      value={summary?.completedJobs ?? '—'}                                icon={CheckCircle2} color="bg-emerald-50 text-emerald-600" />
        <StatCard label="Revenue (paid)" value={summary ? `£${(summary.totalRevenue||0).toFixed(0)}` : '—'}   icon={TrendingUp}   color="bg-violet-50 text-violet-600" />
        <StatCard label="Distance"       value={summary ? `${(summary.totalDistanceKm||0).toFixed(0)} km` : '—'} icon={MapPin}    color="bg-orange-50 text-orange-600" />
        <StatCard label="Active Drivers" value={summary?.activeDrivers ?? '—'}                                icon={Users}        color="bg-sky-50 text-sky-600" />
      </div>

      {/* Jobs per day */}
      <ChartCard title="Jobs Completed Per Day" subtitle="Daily job completion over the last 30 days" loading={loading}>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={jobsPerDay} barSize={14} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#2563eb" />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="date" tickFormatter={fmtDate} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} interval={4} />
            <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 12 }}
              labelFormatter={fmtDate}
              formatter={(v: any) => [`${v} jobs`, 'Count']}
            />
            <Bar dataKey="count" fill="url(#blueGrad)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Distance */}
      <ChartCard title="Total Distance Per Day" subtitle="Combined route distance driven daily (km)" loading={loading}>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={distance} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="date" tickFormatter={fmtDate} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} interval={4} />
            <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 12 }}
              labelFormatter={fmtDate}
              formatter={(v: any) => [`${v} km`, 'Distance']}
            />
            <Line type="monotone" dataKey="totalDistanceKm" stroke="#10b981" strokeWidth={2.5} dot={false} activeDot={{ r: 4, fill: '#10b981' }} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Revenue — Option 3 only */}
      {option === 'option3' && (
        <ChartCard title="Monthly Revenue" subtitle="Paid invoice revenue by month (£)" loading={loading}>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={revenue} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="purpleGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="period" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => `£${v}`} />
              <Tooltip
                contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 12 }}
                formatter={(v: any) => [`£${v}`, 'Revenue']}
              />
              <Area type="monotone" dataKey="revenue" stroke="#8b5cf6" strokeWidth={2.5} fill="url(#purpleGrad)" dot={false} activeDot={{ r: 4, fill: '#8b5cf6' }} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      )}
    </div>
  )
}
