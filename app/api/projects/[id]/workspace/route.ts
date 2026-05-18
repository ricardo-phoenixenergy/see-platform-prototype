// app/api/projects/[id]/workspace/route.ts
// Returns workspace + channels accessible to the current user for a project.

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = session.user.id
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: projectId } = await params

  const workspace = await db.projectWorkspace.findUnique({
    where: { projectId },
    select: {
      id: true,
      channels: {
        where: {
          isArchived: false,
          memberships: {
            some: { userId, leftAt: null },
          },
        },
        select: {
          id: true,
          name: true,
          displayName: true,
          description: true,
          kind: true,
          topic: true,
          isPinned: true,
          milestoneId: true,
          lastMessageAt: true,
          memberships: {
            where: { userId, leftAt: null },
            select: { lastReadAt: true },
          },
          _count: {
            select: { messages: true },
          },
        },
      },
    },
  })

  if (!workspace) {
    return NextResponse.json({ workspace: null, channels: [] })
  }

  // Build a map of channelId → lastReadAt from the user's memberships
  const membershipMap = new Map<string, Date | null>(
    workspace.channels.map((ch) => [
      ch.id,
      ch.memberships[0]?.lastReadAt ?? null,
    ])
  )
  const channelIds = workspace.channels.map((c) => c.id)

  // Fetch all candidate messages in ONE query, then filter per-channel in memory.
  // At demo scale (~80 messages total in seed) this is fine and avoids N+1 counts.
  const allMessages = await db.message.findMany({
    where: {
      channelId: { in: channelIds },
      deletedAt: null,
      parentMessageId: null, // only top-level messages count
    },
    select: { channelId: true, createdAt: true },
  })

  // Build unread count per channel in memory
  const unreadCountMap = new Map<string, number>()
  for (const msg of allMessages) {
    const lastRead = membershipMap.get(msg.channelId) ?? null
    if (lastRead === null || msg.createdAt > lastRead) {
      unreadCountMap.set(msg.channelId, (unreadCountMap.get(msg.channelId) ?? 0) + 1)
    }
  }

  const channelsWithUnread = workspace.channels.map((ch) => {
    // Strip relational fields before returning
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { memberships: _m, _count: _c, ...channelData } = ch
    return { ...channelData, unreadCount: unreadCountMap.get(ch.id) ?? 0 }
  })

  // Sort: isPinned first, then by lastMessageAt desc
  const sorted = channelsWithUnread.sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1
    if (!a.isPinned && b.isPinned) return 1
    const aTime = a.lastMessageAt?.getTime() ?? 0
    const bTime = b.lastMessageAt?.getTime() ?? 0
    return bTime - aTime
  })

  return NextResponse.json({ workspace: { id: workspace.id }, channels: sorted })
}
