'use client'
// components/shell/topbar-actions.tsx
// Client component: Bell + InboxButton with unread badge + avatar.
// Separated from Topbar (server component) to allow useInboxSummary hook.

import { useState } from 'react'
import { Bell } from 'lucide-react'
import { useInboxSummary } from '@/hooks/use-comms'
import { InboxPanel } from '@/components/comms/inbox-panel'
import { cn } from '@/lib/utils'

type Props = {
  initials: string
  name: string
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
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
          />
        </svg>
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

export function TopbarActions({ initials, name }: Props) {
  return (
    <div className="flex items-center gap-3">
      <button
        className="rounded-md p-1.5 text-ink-400 hover:bg-ink-50 hover:text-ink-700 transition-colors focus-visible:outline-none"
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4" strokeWidth={1.5} />
      </button>
      <InboxButton />
      <div className="h-[1px] w-4 bg-ink-200 rotate-90" />
      <div
        className="h-7 w-7 rounded-full bg-ink-100 flex items-center justify-center text-[10px] font-semibold text-ink-700 select-none flex-shrink-0"
        title={name}
      >
        {initials}
      </div>
    </div>
  )
}
