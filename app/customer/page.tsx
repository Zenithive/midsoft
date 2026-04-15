'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { Toaster } from '@/components/ui/sonner'
import { CheckCircle } from 'lucide-react'

const SKIP_SIZES = [2, 4, 6, 8, 10, 12, 14, 16]
const TIME_SLOTS = ['08:00-10:00', '10:00-12:00', '12:00-14:00', '14:00-16:00', '16:00-18:00']
const JOB_TYPES = ['delivery', 'collection', 'exchange', 'wait_and_load']

export default function CustomerPage() {
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({ jobType: '', skipSize: 0, address: '', date: '', timeSlot: '', notes: '' })
  const [submitted, setSubmitted] = useState(false)

  async function handleSubmit() {
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId: 1, yardId: 1, bookingDate: form.date, jobType: form.jobType, skipSize: form.skipSize, preferredTimeSlot: form.timeSlot, notes: form.notes }),
      })
      if (res.ok) { setSubmitted(true) }
      else { const d = await res.json(); toast.error(d.error || 'Booking failed') }
    } catch { toast.error('Network error') }
  }

  if (submitted) return (
    <div className="max-w-lg mx-auto p-8 text-center space-y-4">
      <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
      <h2 className="text-2xl font-bold">Booking Confirmed!</h2>
      <p className="text-slate-600">We'll be in touch to confirm your {form.jobType} of a {form.skipSize}yd skip on {form.date}.</p>
      <Button onClick={() => { setSubmitted(false); setStep(1); setForm({ jobType: '', skipSize: 0, address: '', date: '', timeSlot: '', notes: '' }) }}>Book Another</Button>
    </div>
  )

  return (
    <div className="max-w-lg mx-auto p-8">
      <Toaster />
      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8">
        {[1,2,3,4].map(s => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= s ? 'bg-green-600 text-white' : 'bg-slate-200 text-slate-500'}`}>{s}</div>
            {s < 4 && <div className={`h-0.5 w-8 ${step > s ? 'bg-green-600' : 'bg-slate-200'}`} />}
          </div>
        ))}
      </div>

      {step === 1 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Select Job Type</h2>
          <div className="grid grid-cols-2 gap-3">
            {JOB_TYPES.map(t => (
              <button key={t} onClick={() => setForm(f => ({...f, jobType: t}))} className={`p-4 rounded-xl border-2 text-sm font-medium capitalize transition-colors ${form.jobType === t ? 'border-green-600 bg-green-50 text-green-700' : 'border-slate-200 hover:border-slate-300'}`}>
                {t.replace('_', ' ')}
              </button>
            ))}
          </div>
          <Button className="w-full bg-green-600 hover:bg-green-700" disabled={!form.jobType} onClick={() => setStep(2)}>Next</Button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Select Skip Size</h2>
          <div className="grid grid-cols-4 gap-3">
            {SKIP_SIZES.map(s => (
              <button key={s} onClick={() => setForm(f => ({...f, skipSize: s}))} className={`p-3 rounded-xl border-2 text-sm font-bold transition-colors ${form.skipSize === s ? 'border-green-600 bg-green-50 text-green-700' : 'border-slate-200 hover:border-slate-300'}`}>
                {s}yd
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>Back</Button>
            <Button className="flex-1 bg-green-600 hover:bg-green-700" disabled={!form.skipSize} onClick={() => setStep(3)}>Next</Button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Address & Date</h2>
          <div className="space-y-1"><Label>Delivery Address</Label><Input value={form.address} onChange={e => setForm(f => ({...f, address: e.target.value}))} placeholder="Enter full address" /></div>
          <div className="space-y-1"><Label>Preferred Date</Label><Input type="date" value={form.date} onChange={e => setForm(f => ({...f, date: e.target.value}))} /></div>
          <div className="space-y-1">
            <Label>Time Slot</Label>
            <Select value={form.timeSlot} onValueChange={v => setForm(f => ({...f, timeSlot: v ?? ''}))}>
              <SelectTrigger><SelectValue placeholder="Select time slot" /></SelectTrigger>
              <SelectContent>{TIME_SLOTS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1"><Label>Notes (optional)</Label><Input value={form.notes} onChange={e => setForm(f => ({...f, notes: e.target.value}))} placeholder="Any special instructions" /></div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setStep(2)}>Back</Button>
            <Button className="flex-1 bg-green-600 hover:bg-green-700" disabled={!form.address || !form.date || !form.timeSlot} onClick={() => setStep(4)}>Next</Button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Confirm Booking</h2>
          <div className="bg-slate-50 rounded-xl p-4 space-y-2 text-sm">
            {[['Job Type', form.jobType.replace('_',' ')], ['Skip Size', `${form.skipSize}yd`], ['Address', form.address], ['Date', form.date], ['Time Slot', form.timeSlot]].map(([k,v]) => (
              <div key={k} className="flex justify-between"><span className="text-slate-500">{k}</span><span className="font-medium">{v}</span></div>
            ))}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setStep(3)}>Back</Button>
            <Button className="flex-1 bg-green-600 hover:bg-green-700" onClick={handleSubmit}>Confirm Booking</Button>
          </div>
        </div>
      )}
    </div>
  )
}
