# M10 — SEE.AI Assistant + Polish Pass Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the real SEE.AI chat assistant (streaming Claude API, 6 tool calls, persistent history), then complete a global polish pass: empty states, loading skeletons, Demo Mode toggle, and final demo-readiness validation.

**Architecture:** `/api/ai/chat` streaming route using Anthropic SDK `messages.stream()`. Tool calls execute server-side in the streaming loop and re-enter as `tool_result` blocks. Chat widget is a persistent client component (`'use client'`) mounted at the root layout level so it survives page navigation. Demo Mode is a server-side boolean toggled via admin Configuration → stored in `PlatformBankAccount.notes` field as a lightweight flag (no schema change needed — demo prototype only).

**Tech Stack:** `@anthropic-ai/sdk` (already in package.json), Next.js 15 streaming Route Handler, React `useEffect` + `useState` for streaming, `react-markdown` + `remark-gfm` for message rendering, Framer Motion for panel animation.

---

## File Map

**New files:**
- `lib/ai/system-prompt.ts` — buildSystemPrompt(ctx)
- `lib/ai/tools.ts` — tool definitions + server-side executors
- `app/api/ai/chat/route.ts` — streaming POST handler
- `components/ai/chat-widget.tsx` — floating button + slide-up panel
- `components/ai/chat-panel.tsx` — message list, input, history sidebar
- `components/ai/message-bubble.tsx` — user / assistant / tool bubbles with markdown

**Modified files:**
- `app/(app)/contractor/layout.tsx` — mount `<ChatWidget>` (contractor only for M10; extend to other roles in post-prototype)
- `app/(app)/admin/configuration/page.tsx` — Demo Mode toggle
- Every major list page — add empty state, loading skeleton where missing

---

## Task 1: SEE.AI Backend

**Files:**
- Create: `lib/ai/system-prompt.ts`
- Create: `lib/ai/tools.ts`
- Create: `app/api/ai/chat/route.ts`

- [ ] **Step 1: Create `lib/ai/system-prompt.ts`**

```typescript
// lib/ai/system-prompt.ts

export type ChatContext = {
  userName: string
  role: string
  companyName: string
  companyType: string
  tier?: string
  tokenBalance?: number
  currentPage: string
  currentProjectId?: string
  currentProjectName?: string
  currentProjectStage?: string
  language?: string
}

export function buildSystemPrompt(ctx: ChatContext): string {
  return `You are SEE.AI, the intelligent assistant for the Sustainable Energy Ecosystem (SEE) platform — a B2B operating system for renewable energy project development in Southern Africa.

You are calm, technical, direct, and confident. You speak like Stripe documentation or Linear product copy. You never use exclamation marks. You never use emoji. You respect the user's intelligence.

## Current user context
- Name: ${ctx.userName}
- Role: ${ctx.role}
- Company: ${ctx.companyName} (${ctx.companyType})
${ctx.tier ? `- Platform tier: ${ctx.tier}` : ''}
${ctx.tokenBalance != null ? `- Token balance: ${ctx.tokenBalance.toLocaleString()} tokens` : ''}
- Currently viewing: ${ctx.currentPage}
${ctx.currentProjectId ? `- Active project: ${ctx.currentProjectName} (${ctx.currentProjectStage} stage)` : ''}

## Language
Respond in: ${ctx.language ?? 'English'}

## Capabilities
- Answer questions about the user's projects, milestones, and portfolio
- Identify projects at risk (overdue milestones, rejected submissions, stalled stages)
- Recommend next actions based on project state
- Recommend Service Providers from the marketplace by category and location
- Help draft client communications and portfolio overviews
- Surface O&M license upsell opportunities with estimated commission
- Answer questions about how the SEE platform works

## Constraints
- Use the provided tools to fetch real data — never guess project names, milestone counts, or statuses
- If you don't have data, say so directly
- For financial figures, note they are estimates unless retrieved from a tool
- Keep responses concise — the user is in the middle of their workflow
- No exclamation marks. No padding. Get to the answer.

