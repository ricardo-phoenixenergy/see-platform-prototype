// app/(app)/contractor/projects/[id]/comms/[channelId]/page.tsx
// Server component shell — fetches channel metadata + members, renders CommsLayout.

import { auth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { canAccessChannel } from '@/lib/comms/access'
import { CommsLayout } from '@/components/comms/comms-layout'

type Props = {
  params: Promise<{ id: string; channelId: string }>
}

export default async function ChannelPage({ params }: Props) {
  const { id: projectId, channelId } = await params
  const session = await auth()
  if (!session) redirect('/login')
  const userId = session.user.id
  if (!userId) redirect('/login')

  const hasAccess = await canAccessChannel(userId, channelId)
  if (!hasAccess) notFound()

  // Fetch channel + members
  const channel = await db.channel.findUnique({
    where: { id: channelId },
    select: {
      id: true,
      name: true,
      displayName: true,
      workspaceId: true,
      memberships: {
        where: { leftAt: null },
        select: {
          role: true,
          user: {
            select: {
              id: true,
              name: true,
              image: true,
              memberships: {
                select: { role: true, company: { select: { type: true } } },
                take: 1,
              },
            },
          },
        },
      },
    },
  })

  if (!channel) notFound()

  // Build members list for the panel
  const members = channel.memberships.map((m) => {
    const companyType = m.user.memberships[0]?.company.type
    let companyRole: string | undefined
    if (companyType === 'SERVICE_PROVIDER') companyRole = 'SP'
    else if (companyType === 'END_CLIENT') companyRole = 'Client'

    return {
      id: m.user.id,
      name: m.user.name,
      image: m.user.image,
      role: m.role as string,
      ...(companyRole !== undefined ? { companyRole } : {}),
    }
  })

  const channelName = channel.displayName ?? channel.name

  return (
    <CommsLayout
      projectId={projectId}
      channelId={channelId}
      channelName={channelName}
      members={members}
      currentUserId={userId}
    />
  )
}
