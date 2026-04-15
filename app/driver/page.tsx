'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { Home, Briefcase, Map, User, Power } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { JobCard } from '@/components/driver/JobCard'
import { CompletionModal } from '@/components/driver/CompletionModal'
import { Toaster } from '@/components/ui/sonner'
import { toast } from 'sonner'

const DriverMap = dynamic(() => import('@/components/driver/DriverMap'), { ssr: false, loading: () => <div className="flex-1 bg-slate-100 flex items-center justify-center text-slate-400 text-sm">Loading map...</div> })

type Tab = 'home' | 'jobs' | 'map' | 'profile'

// Demo: use driver ID 1
const DRIVER_ID = 1

export default function DriverPage() {
  const [tab, setTab] = useState<Tab>('jobs')
  const [jobs, setJobs] = useState<any[]>([])
  const [driver, setDriver] = useState<any>(null)
  const [gps, setGps] = useState<any>(null)
  const [completingJob, setCompletingJob] = useState<any>(null)

  async function loadData() {
    const [jobsData, driversData, gpsData] = await Promise.all([
      fetch(`/api/jobs?driverId=${DRIVER_ID}`).then(r => r.json()),
      fetch('/api/drivers').then(r => r.json()),
      fetch('/api/gps').then(r => r.json()),
    ])
    setJobs(jobsData)
    setDriver(driversData.find((d: any) => d.id === DRIVER_ID))
    setGps(gpsData.find((g: any) => g.driver_id === DRIVER_ID))
  }

  useEffect(() => { loadData() }, [])

  async function toggleShift() {
    if (!driver) return
    const newStatus = driver.status === 'on_shift' ? 'off_duty' : 'on_shift'
    await fetch(`/api/drivers/${DRIVER_ID}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: newStatus }) })
    toast.success(`Shift ${newStatus === 'on_shift' ? 'started' : 'ended'}`)
    loadData()
  }

  const tabs: { id: Tab; label: string; icon: React.ComponentType<any> }[] = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'jobs', label: 'Jobs', icon: Briefcase },
    { id: 'map', label: 'Map', icon: Map },
    { id: 'profile', label: 'Profile', icon: User },
  ]

  return (
    <div className="flex justify-center bg-slate-100 min-h-full p-4">
      <Toaster />
      <div className="w-full max-w-[390px] bg-white rounded-2xl shadow-xl flex flex-col overflow-hidden" style={{ minHeight: '700px' }}>
        {/* Header */}
        <div className="bg-slate-900 text-white p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold">{driver?.name || 'Driver'}</div>
              <div className="text-xs text-slate-400">{driver?.status?.replace('_', ' ')}</div>
            </div>
            <Button size="sm" variant={driver?.status === 'on_shift' ? 'destructive' : 'default'} onClick={toggleShift}>
              <Power className="h-3 w-3 mr-1" />{driver?.status === 'on_shift' ? 'End Shift' : 'Start Shift'}
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {tab === 'home' && (
            <div className="p-4 space-y-4">
              <h2 className="font-semibold">Today's Summary</h2>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Total', value: jobs.length },
                  { label: 'In Progress', value: jobs.filter(j => j.status === 'in_progress').length },
                  { label: 'Completed', value: jobs.filter(j => j.status === 'completed').length },
                ].map(s => (
                  <div key={s.label} className="bg-slate-50 rounded-lg p-3 text-center">
                    <div className="text-xl font-bold">{s.value}</div>
                    <div className="text-xs text-slate-500">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'jobs' && (
            <div className="p-4 space-y-3">
              <h2 className="font-semibold">My Jobs</h2>
              {jobs.length === 0 ? <p className="text-sm text-slate-400 text-center py-8">No jobs assigned</p> : jobs.map(job => (
                <JobCard key={job.id} job={job} onComplete={setCompletingJob} />
              ))}
            </div>
          )}

          {tab === 'map' && (
            <div className="h-[500px]">
              <DriverMap gps={gps} />
            </div>
          )}

          {tab === 'profile' && (
            <div className="p-4 space-y-3">
              <h2 className="font-semibold">Profile</h2>
              {driver && (
                <div className="space-y-2 text-sm">
                  {[['Name', driver.name], ['Phone', driver.phone], ['Licence', driver.licence_class], ['Shift', `${driver.shift_start} – ${driver.shift_end}`]].map(([k, v]) => (
                    <div key={k} className="flex justify-between py-2 border-b border-slate-100">
                      <span className="text-slate-500">{k}</span><span className="font-medium">{v}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom tab bar */}
        <div className="border-t border-slate-200 grid grid-cols-4">
          {tabs.map(t => {
            const Icon = t.icon
            return (
              <button key={t.id} onClick={() => setTab(t.id)} className={`flex flex-col items-center py-3 text-xs gap-1 transition-colors ${tab === t.id ? 'text-blue-600' : 'text-slate-400'}`}>
                <Icon className="h-5 w-5" />{t.label}
              </button>
            )
          })}
        </div>
      </div>

      {completingJob && (
        <CompletionModal jobId={completingJob.id} open={!!completingJob} onClose={() => setCompletingJob(null)} onCompleted={loadData} />
      )}
    </div>
  )
}
