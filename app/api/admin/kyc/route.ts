// app/api/admin/kyc/route.ts

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getKycQueue } from '@/server/queries/admin'

export async function GET() {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const submissions = await getKycQueue()
  return NextResponse.json({ submissions })
}
