// app/api/inbox/summary/route.ts
// GET: unread summary across all user's channels — batched to avoid N+1

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = session.user.id
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

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

  const activeMembers = memberships.filter((m) => !m.channel.isArchived)
  const channelIds = activeMembers.map((m) => m.channelId)

  if (channelIds.length === 0) {
    return NextResponse.json({ totalUnread: 0, channels: [] })
  }

  // Single query: fetch all top-level, non-deleted messages across all channels
  const allMessages = await db.message.findMany({
    where: {
      channelId: { in: channelIds },
      deletedAt: null,
      parentMessageId: null,
    },
    select: {
      id: true,
      channelId: true,
      body: true,
      createdAt: true,
      author: { select: { name: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  // Group by channel in memory
  const byChannel = new Map<string, typeof allMessages>()
  for (const msg of allMessages) {
    const list = byChannel.get(msg.channelId) ?? []
    list.push(msg)
    byChannel.set(msg.channelId, list)
  }

  const channelSummaries = activeMembers.map((m) => {
    const msgs = byChannel.get(m.channelId) ?? []
    const lastReadAt = m.lastReadAt

    const unreadCount = lastReadAt
      ? msgs.filter((msg) => new Date(msg.createdAt) > new Date(lastReadAt)).length
      : msgs.length

    // msgs are already desc by createdAt — first is latest
    const latest = msgs[0] ?? null

    return {
      channelId: m.channelId,
      channelName: m.channel.displayName ?? m.channel.name,
      projectId: m.channel.workspace.project.id,
      projectName: m.channel.workspace.project.name,
      unreadCount,
      latestMessage: latest
        ? {
            body: latest.body,
            authorName: latest.author?.name ?? 'System',
            createdAt: latest.createdAt.toISOString(),
          }
        : null,
    }
  })

  const totalUnread = channelSummaries.reduce((sum, ch) => sum + ch.unreadCount, 0)
  const filtered = channelSummaries.filter((ch) => ch.latestMessage !== null)

  return NextResponse.json({ totalUnread, channels: filtered })
}
