'use client'
// components/ai/chat-panel.tsx

import { useState, useRef, useEffect } from 'react'
import { Send, Loader2, X } from 'lucide-react'
import { MessageBubble } from './message-bubble'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'

type Message = {
  role: 'user' | 'assistant' | 'tool'
  content: string
  toolName?: string
}

type Props = { onClose: () => void }

const SUGGESTIONS = [
  'Which of my projects are at risk?',
  'Summarise my milestone status',
  'Who should I use for structural engineering in Gauteng?',
  'Which sites could I sell O&M licenses to?',
]

export function ChatPanel({ onClose }: Props) {
  const { data: session } = useSession()
  const pathname = usePathname()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [convId, setConvId] = useState<string | undefined>()
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage() {
    const text = input.trim()
    if (!text || isStreaming) return

    setInput('')
    const newMessages: Message[] = [...messages, { role: 'user', content: text }]
    setMessages(newMessages)
    setIsStreaming(true)

    const context = {
      userName: session?.user?.name ?? 'User',
      role: 'CONTRACTOR',
      companyName: session?.user?.companyId ?? '',
      companyType: 'CONTRACTOR',
      currentPage: pathname,
      language: 'English',
    }

    const apiMessages = newMessages
      .filter((m) => m.role !== 'tool')
      .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }))

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages, conversationId: convId, context }),
      })

      if (!res.body) throw new Error('No response body')
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let assistantText = ''

      // Add placeholder assistant message
      setMessages((prev) => [...prev, { role: 'assistant', content: '' }])

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        for (const line of chunk.split('\n')) {
          if (!line.startsWith('data: ')) continue
          try {
            const data = JSON.parse(line.slice(6)) as {
              type: string
              text?: string
              id?: string
              name?: string
              message?: string
            }
            if (data.type === 'conversation_id' && data.id) {
              setConvId(data.id)
            } else if (data.type === 'text' && data.text) {
              assistantText += data.text
              setMessages((prev) => {
                const updated = [...prev]
                updated[updated.length - 1] = { role: 'assistant', content: assistantText }
                return updated
              })
            } else if (data.type === 'tool_call' && data.name) {
              const toolName = data.name
              setMessages((prev): Message[] => [
                ...prev.slice(0, -1),
                { role: 'tool', content: '', toolName },
                { role: 'assistant', content: '' },
              ])
            } else if (data.type === 'error') {
              assistantText = 'Something went wrong. Please try again.'
              setMessages((prev) => {
                const updated = [...prev]
                updated[updated.length - 1] = { role: 'assistant', content: assistantText }
                return updated
              })
            }
          } catch {
            // Ignore malformed SSE lines
          }
        }
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Something went wrong. Please try again.' },
      ])
    } finally {
      setIsStreaming(false)
      setTimeout(() => textareaRef.current?.focus(), 50)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void sendMessage()
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-ink-200 flex-shrink-0">
        <div>
          <p className="text-sm font-semibold text-ink-900">SEE.AI</p>
          <p className="text-xs text-ink-400">Ask about your projects, milestones, or marketplace</p>
        </div>
        <button onClick={onClose} className="text-ink-400 hover:text-ink-700 transition-colors">
          <X className="h-4 w-4" strokeWidth={1.5} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
        {messages.length === 0 && (
          <div className="space-y-2 py-4">
            <p className="text-xs text-ink-400 text-center">Suggestions</p>
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => {
                  setInput(s)
                  textareaRef.current?.focus()
                }}
                className="w-full text-left text-xs px-3 py-2 rounded-lg border border-ink-200 bg-ink-25 hover:bg-ink-50 transition-colors text-ink-600"
              >
                {s}
              </button>
            ))}
          </div>
        )}
        {messages.map((msg, i) => (
          <MessageBubble
            key={i}
            role={msg.role}
            content={msg.content}
            {...(msg.toolName !== undefined ? { toolName: msg.toolName } : {})}
            isStreaming={
              isStreaming && i === messages.length - 1 && msg.role === 'assistant'
            }
          />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-ink-200 p-3 flex items-end gap-2 flex-shrink-0">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          placeholder="Ask SEE.AI…"
          className="flex-1 resize-none rounded-lg border border-ink-200 px-3 py-2 text-sm placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-accent-500/20 max-h-24"
          style={{ minHeight: '36px' }}
        />
        <button
          onClick={() => void sendMessage()}
          disabled={isStreaming || !input.trim()}
          className="flex-shrink-0 h-9 w-9 rounded-lg bg-ink-900 text-white flex items-center justify-center hover:bg-ink-800 transition-colors disabled:opacity-40"
        >
          {isStreaming ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" strokeWidth={1.5} />
          )}
        </button>
      </div>
    </div>
  )
}
