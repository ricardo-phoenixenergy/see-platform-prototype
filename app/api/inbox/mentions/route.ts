// app/api/inbox/mentions/route.ts
// GET: recent MESSAGE_MENTION notifications for the current user

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = session.user.id
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const mentions = await db.notification.findMany({
    where: {
      userId,
      type: 'MESSAGE_MENTION',
    },
    orderBy: { createdAt: 'desc' },
    take: 20,
    select: {
      id: true,
      title: true,
      body: true,
      link: true,
      readAt: true,
      createdAt: true,
    },
  })

  return NextResponse.json({ mentions })
}
