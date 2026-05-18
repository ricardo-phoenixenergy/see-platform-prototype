'use client'
// Thin client wrapper for tab navigation — needs usePathname() for active state.
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

type Tab = { label: string; href: string; locked?: boolean }
type Props = { tabs: Tab[] }

export function TabNav({ tabs }: Props) {
  const pathname = usePathname()
  return (
    <nav className="flex gap-1">
      {tabs.map(tab => {
        const isActive = pathname === tab.href || pathname.startsWith(tab.href + '/')
        return (
          <Link
            key={tab.href}
            href={tab.locked ? '#' : tab.href}
            aria-disabled={tab.locked}
            className={cn(
              'px-4 py-2.5 text-sm font-medium border-b-2 transition-colors',
              tab.locked
                ? 'text-ink-300 border-transparent cursor-not-allowed'
                : isActive
                ? 'text-ink-900 border-ink-900'
                : 'text-ink-500 border-transparent hover:text-ink-900 hover:border-ink-200'
            )}
          >
            {tab.label}
            {tab.locked && <span className="ml-1.5 text-[10px] text-ink-300">Locked</span>}
          </Link>
        )
      })}
    </nav>
  )
}
