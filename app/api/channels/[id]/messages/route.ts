// app/api/channels/[id]/messages/route.ts
// GET: paginated messages for a channel
// POST: send a new message

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { canAccessChannel, assertCanPostToChannel } from '@/lib/comms/access'
import { z } from 'zod'

const postBodySchema = z.object({
  body: z.string().min(1).max(10000),
  parentMessageId: z.string().optional(),
})

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = session.user.id
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: channelId } = await params

  const hasAccess = await canAccessChannel(userId, channelId)
  if (!hasAccess) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const url = new URL(req.url)
  const sinceParam = url.searchParams.get('since')
  // `since` is an ISO timestamp string — no extra DB lookup needed
  const sinceDate = sinceParam ? new Date(sinceParam) : undefined
  const limit = Math.min(parseInt(url.searchParams.get('limit') ?? '50', 10), 100)

  const messages = await db.message.findMany({
    where: {
      channelId,
      parentMessageId: null, // top-level messages only
      ...(sinceDate ? { createdAt: { gt: sinceDate } } : {}),
    },
    include: {
      author: { select: { id: true, name: true, image: true } },
      reactions: {
        select: { id: true, emoji: true, userId: true },
      },
      _count: { select: { replies: true } },
    },
    orderBy: { createdAt: 'asc' },
    take: limit,
  })

  // Group reactions by emoji
  const messagesWithGroupedReactions = messages.map((msg) => {
    const reactionMap = new Map<string, string[]>()
    for (const r of msg.reactions) {
      const users = reactionMap.get(r.emoji) ?? []
      users.push(r.userId)
      reactionMap.set(r.emoji, users)
    }
    const groupedReactions = Array.from(reactionMap.entries()).map(([emoji, userIds]) => ({
      emoji,
      userIds,
      count: userIds.length,
    }))

    return {
      id: msg.id,
      channelId: msg.channelId,
      authorUserId: msg.authorUserId,
      body: msg.body,
      parentMessageId: msg.parentMessageId,
      isPinned: msg.isPinned,
      attachments: msg.attachments,
      entityRefs: msg.entityRefs,
      mentions: msg.mentions,
      editedAt: msg.editedAt,
      deletedAt: msg.deletedAt,
      createdAt: msg.createdAt,
      updatedAt: msg.updatedAt,
      author: msg.author,
      reactions: groupedReactions,
      replyCount: msg._count.replies,
    }
  })

  return NextResponse.json({ messages: messagesWithGroupedReactions })
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = session.user.id
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: channelId } = await params

  try {
    await assertCanPostToChannel(userId, channelId)
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let body: z.infer<typeof postBodySchema>
  try {
    const json = await req.json() as unknown
    body = postBodySchema.parse(json)
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  // Extract @mention userIds from body (pattern @userId)
  const mentionPattern = /@([a-zA-Z0-9_-]+)/g
  const mentionMatches = Array.from(body.body.matchAll(mentionPattern))
  const mentionedIds = mentionMatches.map((m) => m[1])

  const mentionsData = mentionedIds.length > 0 ? mentionedIds : null
  const message = await db.message.create({
    data: {
      channelId,
      authorUserId: userId,
      body: body.body,
      parentMessageId: body.parentMessageId ?? null,
      // Prisma types Json fields as InputJsonValue which doesn't accept string[] directly
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mentions: mentionsData as any,
    },
    include: {
      author: { select: { id: true, name: true, image: true } },
      reactions: { select: { id: true, emoji: true, userId: true } },
      _count: { select: { replies: true } },
    },
  })

  // Update channel lastMessageAt
  await db.channel.update({
    where: { id: channelId },
    data: { lastMessageAt: new Date() },
  })

  // Create notifications for mentioned users (if any valid members)
  if (mentionedIds.length > 0) {
    const channel = await db.channel.findUnique({
      where: { id: channelId },
      select: { workspace: { select: { project: { select: { id: true, name: true } } } } },
    })

    for (const mentionedId of mentionedIds) {
      if (!mentionedId) continue
      if (mentionedId === userId) continue // don't notify yourself
      if (mentionedId === 'everyone') continue // skip @everyone for now

      try {
        // Prisma v7 strict union types conflict between userId:string and companyId:string|null
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (db.notification.create as any)({
          data: {
            userId: mentionedId,
            type: 'MESSAGE_MENTION',
            title: 'You were mentioned',
            body: `${session.user.name ?? 'Someone'} mentioned you in ${channel?.workspace.project.name ?? 'a project'}`,
            link: `/api/channels/${channelId}/messages`,
          },
        })
      } catch {
        // Non-critical — don't fail the message post
      }
    }
  }

  return NextResponse.json({
    message: {
      ...message,
      reactions: [],
      replyCount: 0,
    },
  })
}
