'use client'
// components/comms/message-item.tsx
// Individual message with hover toolbar: react, reply in thread, pin.

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { renderMarkdown } from '@/lib/comms/markdown'
import { getInitials } from '@/lib/utils'
import { SmilePlus, MessageSquare, Pin } from 'lucide-react'
import { type ChannelMessage, type GroupedReaction, useToggleReaction } from '@/hooks/use-comms'
import { formatDistanceToNow } from 'date-fns'

type MemberLookup = Record<string, string>

type Props = {
  message: ChannelMessage
  members: MemberLookup
  channelId: string
  collapsed?: boolean // hide avatar/name when consecutive messages from same author
  onReplyClick?: (message: ChannelMessage) => void
  currentUserId?: string | undefined
}

const QUICK_EMOJIS = ['👍', '✅', '👀', '🎉']

function ReactionBar({
  reactions,
  messageId,
  channelId,
  currentUserId,
}: {
  reactions: GroupedReaction[]
  messageId: string
  channelId: string
  currentUserId?: string | undefined
}) {
  const toggleReaction = useToggleReaction(channelId)

  if (reactions.length === 0) return null

  return (
    <div className="flex flex-wrap gap-1 mt-1.5">
      {reactions.map((r) => {
        const isActive = currentUserId ? r.userIds.includes(currentUserId) : false
        return (
          <button
            key={r.emoji}
            onClick={() => toggleReaction.mutate({ messageId, emoji: r.emoji })}
            className={cn(
              'flex items-center gap-1 h-6 px-2 rounded-full text-xs border transition-colors',
              isActive
                ? 'bg-accent-500/10 border-accent-500/30 text-accent-600'
                : 'bg-white border-ink-200 text-ink-600 hover:border-ink-300 hover:bg-ink-50'
            )}
          >
            <span>{r.emoji}</span>
            <span className="font-medium">{r.count}</span>
          </button>
        )
      })}
    </div>
  )
}

export function MessageItem({
  message,
  members,
  channelId,
  collapsed = false,
  onReplyClick,
  currentUserId,
}: Props) {
  const [hovered, setHovered] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const toggleReaction = useToggleReaction(channelId)

  const isDeleted = !!message.deletedAt
  const isSystem = !message.authorUserId
  const authorName = members[message.authorUserId] ?? message.author?.name ?? 'Unknown'
  const initials = getInitials(authorName)

  const timeAgo = formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })
  const timeFormatted = new Date(message.createdAt).toLocaleTimeString('en-ZA', {
    hour: '2-digit',
    minute: '2-digit',
  })

  // System message style
  if (isSystem) {
    return (
      <div className="px-4 py-1">
        <div
          className={cn(
            'border-l-2 border-accent-500 pl-3 py-1.5 rounded-r-sm text-sm text-ink-700',
            'bg-accent-500/5'
          )}
          dangerouslySetInnerHTML={{ __html: renderMarkdown(message.body, members) }}
        />
      </div>
    )
  }

  // Deleted message
  if (isDeleted) {
    return (
      <div className={cn('px-4 py-0.5', collapsed ? 'pt-0' : '')}>
        {!collapsed && (
          <div className="flex items-baseline gap-2 mb-0.5 h-5" />
        )}
        <p className="text-sm italic text-ink-400 ml-9">This message was deleted.</p>
      </div>
    )
  }

  return (
    <div
      className={cn('relative px-4 group', collapsed ? 'py-0.5' : 'pt-3 pb-0.5')}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setShowEmojiPicker(false) }}
    >
      {/* Hover action toolbar */}
      {hovered && (
        <div className="absolute top-1 right-4 z-10 bg-white border border-ink-200 rounded-md shadow-sm flex gap-0.5 p-0.5">
          {QUICK_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => toggleReaction.mutate({ messageId: message.id, emoji })}
              className="h-6 w-6 flex items-center justify-center rounded hover:bg-ink-50 text-sm"
              title={`React with ${emoji}`}
            >
              {emoji}
            </button>
          ))}
          <div className="h-5 w-px bg-ink-200 mx-0.5 self-center" />
          <button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="h-6 w-6 flex items-center justify-center rounded hover:bg-ink-50 text-ink-400 hover:text-ink-700"
            title="Add reaction"
            aria-label="React to message"
          >
            <SmilePlus className="h-3.5 w-3.5" strokeWidth={1.5} />
          </button>
          {onReplyClick && (
            <button
              onClick={() => onReplyClick(message)}
              className="h-6 w-6 flex items-center justify-center rounded hover:bg-ink-50 text-ink-400 hover:text-ink-700"
              title="Reply in thread"
              aria-label="Reply in thread"
            >
              <MessageSquare className="h-3.5 w-3.5" strokeWidth={1.5} />
            </button>
          )}
          {message.isPinned && (
            <button
              className="h-6 w-6 flex items-center justify-center rounded hover:bg-ink-50 text-accent-500"
              title="Pinned"
              aria-label="Message is pinned"
            >
              <Pin className="h-3.5 w-3.5" strokeWidth={1.5} />
            </button>
          )}
        </div>
      )}

      {/* Message body */}
      <div className={cn('flex gap-2.5', collapsed ? 'ml-9' : '')}>
        {!collapsed && (
          <div
            className="h-8 w-8 rounded-full bg-ink-100 flex items-center justify-center text-[10px] font-semibold text-ink-700 flex-shrink-0 mt-0.5"
            title={authorName}
          >
            {initials}
          </div>
        )}

        <div className="flex-1 min-w-0">
          {!collapsed && (
            <div className="flex items-baseline gap-2 mb-0.5">
              <span className="text-sm font-semibold text-ink-900">{authorName}</span>
              <span className="text-[11px] text-ink-400" title={timeAgo}>
                {timeFormatted}
              </span>
              {message.isPinned && (
                <Pin className="h-2.5 w-2.5 text-accent-500 ml-0.5" strokeWidth={2} />
              )}
              {message.editedAt && (
                <span className="text-[10px] text-ink-300 italic">(edited)</span>
              )}
            </div>
          )}

          {collapsed && hovered && (
            <span className="absolute left-4 text-[10px] text-ink-300 select-none" style={{ top: '50%', transform: 'translateY(-50%)' }}>
              {timeFormatted}
            </span>
          )}

          <div
            className="text-sm text-ink-800 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(message.body, members) }}
          />

          <ReactionBar
            reactions={message.reactions}
            messageId={message.id}
            channelId={channelId}
            currentUserId={currentUserId}
          />

          {message.replyCount > 0 && onReplyClick && (
            <button
              onClick={() => onReplyClick(message)}
              className="mt-1 flex items-center gap-1.5 text-xs text-accent-500 hover:text-accent-600 transition-colors"
            >
              <MessageSquare className="h-3 w-3" strokeWidth={1.5} />
              {message.replyCount} {message.replyCount === 1 ? 'reply' : 'replies'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
