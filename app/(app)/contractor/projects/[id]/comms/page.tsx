// app/(app)/contractor/projects/[id]/comms/page.tsx
// Server component — redirects to the first accessible channel.
// Lazily creates the workspace if it doesn't exist yet.

import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { MessageSquareOff } from 'lucide-react'

type Props = { params: Promise<{ id: string }> }

async function ensureWorkspace(projectId: string, userId: string): Promise<string | null> {
  // Find the project's contractor company to seed memberships
  const project = await db.project.findUnique({
    where: { id: projectId },
    select: { contractorCompanyId: true },
  })
  if (!project) return null

  // Get all members of the contractor company
  const contractorMembers = await db.membership.findMany({
    where: { companyId: project.contractorCompanyId },
    select: { userId: true },
  })
  const memberUserIds = contractorMembers.map(m => m.userId)

  // Get all platform admin users
  const adminMemberships = await db.membership.findMany({
    where: { company: { type: 'PLATFORM_ADMIN' } },
    select: { userId: true },
  })
  const adminUserIds = adminMemberships.map(m => m.userId)

  const workspace = await db.projectWorkspace.create({
    data: { projectId },
  })

  const defaultChannels = [
    { name: 'general', displayName: 'General', description: 'Broad project discussion', isPinned: true },
    { name: 'site-updates', displayName: 'Site Updates', description: 'Field updates, photos, and site conditions', isPinned: false },
    { name: 'client', displayName: 'Client', description: 'Client-facing communications', isPinned: false },
    { name: 'admin', displayName: 'Admin', description: 'Platform administration', isPinned: false },
  ] as const

  let firstChannelId: string | null = null

  for (const ch of defaultChannels) {
    const channel = await db.channel.create({
      data: {
        workspaceId: workspace.id,
        name: ch.name,
        displayName: ch.displayName,
        description: ch.description,
        kind: 'DEFAULT',
        isPinned: ch.isPinned,
      },
    })

    if (!firstChannelId) firstChannelId = channel.id

    if (memberUserIds.length > 0) {
      await db.channelMembership.createMany({
        data: memberUserIds.map(uid => ({
          channelId: channel.id,
          userId: uid,
          role: 'OWNER' as const,
        })),
        skipDuplicates: true,
      })
    }

    if (ch.name === 'admin' && adminUserIds.length > 0) {
      await db.channelMembership.createMany({
        data: adminUserIds
          .filter(uid => !memberUserIds.includes(uid))
          .map(uid => ({
            channelId: channel.id,
            userId: uid,
            role: 'OBSERVER' as const,
          })),
        skipDuplicates: true,
      })
    }
  }

  // Post system welcome message in #general
  const generalChannel = await db.channel.findUnique({
    where: { workspaceId_name: { workspaceId: workspace.id, name: 'general' } },
  })
  if (generalChannel) {
    await db.message.create({
      data: {
        channelId: generalChannel.id,
        authorUserId: null,
        isSystem: true,
        body: 'Project workspace created. Add your team members and start collaborating.',
      },
    })
  }

  // Ensure the current user is a member (they might not be if they just joined)
  if (!memberUserIds.includes(userId) && firstChannelId) {
    await db.channelMembership.upsert({
      where: { channelId_userId: { channelId: firstChannelId, userId } },
      update: {},
      create: { channelId: firstChannelId, userId, role: 'OWNER' },
    })
  }

  return firstChannelId
}

export default async function CommsIndexPage({ params }: Props) {
  const { id: projectId } = await params
  const session = await auth()
  if (!session) redirect('/login')
  const userId = session.user.id
  if (!userId) redirect('/login')

  const workspace = await db.projectWorkspace.findUnique({
    where: { projectId },
    select: {
      id: true,
      channels: {
        where: {
          isArchived: false,
          memberships: { some: { userId, leftAt: null } },
        },
        orderBy: [{ isPinned: 'desc' }, { lastMessageAt: 'desc' }],
        select: { id: true },
        take: 1,
      },
    },
  })

  // Lazy creation: workspace missing → create it now
  if (!workspace) {
    const firstChannelId = await ensureWorkspace(projectId, userId)
    if (!firstChannelId) {
      return (
        <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
          <MessageSquareOff className="h-10 w-10 text-ink-200" strokeWidth={1} />
          <div>
            <p className="text-sm font-medium text-ink-700">Project not found</p>
            <p className="text-xs text-ink-400 mt-0.5">
              This project workspace could not be initialised.
            </p>
          </div>
        </div>
      )
    }
    redirect(`/contractor/projects/${projectId}/comms/${firstChannelId}`)
  }

  const firstChannel = workspace.channels[0]
  if (!firstChannel) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
        <MessageSquareOff className="h-10 w-10 text-ink-200" strokeWidth={1} />
        <div>
          <p className="text-sm font-medium text-ink-700">No channels accessible</p>
          <p className="text-xs text-ink-400 mt-0.5">
            You haven&apos;t been added to any channels in this project yet.
          </p>
        </div>
      </div>
    )
  }

  redirect(`/contractor/projects/${projectId}/comms/${firstChannel.id}`)
}
