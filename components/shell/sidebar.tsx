'use client'
// Client component: sidebar collapse state, active nav detection

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Wordmark } from '@/components/brand/wordmark'
import {
  LayoutDashboard, FolderOpen, ShoppingBag, Wallet,
  Building2, ChevronLeft, ChevronRight, Wrench,
} from 'lucide-react'

export type NavItem = {
  label: string
  href: string
  icon: React.ElementType
}

type TierInfo = {
  tier: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM'
  tokens: number
}

type Props = {
  navItems: NavItem[]
  tierInfo?: TierInfo
}

const TIER_COLOURS: Record<string, string> = {
  BRONZE: '#A56A3E',
  SILVER: '#8B95A0',
  GOLD: '#C9A03E',
  PLATINUM: '#6E7A8A',
}

export function Sidebar({ navItems, tierInfo }: Props) {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()

  return (
    <aside
      className={cn(
        'flex flex-col border-r border-ink-200 bg-white transition-[width] duration-200 ease-in-out flex-shrink-0 overflow-hidden',
        collapsed ? 'w-[60px]' : 'w-[220px]'
      )}
    >
      {/* Header */}
      <div className="flex h-14 items-center justify-between px-4 border-b border-ink-200 flex-shrink-0">
        {!collapsed && <Wordmark size="sm" />}
        <button
          onClick={() => setCollapsed(c => !c)}
          className={cn(
            'rounded-md p-1.5 text-ink-400 hover:bg-ink-50 hover:text-ink-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500/20',
            collapsed && 'mx-auto'
          )}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed
            ? <ChevronRight className="h-4 w-4" />
            : <ChevronLeft className="h-4 w-4" />
          }
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 overflow-y-auto overflow-x-hidden">
        <ul className="space-y-0.5 px-2">
          {navItems.map(item => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            const Icon = item.icon
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  title={collapsed ? item.label : undefined}
                  className={cn(
                    'flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors',
                    collapsed ? 'justify-center' : '',
                    isActive
                      ? 'bg-ink-50 text-ink-900 font-medium'
                      : 'text-ink-500 hover:bg-ink-50 hover:text-ink-800'
                  )}
                >
                  <Icon
                    className={cn(
                      'h-4 w-4 flex-shrink-0',
                      isActive ? 'text-accent-500' : 'text-ink-400'
                    )}
                    strokeWidth={1.5}
                  />
                  {!collapsed && (
                    <span className="truncate">{item.label}</span>
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Status footer */}
      {tierInfo && (
        <div className={cn(
          'border-t border-ink-100 py-3 px-3 flex-shrink-0',
          collapsed ? 'flex flex-col items-center gap-2' : 'space-y-2'
        )}>
          {/* Tier badge */}
          <div
            className={cn(
              'inline-flex items-center gap-1.5 rounded-sm px-2 py-0.5',
              collapsed ? '' : 'w-full'
            )}
            style={{
              backgroundColor: `${TIER_COLOURS[tierInfo.tier] ?? '#8B95A0'}18`,
              border: `1px solid ${TIER_COLOURS[tierInfo.tier] ?? '#8B95A0'}40`,
            }}
          >
            <div
              className="h-1.5 w-1.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: TIER_COLOURS[tierInfo.tier] ?? '#8B95A0' }}
            />
            {!collapsed && (
              <span
                className="text-[10px] font-semibold tracking-widest uppercase"
                style={{ color: TIER_COLOURS[tierInfo.tier] ?? '#8B95A0' }}
              >
                {tierInfo.tier}
              </span>
            )}
          </div>

          {/* Token balance */}
          {!collapsed && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-ink-400">Tokens</span>
              <span className="text-xs font-semibold text-ink-700 tabular-nums">
                {tierInfo.tokens.toLocaleString()}
              </span>
            </div>
          )}
        </div>
      )}
    </aside>
  )
}

// Pre-defined nav items per role
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
