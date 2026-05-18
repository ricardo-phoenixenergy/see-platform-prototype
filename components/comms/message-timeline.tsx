'use client'
// components/comms/message-timeline.tsx
// Main message feed for a channel with polling, date separators, and thread support.

import { useEffect, useRef, useState, useMemo } from 'react'
import { AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useChannelMessages, useMarkChannelRead, type ChannelMessage } from '@/hooks/use-comms'
import { MessageItem } from './message-item'
import { MessageComposer } from './message-composer'
import { ThreadDrawer } from './thread-drawer'
import { format, isToday, isYesterday } from 'date-fns'
import { Hash } from 'lucide-react'

type MemberLookup = Record<string, string>
type MemberEntry = { id: string; name: string }

type Props = {
  channelId: string
  channelName: string
  projectId: string
  members: MemberLookup
  membersList: MemberEntry[]
  currentUserId?: string | undefined
}

function DateSeparator({ date }: { date: Date }) {
  let label: string
  if (isToday(date)) {
    label = 'Today'
  } else if (isYesterday(date)) {
    label = 'Yesterday'
  } else {
    label = format(date, 'EEE d MMM')
  }
  return (
    <div className="flex items-center gap-3 px-4 py-2">
      <div className="flex-1 h-px bg-ink-100" />
      <span className="text-[11px] font-medium text-ink-400 flex-shrink-0">{label}</span>
      <div className="flex-1 h-px bg-ink-100" />
    </div>
  )
}

type MessageGroup = {
  type: 'separator'
  date: Date
} | {
  type: 'message'
  message: ChannelMessage
  collapsed: boolean
}

function buildGroups(messages: ChannelMessage[]): MessageGroup[] {
  // Filter to only top-level messages
  const topLevel = messages.filter((m) => !m.parentMessageId)
  const groups: MessageGroup[] = []
  let lastDate: string | null = null

  for (let i = 0; i < topLevel.length; i++) {
    const msg = topLevel[i]
    if (!msg) continue
    const msgDate = new Date(msg.createdAt)
    const dateKey = format(msgDate, 'yyyy-MM-dd')

    if (dateKey !== lastDate) {
      groups.push({ type: 'separator', date: msgDate })
      lastDate = dateKey
    }

    const prev = topLevel[i - 1]
    const collapsed =
      prev != null &&
      !prev.deletedAt &&
      prev.authorUserId === msg.authorUserId &&
      msgDate.getTime() - new Date(prev.createdAt).getTime() < 5 * 60 * 1000

    groups.push({ type: 'message', message: msg, collapsed })
  }

  return groups
}

export function MessageTimeline({ channelId, channelName, projectId, members, membersList, currentUserId }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [threadMessage, setThreadMessage] = useState<ChannelMessage | null>(null)
  const [autoScroll, setAutoScroll] = useState(true)
  const markRead = useMarkChannelRead(channelId, projectId)

  const { data, isLoading } = useChannelMessages(channelId, true)

  const groups = useMemo(() => buildGroups(data ?? []), [data])

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (autoScroll) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [groups.length, autoScroll])

  // Mark channel as read on mount
  useEffect(() => {
    if (channelId) {
      markRead.mutate()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelId])

  const handleScroll = () => {
    const el = containerRef.current
    if (!el) return
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 100
    setAutoScroll(nearBottom)
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden relative">
      {/* Channel header */}
      <div className="px-4 py-3 border-b border-ink-100 flex-shrink-0 bg-white flex items-center gap-2">
        <Hash className="h-4 w-4 text-ink-400" strokeWidth={1.5} />
        <span className="text-sm font-semibold text-ink-900">{channelName}</span>
      </div>

      {/* Messages */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className={cn(
          'flex-1 overflow-y-auto bg-ink-25',
          threadMessage ? 'pr-[480px]' : ''
        )}
      >
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <p className="text-sm text-ink-400">Loading messages…</p>
          </div>
        ) : groups.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-2">
            <Hash className="h-8 w-8 text-ink-200" strokeWidth={1} />
            <p className="text-sm text-ink-400">No messages yet. Start the conversation.</p>
          </div>
        ) : (
          <div className="py-2">
            {groups.map((group, i) => {
              if (group.type === 'separator') {
                return <DateSeparator key={`sep-${i}`} date={group.date} />
              }
              return (
                <MessageItem
                  key={group.message.id}
                  message={group.message}
                  members={members}
                  channelId={channelId}
                  collapsed={group.collapsed}
                  onReplyClick={setThreadMessage}
                  currentUserId={currentUserId}
                />
              )
            })}
            <div ref={bottomRef} className="h-2" />
          </div>
        )}
      </div>

      {/* Composer */}
      <div className={cn('flex-shrink-0', threadMessage ? 'pr-[480px]' : '')}>
        <MessageComposer
          channelId={channelId}
          members={membersList}
          onMessageSent={() => setAutoScroll(true)}
        />
      </div>

      {/* Thread drawer — AnimatePresence must be in the parent so exit animation fires */}
      <AnimatePresence>
        {threadMessage && (
          <ThreadDrawer
            key={threadMessage.id}
            rootMessage={threadMessage}
            channelId={channelId}
            members={members}
            membersList={membersList}
            currentUserId={currentUserId}
            onClose={() => setThreadMessage(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
