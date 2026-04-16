'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'

export default function JobDetailPage() {
  const params = useParams<{ id: string }>()
  const search = useSearchParams()
  const isPrint = search.get('print') === 'true'
  const jobId = Number(params.id)

  const [job, setJob] = useState<any>(null)

  useEffect(() => {
    fetch(`/api/jobs/${jobId}`).then((r) => r.json()).then(setJob)
  }, [jobId])

  const paymentLabel = useMemo(() => {
    if (!job) return '-'
    if (job.payment_method === 'account') return 'Account (Invoice to follow)'
    return `${job.payment_method}${job.is_paid ? ' (Paid)' : ' (Unpaid)'}`
  }, [job])

  if (!job) return <div className="p-6">Loading job...</div>

  return (
    <div className="p-6 space-y-4">
      <div className={`${isPrint ? 'hidden print:block' : 'print:hidden'} flex items-center justify-between`}>
        <h1 className="text-2xl font-bold">Job #{job.id}</h1>
        <div className="flex gap-2">
          <Button onClick={() => window.location.href = `/jobs/${job.id}?print=true`}>Print Job Ticket</Button>
          <Link href="/dispatcher"><Button variant="outline">Back to Dispatcher</Button></Link>
        </div>
      </div>

      <div className={`${isPrint ? 'print:block' : ''} rounded border border-slate-400 p-4 text-sm bg-white`}>
        <div className="flex items-center justify-between border-b border-slate-400 pb-2 mb-2">
          <div>
            <div className="font-bold">WasteRoute</div>
            <div>Job Ref: JOB-{String(job.id).padStart(5, '0')} • Date: {job.scheduled_date}</div>
          </div>
          <div className="text-right">[LOGO]</div>
        </div>

        <div className="border-b border-slate-300 pb-2 mb-2">
          <div>Customer: {job.customer_name} • Account: {job.account_number || '-'}</div>
          <div>Site: {job.address}</div>
          <div>PO Number: {job.po_number || '-'} • Requested By: {job.requested_by || '-'}</div>
        </div>

        <div className="border-b border-slate-300 pb-2 mb-2">
          <div>Service: {job.service_name || '-'} • Job Type: {job.type}</div>
          <div>EWC Code: {job.ewc_code || '-'}</div>
          <div>Vehicle: {job.vehicle_id || '-'} • Driver: {job.driver_id || '-'}</div>
          <div>Time Slot: {job.time_slot || 'Anytime'}</div>
        </div>

        <div className="border-b border-slate-300 pb-2 mb-2">
          <div className="font-semibold">Instructions / Notes</div>
          <div>{job.notes || '-'}</div>
        </div>

        <div className="border-b border-slate-300 pb-2 mb-2">
          <div>Price: £{Number(job.price_gbp || 0).toFixed(2)} • VAT: £{Number(job.vat_gbp || 0).toFixed(2)} • Total: £{Number(job.total_gbp || 0).toFixed(2)}</div>
          <div>Payment: {paymentLabel}</div>
        </div>

        <div>
          <div>Signature: ____________________</div>
          <div>Print Name: ___________________</div>
        </div>

        <div className="mt-4 rounded border border-slate-200 p-3">
          <h2 className="font-semibold mb-2">Pricing & Payment</h2>
          <div>Price ex VAT: £{Number(job.price_gbp || 0).toFixed(2)}</div>
          <div>VAT: £{Number(job.vat_gbp || 0).toFixed(2)} ({Number(job.vat_rate || 20).toFixed(2)}%)</div>
          <div>Total: £{Number(job.total_gbp || 0).toFixed(2)}</div>
          <div>Payment method: {job.payment_method}</div>
          <div>Paid: {job.is_paid ? 'Yes' : 'No'}</div>
          <div>Paid date: {job.paid_date || '-'}</div>
          <div>PO number: {job.po_number || '-'}</div>
          <div>Requested by: {job.requested_by || '-'}</div>
          <div>Weight (kg): {job.weight_kg || '-'}</div>
          {job.customer_type === 'cash' && !job.is_paid && (
            <Button className="mt-2" onClick={async () => {
              await fetch(`/api/jobs/${job.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ is_paid: 1, paid_date: new Date().toISOString().split('T')[0] }),
              })
              setJob((prev: any) => ({ ...prev, is_paid: 1, paid_date: new Date().toISOString().split('T')[0] }))
            }}>Mark as Paid</Button>
          )}
        </div>
      </div>

      {isPrint && <script dangerouslySetInnerHTML={{ __html: 'window.print()' }} />}
    </div>
  )
}
