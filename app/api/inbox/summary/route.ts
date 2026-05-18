// app/api/inbox/summary/route.ts
// GET: unread summary across all user's channels

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(_req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = session.user.id
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Get all active channel memberships for the user
  const memberships = await db.channelMembership.findMany({
    where: { userId, leftAt: null },
    select: {
      channelId: true,
      lastReadAt: true,
      channel: {
        select: {
          id: true,
          name: true,
          displayName: true,
          isArchived: true,
          workspace: {
            select: {
              project: { select: { id: true, name: true } },
            },
          },
        },
      },
    },
  })

  // Filter out archived channels
  const activeMembers = memberships.filter((m) => !m.channel.isArchived)

  const channelSummaries = await Promise.all(
    activeMembers.map(async (m) => {
      const lastReadAt = m.lastReadAt

      const unreadCount = lastReadAt
        ? await db.message.count({
            where: {
              channelId: m.channelId,
              createdAt: { gt: lastReadAt },
              deletedAt: null,
              parentMessageId: null,
            },
          })
        : await db.message.count({
            where: {
              channelId: m.channelId,
              deletedAt: null,
              parentMessageId: null,
            },
          })

      // Get latest message
      const latestMessage = await db.message.findFirst({
        where: { channelId: m.channelId, deletedAt: null, parentMessageId: null },
        orderBy: { createdAt: 'desc' },
        select: {
          body: true,
          createdAt: true,
          author: { select: { name: true } },
        },
      })

      return {
        channelId: m.channelId,
        channelName: m.channel.displayName ?? m.channel.name,
        projectId: m.channel.workspace.project.id,
        projectName: m.channel.workspace.project.name,
        unreadCount,
        latestMessage: latestMessage
          ? {
              body: latestMessage.body,
              authorName: latestMessage.author?.name ?? 'System',
              createdAt: latestMessage.createdAt.toISOString(),
            }
          : null,
      }
    })
  )

  const totalUnread = channelSummaries.reduce((sum, ch) => sum + ch.unreadCount, 0)

  // Only return channels that have messages or unread counts
  const filtered = channelSummaries.filter((ch) => ch.latestMessage !== null)

  return NextResponse.json({
    totalUnread,
    channels: filtered,
  })
}
