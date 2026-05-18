'use client'
// components/comms/message-composer.tsx
// Textarea + formatting toolbar for composing messages.
// Cmd/Ctrl+Enter submits.

import { useState, useRef, useCallback, type KeyboardEvent } from 'react'
import { cn } from '@/lib/utils'
import { useSendMessage } from '@/hooks/use-comms'
import { Bold, Italic, Code, Send, AtSign, Paperclip } from 'lucide-react'

type MemberEntry = { id: string; name: string }

type Props = {
  channelId: string
  placeholder?: string
  parentMessageId?: string
  members?: MemberEntry[]
  onMessageSent?: () => void
}

export function MessageComposer({
  channelId,
  placeholder = 'Type your message…',
  parentMessageId,
  members = [],
  onMessageSent,
}: Props) {
  const [body, setBody] = useState('')
  const [mentionQuery, setMentionQuery] = useState<string | null>(null)
  const [mentionAnchor, setMentionAnchor] = useState(0)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const sendMessage = useSendMessage(channelId)

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value
    setBody(val)

    // Detect @mention trigger
    const pos = e.target.selectionStart ?? 0
    const before = val.slice(0, pos)
    const mentionMatch = before.match(/@([\w-]*)$/)
    if (mentionMatch) {
      setMentionQuery(mentionMatch[1] ?? '')
      setMentionAnchor(pos - (mentionMatch[0]?.length ?? 0))
    } else {
      setMentionQuery(null)
    }
  }, [])

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault()
        void handleSubmit()
      }
      if (e.key === 'Escape') {
        setMentionQuery(null)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [body, channelId]
  )

  const handleSubmit = async () => {
    const trimmed = body.trim()
    if (!trimmed) return
    setBody('')
    setMentionQuery(null)
    try {
      await sendMessage.mutateAsync(
        parentMessageId
          ? { body: trimmed, parentMessageId }
          : { body: trimmed }
      )
      onMessageSent?.()
    } catch {
      setBody(trimmed) // restore on failure
    }
  }

  const insertMention = (member: MemberEntry) => {
    const before = body.slice(0, mentionAnchor)
    const after = body.slice(textareaRef.current?.selectionStart ?? mentionAnchor + (mentionQuery?.length ?? 0) + 1)
    const newBody = `${before}@${member.id} ${after}`
    setBody(newBody)
    setMentionQuery(null)
    textareaRef.current?.focus()
  }

  const insertFormat = (prefix: string, suffix: string) => {
    const el = textareaRef.current
    if (!el) return
    const start = el.selectionStart
    const end = el.selectionEnd
    const selected = body.slice(start, end)
    const newBody = body.slice(0, start) + prefix + (selected || 'text') + suffix + body.slice(end)
    setBody(newBody)
    setTimeout(() => {
      el.focus()
      el.setSelectionRange(start + prefix.length, start + prefix.length + (selected || 'text').length)
    }, 0)
  }

  const filteredMembers =
    mentionQuery !== null
      ? members.filter((m) =>
          m.name.toLowerCase().includes(mentionQuery.toLowerCase())
        )
      : []

  return (
    <div className="relative border-t border-ink-100 bg-white">
      {/* @mention popover */}
      {mentionQuery !== null && filteredMembers.length > 0 && (
        <div className="absolute bottom-full left-4 mb-1 bg-white border border-ink-200 rounded-md shadow-lg z-20 w-52 overflow-hidden">
          {filteredMembers.slice(0, 6).map((m) => (
            <button
              key={m.id}
              onMouseDown={(e) => {
                e.preventDefault() // prevent blur
                insertMention(m)
              }}
              className="w-full text-left px-3 py-2 text-sm hover:bg-ink-50 text-ink-800 transition-colors"
            >
              @{m.name}
            </button>
          ))}
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center gap-1 px-3 pt-2 pb-0">
        <button
          type="button"
          onClick={() => insertFormat('**', '**')}
          className="h-6 w-6 flex items-center justify-center rounded text-ink-400 hover:bg-ink-50 hover:text-ink-700 transition-colors"
          title="Bold"
        >
          <Bold className="h-3.5 w-3.5" strokeWidth={2} />
        </button>
        <button
          type="button"
          onClick={() => insertFormat('*', '*')}
          className="h-6 w-6 flex items-center justify-center rounded text-ink-400 hover:bg-ink-50 hover:text-ink-700 transition-colors"
          title="Italic"
        >
          <Italic className="h-3.5 w-3.5" strokeWidth={2} />
        </button>
        <button
          type="button"
          onClick={() => insertFormat('`', '`')}
          className="h-6 w-6 flex items-center justify-center rounded text-ink-400 hover:bg-ink-50 hover:text-ink-700 transition-colors"
          title="Code"
        >
          <Code className="h-3.5 w-3.5" strokeWidth={2} />
        </button>
        <div className="h-4 w-px bg-ink-200 mx-0.5" />
        <button
          type="button"
          onClick={() => {
            setBody((b) => b + '@')
            textareaRef.current?.focus()
          }}
          className="h-6 w-6 flex items-center justify-center rounded text-ink-400 hover:bg-ink-50 hover:text-ink-700 transition-colors"
          title="Mention"
        >
          <AtSign className="h-3.5 w-3.5" strokeWidth={1.5} />
        </button>
        <button
          type="button"
          className="h-6 w-6 flex items-center justify-center rounded text-ink-400 hover:bg-ink-50 hover:text-ink-700 transition-colors"
          title="Attach file (coming soon)"
          disabled
        >
          <Paperclip className="h-3.5 w-3.5" strokeWidth={1.5} />
        </button>
      </div>

      {/* Textarea + send */}
      <div className="flex items-end gap-2 px-3 pb-3 pt-1.5">
        <textarea
          ref={textareaRef}
          value={body}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={1}
          className={cn(
            'flex-1 resize-none text-sm text-ink-900 placeholder:text-ink-400',
            'bg-transparent border-0 outline-none focus:outline-none',
            'min-h-[36px] max-h-[144px] leading-relaxed py-1.5'
          )}
          style={{
            height: 'auto',
            overflowY: body.split('\n').length > 6 ? 'auto' : 'hidden',
          }}
          onInput={(e) => {
            const el = e.currentTarget
            el.style.height = 'auto'
            el.style.height = Math.min(el.scrollHeight, 144) + 'px'
          }}
        />
        <button
          type="button"
          onClick={() => void handleSubmit()}
          disabled={!body.trim() || sendMessage.isPending}
          className={cn(
            'flex-shrink-0 h-8 w-8 flex items-center justify-center rounded-md transition-colors',
            body.trim()
              ? 'bg-ink-900 text-white hover:bg-ink-800'
              : 'bg-ink-100 text-ink-400 cursor-not-allowed'
          )}
          title="Send (Cmd+Enter)"
        >
          <Send className="h-3.5 w-3.5" strokeWidth={1.5} />
        </button>
      </div>
    </div>
  )
}
