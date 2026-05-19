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

  const { messages, conversationId, context } = (await req.json()) as {
    messages: { role: 'user' | 'assistant'; content: string }[]
    conversationId?: string
    context: ChatContext
  }

  const companyId = session.user.companyId

  // Persist or retrieve conversation
  let convId = conversationId
  if (!convId) {
    const conv = await db.aiConversation.create({
      data: {
        userId: session.user.id ?? '',
        title: (messages[0]?.content ?? 'New conversation').slice(0, 60),
      },
    })
    convId = conv.id
  }

  // Persist the latest user message
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
        // Agentic loop — tool calls can chain before final text response
        const msgHistory = [...messages] as Anthropic.Messages.MessageParam[]

        // Send conversationId to client first
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: 'conversation_id', id: convId })}\n\n`)
        )

        let continueLoop = true
        while (continueLoop) {
          const response = await anthropic.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 1024,
            system: systemPrompt,
            tools: AI_TOOL_DEFINITIONS as Anthropic.Messages.Tool[],
            messages: msgHistory,
          })

          if (response.stop_reason === 'tool_use') {
            const toolUseBlocks = response.content.filter(
              (b): b is Anthropic.Messages.ToolUseBlock => b.type === 'tool_use'
            )
            msgHistory.push({ role: 'assistant', content: response.content })

            const toolResults: Anthropic.Messages.ToolResultBlockParam[] = []
            for (const toolUse of toolUseBlocks) {
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({ type: 'tool_call', name: toolUse.name })}\n\n`
                )
              )
              const result = await executeToolCall(
                toolUse.name,
                toolUse.input as Record<string, unknown>,
                companyId
              )
              toolResults.push({ type: 'tool_result', tool_use_id: toolUse.id, content: result })
            }
            msgHistory.push({ role: 'user', content: toolResults })
          } else {
            // Final response — stream text word by word
            continueLoop = false
            for (const block of response.content) {
              if (block.type === 'text') {
                fullResponse += block.text
                const words = block.text.split(' ')
                for (const word of words) {
                  controller.enqueue(
                    encoder.encode(
                      `data: ${JSON.stringify({ type: 'text', text: word + ' ' })}\n\n`
                    )
                  )
                  await new Promise((r) => setTimeout(r, 15))
                }
              }
            }

            // Persist assistant response
            if (fullResponse && convId) {
              await db.aiMessage.create({
                data: { conversationId: convId, role: 'ASSISTANT', content: fullResponse },
              })
            }

            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`))
          }
        }
      } catch (err) {
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: 'error', message: String(err) })}\n\n`
          )
        )
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
