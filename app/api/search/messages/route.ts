// app/api/search/messages/route.ts
// GET: full-text search across user's accessible channels
// ?q=query&limit=20

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = session.user.id
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const url = new URL(req.url)
  const q = url.searchParams.get('q')?.trim() ?? ''
  const limit = Math.min(parseInt(url.searchParams.get('limit') ?? '20', 10), 50)

  if (q.length < 2) return NextResponse.json({ results: [] })

  // Get all channels the user can access
  const memberships = await db.channelMembership.findMany({
    where: { userId, leftAt: null },
    select: {
      channelId: true,
      channel: {
        select: {
          name: true,
          displayName: true,
          workspace: { select: { project: { select: { id: true, name: true } } } },
        },
      },
    },
  })

  const channelIds = memberships.map((m) => m.channelId)
  if (channelIds.length === 0) return NextResponse.json({ results: [] })

  // Case-insensitive contains search across accessible channels
  const messages = await db.message.findMany({
    where: {
      channelId: { in: channelIds },
      deletedAt: null,
      isSystem: false,
      body: { contains: q, mode: 'insensitive' },
    },
    select: {
      id: true,
      channelId: true,
      body: true,
      createdAt: true,
      parentMessageId: true,
      author: { select: { name: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  })

  const channelMap = new Map(memberships.map((m) => [m.channelId, m.channel]))

  const results = messages.map((msg) => {
    const ch = channelMap.get(msg.channelId)
    // Find the query match position for snippet
    const lBody = msg.body.toLowerCase()
    const lQ = q.toLowerCase()
    const matchIdx = lBody.indexOf(lQ)
    const snippetStart = Math.max(0, matchIdx - 40)
    const snippet = (snippetStart > 0 ? '…' : '') + msg.body.slice(snippetStart, snippetStart + 120) + (snippetStart + 120 < msg.body.length ? '…' : '')

    return {
      messageId: msg.id,
      channelId: msg.channelId,
      channelName: ch?.displayName ?? ch?.name ?? 'Unknown channel',
      projectId: ch?.workspace.project.id ?? '',
      projectName: ch?.workspace.project.name ?? '',
      snippet,
      authorName: msg.author?.name ?? 'System',
      createdAt: msg.createdAt.toISOString(),
      isReply: msg.parentMessageId !== null,
    }
  })

  return NextResponse.json({ results })
}
