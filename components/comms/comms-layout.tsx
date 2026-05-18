'use client'
// components/comms/comms-layout.tsx
// 3-column comms layout: ChannelSidebar | MessageTimeline | MembersPanel
// Fills h-full of the project workspace content area.

import { ChannelSidebar } from './channel-sidebar'
import { MessageTimeline } from './message-timeline'
import { MembersPanel, type ChannelMember } from './members-panel'

type Props = {
  projectId: string
  channelId: string
  channelName: string
  members: ChannelMember[]
  currentUserId?: string | undefined
}

export function CommsLayout({ projectId, channelId, channelName, members, currentUserId }: Props) {
  // Build member lookup maps
  const memberLookup: Record<string, string> = {}
  for (const m of members) {
    memberLookup[m.id] = m.name ?? 'Unknown'
  }

  const membersList = members.map((m) => ({
    id: m.id,
    name: m.name ?? 'Unknown',
  }))

  return (
    <div className="flex h-full overflow-hidden">
      <ChannelSidebar projectId={projectId} activeChannelId={channelId} />

      <MessageTimeline
        channelId={channelId}
        channelName={channelName}
        projectId={projectId}
        members={memberLookup}
        membersList={membersList}
        currentUserId={currentUserId}
      />

      <MembersPanel members={members} />
    </div>
  )
}
