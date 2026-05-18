// app/api/marketplace/rfq/[id]/route.ts

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getRfqDetail } from '@/server/queries/marketplace'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const rfq = await getRfqDetail(id)
  if (!rfq) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({ rfq })
}
