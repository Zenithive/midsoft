'use client'

import { useState, useMemo } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, MapPin, Package, Clock, AlertCircle, CheckCircle2, Loader2, Circle } from 'lucide-react'

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

interface Props {
  jobs: Job[]
  onReorder: (reorderedJobs: Job[]) => void
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ComponentType<any> }> = {
  pending:     { label: 'Pending',     color: 'text-slate-500',  bg: 'bg-slate-100',   icon: Circle },
  assigned:    { label: 'Assigned',    color: 'text-blue-600',   bg: 'bg-blue-50',     icon: AlertCircle },
  in_progress: { label: 'In Progress', color: 'text-amber-600',  bg: 'bg-amber-50',    icon: Loader2 },
  completed:   { label: 'Completed',   color: 'text-emerald-600',bg: 'bg-emerald-50',  icon: CheckCircle2 },
  cancelled:   { label: 'Cancelled',   color: 'text-red-500',    bg: 'bg-red-50',      icon: AlertCircle },
}

const TYPE_COLORS: Record<string, string> = {
  delivery:     'bg-blue-100 text-blue-700',
  collection:   'bg-purple-100 text-purple-700',
  exchange:     'bg-orange-100 text-orange-700',
  wait_and_load:'bg-teal-100 text-teal-700',
}

function SortableJobCard({ job }: { job: Job }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: job.id })
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }
  const cfg = STATUS_CONFIG[job.status] || STATUS_CONFIG.pending
  const StatusIcon = cfg.icon

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group bg-white rounded-xl border transition-all duration-150
        ${isDragging ? 'shadow-xl border-blue-300 scale-[1.02]' : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'}`}
    >
      <div className="flex items-start gap-2 p-3">
        {/* Drag handle */}
        <button
          {...attributes}
          {...listeners}
          className="mt-0.5 p-1 rounded text-slate-300 hover:text-slate-500 hover:bg-slate-100 cursor-grab active:cursor-grabbing transition-colors flex-shrink-0"
        >
          <GripVertical className="h-3.5 w-3.5" />
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <span className="font-semibold text-sm text-slate-800 truncate">{job.customer_name}</span>
            <span className={`flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${cfg.bg} ${cfg.color}`}>
              <StatusIcon className="h-2.5 w-2.5" />
              {cfg.label}
            </span>
          </div>

          <div className="flex items-center gap-1 text-xs text-slate-400 mb-2">
            <MapPin className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">{job.address}</span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`text-[11px] font-medium px-2 py-0.5 rounded-md capitalize ${TYPE_COLORS[job.type] || 'bg-slate-100 text-slate-600'}`}>
              {job.type.replace('_', ' ')}
            </span>
            <span className="flex items-center gap-1 text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
              <Package className="h-2.5 w-2.5" />{job.skip_size}yd
            </span>
            {job.scheduled_time && (
              <span className="flex items-center gap-1 text-[11px] text-slate-400">
                <Clock className="h-2.5 w-2.5" />{job.scheduled_time}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

const TABS = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'completed', label: 'Completed' },
]

export function JobList({ jobs, onReorder }: Props) {
  const [activeTab, setActiveTab] = useState('all')

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const stats = useMemo(() => ({
    total:      jobs.length,
    pending:    jobs.filter(j => j.status === 'pending').length,
    inProgress: jobs.filter(j => j.status === 'in_progress').length,
    completed:  jobs.filter(j => j.status === 'completed').length,
    unassigned: jobs.filter(j => !j.driver_id && j.status === 'pending').length,
  }), [jobs])

  const filteredJobs = useMemo(() => {
    switch (activeTab) {
      case 'pending':     return jobs.filter(j => j.status === 'pending')
      case 'in_progress': return jobs.filter(j => j.status === 'in_progress')
      case 'completed':   return jobs.filter(j => j.status === 'completed')
      default:            return jobs
    }
  }, [jobs, activeTab])

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = filteredJobs.findIndex(j => j.id === active.id)
    const newIndex = filteredJobs.findIndex(j => j.id === over.id)
    const reordered = arrayMove(filteredJobs, oldIndex, newIndex)
    onReorder(reordered.map((job, idx) => ({ ...job, sequence_order: idx + 1 })))
  }

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Stats strip */}
      <div className="px-4 pt-4 pb-3 bg-white border-b border-slate-100">
        <div className="grid grid-cols-5 gap-2">
          {[
            { label: 'Total',       value: stats.total,      color: 'text-slate-700',   bg: 'bg-slate-100' },
            { label: 'Pending',     value: stats.pending,    color: 'text-slate-600',   bg: 'bg-slate-50' },
            { label: 'In Progress', value: stats.inProgress, color: 'text-amber-600',   bg: 'bg-amber-50' },
            { label: 'Completed',   value: stats.completed,  color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { label: 'Unassigned',  value: stats.unassigned, color: 'text-red-500',     bg: 'bg-red-50' },
          ].map(s => (
            <div key={s.label} className={`${s.bg} rounded-xl p-2.5 text-center`}>
              <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-[10px] text-slate-500 font-medium mt-0.5 leading-tight">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 px-4 pt-3 pb-2 bg-white border-b border-slate-100">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all
              ${activeTab === tab.key
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Job list */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={filteredJobs.map(j => j.id)} strategy={verticalListSortingStrategy}>
            {filteredJobs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                <Circle className="h-10 w-10 mb-3 opacity-20" />
                <p className="text-sm">No jobs in this category</p>
              </div>
            ) : (
              filteredJobs.map(job => <SortableJobCard key={job.id} job={job} />)
            )}
          </SortableContext>
        </DndContext>
      </div>
    </div>
  )
}