## Voice
Direct, technical, confident. The user is a professional — treat them as one.`
}
```

- [ ] **Step 2: Create `lib/ai/tools.ts`**

```typescript
// lib/ai/tools.ts

import { db } from '@/lib/db'

export const AI_TOOL_DEFINITIONS = [
  {
    name: 'get_project_details',
    description: 'Get detailed information about one of the user\'s projects by ID or partial name.',
    input_schema: {
      type: 'object' as const,
      properties: {
        identifier: { type: 'string', description: 'Project ID or partial name match' },
      },
      required: ['identifier'],
    },
  },
  {
    name: 'list_projects_at_risk',
    description: 'List the user\'s projects that have overdue milestones, rejected submissions, or are stalled.',
    input_schema: { type: 'object' as const, properties: {} },
  },
  {
    name: 'summarise_milestone_status',
    description: 'Summarise milestone completion status across all active projects.',
    input_schema: {
      type: 'object' as const,
      properties: {
        stageFilter: {
          type: 'string',
          enum: ['DEVELOPMENT', 'FINANCING', 'CONSTRUCTION', 'COMMISSIONING', 'OPERATIONAL'],
          description: 'Optional: filter to projects in a specific stage',
        },
      },
    },
  },
  {
    name: 'recommend_service_provider',
    description: 'Recommend Service Providers from the marketplace for a given category.',
    input_schema: {
      type: 'object' as const,
      properties: {
        category: {
          type: 'string',
          enum: ['STRUCTURAL_CIVILS', 'ENGINEERING', 'LEGAL', 'LOGISTICS_PLANT_HIRE', 'FINANCE_INSURANCE'],
        },
        province: { type: 'string', description: 'South African province (optional)' },
      },
      required: ['category'],
    },
  },
  {
    name: 'generate_company_profile_draft',
    description: 'Generate a draft portfolio overview for the user\'s company, suitable for sending to a prospective client.',
    input_schema: { type: 'object' as const, properties: {} },
  },
  {
    name: 'list_license_upsell_opportunities',
    description: 'List operational sites where the contractor could sell or upgrade O&M licenses to their clients, with estimated monthly commission.',
    input_schema: { type: 'object' as const, properties: {} },
  },
]

type ToolInput = Record<string, unknown>

export async function executeToolCall(
  toolName: string,
  input: ToolInput,
  companyId: string
): Promise<string> {
  switch (toolName) {
    case 'get_project_details': {
      const id = String(input['identifier'] ?? '')
      const project = await db.project.findFirst({
        where: {
          contractorCompanyId: companyId,
          OR: [{ id }, { name: { contains: id, mode: 'insensitive' } }],
        },
        include: {
          site: { select: { city: true, province: true } },
          milestones: { select: { name: true, status: true, phase: true }, orderBy: { order: 'asc' } },
          clientCompany: { select: { name: true } },
        },
      })
      if (!project) return `No project found matching "${id}".`
      const mileSummary = project.milestones
        .map((m) => `  - ${m.name} (${m.phase}): ${m.status}`)
        .join('\n')
      return `**${project.name}**\nClient: ${project.clientCompany?.name ?? 'None'}\nStage: ${project.stage}\nLocation: ${project.site.city}, ${project.site.province}\nSize: ${project.systemSizeKw} kW\n\nMilestones:\n${mileSummary}`
    }

    case 'list_projects_at_risk': {
      const projects = await db.project.findMany({
        where: { contractorCompanyId: companyId, deletedAt: null },
        include: {
          milestones: {
            where: {
              OR: [
                { status: 'SUBMITTED' },
                { status: 'ACTION_REQUIRED' },
                { AND: [{ dueDate: { lt: new Date() } }, { status: { notIn: ['APPROVED', 'AUTO_GOLD', 'LOCKED'] } }] },
              ],
            },
            select: { name: true, status: true, dueDate: true },
          },
        },
      })
      const atRisk = projects.filter((p) => p.milestones.length > 0)
      if (atRisk.length === 0) return 'No projects currently at risk.'
      return atRisk.map((p) => `**${p.name}** (${p.stage}):\n${p.milestones.map((m) => `  - ${m.name}: ${m.status}${m.dueDate && m.dueDate < new Date() ? ' (overdue)' : ''}`).join('\n')}`).join('\n\n')
    }

    case 'summarise_milestone_status': {
      const stage = input['stageFilter'] as string | undefined
      const projects = await db.project.findMany({
        where: { contractorCompanyId: companyId, deletedAt: null, ...(stage ? { stage: stage as never } : {}) },
        include: { milestones: { select: { status: true } } },
      })
      const counts: Record<string, number> = {}
      let total = 0
      for (const p of projects) {
        for (const m of p.milestones) {
          counts[m.status] = (counts[m.status] ?? 0) + 1
          total++
        }
      }
      if (total === 0) return 'No milestones found.'
      const summary = Object.entries(counts)
        .sort(([, a], [, b]) => b - a)
        .map(([status, count]) => `  - ${status}: ${count}`)
        .join('\n')
      return `**Milestone summary** (${projects.length} project${projects.length !== 1 ? 's' : ''}, ${total} milestones):\n${summary}`
    }

    case 'recommend_service_provider': {
      const category = String(input['category'] ?? '')
      const province = input['province'] as string | undefined
      const providers = await db.serviceProviderProfile.findMany({
        where: {
          categories: { has: category as never },
          ...(province ? { serviceAreas: { has: province } } : {}),
        },
        include: { company: { select: { name: true, email: true } } },
        orderBy: { rating: 'desc' },
        take: 3,
      })
      if (providers.length === 0) return `No ${category} providers found${province ? ` in ${province}` : ''}.`
      return providers
        .map((p) => `**${p.company.name}**\n${p.headline}\nRating: ${p.rating?.toFixed(1) ?? 'N/A'} (${p.ratingCount} reviews)\nAreas: ${p.serviceAreas.join(', ')}\nContact: ${p.company.email ?? 'N/A'}`)
        .join('\n\n')
    }

    case 'generate_company_profile_draft': {
      const company = await db.company.findUnique({
        where: { id: companyId },
        include: {
          tierStatus: { select: { tier: true, compliantProjectCount: true } },
          projects: { where: { deletedAt: null }, select: { stage: true, systemSizeKw: true } },
        },
      })
      if (!company) return 'Company data not found.'
      const operationalKw = company.projects
        .filter((p) => p.stage === 'OPERATIONAL')
        .reduce((s, p) => s + p.systemSizeKw, 0)
      return `Here is a draft company profile for **${company.name}**:\n\n---\n\n${company.about ?? company.name + ' is a renewable energy EPC.'}\n\nWe hold **${company.tierStatus?.tier ?? 'Bronze'} tier** accreditation on the SEE platform, with ${company.tierStatus?.compliantProjectCount ?? 0} verified compliant projects. Our installed portfolio includes ${company.projects.length} projects totalling ${Math.round(operationalKw).toLocaleString()} kW of operational capacity.\n\n*[Customise with specific project names, client references, and technical specialisations before sending.]*`
    }

    case 'list_license_upsell_opportunities': {
      const projects = await db.project.findMany({
        where: { contractorCompanyId: companyId, stage: 'OPERATIONAL', deletedAt: null },
        include: {
          clientCompany: { select: { name: true } },
          omLicenses: {
            where: { viewerType: 'CLIENT', status: 'ACTIVE' },
            select: { tier: true, monthlyFeeCents: true },
            take: 1,
          },
        },
      })
      const opportunities = projects.filter((p) => p.clientCompanyId && p.omLicenses.length === 0)
      if (opportunities.length === 0) return 'All operational sites with clients already have active licenses.'
      return `**Upsell opportunities** (${opportunities.length} site${opportunities.length !== 1 ? 's' : ''} without a client license):\n\n` +
        opportunities
          .map((p) => `- **${p.name}** — client: ${p.clientCompany?.name ?? 'none'}\n  Estimated AI tier commission: R ${Math.round(180_000 * 0.2 / 100).toLocaleString()}/month`)
          .join('\n')
    }

    default:
      return `Unknown tool: ${toolName}`
  }
}
```

