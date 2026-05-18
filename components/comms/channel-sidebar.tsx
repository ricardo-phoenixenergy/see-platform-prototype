'use client'
// components/comms/channel-sidebar.tsx

import { useState, useRef, useEffect } from 'react'
import { useWorkspaceChannels, useCreateChannel, type ChannelSummary } from '@/hooks/use-comms'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Hash, GitBranch, Plus, X, Loader2 } from 'lucide-react'

type Props = {
  projectId: string
  activeChannelId: string
}

function UnreadBadge({ count }: { count: number }) {
  if (count <= 0) return null
  return (
    <span className="ml-auto flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-danger-500 text-[10px] font-semibold text-white">
      {count > 9 ? '9+' : count}
    </span>
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

function CreateChannelModal({
  projectId,
  onClose,
}: {
  projectId: string
  onClose: () => void
}) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const createChannel = useCreateChannel(projectId)

  useEffect(() => { inputRef.current?.focus() }, [])

  const slugPreview = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!slugPreview) return
    createChannel.mutate(
      { name: slugPreview, displayName: name, ...(description ? { description } : {}) },
      { onSuccess: () => onClose() }
    )
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/30 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white rounded-xl border border-ink-200 shadow-2xl w-[400px] p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-ink-900">Create channel</h3>
          <button onClick={onClose} className="h-6 w-6 flex items-center justify-center rounded text-ink-400 hover:bg-ink-50">
            <X className="h-3.5 w-3.5" strokeWidth={1.5} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-ink-700 mb-1">Channel name</label>
            <div className="flex items-center border border-ink-200 rounded-md focus-within:ring-2 focus-within:ring-accent-500/30 focus-within:border-accent-400 overflow-hidden">
              <span className="px-2.5 text-ink-400 text-sm select-none">#</span>
              <input
                ref={inputRef}
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. client-approvals"
                className="flex-1 py-2 pr-3 text-sm text-ink-900 placeholder:text-ink-300 focus:outline-none bg-transparent"
              />
            </div>
            {slugPreview && slugPreview !== name.toLowerCase() && (
              <p className="text-[10px] text-ink-400 mt-1">Will be created as #{slugPreview}</p>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-700 mb-1">Description <span className="text-ink-300 font-normal">(optional)</span></label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's this channel for?"
              className="w-full border border-ink-200 rounded-md px-3 py-2 text-sm text-ink-900 placeholder:text-ink-300 focus:outline-none focus:ring-2 focus:ring-accent-500/30 focus:border-accent-400"
            />
          </div>
          {createChannel.error && (
            <p className="text-xs text-danger-500">{createChannel.error.message}</p>
          )}
          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              disabled={!slugPreview || createChannel.isPending}
              className="flex-1 h-8 flex items-center justify-center gap-1.5 rounded-md bg-ink-900 text-white text-xs font-medium hover:bg-ink-800 transition-colors disabled:opacity-50"
            >
              {createChannel.isPending && <Loader2 className="h-3 w-3 animate-spin" strokeWidth={2} />}
              Create channel
            </button>
            <button
              type="button"
              onClick={onClose}
              className="h-8 px-3 rounded-md border border-ink-200 text-ink-600 text-xs hover:bg-ink-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export function ChannelSidebar({ projectId, activeChannelId }: Props) {
  const [showCreate, setShowCreate] = useState(false)
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
    <>
      <div className="w-[220px] flex-shrink-0 border-r border-ink-100 bg-white flex flex-col overflow-y-auto">
        <div className="p-2 pt-3 space-y-4 flex-1">
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

        {/* Create custom channel */}
        <div className="p-2 border-t border-ink-100">
          <button
            onClick={() => setShowCreate(true)}
            className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-ink-400 hover:text-ink-700 hover:bg-ink-50 rounded-md transition-colors"
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={1.5} />
            Add channel
          </button>
        </div>
      </div>

      {showCreate && (
        <CreateChannelModal projectId={projectId} onClose={() => setShowCreate(false)} />
      )}
    </>
  )
}
