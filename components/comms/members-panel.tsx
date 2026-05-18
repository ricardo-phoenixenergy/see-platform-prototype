'use client'
// components/comms/members-panel.tsx
// Right sidebar showing channel members. Collapsible.

import { useState } from 'react'
import { Users, ChevronRight } from 'lucide-react'
import { getInitials } from '@/lib/utils'

export type ChannelMember = {
  id: string
  name: string | null
  image: string | null
  role: string // MembershipRole
  companyRole?: string | undefined // 'SP' | 'Client' | etc
}

type Props = {
  members: ChannelMember[]
}

const ROLE_LABEL: Record<string, string> = {
  OWNER: 'Owner',
  MEMBER: 'Member',
  GUEST: 'Guest',
  OBSERVER: 'Observer',
}

export function MembersPanel({ members }: Props) {
  const [collapsed, setCollapsed] = useState(false)

  if (collapsed) {
    return (
      <div className="w-10 flex-shrink-0 border-l border-ink-100 bg-white flex flex-col items-center py-3">
        <button
          onClick={() => setCollapsed(false)}
          className="h-7 w-7 flex items-center justify-center rounded-md text-ink-400 hover:bg-ink-50 hover:text-ink-700 transition-colors"
          title="Show members"
        >
          <Users className="h-4 w-4" strokeWidth={1.5} />
        </button>
        <div className="mt-3 space-y-2">
          {members.slice(0, 5).map((m) => (
            <div
              key={m.id}
              className="h-6 w-6 rounded-full bg-ink-100 flex items-center justify-center text-[9px] font-semibold text-ink-700"
              title={m.name ?? 'Unknown'}
            >
              {getInitials(m.name ?? '')}
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="w-[200px] flex-shrink-0 border-l border-ink-100 bg-white flex flex-col overflow-y-auto">
      <div className="flex items-center justify-between px-3 py-3 border-b border-ink-100">
        <div className="flex items-center gap-1.5">
          <Users className="h-3.5 w-3.5 text-ink-400" strokeWidth={1.5} />
          <span className="text-xs font-semibold text-ink-600">
            Members ({members.length})
          </span>
        </div>
        <button
          onClick={() => setCollapsed(true)}
          className="h-5 w-5 flex items-center justify-center rounded text-ink-300 hover:bg-ink-50 hover:text-ink-700 transition-colors"
          title="Collapse panel"
        >
          <ChevronRight className="h-3.5 w-3.5" strokeWidth={1.5} />
        </button>
      </div>

      <div className="p-2 space-y-0.5">
        {members.map((m) => {
          const initials = getInitials(m.name ?? '')
          const roleLabel = ROLE_LABEL[m.role] ?? m.role
          return (
            <div
              key={m.id}
              className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-ink-50 transition-colors"
            >
              <div
                className="h-6 w-6 rounded-full bg-ink-100 flex items-center justify-center text-[9px] font-semibold text-ink-700 flex-shrink-0"
                title={m.name ?? 'Unknown'}
              >
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-ink-800 truncate">
                  {m.name ?? 'Unknown'}
                </p>
                <p className="text-[10px] text-ink-400">
                  {roleLabel}
                  {m.companyRole && (
                    <span className="ml-1 text-ink-300">· {m.companyRole}</span>
                  )}
                </p>
              </div>
            </div>
          )
        })}
        {members.length === 0 && (
          <p className="px-2 py-2 text-xs text-ink-400">No members found.</p>
        )}
      </div>
    </div>
  )
}
