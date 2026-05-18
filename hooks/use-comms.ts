// hooks/use-comms.ts
// TanStack Query hooks for the comms system.
// - Channel messages: refetch every 3s (polling, no WebSocket in prototype)
// - Inbox summary: refetch every 15s
// - Workspace channels: refetch every 15s

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

// ─── Types ──────────────────────────────────────────────────────────────────

export type GroupedReaction = {
  emoji: string
  userIds: string[]
  count: number
}

export type MessageAuthor = {
  id: string
  name: string | null
  image: string | null
}

export type ChannelMessage = {
  id: string
  channelId: string
  authorUserId: string
  body: string
  parentMessageId: string | null
  isPinned: boolean
  attachments: unknown
  entityRefs: unknown
  mentions: unknown
  editedAt: string | null
  deletedAt: string | null
  createdAt: string
  updatedAt: string
  author: MessageAuthor
  reactions: GroupedReaction[]
  replyCount: number
}

export type ChannelSummary = {
  id: string
  name: string
  displayName: string | null
  description: string | null
  kind: string
  topic: string | null
  isPinned: boolean
  milestoneId: string | null
  lastMessageAt: string | null
  unreadCount: number
}

export type InboxChannelItem = {
  channelId: string
  channelName: string
  projectId: string
  projectName: string
  unreadCount: number
  latestMessage: {
    body: string
    authorName: string
    createdAt: string
  } | null
}

export type InboxSummary = {
  totalUnread: number
  channels: InboxChannelItem[]
}

// ─── Channel messages (3s polling) ──────────────────────────────────────────

export function useChannelMessages(channelId: string, enabled = true) {
  return useQuery<ChannelMessage[], Error>({
    queryKey: ['channel-messages', channelId],
    queryFn: async () => {
      const res = await fetch(`/api/channels/${channelId}/messages?limit=50`)
      if (!res.ok) throw new Error('Failed to load messages')
      const data = await res.json() as { messages: ChannelMessage[] }
      return data.messages
    },
    enabled: enabled && !!channelId,
    refetchInterval: 3000,
    staleTime: 0,
  })
}

// ─── Inbox summary (15s polling) ────────────────────────────────────────────

export function useInboxSummary() {
  return useQuery<InboxSummary, Error>({
    queryKey: ['inbox-summary'],
    queryFn: async () => {
      const res = await fetch('/api/inbox/summary')
      if (!res.ok) throw new Error('Failed to load inbox summary')
      return res.json() as Promise<InboxSummary>
    },
    refetchInterval: 15000,
    staleTime: 5000,
  })
}

// ─── Workspace channels (15s polling) ────────────────────────────────────────

export function useWorkspaceChannels(projectId: string) {
  return useQuery<{ workspace: { id: string } | null; channels: ChannelSummary[] }, Error>({
    queryKey: ['workspace-channels', projectId],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${projectId}/workspace`)
      if (!res.ok) throw new Error('Failed to load workspace')
      return res.json() as Promise<{ workspace: { id: string } | null; channels: ChannelSummary[] }>
    },
    enabled: !!projectId,
    refetchInterval: 15000,
    staleTime: 5000,
  })
}

// ─── Send message ────────────────────────────────────────────────────────────

export function useSendMessage(channelId: string) {
  const queryClient = useQueryClient()
  return useMutation<
    { message: ChannelMessage },
    Error,
    { body: string; parentMessageId?: string }
  >({
    mutationFn: async (payload) => {
      const res = await fetch(`/api/channels/${channelId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error('Failed to send message')
      return res.json() as Promise<{ message: ChannelMessage }>
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['channel-messages', channelId] })
    },
  })
}

// ─── Toggle reaction ─────────────────────────────────────────────────────────

export function useToggleReaction(channelId: string) {
  const queryClient = useQueryClient()
  return useMutation<
    { added: boolean },
    Error,
    { messageId: string; emoji: string }
  >({
    mutationFn: async ({ messageId, emoji }) => {
      const res = await fetch(`/api/messages/${messageId}/reactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emoji }),
      })
      if (!res.ok) throw new Error('Failed to toggle reaction')
      return res.json() as Promise<{ added: boolean }>
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['channel-messages', channelId] })
    },
  })
}

// ─── Mark channel read ────────────────────────────────────────────────────────

export function useMarkChannelRead(channelId: string, projectId: string) {
  const queryClient = useQueryClient()
  return useMutation<{ ok: boolean }, Error, void>({
    mutationFn: async () => {
      const res = await fetch(`/api/channels/${channelId}/mark-read`, { method: 'POST' })
      if (!res.ok) throw new Error('Failed to mark read')
      return res.json() as Promise<{ ok: boolean }>
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['workspace-channels', projectId] })
      void queryClient.invalidateQueries({ queryKey: ['inbox-summary'] })
    },
  })
}
