// app/api/projects/[id]/channels/route.ts
// POST: create a custom channel in a project workspace

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { z } from 'zod'

const createSchema = z.object({
  name: z
    .string()
    .min(1)
    .max(80)
    .transform((s) => s.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')),
  displayName: z.string().min(1).max(80).optional(),
  description: z.string().max(250).optional(),
})

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = session.user.id
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: projectId } = await params

  const workspace = await db.projectWorkspace.findUnique({
    where: { projectId },
    select: { id: true },
  })
  if (!workspace) return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })

  // Verify user has access to this workspace (is a member of at least one channel)
  const anyMembership = await db.channelMembership.findFirst({
    where: {
      userId,
      leftAt: null,
      channel: { workspaceId: workspace.id },
    },
  })
  if (!anyMembership) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  let body: z.infer<typeof createSchema>
  try {
    const json = await req.json() as unknown
    body = createSchema.parse(json)
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  // Check name uniqueness within workspace
  const existing = await db.channel.findFirst({
    where: { workspaceId: workspace.id, name: body.name },
  })
  if (existing) return NextResponse.json({ error: 'Channel name already exists in this workspace' }, { status: 409 })

  const channel = await db.channel.create({
    data: {
      workspaceId: workspace.id,
      name: body.name,
      displayName: body.displayName ?? body.name,
      description: body.description ?? null,
      kind: 'CUSTOM',
      memberships: {
        create: { userId, role: 'OWNER' },
      },
    },
    select: { id: true, name: true, displayName: true, description: true, kind: true },
  })

  return NextResponse.json({ channel }, { status: 201 })
}
