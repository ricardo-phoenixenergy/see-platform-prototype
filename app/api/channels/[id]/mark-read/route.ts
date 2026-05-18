// app/api/channels/[id]/mark-read/route.ts
// POST: mark channel as read for the current user

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { canAccessChannel } from '@/lib/comms/access'

export async function POST(
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

  await db.channelMembership.updateMany({
    where: { channelId, userId, leftAt: null },
    data: { lastReadAt: new Date() },
  })

  return NextResponse.json({ ok: true })
}
