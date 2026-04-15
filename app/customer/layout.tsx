import { ReactNode } from 'react'

export default function CustomerLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-full bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">W</div>
          <span className="font-semibold text-slate-800">WasteRoute</span>
        </div>
        <a href="/customer/orders" className="text-sm text-green-600 hover:underline font-medium">My Account</a>
      </header>
      <main>{children}</main>
    </div>
  )
}
