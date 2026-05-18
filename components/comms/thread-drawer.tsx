'use client'
// components/comms/thread-drawer.tsx
// Slide-in panel from the right side showing a thread (root message + replies).
// AnimatePresence lives in the parent (message-timeline.tsx) so that exit animations fire.

import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useThreadReplies } from '@/hooks/use-comms'
import { type ChannelMessage } from '@/hooks/use-comms'
import { MessageItem } from './message-item'
import { MessageComposer } from './message-composer'
import { renderMarkdown } from '@/lib/comms/markdown'

type MemberLookup = Record<string, string>
type MemberEntry = { id: string; name: string }

type Props = {
  rootMessage: ChannelMessage
  channelId: string
  members: MemberLookup
  membersList: MemberEntry[]
  currentUserId?: string | undefined
  onClose: () => void
}

function ThreadMessages({
  parentMessageId,
  channelId,
  members,
  currentUserId,
}: {
  parentMessageId: string
  channelId: string
  members: MemberLookup
  currentUserId?: string | undefined
}) {
  const bottomRef = useRef<HTMLDivElement>(null)

  const { data, isLoading } = useThreadReplies(parentMessageId)
  const replies = data ?? []

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [replies.length])

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-sm text-ink-400">Loading replies…</p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto py-2">
      <div className="space-y-0.5">
        {replies.map((msg, i) => {
          const prev = replies[i - 1]
          const collapsed =
            prev != null &&
            prev.authorUserId === msg.authorUserId &&
            new Date(msg.createdAt).getTime() - new Date(prev.createdAt).getTime() < 5 * 60 * 1000
          return (
            <MessageItem
              key={msg.id}
              message={msg}
              members={members}
              channelId={channelId}
              collapsed={collapsed}
              currentUserId={currentUserId}
            />
          )
        })}
        {replies.length === 0 && (
          <p className="px-4 py-3 text-sm text-ink-400">No replies yet. Start the thread below.</p>
        )}
      </div>
      <div ref={bottomRef} />
    </div>
  )
}

export function ThreadDrawer({ rootMessage, channelId, members, membersList, currentUserId, onClose }: Props) {
  return (
    <motion.div
      initial={{ x: '100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '100%', opacity: 0 }}
      transition={{ type: 'spring', damping: 28, stiffness: 300 }}
      className={cn(
        'absolute right-0 top-0 bottom-0 w-[480px] z-20',
        'bg-white border-l border-ink-200 flex flex-col shadow-xl'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-ink-100 flex-shrink-0">
        <div>
          <p className="text-sm font-semibold text-ink-900">Thread</p>
        </div>
        <button
          onClick={onClose}
          aria-label="Close thread"
          className="h-7 w-7 flex items-center justify-center rounded-md text-ink-400 hover:bg-ink-50 hover:text-ink-700 transition-colors"
        >
          <X className="h-4 w-4" strokeWidth={1.5} />
        </button>
      </div>

      {/* Root message */}
      <div className="border-b border-ink-100 flex-shrink-0 bg-ink-25">
        <div className="px-4 py-3">
          <p className="text-[11px] font-semibold text-ink-400 uppercase tracking-wider mb-2">
            Original message
          </p>
          <div
            className="text-sm text-ink-800 leading-relaxed"
            dangerouslySetInnerHTML={{
              __html: renderMarkdown(rootMessage.body, members),
            }}
          />
          <p className="text-[11px] text-ink-400 mt-1">
            {(rootMessage.authorUserId ? (members[rootMessage.authorUserId] ?? rootMessage.author?.name) : null) ?? 'System'} ·{' '}
            {new Date(rootMessage.createdAt).toLocaleString('en-ZA', {
              hour: '2-digit',
              minute: '2-digit',
              day: 'numeric',
              month: 'short',
            })}
          </p>
        </div>
      </div>

      {/* Replies */}
      <ThreadMessages
        parentMessageId={rootMessage.id}
        channelId={channelId}
        members={members}
        currentUserId={currentUserId}
      />

      {/* Composer */}
      <div className="flex-shrink-0">
        <MessageComposer
          channelId={channelId}
          placeholder="Reply in thread…"
          parentMessageId={rootMessage.id}
          members={membersList}
        />
      </div>
    </motion.div>
  )
}
