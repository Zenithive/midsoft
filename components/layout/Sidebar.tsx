'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import {
  LayoutDashboard,
  Route,
  CalendarDays,
  MapPin,
  Smartphone,
  ShoppingCart,
  Settings,
  BarChart3,
  FileText,
  Car,
  Tag,
  Shield,
  Upload,
  ChevronLeft,
  ChevronRight,
  Lock,
  Truck,
} from 'lucide-react'
import { useOption } from './OptionContext'

interface NavItem {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  option3Only: boolean
}

const navItems: NavItem[] = [
  { label: 'Dispatcher', href: '/dispatcher', icon: LayoutDashboard, option3Only: false },
  { label: 'Optimizer', href: '/optimizer', icon: Route, option3Only: false },
  { label: 'Scheduler', href: '/scheduler', icon: CalendarDays, option3Only: true },
  { label: 'Skips on Site', href: '/skips-on-site', icon: MapPin, option3Only: true },
  { label: 'Driver', href: '/driver', icon: Smartphone, option3Only: true },
  { label: 'Customer', href: '/customer', icon: ShoppingCart, option3Only: true },
  { label: 'Admin Customers', href: '/admin/customers', icon: Settings, option3Only: true },
  { label: 'Services', href: '/admin/services', icon: Tag, option3Only: true },
  { label: 'EWC Codes', href: '/admin/ewc-codes', icon: FileText, option3Only: true },
  { label: 'Permits', href: '/admin/permits', icon: Shield, option3Only: true },
  { label: 'Customer Import', href: '/admin/customers/import', icon: Upload, option3Only: true },
  { label: 'Batch Invoicing', href: '/admin/invoicing/batch', icon: FileText, option3Only: true },
  { label: 'Reports', href: '/reports', icon: BarChart3, option3Only: true },
  { label: 'Telematics', href: '/telematics', icon: Car, option3Only: true },
]

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const { option, setOption } = useOption()
  const pathname = usePathname()

  return (
    <aside
      className={`relative flex flex-col min-h-screen transition-all duration-300 ease-in-out
        ${isCollapsed ? 'w-[68px]' : 'w-[240px]'}
        bg-[#0f172a] border-r border-white/5`}
    >
      {/* Logo */}
      <div className={`flex items-center gap-3 px-4 py-5 border-b border-white/5 ${isCollapsed ? 'justify-center' : ''}`}>
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center flex-shrink-0 shadow-lg">
          <Truck className="h-4 w-4 text-white" />
        </div>
        {!isCollapsed && (
          <div>
            <div className="text-white font-bold text-sm leading-tight">WasteRoute</div>
            <div className="text-blue-400 text-[10px] font-medium tracking-wider uppercase">Platform</div>
          </div>
        )}
      </div>

      {/* Option Toggle */}
      {!isCollapsed && (
        <div className="mx-3 mt-4 mb-2 rounded-xl bg-white/5 p-1 flex gap-1">
          {(['option1', 'option3'] as const).map((opt) => (
            <button
              key={opt}
              onClick={() => setOption(opt)}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200
                ${option === opt
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-900/40'
                  : 'text-slate-400 hover:text-slate-200'
                }`}
            >
              {opt === 'option1' ? 'Option 1' : 'Option 3'}
            </button>
          ))}
        </div>
      )}

      {/* Nav label */}
      {!isCollapsed && (
        <div className="px-4 pt-3 pb-1">
          <span className="text-[10px] font-semibold tracking-widest text-slate-500 uppercase">Navigation</span>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-2 py-1 space-y-0.5">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href)
          const isLocked = item.option3Only && option === 'option1'
          const Icon = item.icon

          return (
            <div key={item.href} title={isLocked ? 'Available in Option 3 – Full Platform' : item.label}>
              {isLocked ? (
                <div className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-not-allowed
                  ${isCollapsed ? 'justify-center' : ''}
                  opacity-35`}
                >
                  <Icon className="h-4 w-4 text-slate-400 flex-shrink-0" />
                  {!isCollapsed && (
                    <>
                      <span className="text-sm text-slate-400 flex-1">{item.label}</span>
                      <Lock className="h-3 w-3 text-slate-500" />
                    </>
                  )}
                </div>
              ) : (
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150
                    ${isCollapsed ? 'justify-center' : ''}
                    ${isActive
                      ? 'bg-blue-600/20 text-blue-400 border border-blue-500/20'
                      : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                    }`}
                >
                  <Icon className={`h-4 w-4 flex-shrink-0 ${isActive ? 'text-blue-400' : ''}`} />
                  {!isCollapsed && (
                    <span className={`text-sm font-medium ${isActive ? 'text-blue-300' : ''}`}>
                      {item.label}
                    </span>
                  )}
                  {!isCollapsed && isActive && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-400" />
                  )}
                </Link>
              )}
            </div>
          )
        })}
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-[72px] w-6 h-6 rounded-full bg-slate-700 border border-slate-600
          flex items-center justify-center text-slate-300 hover:bg-slate-600 transition-colors shadow-md z-10"
      >
        {isCollapsed
          ? <ChevronRight className="h-3 w-3" />
          : <ChevronLeft className="h-3 w-3" />
        }
      </button>

      {/* Footer */}
      {!isCollapsed && (
        <div className="px-4 py-4 border-t border-white/5">
          <div className="text-[10px] text-slate-600 text-center">
            {option === 'option3' ? '✦ Full Platform' : '◈ Route Optimisation'}
          </div>
        </div>
      )}
    </aside>
  )
}
