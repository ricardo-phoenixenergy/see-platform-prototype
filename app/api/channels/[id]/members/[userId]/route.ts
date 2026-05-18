// app/api/channels/[id]/members/[userId]/route.ts
// DELETE: remove a member (soft-leave — sets leftAt)

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const currentUserId = session.user.id
  if (!currentUserId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: channelId, userId: targetUserId } = await params

  // Must be OWNER or removing yourself
  const callerMembership = await db.channelMembership.findFirst({
    where: { channelId, userId: currentUserId, leftAt: null },
    select: { role: true },
  })
  if (!callerMembership) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (callerMembership.role !== 'OWNER' && currentUserId !== targetUserId) {
    return NextResponse.json({ error: 'Forbidden — OWNER role required to remove others' }, { status: 403 })
  }

  const target = await db.channelMembership.findFirst({
    where: { channelId, userId: targetUserId, leftAt: null },
  })
  if (!target) return NextResponse.json({ error: 'Member not found' }, { status: 404 })

  await db.channelMembership.update({
    where: { id: target.id },
    data: { leftAt: new Date() },
  })

  return NextResponse.json({ ok: true })
}
