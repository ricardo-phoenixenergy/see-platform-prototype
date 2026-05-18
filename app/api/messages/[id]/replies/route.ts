// app/api/messages/[id]/replies/route.ts
// GET: fetch thread replies for a parent message

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { canAccessChannel } from '@/lib/comms/access'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = session.user.id
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: parentMessageId } = await params

  const parent = await db.message.findUnique({
    where: { id: parentMessageId },
    select: { channelId: true },
  })
  if (!parent) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const hasAccess = await canAccessChannel(userId, parent.channelId)
  if (!hasAccess) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const replies = await db.message.findMany({
    where: { parentMessageId, deletedAt: null },
    include: {
      author: { select: { id: true, name: true, image: true } },
      reactions: { select: { id: true, emoji: true, userId: true } },
    },
    orderBy: { createdAt: 'asc' },
  })

  const repliesWithGroupedReactions = replies.map((msg) => {
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
      isSystem: msg.isSystem,
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
      replyCount: 0,
    }
  })

  return NextResponse.json({ replies: repliesWithGroupedReactions })
}
