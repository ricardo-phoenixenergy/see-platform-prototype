// components/ai/message-bubble.tsx
'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Bot, User, Wrench } from 'lucide-react'
import { cn } from '@/lib/utils'

type Props = {
  role: 'user' | 'assistant' | 'tool'
  content: string
  toolName?: string
  isStreaming?: boolean
}

export function MessageBubble({ role, content, toolName, isStreaming }: Props) {
  if (role === 'tool') {
    return (
      <div className="flex items-center gap-2 py-1 text-xs text-ink-400">
        <Wrench className="h-3 w-3 flex-shrink-0" strokeWidth={1.5} />
        <span>Fetching {toolName?.replace(/_/g, ' ')}…</span>
      </div>
    )
  }

  return (
    <div className={cn('flex items-start gap-2.5', role === 'user' && 'flex-row-reverse')}>
      <div
        className={cn(
          'h-7 w-7 rounded-full flex items-center justify-center flex-shrink-0',
          role === 'user' ? 'bg-accent-500/10' : 'bg-ink-100'
        )}
      >
        {role === 'user' ? (
          <User className="h-3.5 w-3.5 text-accent-600" strokeWidth={1.5} />
        ) : (
          <Bot className="h-3.5 w-3.5 text-ink-500" strokeWidth={1.5} />
        )}
      </div>
      <div
        className={cn(
          'max-w-[85%] rounded-xl px-3 py-2 text-sm',
          role === 'user' ? 'bg-accent-500/10 text-ink-900' : 'bg-ink-50 text-ink-800'
        )}
      >
        {role === 'assistant' ? (
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              p: ({ children }) => <p className="mb-1 last:mb-0 leading-relaxed">{children}</p>,
              ul: ({ children }) => <ul className="list-disc pl-4 mb-1 space-y-0.5">{children}</ul>,
              ol: ({ children }) => <ol className="list-decimal pl-4 mb-1 space-y-0.5">{children}</ol>,
              li: ({ children }) => <li className="leading-relaxed">{children}</li>,
              strong: ({ children }) => (
                <strong className="font-semibold text-ink-900">{children}</strong>
              ),
              code: ({ children }) => (
                <code className="font-mono text-xs bg-ink-100 px-1 py-0.5 rounded">{children}</code>
              ),
            }}
          >
            {content}
          </ReactMarkdown>
        ) : (
          <p className="leading-relaxed">{content}</p>
        )}
        {isStreaming && (
          <span className="inline-flex gap-0.5 ml-1">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="h-1 w-1 rounded-full bg-ink-400 animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </span>
        )}
      </div>
    </div>
  )
}
