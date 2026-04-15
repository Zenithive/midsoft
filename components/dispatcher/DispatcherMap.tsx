'use client'

import dynamic from 'next/dynamic'

const DispatcherMapInner = dynamic(() => import('./DispatcherMapInner'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center bg-slate-100 rounded-lg">
      <div className="text-slate-500 text-sm">Loading map...</div>
    </div>
  ),
})

export default DispatcherMapInner
