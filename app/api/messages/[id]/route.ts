// app/api/messages/[id]/route.ts
// PATCH: edit own message
// DELETE: soft-delete own message

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { canAccessChannel } from '@/lib/comms/access'
import { z } from 'zod'

const editSchema = z.object({
  body: z.string().min(1).max(10000),
})

export async function PATCH(
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
    select: { channelId: true, authorUserId: true, deletedAt: true, isSystem: true },
  })
  if (!message) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (message.deletedAt) return NextResponse.json({ error: 'Message is deleted' }, { status: 410 })
  if (message.isSystem || message.authorUserId !== userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const hasAccess = await canAccessChannel(userId, message.channelId)
  if (!hasAccess) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  let body: z.infer<typeof editSchema>
  try {
    const json = await req.json() as unknown
    body = editSchema.parse(json)
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const updated = await db.message.update({
    where: { id: messageId },
    data: { body: body.body, editedAt: new Date() },
    select: { id: true, body: true, editedAt: true },
  })

  return NextResponse.json({ message: updated })
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = session.user.id
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: messageId } = await params

  const message = await db.message.findUnique({
    where: { id: messageId },
    select: { channelId: true, authorUserId: true, deletedAt: true, isSystem: true },
  })
  if (!message) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (message.deletedAt) return NextResponse.json({ error: 'Already deleted' }, { status: 410 })
  if (message.isSystem || message.authorUserId !== userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const hasAccess = await canAccessChannel(userId, message.channelId)
  if (!hasAccess) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  await db.message.update({
    where: { id: messageId },
    data: { deletedAt: new Date() },
  })

  return NextResponse.json({ ok: true })
}
