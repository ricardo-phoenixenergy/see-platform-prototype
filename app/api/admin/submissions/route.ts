// app/api/admin/submissions/route.ts

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getSubmissionsQueue } from '@/server/queries/admin'

export async function GET() {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const submissions = await getSubmissionsQueue()
  return NextResponse.json({ submissions })
}
