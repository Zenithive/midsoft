'use client'

import { useRef, useState } from 'react'
import SignatureCanvas from 'react-signature-canvas'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'

interface Props {
  jobId: number
  open: boolean
  onClose: () => void
  onCompleted: () => void
}

export function CompletionModal({ jobId, open, onClose, onCompleted }: Props) {
  const sigRef = useRef<SignatureCanvas>(null)
  const [wasteType, setWasteType] = useState('mixed')
  const [weightKg, setWeightKg] = useState('')
  const [disposalSite, setDisposalSite] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit() {
    const signature = sigRef.current?.toDataURL() || ''
    if (!signature || sigRef.current?.isEmpty()) {
      toast.error('Please provide a signature')
      return
    }
    setSubmitting(true)
    try {
      const body: any = { signature }
      if (wasteType && weightKg && disposalSite) {
        body.wasteType = wasteType
        body.weightKg = Number(weightKg)
        body.disposalSite = disposalSite
      }
      const res = await fetch(`/api/jobs/${jobId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error || 'Failed to complete job'); return }
      toast.success('Job completed!')
      onCompleted()
      onClose()
    } catch { toast.error('Network error') }
    finally { setSubmitting(false) }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>Complete Job</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="mb-2 block">Signature</Label>
            <div className="border-2 border-dashed border-slate-300 rounded-lg overflow-hidden">
              <SignatureCanvas ref={sigRef} canvasProps={{ width: 320, height: 120, className: 'w-full' }} />
            </div>
            <button className="text-xs text-slate-500 mt-1 underline" onClick={() => sigRef.current?.clear()}>Clear</button>
          </div>

          <div>
            <Label className="mb-1 block">Photo (optional)</Label>
            <Input type="file" accept="image/*" capture="environment" className="text-xs" />
          </div>

          <div className="space-y-1">
            <Label>Waste Type</Label>
            <Select value={wasteType} onValueChange={v => setWasteType(v ?? 'mixed')}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {['mixed','inert','wood','concrete','hazardous'].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label>Weight (kg)</Label>
            <Input type="number" value={weightKg} onChange={e => setWeightKg(e.target.value)} placeholder="e.g. 1200" />
          </div>

          <div className="space-y-1">
            <Label>Disposal Site</Label>
            <Input value={disposalSite} onChange={e => setDisposalSite(e.target.value)} placeholder="Site name" />
          </div>

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button className="flex-1 bg-green-600 hover:bg-green-700" onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
