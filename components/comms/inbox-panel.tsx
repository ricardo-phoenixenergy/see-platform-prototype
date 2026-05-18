'use client'
// components/comms/inbox-panel.tsx

import { useState, useEffect, useRef } from 'react'
import { useInboxSummary, useInboxMentions } from '@/hooks/use-comms'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import { Inbox, AtSign } from 'lucide-react'

type Tab = 'mentions' | 'unread' | 'all'

type Props = {
  onClose: () => void
}

export function InboxPanel({ onClose }: Props) {
  const [tab, setTab] = useState<Tab>('unread')
  const { data, isLoading } = useInboxSummary()
  const { data: mentionData, isLoading: mentionsLoading } = useInboxMentions()
  const router = useRouter()
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [onClose])

  const channels = data?.channels ?? []
  const mentions = mentionData ?? []

  const displayChannels =
    tab === 'unread'
      ? channels.filter((ch) => ch.unreadCount > 0)
      : tab === 'mentions'
      ? []
      : channels

  const isListLoading = tab === 'mentions' ? mentionsLoading : isLoading
  const isEmpty =
    tab === 'mentions' ? mentions.length === 0 : displayChannels.length === 0

  return (
    <div
      ref={panelRef}
      className="absolute right-0 top-full mt-1.5 w-[400px] bg-white border border-ink-200 rounded-lg shadow-xl z-50 overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-ink-100">
        <div className="flex items-center gap-2">
          <Inbox className="h-4 w-4 text-ink-600" strokeWidth={1.5} />
          <span className="text-sm font-semibold text-ink-900">Inbox</span>
          {(data?.totalUnread ?? 0) > 0 && (
            <span className="flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-danger-500 text-[10px] font-semibold text-white">
              {(data?.totalUnread ?? 0) > 99 ? '99+' : (data?.totalUnread ?? 0)}
            </span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-ink-100">
        {(['mentions', 'unread', 'all'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'flex-1 py-2 text-xs font-medium capitalize transition-colors',
              tab === t
                ? 'text-ink-900 border-b-2 border-ink-900'
                : 'text-ink-400 hover:text-ink-700'
            )}
          >
            {t}
            {t === 'mentions' && mentions.filter((m) => !m.readAt).length > 0 && (
              <span className="ml-1 inline-flex h-3.5 min-w-3.5 px-0.5 items-center justify-center rounded-full bg-accent-500 text-[8px] font-semibold text-white">
                {mentions.filter((m) => !m.readAt).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="max-h-80 overflow-y-auto">
        {isListLoading ? (
          <div className="p-4 space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-12 rounded-md bg-ink-50 animate-pulse" />
            ))}
          </div>
        ) : isEmpty ? (
          <div className="flex flex-col items-center justify-center py-10 gap-2">
            {tab === 'mentions' ? (
              <AtSign className="h-8 w-8 text-ink-200" strokeWidth={1} />
            ) : (
              <Inbox className="h-8 w-8 text-ink-200" strokeWidth={1} />
            )}
            <p className="text-sm text-ink-400">
              {tab === 'mentions' ? 'No mentions' : tab === 'unread' ? 'All caught up' : 'No messages'}
            </p>
          </div>
        ) : tab === 'mentions' ? (
          <div className="divide-y divide-ink-50">
            {mentions.map((mention) => (
              <button
                key={mention.id}
                onClick={() => {
                  if (mention.link) router.push(mention.link)
                  onClose()
                }}
                className="w-full text-left px-4 py-3 hover:bg-ink-25 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <AtSign className="h-3 w-3 text-accent-500 flex-shrink-0" strokeWidth={2} />
                      <span className="text-xs font-semibold text-ink-800 truncate">
                        {mention.title}
                      </span>
                    </div>
                    <p className="text-xs text-ink-500 truncate mt-0.5">{mention.body}</p>
                  </div>
                  <div className="flex-shrink-0 flex flex-col items-end gap-1">
                    <span className="text-[10px] text-ink-400">
                      {formatDistanceToNow(new Date(mention.createdAt), { addSuffix: true })}
                    </span>
                    {!mention.readAt && (
                      <span className="h-2 w-2 rounded-full bg-accent-500" />
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="divide-y divide-ink-50">
            {displayChannels.map((ch) => {
              const timeAgo = ch.latestMessage
                ? formatDistanceToNow(new Date(ch.latestMessage.createdAt), { addSuffix: true })
                : ''
              return (
                <button
                  key={ch.channelId}
                  onClick={() => {
                    router.push(`/contractor/projects/${ch.projectId}/comms/${ch.channelId}`)
                    onClose()
                  }}
                  className="w-full text-left px-4 py-3 hover:bg-ink-25 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-ink-800 truncate">
                          #{ch.channelName}
                        </span>
                        <span className="text-[10px] text-ink-300">·</span>
                        <span className="text-[10px] text-ink-400 truncate">{ch.projectName}</span>
                      </div>
                      {ch.latestMessage && (
                        <p className="text-xs text-ink-500 truncate mt-0.5">
                          <span className="font-medium text-ink-700">{ch.latestMessage.authorName}:</span>{' '}
                          {ch.latestMessage.body.slice(0, 80)}
                          {ch.latestMessage.body.length > 80 ? '…' : ''}
                        </p>
                      )}
                    </div>
                    <div className="flex-shrink-0 flex flex-col items-end gap-1">
                      <span className="text-[10px] text-ink-400">{timeAgo}</span>
                      {ch.unreadCount > 0 && (
                        <span className="flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-danger-500 text-[10px] font-semibold text-white">
                          {ch.unreadCount > 9 ? '9+' : ch.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
