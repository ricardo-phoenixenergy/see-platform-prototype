// app/api/messages/[id]/reactions/route.ts
// POST: toggle an emoji reaction on a message

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { canAccessChannel } from '@/lib/comms/access'
import { z } from 'zod'

const bodySchema = z.object({
  emoji: z.string().min(1).max(10),
})

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = session.user.id
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: messageId } = await params

  const message = await db.message.findUnique({
    where: { id: messageId },
    select: { channelId: true },
  })
  if (!message) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const hasAccess = await canAccessChannel(userId, message.channelId)
  if (!hasAccess) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  let body: z.infer<typeof bodySchema>
  try {
    const json = await req.json() as unknown
    body = bodySchema.parse(json)
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const existing = await db.messageReaction.findFirst({
    where: { messageId, userId, emoji: body.emoji },
  })

  if (existing) {
    await db.messageReaction.delete({ where: { id: existing.id } })
    return NextResponse.json({ added: false })
  } else {
    await db.messageReaction.create({
      data: { messageId, userId, emoji: body.emoji },
    })
    return NextResponse.json({ added: true })
  }
}
