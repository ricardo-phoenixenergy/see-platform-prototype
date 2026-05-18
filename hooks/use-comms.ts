// hooks/use-comms.ts
// TanStack Query hooks for the comms system.
// - Channel messages: refetch every 3s (polling, no WebSocket in prototype)
// - Thread replies: refetch every 3s when a thread is open
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
  authorUserId: string | null
  isSystem: boolean
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
  author: MessageAuthor | null
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

export type MentionItem = {
  id: string
  title: string
  body: string
  link: string | null
  readAt: string | null
  createdAt: string
}

export type MessageSearchResult = {
  messageId: string
  channelId: string
  channelName: string
  projectId: string
  projectName: string
  snippet: string
  authorName: string
  createdAt: string
  isReply: boolean
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

// ─── Thread replies (3s polling when thread is open) ─────────────────────────

export function useThreadReplies(parentMessageId: string, enabled = true) {
  return useQuery<ChannelMessage[], Error>({
    queryKey: ['thread-replies', parentMessageId],
    queryFn: async () => {
      const res = await fetch(`/api/messages/${parentMessageId}/replies`)
      if (!res.ok) throw new Error('Failed to load replies')
      const data = await res.json() as { replies: ChannelMessage[] }
      return data.replies
    },
    enabled: enabled && !!parentMessageId,
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

// ─── Inbox mentions ───────────────────────────────────────────────────────────

export function useInboxMentions() {
  return useQuery<MentionItem[], Error>({
    queryKey: ['inbox-mentions'],
    queryFn: async () => {
      const res = await fetch('/api/inbox/mentions')
      if (!res.ok) throw new Error('Failed to load mentions')
      const data = await res.json() as { mentions: MentionItem[] }
      return data.mentions
    },
    refetchInterval: 15000,
    staleTime: 5000,
  })
}

// ─── Message search ───────────────────────────────────────────────────────────

export function useMessageSearch(q: string) {
  return useQuery<MessageSearchResult[], Error>({
    queryKey: ['message-search', q],
    queryFn: async () => {
      const res = await fetch(`/api/search/messages?q=${encodeURIComponent(q)}`)
      if (!res.ok) throw new Error('Failed to search messages')
      const data = await res.json() as { results: MessageSearchResult[] }
      return data.results
    },
    enabled: q.length >= 2,
    staleTime: 10000,
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
    onSuccess: (_, vars) => {
      void queryClient.invalidateQueries({ queryKey: ['channel-messages', channelId] })
      if (vars.parentMessageId) {
        void queryClient.invalidateQueries({ queryKey: ['thread-replies', vars.parentMessageId] })
      }
      void queryClient.invalidateQueries({ queryKey: ['workspace-channels'] })
    },
  })
}

// ─── Edit message ─────────────────────────────────────────────────────────────

export function useEditMessage(channelId: string) {
  const queryClient = useQueryClient()
  return useMutation<
    { message: { id: string; body: string; editedAt: string } },
    Error,
    { messageId: string; body: string; parentMessageId?: string | null }
  >({
    mutationFn: async ({ messageId, body }) => {
      const res = await fetch(`/api/messages/${messageId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body }),
      })
      if (!res.ok) throw new Error('Failed to edit message')
      return res.json() as Promise<{ message: { id: string; body: string; editedAt: string } }>
    },
    onSuccess: (_, vars) => {
      void queryClient.invalidateQueries({ queryKey: ['channel-messages', channelId] })
      if (vars.parentMessageId) {
        void queryClient.invalidateQueries({ queryKey: ['thread-replies', vars.parentMessageId] })
      }
    },
  })
}

// ─── Delete message ───────────────────────────────────────────────────────────

export function useDeleteMessage(channelId: string) {
  const queryClient = useQueryClient()
  return useMutation<
    { ok: boolean },
    Error,
    { messageId: string; parentMessageId?: string | null }
  >({
    mutationFn: async ({ messageId }) => {
      const res = await fetch(`/api/messages/${messageId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete message')
      return res.json() as Promise<{ ok: boolean }>
    },
    onSuccess: (_, vars) => {
      void queryClient.invalidateQueries({ queryKey: ['channel-messages', channelId] })
      if (vars.parentMessageId) {
        void queryClient.invalidateQueries({ queryKey: ['thread-replies', vars.parentMessageId] })
      }
    },
  })
}

// ─── Toggle reaction ─────────────────────────────────────────────────────────

export function useToggleReaction(channelId: string) {
  const queryClient = useQueryClient()
  return useMutation<
    { added: boolean },
    Error,
    { messageId: string; emoji: string; parentMessageId?: string | null }
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
    onSuccess: (_, vars) => {
      void queryClient.invalidateQueries({ queryKey: ['channel-messages', channelId] })
      if (vars.parentMessageId) {
        void queryClient.invalidateQueries({ queryKey: ['thread-replies', vars.parentMessageId] })
      }
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

// ─── Invite member ────────────────────────────────────────────────────────────

export function useInviteMember(channelId: string, projectId: string) {
  const queryClient = useQueryClient()
  return useMutation<
    { membership: unknown; created: boolean },
    Error,
    { userId: string; role?: 'MEMBER' | 'GUEST' | 'OBSERVER' }
  >({
    mutationFn: async (payload) => {
      const res = await fetch(`/api/channels/${channelId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const err = await res.json() as { error?: string }
        throw new Error(err.error ?? 'Failed to invite member')
      }
      return res.json() as Promise<{ membership: unknown; created: boolean }>
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['workspace-channels', projectId] })
      void queryClient.invalidateQueries({ queryKey: ['channel-messages', channelId] })
    },
  })
}

// ─── Create custom channel ────────────────────────────────────────────────────

export function useCreateChannel(projectId: string) {
  const queryClient = useQueryClient()
  return useMutation<
    { channel: { id: string; name: string; displayName: string | null; description: string | null; kind: string } },
    Error,
    { name: string; displayName?: string; description?: string }
  >({
    mutationFn: async (payload) => {
      const res = await fetch(`/api/projects/${projectId}/channels`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const err = await res.json() as { error?: string }
        throw new Error(err.error ?? 'Failed to create channel')
      }
      return res.json() as Promise<{ channel: { id: string; name: string; displayName: string | null; description: string | null; kind: string } }>
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['workspace-channels', projectId] })
    },
  })
}
