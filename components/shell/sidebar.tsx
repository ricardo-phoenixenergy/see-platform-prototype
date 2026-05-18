'use client'
// Client component: manages sidebar collapse state

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Wordmark } from '@/components/brand/wordmark'
import {
  LayoutDashboard, FolderOpen, ShoppingBag, Wallet, Building2,
  ChevronLeft, ChevronRight, Wrench,
} from 'lucide-react'

type NavItem = {
  label: string
  href: string
  icon: React.ElementType
}

type Props = {
  navItems: NavItem[]
}

export function Sidebar({ navItems }: Props) {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()

  return (
    <aside
      className={cn(
        'flex flex-col border-r border-ink-200 bg-white transition-all duration-200 flex-shrink-0',
        collapsed ? 'w-16' : 'w-60'
      )}
    >
      {/* Header */}
      <div className="flex h-14 items-center justify-between px-4 border-b border-ink-200">
        {!collapsed && <Wordmark size="sm" />}
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="ml-auto rounded-md p-1.5 text-ink-500 hover:bg-ink-50 hover:text-ink-900 transition-colors focus-visible:outline-none focus-visible:shadow-ring"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 overflow-y-auto">
        <ul className="space-y-0.5 px-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            const Icon = item.icon
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                    collapsed ? 'justify-center px-2' : '',
                    isActive
                      ? 'bg-ink-50 text-ink-900 font-medium'
                      : 'text-ink-600 hover:bg-ink-50 hover:text-ink-900'
                  )}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon
                    className={cn('h-4 w-4 flex-shrink-0', isActive ? 'text-accent-500' : 'text-ink-400')}
                    strokeWidth={1.5}
                  />
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </aside>
  )
}

// Pre-defined nav items for each role
export const CONTRACTOR_NAV: NavItem[] = [
  { label: 'Dashboard', href: '/contractor', icon: LayoutDashboard },
  { label: 'Projects', href: '/contractor/projects', icon: FolderOpen },
  { label: 'Marketplace', href: '/contractor/marketplace', icon: ShoppingBag },
  { label: 'Service Centre', href: '/contractor/service-center', icon: Wrench },
  { label: 'Wallet', href: '/contractor/wallet', icon: Wallet },
  { label: 'Company', href: '/contractor/company', icon: Building2 },
]

export const SERVICE_PROVIDER_NAV: NavItem[] = [
  { label: 'Opportunities', href: '/service-provider', icon: LayoutDashboard },
  { label: 'My Jobs', href: '/service-provider/jobs', icon: FolderOpen },
  { label: 'Company', href: '/service-provider/company', icon: Building2 },
]

export const CLIENT_NAV: NavItem[] = [
  { label: 'Portfolio', href: '/client', icon: LayoutDashboard },
  { label: 'My Sites', href: '/client/sites', icon: Building2 },
]

export const ADMIN_NAV: NavItem[] = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { label: 'KYC Queue', href: '/admin/kyc', icon: FolderOpen },
  { label: 'Milestones', href: '/admin/milestones', icon: Wrench },
  { label: 'Users', href: '/admin/users', icon: Building2 },
  { label: 'Templates', href: '/admin/templates', icon: ShoppingBag },
]
