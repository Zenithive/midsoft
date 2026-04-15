'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { 
  LayoutDashboard, 
  Route, 
  Smartphone, 
  Users, 
  Settings, 
  BarChart3, 
  FileText, 
  Car, 
  ShoppingCart,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { useOption } from './OptionContext'
import { Button } from '@/components/ui/button'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'

interface NavItem {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  option3Only: boolean
}

const navItems: NavItem[] = [
  { label: 'Dispatcher', href: '/dispatcher', icon: LayoutDashboard, option3Only: false },
  { label: 'Optimizer', href: '/optimizer', icon: Route, option3Only: false },
  { label: 'Driver', href: '/driver', icon: Smartphone, option3Only: true },
  { label: 'Customer', href: '/customer', icon: ShoppingCart, option3Only: true },
  { label: 'Admin', href: '/admin', icon: Settings, option3Only: false },
  { label: 'Reports', href: '/reports', icon: BarChart3, option3Only: true },
  { label: 'Compliance', href: '/compliance', icon: FileText, option3Only: true },
  { label: 'Telematics', href: '/telematics', icon: Car, option3Only: true },
]

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const { option, setOption } = useOption()
  const pathname = usePathname()

  return (
    <div className={`bg-slate-900 text-white transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-64'} min-h-screen flex flex-col`}>
      {/* Header */}
      <div className="p-4 border-b border-slate-700 flex items-center justify-between">
        {!isCollapsed && (
          <h1 className="text-xl font-bold">Waste Route</h1>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="text-white hover:bg-slate-700"
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      {/* Option Toggle */}
      {!isCollapsed && (
        <div className="p-4 border-b border-slate-700">
          <RadioGroup value={option} onValueChange={(value) => setOption(value as 'option1' | 'option3')}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="option1" id="option1" />
              <Label htmlFor="option1" className="text-sm">Option 1</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="option3" id="option3" />
              <Label htmlFor="option3" className="text-sm">Option 3</Label>
            </div>
          </RadioGroup>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href)
            const isLocked = item.option3Only && option === 'option1'
            const Icon = item.icon

            return (
              <li key={item.href}>
                {isLocked ? (
                  <div 
                    className="flex items-center px-3 py-2 rounded-md text-slate-400 cursor-not-allowed"
                    title="Available in Option 3 – Full Platform"
                  >
                    <Icon className="h-5 w-5 mr-3" />
                    {!isCollapsed && <span>{item.label}</span>}
                  </div>
                ) : (
                  <Link
                    href={item.href}
                    className={`flex items-center px-3 py-2 rounded-md transition-colors ${
                      isActive 
                        ? 'bg-blue-600 text-white' 
                        : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                    }`}
                  >
                    <Icon className="h-5 w-5 mr-3" />
                    {!isCollapsed && <span>{item.label}</span>}
                  </Link>
                )}
              </li>
            )
          })}
        </ul>
      </nav>
    </div>
  )
}