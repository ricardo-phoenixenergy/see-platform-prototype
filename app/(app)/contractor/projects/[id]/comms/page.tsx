// app/(app)/contractor/projects/[id]/comms/page.tsx
// Server component — redirects to the first accessible channel.
// If no workspace exists, shows a placeholder.

import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { MessageSquareOff } from 'lucide-react'

type Props = { params: Promise<{ id: string }> }

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

  if (!workspace) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
        <MessageSquareOff className="h-10 w-10 text-ink-200" strokeWidth={1} />
        <div>
          <p className="text-sm font-medium text-ink-700">No workspace yet</p>
          <p className="text-xs text-ink-400 mt-0.5">
            A communications workspace will be created automatically when the project progresses.
          </p>
        </div>
      </div>
    )
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
