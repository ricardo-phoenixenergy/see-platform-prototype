// app/api/channels/[id]/route.ts
// PATCH: rename / set topic / archive a channel (OWNER only)

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { z } from 'zod'

const patchSchema = z.object({
  displayName: z.string().min(1).max(80).optional(),
  topic: z.string().max(250).optional(),
  isArchived: z.boolean().optional(),
})

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = session.user.id
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: channelId } = await params

  const membership = await db.channelMembership.findFirst({
    where: { channelId, userId, leftAt: null },
    select: { role: true },
  })
  if (!membership || membership.role !== 'OWNER') {
    return NextResponse.json({ error: 'Forbidden — OWNER role required' }, { status: 403 })
  }

  let body: z.infer<typeof patchSchema>
  try {
    const json = await req.json() as unknown
    body = patchSchema.parse(json)
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const updated = await db.channel.update({
    where: { id: channelId },
    data: {
      ...(body.displayName !== undefined && { displayName: body.displayName }),
      ...(body.topic !== undefined && { topic: body.topic }),
      ...(body.isArchived !== undefined && { isArchived: body.isArchived }),
    },
    select: { id: true, name: true, displayName: true, topic: true, isArchived: true },
  })

  return NextResponse.json({ channel: updated })
}
