'use client'
// components/shell/topbar-actions.tsx
// Client component: inbox button + avatar dropdown with sign-out.

import { useState, useRef, useEffect } from 'react'
import { Inbox, LogOut } from 'lucide-react'
import { signOut } from 'next-auth/react'
import { useInboxSummary } from '@/hooks/use-comms'
import { InboxPanel } from '@/components/comms/inbox-panel'
import { cn } from '@/lib/utils'

type Props = {
  initials: string
  name: string
  email: string
  roleLabel: string
}

function InboxButton() {
  const [open, setOpen] = useState(false)
  const { data } = useInboxSummary()
  const totalUnread = data?.totalUnread ?? 0

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'relative rounded-md p-1.5 transition-colors focus-visible:outline-none',
          open
            ? 'bg-ink-100 text-ink-700'
            : 'text-ink-400 hover:bg-ink-50 hover:text-ink-700'
        )}
        aria-label="Inbox"
      >
        <Inbox className="h-4 w-4" strokeWidth={1.5} />
        {totalUnread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-3.5 min-w-3.5 px-0.5 flex items-center justify-center rounded-full bg-danger-500 text-[8px] font-semibold text-white">
            {totalUnread > 99 ? '99+' : totalUnread}
          </span>
        )}
      </button>
      {open && <InboxPanel onClose={() => setOpen(false)} />}
    </div>
  )
}

function AvatarMenu({ initials, name, email, roleLabel }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-semibold select-none flex-shrink-0 transition-colors ring-offset-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500',
          open
            ? 'bg-ink-900 text-white'
            : 'bg-ink-100 text-ink-700 hover:bg-ink-200'
        )}
        aria-label="Account menu"
        aria-expanded={open}
      >
        {initials}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 rounded-md border border-ink-200 bg-white shadow-md z-50">
          {/* User info */}
          <div className="px-4 py-3 border-b border-ink-100">
            <p className="text-sm font-semibold text-ink-900 truncate">{name}</p>
            <p className="text-xs text-ink-400 truncate mt-0.5">{email}</p>
            <span className="mt-1.5 inline-block rounded-sm px-1.5 py-0.5 text-[10px] font-medium bg-ink-100 text-ink-500">
              {roleLabel}
            </span>
          </div>

          {/* Actions */}
          <div className="py-1">
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-ink-600 hover:bg-ink-50 hover:text-ink-900 transition-colors"
            >
              <LogOut className="h-3.5 w-3.5 flex-shrink-0" strokeWidth={1.5} />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export function TopbarActions({ initials, name, email, roleLabel }: Props) {
  return (
    <div className="flex items-center gap-3">
      <InboxButton />
      <div className="h-[1px] w-4 bg-ink-200 rotate-90" />
      <AvatarMenu initials={initials} name={name} email={email} roleLabel={roleLabel} />
    </div>
  )
}
