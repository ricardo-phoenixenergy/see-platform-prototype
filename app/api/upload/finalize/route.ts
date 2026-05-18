import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const finalizeSchema = z.object({
  blobUrl: z.string().url(),
})

export async function POST(request: Request) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const body = await request.json() as unknown
  const parsed = finalizeSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  // Prototype: return a mock sha256 — production would compute from blob content
  const mockSha256 = Buffer.from(parsed.data.blobUrl).toString('base64').slice(0, 64)

  return NextResponse.json({
    ok: true,
    sha256: mockSha256,
    virusScan: 'clean',
  })
}
