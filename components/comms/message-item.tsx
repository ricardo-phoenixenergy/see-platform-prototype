'use client'
// components/comms/message-item.tsx

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { renderMarkdown } from '@/lib/comms/markdown'
import { getInitials } from '@/lib/utils'
import { SmilePlus, MessageSquare, Pin, Pencil, Trash2, Check, X } from 'lucide-react'
import {
  type ChannelMessage,
  type GroupedReaction,
  useToggleReaction,
  useEditMessage,
  useDeleteMessage,
} from '@/hooks/use-comms'
import { formatDistanceToNow } from 'date-fns'

type MemberLookup = Record<string, string>

type Props = {
  message: ChannelMessage
  members: MemberLookup
  channelId: string
  collapsed?: boolean
  onReplyClick?: (message: ChannelMessage) => void
  currentUserId?: string | undefined
}

const QUICK_EMOJIS = ['👍', '✅', '👀', '🎉']

function ReactionBar({
  reactions,
  messageId,
  channelId,
  currentUserId,
  parentMessageId,
}: {
  reactions: GroupedReaction[]
  messageId: string
  channelId: string
  currentUserId?: string | undefined
  parentMessageId?: string | null
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
            onClick={() => toggleReaction.mutate({ messageId, emoji: r.emoji, parentMessageId: parentMessageId ?? null })}
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

function AttachmentCard({ attachment }: { attachment: { name: string; url: string; fileSize?: number; mimeType?: string } }) {
  const isImage = attachment.mimeType?.startsWith('image/')
  return (
    <a
      href={attachment.url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 mt-1.5 px-3 py-2 rounded-md border border-ink-200 bg-ink-50 text-xs text-ink-700 hover:bg-ink-100 transition-colors max-w-xs"
    >
      <span className="text-base">{isImage ? '🖼' : '📎'}</span>
      <span className="truncate font-medium">{attachment.name}</span>
      {attachment.fileSize && (
        <span className="text-ink-400 flex-shrink-0">
          {attachment.fileSize > 1024 * 1024
            ? `${(attachment.fileSize / 1024 / 1024).toFixed(1)}MB`
            : `${Math.round(attachment.fileSize / 1024)}KB`}
        </span>
      )}
    </a>
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
  const [editing, setEditing] = useState(false)
  const [editBody, setEditBody] = useState(message.body)

  const toggleReaction = useToggleReaction(channelId)
  const editMessage = useEditMessage(channelId)
  const deleteMessage = useDeleteMessage(channelId)

  const isDeleted = !!message.deletedAt
  const isOwn = message.authorUserId === currentUserId
  const authorName = message.authorUserId
    ? (members[message.authorUserId] ?? message.author?.name ?? 'Unknown')
    : 'System'
  const initials = getInitials(authorName)

  const timeAgo = formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })
  const timeFormatted = new Date(message.createdAt).toLocaleTimeString('en-ZA', {
    hour: '2-digit',
    minute: '2-digit',
  })

  // Parse attachments
  const attachments = (() => {
    if (!message.attachments) return []
    try {
      const parsed = message.attachments as Array<{ name: string; url: string; fileSize?: number; mimeType?: string }>
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  })()

  function handleEditSubmit() {
    if (!editBody.trim() || editBody === message.body) {
      setEditing(false)
      return
    }
    editMessage.mutate(
      { messageId: message.id, body: editBody.trim(), parentMessageId: message.parentMessageId },
      { onSuccess: () => setEditing(false) }
    )
  }

  function handleDelete() {
    if (!confirm('Delete this message?')) return
    deleteMessage.mutate({ messageId: message.id, parentMessageId: message.parentMessageId })
  }

  // System message style
  if (message.isSystem) {
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
        {!collapsed && <div className="flex items-baseline gap-2 mb-0.5 h-5" />}
        <p className="text-sm italic text-ink-400 ml-9">This message was deleted.</p>
      </div>
    )
  }

  return (
    <div
      className={cn('relative px-4 group', collapsed ? 'py-0.5' : 'pt-3 pb-0.5')}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Hover action toolbar */}
      {hovered && !editing && (
        <div className="absolute top-1 right-4 z-10 bg-white border border-ink-200 rounded-md shadow-sm flex gap-0.5 p-0.5">
          {QUICK_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => toggleReaction.mutate({ messageId: message.id, emoji, parentMessageId: message.parentMessageId })}
              className="h-6 w-6 flex items-center justify-center rounded hover:bg-ink-50 text-sm"
              title={`React with ${emoji}`}
            >
              {emoji}
            </button>
          ))}
          <div className="h-5 w-px bg-ink-200 mx-0.5 self-center" />
          <button
            onClick={() => toggleReaction.mutate({ messageId: message.id, emoji: '😊', parentMessageId: message.parentMessageId })}
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
          {isOwn && (
            <>
              <button
                onClick={() => { setEditing(true); setEditBody(message.body) }}
                className="h-6 w-6 flex items-center justify-center rounded hover:bg-ink-50 text-ink-400 hover:text-ink-700"
                title="Edit message"
                aria-label="Edit message"
              >
                <Pencil className="h-3.5 w-3.5" strokeWidth={1.5} />
              </button>
              <button
                onClick={handleDelete}
                className="h-6 w-6 flex items-center justify-center rounded hover:bg-ink-50 text-ink-400 hover:text-danger-500"
                title="Delete message"
                aria-label="Delete message"
              >
                <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
              </button>
            </>
          )}
          {message.isPinned && (
            <div className="h-6 w-6 flex items-center justify-center rounded text-accent-500" title="Pinned">
              <Pin className="h-3.5 w-3.5" strokeWidth={1.5} />
            </div>
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
            <span
              className="absolute left-4 text-[10px] text-ink-300 select-none"
              style={{ top: '50%', transform: 'translateY(-50%)' }}
            >
              {timeFormatted}
            </span>
          )}

          {/* Inline editor */}
          {editing ? (
            <div className="mt-0.5">
              <textarea
                value={editBody}
                onChange={(e) => setEditBody(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleEditSubmit() }
                  if (e.key === 'Escape') { setEditing(false); setEditBody(message.body) }
                }}
                className="w-full text-sm text-ink-800 border border-accent-400 rounded-md px-2 py-1.5 resize-none focus:outline-none focus:ring-2 focus:ring-accent-500/30"
                rows={Math.max(2, editBody.split('\n').length)}
                autoFocus
              />
              <div className="flex gap-1.5 mt-1">
                <button
                  onClick={handleEditSubmit}
                  disabled={editMessage.isPending}
                  className="h-6 px-2.5 flex items-center gap-1 text-xs rounded-md bg-ink-900 text-white hover:bg-ink-800 transition-colors disabled:opacity-50"
                >
                  <Check className="h-3 w-3" strokeWidth={2} />
                  Save
                </button>
                <button
                  onClick={() => { setEditing(false); setEditBody(message.body) }}
                  className="h-6 px-2.5 flex items-center gap-1 text-xs rounded-md border border-ink-200 text-ink-600 hover:bg-ink-50 transition-colors"
                >
                  <X className="h-3 w-3" strokeWidth={2} />
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div
              className="text-sm text-ink-800 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(message.body, members) }}
            />
          )}

          {/* Attachments */}
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-1">
              {attachments.map((att, i) => (
                <AttachmentCard key={i} attachment={att} />
              ))}
            </div>
          )}

          <ReactionBar
            reactions={message.reactions}
            messageId={message.id}
            channelId={channelId}
            currentUserId={currentUserId}
            parentMessageId={message.parentMessageId}
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
