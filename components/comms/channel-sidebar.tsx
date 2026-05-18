'use client'
// components/comms/channel-sidebar.tsx
// Left sidebar showing channels grouped by kind.

import { useWorkspaceChannels, type ChannelSummary } from '@/hooks/use-comms'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Hash, GitBranch } from 'lucide-react'

type Props = {
  projectId: string
  activeChannelId: string
}

function UnreadBadge({ count }: { count: number }) {
  if (count <= 0) return null
  if (count > 9) {
    return (
      <span className="ml-auto flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-danger-500 text-[10px] font-semibold text-white">
        9+
      </span>
    )
  }
  return (
    <span className="ml-auto h-1.5 w-1.5 rounded-full bg-danger-500 flex-shrink-0" />
  )
}

function ChannelItem({
  channel,
  projectId,
  isActive,
}: {
  channel: ChannelSummary
  projectId: string
  isActive: boolean
}) {
  const router = useRouter()
  const isMilestone = channel.kind === 'MILESTONE_THREAD'
  const displayName = channel.displayName ?? channel.name
  const hasUnread = channel.unreadCount > 0

  return (
    <button
      onClick={() => router.push(`/contractor/projects/${projectId}/comms/${channel.id}`)}
      className={cn(
        'w-full flex items-center gap-2 px-3 py-1.5 text-sm rounded-md transition-colors text-left',
        isActive
          ? 'bg-ink-100 text-ink-900 font-medium'
          : 'text-ink-500 hover:bg-ink-50 hover:text-ink-900',
        hasUnread && !isActive && 'text-ink-800 font-medium'
      )}
    >
      {isMilestone ? (
        <GitBranch className="h-3.5 w-3.5 flex-shrink-0 text-ink-400" strokeWidth={1.5} />
      ) : (
        <Hash className="h-3.5 w-3.5 flex-shrink-0 text-ink-400" strokeWidth={1.5} />
      )}
      <span className="truncate flex-1">{displayName}</span>
      {channel.isPinned && !hasUnread && (
        <span className="text-[10px] text-ink-300 ml-auto">★</span>
      )}
      <UnreadBadge count={channel.unreadCount} />
    </button>
  )
}

export function ChannelSidebar({ projectId, activeChannelId }: Props) {
  const { data, isLoading } = useWorkspaceChannels(projectId)
  const channels = data?.channels ?? []

  const defaultChannels = channels.filter(
    (ch) => ch.kind === 'DEFAULT' || ch.kind === 'CUSTOM'
  )
  const milestoneChannels = channels.filter((ch) => ch.kind === 'MILESTONE_THREAD')

  if (isLoading) {
    return (
      <div className="w-[220px] flex-shrink-0 border-r border-ink-100 bg-white p-3">
        <div className="space-y-1">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-7 rounded-md bg-ink-50 animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="w-[220px] flex-shrink-0 border-r border-ink-100 bg-white flex flex-col overflow-y-auto">
      <div className="p-2 pt-3 space-y-4">
        {defaultChannels.length > 0 && (
          <div>
            <p className="px-3 mb-1 text-[10px] font-semibold text-ink-400 uppercase tracking-wider">
              Channels
            </p>
            <div className="space-y-0.5">
              {defaultChannels.map((ch) => (
                <ChannelItem
                  key={ch.id}
                  channel={ch}
                  projectId={projectId}
                  isActive={ch.id === activeChannelId}
                />
              ))}
            </div>
          </div>
        )}

        {milestoneChannels.length > 0 && (
          <div>
            <p className="px-3 mb-1 text-[10px] font-semibold text-ink-400 uppercase tracking-wider">
              Milestones
            </p>
            <div className="space-y-0.5">
              {milestoneChannels.map((ch) => (
                <ChannelItem
                  key={ch.id}
                  channel={ch}
                  projectId={projectId}
                  isActive={ch.id === activeChannelId}
                />
              ))}
            </div>
          </div>
        )}

        {channels.length === 0 && (
          <p className="px-3 text-xs text-ink-400">No channels yet.</p>
        )}
      </div>
    </div>
  )
}
