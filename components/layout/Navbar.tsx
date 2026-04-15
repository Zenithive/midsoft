'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Bell, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export function Navbar() {
  const pathname = usePathname()
  const [currentTime, setCurrentTime] = useState(new Date())
  const [yards, setYards] = useState<any[]>([])
  const [selectedYard, setSelectedYard] = useState<string>('')

  // Live clock
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  // Load yards
  useEffect(() => {
    fetch('/api/yards')
      .then(res => res.json())
      .then(data => {
        setYards(data)
        if (data.length > 0) {
          setSelectedYard(data[0].id.toString())
        }
      })
      .catch(console.error)
  }, [])

  // Generate breadcrumbs from pathname
  const generateBreadcrumbs = () => {
    const segments = pathname.split('/').filter(Boolean)
    const breadcrumbs = [{ label: 'Home', href: '/' }]
    
    let currentPath = ''
    segments.forEach(segment => {
      currentPath += `/${segment}`
      const label = segment.charAt(0).toUpperCase() + segment.slice(1)
      breadcrumbs.push({ label, href: currentPath })
    })
    
    return breadcrumbs
  }

  const breadcrumbs = generateBreadcrumbs()

  return (
    <header className="bg-white border-b border-slate-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Breadcrumbs */}
        <nav className="flex items-center space-x-2 text-sm">
          {breadcrumbs.map((crumb, index) => (
            <div key={crumb.href} className="flex items-center">
              {index > 0 && <ChevronRight className="h-4 w-4 text-slate-400 mx-2" />}
              <span className={index === breadcrumbs.length - 1 ? 'text-slate-900 font-medium' : 'text-slate-500'}>
                {crumb.label}
              </span>
            </div>
          ))}
        </nav>

        {/* Right side */}
        <div className="flex items-center space-x-4">
          {/* Live clock */}
          <div className="text-sm text-slate-600">
            {currentTime.toLocaleTimeString()}
          </div>

          {/* Yard filter */}
          <Select value={selectedYard} onValueChange={(v) => setSelectedYard(v ?? '')}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select yard" />
            </SelectTrigger>
            <SelectContent>
              {yards.map(yard => (
                <SelectItem key={yard.id} value={yard.id.toString()}>
                  {yard.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Notifications */}
          <Button variant="ghost" size="sm" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              3
            </span>
          </Button>
        </div>
      </div>
    </header>
  )
}