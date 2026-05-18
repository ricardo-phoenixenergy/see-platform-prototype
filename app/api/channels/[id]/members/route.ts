// app/api/channels/[id]/members/route.ts
// GET: list channel members
// POST: add a member (invite)

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { canAccessChannel } from '@/lib/comms/access'
import { z } from 'zod'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = session.user.id
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: channelId } = await params

  const hasAccess = await canAccessChannel(userId, channelId)
  if (!hasAccess) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const memberships = await db.channelMembership.findMany({
    where: { channelId, leftAt: null },
    select: {
      id: true,
      role: true,
      joinedAt: true,
      user: { select: { id: true, name: true, image: true } },
    },
    orderBy: { joinedAt: 'asc' },
  })

  return NextResponse.json({ members: memberships })
}

const inviteSchema = z.object({
  userId: z.string(),
  role: z.enum(['MEMBER', 'GUEST', 'OBSERVER']).default('MEMBER'),
})

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = session.user.id
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: channelId } = await params

  // Only OWNER can invite
  const membership = await db.channelMembership.findFirst({
    where: { channelId, userId, leftAt: null },
    select: { role: true },
  })
  if (!membership || membership.role !== 'OWNER') {
    return NextResponse.json({ error: 'Forbidden — OWNER role required' }, { status: 403 })
  }

  let body: z.infer<typeof inviteSchema>
  try {
    const json = await req.json() as unknown
    body = inviteSchema.parse(json)
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  // Upsert — re-invite if previously left
  const existing = await db.channelMembership.findFirst({
    where: { channelId, userId: body.userId },
  })

  if (existing) {
    const updated = await db.channelMembership.update({
      where: { id: existing.id },
      data: { role: body.role, leftAt: null },
    })
    return NextResponse.json({ membership: updated, created: false })
  }

  const created = await db.channelMembership.create({
    data: { channelId, userId: body.userId, role: body.role },
  })

  // Post system message
  await db.message.create({
    data: {
      channelId,
      authorUserId: null,
      isSystem: true,
      body: `A new member joined the channel.`,
    },
  })
  await db.channel.update({ where: { id: channelId }, data: { lastMessageAt: new Date() } })

  return NextResponse.json({ membership: created, created: true }, { status: 201 })
}