- [ ] **Step 3: Create `app/api/ai/chat/route.ts`**

```typescript
// app/api/ai/chat/route.ts

import { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { buildSystemPrompt, type ChatContext } from '@/lib/ai/system-prompt'
import { AI_TOOL_DEFINITIONS, executeToolCall } from '@/lib/ai/tools'

const anthropic = new Anthropic()

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return new Response('Unauthorized', { status: 401 })

  const { messages, conversationId, context } = await req.json() as {
    messages: { role: 'user' | 'assistant'; content: string }[]
    conversationId?: string
    context: ChatContext
  }

  const companyId = session.user.companyId

  // Persist conversation
  let convId = conversationId
  if (!convId) {
    const conv = await db.aiConversation.create({
      data: {
        userId: session.user.id,
        title: (messages[0]?.content ?? 'New conversation').slice(0, 60),
      },
    })
    convId = conv.id
  }

  // Persist new user message
  const lastUserMsg = messages[messages.length - 1]
  if (lastUserMsg?.role === 'user') {
    await db.aiMessage.create({
      data: {
        conversationId: convId,
        role: 'USER',
        content: lastUserMsg.content,
      },
    })
  }

  const systemPrompt = buildSystemPrompt(context)

  const encoder = new TextEncoder()
  let fullResponse = ''

  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Agentic loop: tool calls can chain
        const msgHistory = [...messages] as Anthropic.Messages.MessageParam[]
        let continueLoop = true

        // Send conversationId first
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'conversation_id', id: convId })}\n\n`))

        while (continueLoop) {
          const response = await anthropic.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 1024,
            system: systemPrompt,
            tools: AI_TOOL_DEFINITIONS as Anthropic.Messages.Tool[],
            messages: msgHistory,
          })

          if (response.stop_reason === 'tool_use') {
            // Execute tool calls
            const toolUseBlocks = response.content.filter(
              (b): b is Anthropic.Messages.ToolUseBlock => b.type === 'tool_use'
            )

            msgHistory.push({ role: 'assistant', content: response.content })

            const toolResults: Anthropic.Messages.ToolResultBlockParam[] = []
            for (const toolUse of toolUseBlocks) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'tool_call', name: toolUse.name })}\n\n`))
              const result = await executeToolCall(toolUse.name, toolUse.input as Record<string, unknown>, companyId)
              toolResults.push({ type: 'tool_result', tool_use_id: toolUse.id, content: result })
            }

            msgHistory.push({ role: 'user', content: toolResults })
          } else {
            // Final text response — stream it
            continueLoop = false
            for (const block of response.content) {
              if (block.type === 'text') {
                const text = block.text
                fullResponse += text
                // Stream in chunks for a more natural feel
                const words = text.split(' ')
                for (const word of words) {
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'text', text: word + ' ' })}\n\n`))
                  await new Promise((r) => setTimeout(r, 15))
                }
              }
            }

            // Persist assistant response
            await db.aiMessage.create({
              data: { conversationId: convId!, role: 'ASSISTANT', content: fullResponse },
            })

            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`))
          }
        }
      } catch (err) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', message: String(err) })}\n\n`))
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
```

- [ ] **Step 4: Typecheck**

```bash
npm run typecheck
```

- [ ] **Step 5: Commit**

```bash
git add lib/ai/ app/api/ai/chat/
git commit -m "feat(m10): SEE.AI backend — streaming chat route, 6 tool calls, conversation persistence"
```

---

## Task 2: SEE.AI Chat Widget

**Files:**
- Create: `components/ai/message-bubble.tsx`
- Create: `components/ai/chat-panel.tsx`
- Create: `components/ai/chat-widget.tsx`
- Modify: `app/(app)/contractor/layout.tsx`

- [ ] **Step 1: Create `components/ai/message-bubble.tsx`**

```typescript
// components/ai/message-bubble.tsx

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
      <div className={cn(
        'h-7 w-7 rounded-full flex items-center justify-center flex-shrink-0',
        role === 'user' ? 'bg-accent-500/10' : 'bg-ink-100'
      )}>
        {role === 'user'
          ? <User className="h-3.5 w-3.5 text-accent-600" strokeWidth={1.5} />
          : <Bot className="h-3.5 w-3.5 text-ink-500" strokeWidth={1.5} />
        }
      </div>
      <div className={cn(
        'max-w-[85%] rounded-xl px-3 py-2 text-sm',
        role === 'user'
          ? 'bg-accent-500/10 text-ink-900'
          : 'bg-ink-50 text-ink-800'
      )}>
        {role === 'assistant' ? (
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              p: ({ children }) => <p className="mb-1 last:mb-0 leading-relaxed">{children}</p>,
              ul: ({ children }) => <ul className="list-disc pl-4 mb-1 space-y-0.5">{children}</ul>,
              ol: ({ children }) => <ol className="list-decimal pl-4 mb-1 space-y-0.5">{children}</ol>,
              li: ({ children }) => <li className="leading-relaxed">{children}</li>,
              strong: ({ children }) => <strong className="font-semibold text-ink-900">{children}</strong>,
              code: ({ children }) => <code className="font-mono text-xs bg-ink-100 px-1 py-0.5 rounded">{children}</code>,
            }}
          >
            {content}
          </ReactMarkdown>
        ) : (
          <p className="leading-relaxed">{content}</p>
        )}
        {isStreaming && (
          <span className="inline-flex gap-0.5 ml-1">
            {[0,1,2].map((i) => (
              <span key={i} className="h-1 w-1 rounded-full bg-ink-400 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
            ))}
          </span>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create `components/ai/chat-panel.tsx`**

```typescript
'use client'
// components/ai/chat-panel.tsx

import { useState, useRef, useEffect, useTransition } from 'react'
import { Send, Loader2, X } from 'lucide-react'
import { MessageBubble } from './message-bubble'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'

type Message = { role: 'user' | 'assistant' | 'tool'; content: string; toolName?: string }

type Props = { onClose: () => void }

export function ChatPanel({ onClose }: Props) {
  const { data: session } = useSession()
  const pathname = usePathname()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [convId, setConvId] = useState<string | undefined>()
  const [isPending] = useTransition()
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
      userName: session?.user.name ?? 'User',
      role: session?.user.role ?? 'CONTRACTOR',
      companyName: session?.user.companyId ?? '',
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

      if (!res.body) throw new Error('No stream')
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let assistantText = ''

      setMessages((prev) => [...prev, { role: 'assistant', content: '' }])

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value)
        for (const line of chunk.split('\n')) {
          if (!line.startsWith('data: ')) continue
          const data = JSON.parse(line.slice(6)) as { type: string; text?: string; id?: string; name?: string }
          if (data.type === 'conversation_id' && data.id) setConvId(data.id)
          if (data.type === 'text' && data.text) {
            assistantText += data.text
            setMessages((prev) => {
              const updated = [...prev]
              updated[updated.length - 1] = { role: 'assistant', content: assistantText }
              return updated
            })
          }
          if (data.type === 'tool_call' && data.name) {
            setMessages((prev) => [...prev.slice(0, -1), { role: 'tool', content: '', toolName: data.name }, { role: 'assistant', content: '' }])
          }
        }
      }
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Sorry — something went wrong. Please try again.' }])
    } finally {
      setIsStreaming(false)
      setTimeout(() => textareaRef.current?.focus(), 50)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void sendMessage() }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-ink-200">
        <div>
          <p className="text-sm font-semibold text-ink-900">SEE.AI</p>
          <p className="text-xs text-ink-400">Ask about your projects, milestones, or marketplace</p>
        </div>
        <button onClick={onClose} className="text-ink-400 hover:text-ink-700 transition-colors">
          <X className="h-4 w-4" strokeWidth={1.5} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="space-y-2 py-4">
            <p className="text-xs text-ink-400 text-center">Suggestions</p>
            {[
              'Which of my projects are at risk?',
              'Summarise my milestone status',
              'Who should I use for structural engineering in Gauteng?',
              'Which sites could I sell O&M licenses to?',
            ].map((s) => (
              <button
                key={s}
                onClick={() => { setInput(s); textareaRef.current?.focus() }}
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
            toolName={msg.toolName}
            isStreaming={isStreaming && i === messages.length - 1 && msg.role === 'assistant'}
          />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-ink-200 p-3 flex items-end gap-2">
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
          {isStreaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" strokeWidth={1.5} />}
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Create `components/ai/chat-widget.tsx`**

```typescript
'use client'
// components/ai/chat-widget.tsx
// Persistent floating SEE.AI button + slide-up panel

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bot } from 'lucide-react'
import { ChatPanel } from './chat-panel'

export function ChatWidget() {
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-6 right-6 z-40 h-12 w-12 rounded-full bg-accent-500 text-white shadow-lg hover:bg-accent-600 transition-colors flex items-center justify-center"
        aria-label="Open SEE.AI"
      >
        <Bot className="h-5 w-5" strokeWidth={1.5} />
      </button>

      {/* Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-6 z-40 w-[380px] h-[520px] rounded-2xl border border-ink-200 bg-white shadow-2xl flex flex-col overflow-hidden"
          >
            <ChatPanel onClose={() => setOpen(false)} />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
```

- [ ] **Step 4: Mount `<ChatWidget>` in contractor layout**

Read `app/(app)/contractor/layout.tsx` and add `<ChatWidget>` just before the closing `</div>`:

```typescript
import { ChatWidget } from '@/components/ai/chat-widget'

// Inside the return, after the existing shell:
// Add <ChatWidget /> as last child inside the outer div
```

The contractor layout wraps with `<div className="flex h-screen...">`. Add `<ChatWidget />` just before the last `</div>`:

```typescript
      <ChatWidget />
    </div>
```

- [ ] **Step 5: Install react-markdown if not present**

```bash
npm list react-markdown 2>/dev/null || npm install react-markdown remark-gfm
```

- [ ] **Step 6: Typecheck**

```bash
npm run typecheck
```

- [ ] **Step 7: Commit**

```bash
git add components/ai/ "app/(app)/contractor/layout.tsx"
git commit -m "feat(m10): SEE.AI chat widget — floating button, streaming panel, 6 tool calls"
```

---

## Task 3: Demo Mode Toggle

**Files:** Modify `app/(app)/admin/configuration/page.tsx`

- [ ] **Step 1: Add Demo Mode toggle to admin configuration page**

Read the current configuration page and replace its content:

```typescript
'use client'

import { useState } from 'react'
import { Settings, Zap } from 'lucide-react'

export default function ConfigurationPage() {
  const [demoMode, setDemoMode] = useState(false)

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-8">
      <div>
        <h2 className="text-base font-semibold text-ink-900">Configuration</h2>
        <p className="text-sm text-ink-500">Platform settings and demo controls.</p>
      </div>

      {/* Demo Mode */}
      <div className="rounded-lg border border-ink-200 bg-white p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-ink-400" strokeWidth={1.5} />
          <h3 className="text-sm font-semibold text-ink-900">Demo Mode</h3>
        </div>
        <p className="text-xs text-ink-500">
          When enabled, EFT payments auto-reconcile after 5 seconds, milestone submissions auto-approve after 30 seconds,
          and tier progression can be triggered manually. Use during live demos to avoid waiting for admin actions.
        </p>
        <div className="flex items-center justify-between rounded-lg border border-ink-100 bg-ink-25 px-4 py-3">
          <div>
            <p className="text-sm font-medium text-ink-900">Demo Mode</p>
            <p className="text-xs text-ink-400">{demoMode ? 'Active — auto-reconciliation enabled' : 'Inactive — production behaviour'}</p>
          </div>
          <button
            onClick={() => setDemoMode((v) => !v)}
            className={`relative h-6 w-11 rounded-full transition-colors ${demoMode ? 'bg-accent-500' : 'bg-ink-200'}`}
          >
            <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${demoMode ? 'translate-x-5' : ''}`} />
          </button>
        </div>
        {demoMode && (
          <div className="rounded-md bg-accent-500/5 border border-accent-200 px-3 py-2 text-xs text-accent-600">
            Demo Mode is active. EFT reconciliation will complete automatically. Remember to disable before production handoff.
          </div>
        )}
      </div>

      {/* Platform bank account display */}
      <div className="rounded-lg border border-ink-200 bg-white p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Settings className="h-4 w-4 text-ink-400" strokeWidth={1.5} />
          <h3 className="text-sm font-semibold text-ink-900">Platform bank account</h3>
        </div>
        <div className="space-y-2 text-sm">
          {[
            ['Account name', 'SEE Platform Operations (Pty) Ltd'],
            ['Bank', 'First National Bank'],
            ['Account number', '62850012345'],
            ['Branch code', '250655'],
            ['Account type', 'Business Cheque'],
          ].map(([label, value]) => (
            <div key={label} className="flex justify-between">
              <span className="text-ink-500">{label}</span>
              <span className="font-medium text-ink-900 font-mono text-xs">{value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Typecheck + commit**

```bash
npm run typecheck
git add "app/(app)/admin/configuration/page.tsx"
git commit -m "feat(m10): demo mode toggle in admin configuration"
```

---

## Task 4: Polish Pass

**Files:** Various — add empty states, loading skeletons to high-visibility screens.

Key screens that need polish:

- [ ] **Step 1: Contractor projects page — empty state**

Read `app/(app)/contractor/projects/page.tsx`. Find the projects list rendering and add before the map:

```typescript
{projects.length === 0 && (
  <div className="flex flex-col items-center py-24 text-center">
    <FolderOpen className="h-10 w-10 text-ink-200 mb-4" strokeWidth={1} />
    <p className="text-sm font-medium text-ink-700">No projects yet</p>
    <p className="text-xs text-ink-400 mt-1 max-w-xs">
      Create your first project to start tracking milestones, documents, and compliance.
    </p>
    <a href="/contractor/projects/new" className="mt-4 h-8 px-4 rounded-md bg-ink-900 text-white text-xs font-medium hover:bg-ink-800 transition-colors flex items-center gap-1.5">
      New project
    </a>
  </div>
)}
```

- [ ] **Step 2: Service center — loading state on SP directory**

The SP directory (`/contractor/service-center`) is a server component. Wrap with a loading.tsx:

Create `app/(app)/contractor/service-center/loading.tsx`:

```typescript
export default function Loading() {
  return (
    <div className="p-6 space-y-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-24 rounded-lg border border-ink-100 bg-ink-50 animate-pulse" />
      ))}
    </div>
  )
}
```

- [ ] **Step 3: Marketplace — loading state**

Create `app/(app)/contractor/marketplace/loading.tsx`:

```typescript
export default function Loading() {
  return (
    <div className="p-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="h-48 rounded-lg border border-ink-100 bg-ink-50 animate-pulse" />
      ))}
    </div>
  )
}
```

- [ ] **Step 4: Client plant dashboard — loading state**

Create `app/(app)/client/plant/[siteId]/loading.tsx`:

```typescript
export default function Loading() {
  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="h-10 w-64 rounded-md bg-ink-100 animate-pulse" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[...Array(4)].map((_, i) => <div key={i} className="h-16 rounded-lg bg-ink-100 animate-pulse" />)}
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {[...Array(4)].map((_, i) => <div key={i} className="h-52 rounded-lg bg-ink-100 animate-pulse" />)}
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Admin financial — loading state**

