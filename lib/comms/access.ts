// lib/comms/access.ts
// Channel access-control helpers used by all comms API routes and server actions.

import { db } from '@/lib/db'

/**
 * Returns true if the given user is an active member of the channel
 * (any role, not soft-left).
 */
export async function canAccessChannel(userId: string, channelId: string): Promise<boolean> {
  const membership = await db.channelMembership.findFirst({
    where: {
      channelId,
      userId,
      leftAt: null,
    },
    select: { id: true },
  })
  return membership !== null
}

/**
 * Asserts the user can POST a message to the given channel.
 * Allowed roles: OWNER, MEMBER, GUEST.
 * OBSERVER role and non-members throw Error('FORBIDDEN').
 */
export async function assertCanPostToChannel(userId: string, channelId: string): Promise<void> {
  const membership = await db.channelMembership.findFirst({
    where: {
      channelId,
      userId,
      leftAt: null,
    },
    select: { role: true },
  })

  if (!membership) {
    throw new Error('FORBIDDEN')
  }

  const postableRoles = ['OWNER', 'MEMBER', 'GUEST'] as const
  if (!(postableRoles as readonly string[]).includes(membership.role)) {
    throw new Error('FORBIDDEN')
  }
}
