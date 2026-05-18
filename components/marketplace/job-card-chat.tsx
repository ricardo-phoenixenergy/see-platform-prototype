'use client'
// components/marketplace/job-card-chat.tsx

import { useState, useTransition } from 'react'
import { addJobMessage } from '@/server/actions/marketplace'
import { Send } from 'lucide-react'

type Message = { id: string; senderUserId: string; body: string; createdAt: string }
type Props = { jobCardId: string; userId: string; initialMessages: Message[] }

export function JobCardChat({ jobCardId, userId, initialMessages }: Props) {
  const [messages, setMessages] = useState(initialMessages)
  const [body, setBody] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleSend() {
    if (!body.trim()) return
    startTransition(async () => {
      await addJobMessage({ jobCardId, senderUserId: userId, body })
      setMessages((prev) => [
        ...prev,
        { id: Date.now().toString(), senderUserId: userId, body, createdAt: new Date().toISOString() },
      ])
      setBody('')
    })
  }

  return (
    <div className="rounded-lg border border-ink-200 bg-white flex flex-col" style={{ minHeight: 280 }}>
      <div className="flex-1 overflow-y-auto p-3 space-y-3 max-h-64">
        {messages.length === 0 && (
          <p className="text-xs text-ink-400 text-center py-4">No messages yet.</p>
        )}
        {messages.map((m) => {
          const isMine = m.senderUserId === userId
          return (
            <div key={m.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
              <div className={`rounded-lg px-3 py-2 max-w-[80%] text-sm ${isMine ? 'bg-ink-900 text-white' : 'bg-ink-100 text-ink-900'}`}>
                {m.body}
              </div>
            </div>
          )
        })}
      </div>
      <div className="border-t border-ink-100 p-2 flex gap-2">
        <input
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
          }}
          placeholder="Type a message…"
          className="flex-1 h-8 rounded-md border border-ink-200 px-3 text-sm placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-accent-500/20"
        />
        <button
          onClick={handleSend}
          disabled={isPending || !body.trim()}
          className="h-8 w-8 rounded-md bg-ink-900 text-white flex items-center justify-center hover:bg-ink-800 transition-colors disabled:opacity-50"
        >
          <Send className="h-3.5 w-3.5" strokeWidth={1.5} />
        </button>
      </div>
    </div>
  )
}
