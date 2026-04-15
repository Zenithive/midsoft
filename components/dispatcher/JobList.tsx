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
import { GripVertical, MapPin, Package } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

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

const STATUS_BADGE: Record<string, string> = {
  pending: 'bg-gray-100 text-gray-700',
  assigned: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-orange-100 text-orange-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
}

function SortableJobCard({ job }: { job: Job }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: job.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white border border-slate-200 rounded-lg p-3 flex items-start gap-3 shadow-sm"
    >
      <button
        {...attributes}
        {...listeners}
        className="mt-1 text-slate-400 hover:text-slate-600 cursor-grab active:cursor-grabbing"
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="font-medium text-sm truncate">{job.customer_name}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_BADGE[job.status] || 'bg-gray-100 text-gray-700'}`}>
            {job.status.replace('_', ' ')}
          </span>
        </div>
        <div className="flex items-center gap-1 mt-1 text-xs text-slate-500">
          <MapPin className="h-3 w-3 flex-shrink-0" />
          <span className="truncate">{job.address}</span>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs bg-slate-100 px-2 py-0.5 rounded">{job.type}</span>
          <span className="text-xs bg-slate-100 px-2 py-0.5 rounded flex items-center gap-1">
            <Package className="h-3 w-3" />{job.skip_size}yd
          </span>
          {job.scheduled_time && (
            <span className="text-xs text-slate-400">{job.scheduled_time}</span>
          )}
        </div>
      </div>
    </div>
  )
}

export function JobList({ jobs, onReorder }: Props) {
  const [activeTab, setActiveTab] = useState('all')

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  // Stats
  const stats = useMemo(() => ({
    total: jobs.length,
    pending: jobs.filter(j => j.status === 'pending').length,
    inProgress: jobs.filter(j => j.status === 'in_progress').length,
    completed: jobs.filter(j => j.status === 'completed').length,
    unassigned: jobs.filter(j => !j.driver_id && j.status === 'pending').length,
  }), [jobs])

  // Filtered jobs per tab
  const filteredJobs = useMemo(() => {
    switch (activeTab) {
      case 'pending': return jobs.filter(j => j.status === 'pending')
      case 'in_progress': return jobs.filter(j => j.status === 'in_progress')
      case 'completed': return jobs.filter(j => j.status === 'completed')
      default: return jobs
    }
  }, [jobs, activeTab])

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = filteredJobs.findIndex(j => j.id === active.id)
    const newIndex = filteredJobs.findIndex(j => j.id === over.id)
    const reordered = arrayMove(filteredJobs, oldIndex, newIndex)

    // Assign contiguous sequence_order starting from 1
    const withOrder = reordered.map((job, idx) => ({ ...job, sequence_order: idx + 1 }))
    onReorder(withOrder)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Stats strip */}
      <div className="grid grid-cols-5 gap-2 p-4 bg-white border-b border-slate-200">
        {[
          { label: 'Total', value: stats.total, color: 'text-slate-700' },
          { label: 'Pending', value: stats.pending, color: 'text-gray-600' },
          { label: 'In Progress', value: stats.inProgress, color: 'text-orange-600' },
          { label: 'Completed', value: stats.completed, color: 'text-green-600' },
          { label: 'Unassigned', value: stats.unassigned, color: 'text-red-600' },
        ].map(stat => (
          <div key={stat.label} className="text-center">
            <div className={`text-xl font-bold ${stat.color}`}>{stat.value}</div>
            <div className="text-xs text-slate-500">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs + job list */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
        <TabsList className="mx-4 mt-3 grid grid-cols-4">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="in_progress">In Progress</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="flex-1 overflow-y-auto p-4 space-y-2 mt-0">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={filteredJobs.map(j => j.id)} strategy={verticalListSortingStrategy}>
              {filteredJobs.length === 0 ? (
                <div className="text-center text-slate-400 py-8 text-sm">No jobs in this category</div>
              ) : (
                filteredJobs.map(job => <SortableJobCard key={job.id} job={job} />)
              )}
            </SortableContext>
          </DndContext>
        </TabsContent>
      </Tabs>
    </div>
  )
}
