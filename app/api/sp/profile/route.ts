// app/api/sp/profile/route.ts

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getSpProfile } from '@/server/queries/marketplace'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const profile = await getSpProfile(session.user.companyId)
  return NextResponse.json({ profile, companyId: session.user.companyId })
}