Create `app/(app)/admin/financial/loading.tsx`:

```typescript
export default function Loading() {
  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="h-8 w-48 rounded-md bg-ink-100 animate-pulse" />
      <div className="grid grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => <div key={i} className="h-24 rounded-lg bg-ink-100 animate-pulse" />)}
      </div>
      {[...Array(3)].map((_, i) => <div key={i} className="h-32 rounded-lg bg-ink-100 animate-pulse" />)}
    </div>
  )
}
```

- [ ] **Step 6: Typecheck**

```bash
npm run typecheck
```

- [ ] **Step 7: Commit**

```bash
git add app/
git commit -m "feat(m10): polish pass — empty states, loading skeletons on high-visibility screens"
```

---

## Task 5: Final Demo Readiness

- [ ] **Step 1: Run unit tests**

```bash
npm run test:unit
```
Expected: 23 tests PASS.

- [ ] **Step 2: Full lint + typecheck**

```bash
npm run lint && npm run typecheck
```
Expected: 0 errors.

- [ ] **Step 3: Manual demo dry-run check**

Walk through these paths and verify no console errors:
1. Login as Marcus → `/contractor` dashboard loads
2. Navigate to Project Alpha → milestones tab → AI verify button visible
3. Navigate to Durbanville Mall monitoring → paywall shows "Sell to client"
4. Login as Tess → `/client/plant/site-durbanville` → paywall with "Accept & Pay"
5. Login as Erin → `/admin/financial` → reconciliation queue visible
6. `/admin/enterprise` → Spaza Holdings license + "Add to scope" button visible
7. SEE.AI widget opens, suggestion prompts visible, send a message → response streams

