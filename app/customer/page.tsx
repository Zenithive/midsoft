'use client'

import { JobCreationWizard } from '@/components/jobs/JobCreationWizard'

const CUSTOMER_ID = 1

export default function CustomerPage() {
  return (
    <div className="max-w-5xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold">Book a Job</h1>
      <p className="text-sm text-slate-600">Create deliveries, collections, exchanges, and wait and load jobs from your agreement sites.</p>
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <JobCreationWizard customerId={CUSTOMER_ID} originLabel="Customer Portal" />
      </div>
    </div>
  )
}