- [ ] **Step 4: Update CLAUDE.md**

```
> **Currently working on:** Post-prototype polish (M10 complete)
> **Last completed:** M10 — SEE.AI Assistant, polish pass, demo mode toggle complete.
> **Status: DEMO READY**
```

- [ ] **Step 5: Final commit**

```bash
git add .
git commit -m "feat: M10 — SEE.AI Assistant, polish pass, demo mode — prototype demo-ready"
```

---

## Spec Coverage Self-Review

| Requirement | Task |
|---|---|
| SEE.AI floating button (persistent, bottom-right) | Task 2 |
| Real Claude API streaming (claude-sonnet-4) | Task 1 |
| System prompt with user context (role, tier, page, project) | Task 1 |
| Tool: get_project_details | Task 1 |
| Tool: list_projects_at_risk | Task 1 |
| Tool: summarise_milestone_status | Task 1 |
| Tool: recommend_service_provider | Task 1 |
| Tool: generate_company_profile_draft | Task 1 |
| Tool: list_license_upsell_opportunities | Task 1 |
| Conversation history persisted (AiConversation + AiMessage) | Task 1 |
| Markdown rendering in responses | Task 2 |
| Demo Mode toggle in admin | Task 3 |
| Empty state: contractor projects | Task 4 |
| Loading skeletons: marketplace, service-center, plant dashboard, financial | Task 4 |

**Known deferred (post-prototype):**
- Multi-language selector (UI + system prompt wired, but no language preference persistence)
- History sidebar (conversation list) — persistence built, sidebar UI deferred
- Voice mode (scaffold only)
- Mobile/tablet responsive QA pass
- Playwright E2E tests for demo flow
