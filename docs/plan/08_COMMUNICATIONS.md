# 08 — Project Communications

The platform's integrated comms layer — channels, threads, mentions, attachments — scoped to projects. This replaces fragmented email/WhatsApp threads with a single audit-trailed location for every project conversation.

**Why this exists.** An EPC running a dozen active projects currently lives across Gmail, WhatsApp, three Slack workspaces (their own, the client's, the contractor's), and a handful of group SMS chats. Decisions get lost. Audit trails for bank-fundable projects are impossible to assemble after the fact. The platform's comms layer consolidates this — and because messages reference project entities (milestones, submissions, RFQs) directly, comms become part of the project record, not parallel to it.

**Real-time strategy:** TanStack Query polling at 3s on the active channel, 15s elsewhere. No WebSockets in the prototype. Production swaps in Pusher / Ably without changing the React hooks (documented at the bottom of this file).

---

## Concepts

### Workspace
Every Project has exactly one **ProjectWorkspace** auto-created when the project is created. The workspace owns channels and membership.

### Channel
A named space within a workspace. Three kinds:

| Kind | Created by | Auto-membership | Visibility |
|---|---|---|---|
| **Default** | System on project creation | Project team | Workspace-wide |
| **Custom** | Contractor / admin | Manual invite | Membership-only |
| **Milestone thread** | System on milestone creation | Project team + assigned SP | Workspace-wide (read), gated (write) |

**Default channels** auto-created with every project:
- `#general` — broad project chat
- `#site-updates` — field updates, photos, conditions
- `#client` — client-facing communications (clients invited here can post; contractor team always present)
- `#admin` — platform admin observers can post; contractor team sees but admin oversight is light-touch

**Milestone threads** — one auto-created per `Milestone` row. Pinned to the channel `#milestones` (a system-managed channel that lists all milestone threads). Thread title = milestone name. Clicking a milestone in the project workspace Tab B opens its thread in the comms pane.

### Membership
A `ChannelMembership` links a User to a Channel with a `MembershipRole`:

- **Owner** — contractor team member; can rename channel, manage membership, archive
- **Member** — full read/write
- **Guest** — read/write but cannot see other guests' presence; used for service providers and clients
- **Observer** — read-only; used for admin overseers and inactive members

### Message
A single post in a channel. Has:
- Author (User)
- Body (markdown)
- Optional parent message (for threaded replies)
- Optional attachments (via the existing file upload pipeline)
- Optional entity references (milestones, submissions, RFQs, projects — rendered as rich cards)
- Mentions (extracted on send)
- Reactions (emoji counts)
- Edit history (last edit timestamp; full history not exposed in UI but stored)

### Thread
A message with replies. The thread root lives in its parent channel; replies are not duplicated to the channel timeline (Slack-style "Also send to channel" is NOT included — too noisy for a project context).

---

## Access control

Channels respect the platform's least-privilege model (per Journey doc — SPs see only relevant project data).

**Rules at the query layer** (enforced server-side, not just UI):

1. A user can only see channels they are a member of (`ChannelMembership` exists).
2. Membership in a project's default channels is auto-granted to:
   - All contractor team members (the project's contractor company)
   - Assigned service providers (via active `JobCard`) — into `#site-updates` and their relevant milestone threads only; NOT `#client`, NOT `#admin`
   - Clients (when invited by contractor) — into `#client` only; NOT `#general`, NOT `#site-updates` unless explicitly added
   - Platform admins — into `#admin` automatically across all projects; observer role
3. Milestone threads inherit channel-level access plus a gate: only users assigned to that milestone's work can post; others can read.
4. When a service provider's job is marked Completed, their membership transitions to Observer (read-only) — they keep access to history but can no longer post.
5. When a service provider's job is Cancelled or the contract ends, their membership is removed.

**Implementation:** All channel/message queries pass through `lib/comms/access.ts` which performs the membership check. Server Actions for mutations call `assertCanPostToChannel(userId, channelId)` before any write.

---

## Schema additions

Five new Prisma models. Patch into `prisma/schema.prisma` (see `03_DATA_MODEL.md` for placement after the existing communication models).

```prisma
// =========================================================================
// PROJECT COMMUNICATIONS
// =========================================================================

model ProjectWorkspace {
  id          String     @id @default(cuid())
  projectId   String     @unique
  isArchived  Boolean    @default(false)

  project     Project    @relation(fields: [projectId], references: [id], onDelete: Cascade)
  channels    Channel[]

  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt
}

model Channel {
  id              String              @id @default(cuid())
  workspaceId     String
  name            String              // "general", "site-updates" — lowercase, slug-style
  displayName     String?             // optional pretty name for display
  description     String?
  kind            ChannelKind
  topic           String?             // Slack-style "topic" line at the top of the channel
  isArchived      Boolean             @default(false)
  isPinned        Boolean             @default(false)  // pin to top of sidebar

  // For milestone threads: which milestone this channel represents
  milestoneId     String?             @unique

  workspace       ProjectWorkspace    @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  milestone       Milestone?          @relation(fields: [milestoneId], references: [id], onDelete: Cascade)
  memberships     ChannelMembership[]
  messages        Message[]

  createdAt       DateTime            @default(now())
  updatedAt       DateTime            @updatedAt
  lastMessageAt   DateTime?           // denormalised for sort-by-recent

  @@unique([workspaceId, name])
  @@index([workspaceId, lastMessageAt])
}

enum ChannelKind {
  DEFAULT             // auto-created default channel (#general, etc.)
  CUSTOM              // user-created
  MILESTONE_THREAD    // auto-created for a Milestone
  DIRECT              // reserved for future DM support (not in prototype)
}

model ChannelMembership {
  id              String              @id @default(cuid())
  channelId       String
  userId          String
  role            MembershipRole      @default(MEMBER)
  lastReadAt      DateTime?           // tracks read state for unread counts
  isMuted         Boolean             @default(false)
  joinedAt        DateTime            @default(now())
  leftAt          DateTime?           // soft-leave; preserve history

  channel         Channel             @relation(fields: [channelId], references: [id], onDelete: Cascade)
  user            User                @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([channelId, userId])
  @@index([userId, lastReadAt])
}

enum MembershipRole {
  OWNER       // contractor team member; can manage
  MEMBER      // full read/write
  GUEST       // read/write but limited (SPs, clients)
  OBSERVER    // read-only (admin overseers, completed-job SPs)
}

model Message {
  id              String              @id @default(cuid())
  channelId       String
  authorUserId    String
  body            String              // markdown content
  parentMessageId String?             // thread reply
  isPinned        Boolean             @default(false)

  // Rich content
  attachments     Json?               // [{ name, url, fileSize, sha256, mimeType }] — same shape as MilestoneSubmission.artefacts
  entityRefs      Json?               // [{ type: 'milestone'|'rfq'|'submission'|'project', id }] for rich-card rendering
  mentions        Json?               // [{ type: 'user'|'everyone', userId? }] extracted on send

  editedAt        DateTime?
  deletedAt       DateTime?           // soft delete

  channel         Channel             @relation(fields: [channelId], references: [id], onDelete: Cascade)
  author          User                @relation(fields: [authorUserId], references: [id])
  parentMessage   Message?            @relation("Replies", fields: [parentMessageId], references: [id], onDelete: Cascade)
  replies         Message[]           @relation("Replies")
  reactions       MessageReaction[]

  createdAt       DateTime            @default(now())
  updatedAt       DateTime            @updatedAt

  @@index([channelId, createdAt])
  @@index([parentMessageId, createdAt])
  @@index([authorUserId, createdAt])
}

model MessageReaction {
  id              String              @id @default(cuid())
  messageId       String
  userId          String
  emoji           String              // unicode emoji or shortcode

  message         Message             @relation(fields: [messageId], references: [id], onDelete: Cascade)
  user            User                @relation(fields: [userId], references: [id], onDelete: Cascade)

  createdAt       DateTime            @default(now())

  @@unique([messageId, userId, emoji])
  @@index([messageId])
}
```

**Relations added to existing models** (also patched in `03_DATA_MODEL.md`):

```prisma
model User {
  // ...existing fields
  channelMemberships  ChannelMembership[]
  messages            Message[]
  messageReactions    MessageReaction[]
}

model Project {
  // ...existing fields
  workspace           ProjectWorkspace?
}

model Milestone {
  // ...existing fields
  channel             Channel?    // bidirectional link to milestone thread
}
```

---

## API surface

```
// Workspace + channels
GET    /api/projects/[id]/workspace                  Workspace + channel list for current user
POST   /api/projects/[id]/channels                   Create custom channel
PATCH  /api/channels/[id]                            Rename / set topic / archive
POST   /api/channels/[id]/members                    Invite users
DELETE /api/channels/[id]/members/[userId]           Remove user
POST   /api/channels/[id]/mark-read                  Mark channel read up to timestamp

// Messages
GET    /api/channels/[id]/messages?cursor=&limit=50  Paginated message history (oldest-first within window)
POST   /api/channels/[id]/messages                   Send message
GET    /api/messages/[id]/replies                    Thread replies
PATCH  /api/messages/[id]                            Edit own message
DELETE /api/messages/[id]                            Soft-delete own message
POST   /api/messages/[id]/reactions                  Toggle reaction
POST   /api/messages/[id]/pin                        Pin/unpin (Owner only)

// Cross-channel
GET    /api/inbox                                    Unread/mention summary across all user's channels
GET    /api/search/messages?q=                       Full-text search across user's accessible channels
GET    /api/channels/[id]/members                    Member list
```

**Polling endpoints** that the chat UI hits:
- Active channel: `GET /api/channels/[id]/messages?since=<lastSeenMessageId>` every 3s when the channel is in focus
- Inbox badge: `GET /api/inbox/summary` every 15s
- Channel sidebar (unread dots): `GET /api/projects/[id]/workspace` every 15s

These are cheap reads — indexed queries on `(channelId, createdAt)`. At demo scale, completely fine. At production scale, swap to Pusher (see "Production swap" at bottom).

---

## UI

### Where comms lives

Two entry points, both reachable from any authenticated page:

1. **Inside a Project Workspace** — a third pane appears beside Tab A / B / C. Sidebar lists the project's channels; main area shows the active channel. Default when entering a project: `#general` of that project.

2. **Global Inbox** — topbar icon (envelope, beside the notifications bell). Click opens a panel showing unread messages and mentions across all projects the user is in. Click a message → jumps to that channel.

The comms pane within a project replaces the existing chat-widget pattern from M7 for `JobMessage` (those messages migrate into the milestone thread of the associated milestone). The SEE.AI chat widget at bottom-right is unaffected — separate concern.

### Channel layout

```
┌────────────────────────────────────────────────────────────────────────┐
│ Project Alpha · Spaza Soweto Retail Solar PPA                          │
├──────────────────┬──────────────────────────────────────┬──────────────┤
│ CHANNELS         │ # site-updates                       │ MEMBERS (8)  │
│                  │ Field updates and site conditions    │              │
│ # general    ●3  │ ─────────────────────────────────────│ Marcus A.    │
│ # site-updates   │                                      │ Naledi K.    │
│ # client     ●1  │ [yesterday]                          │ Lerato M. SP │
│ # admin          │ Lerato Mokoena  4:32 PM              │ Sipho D.  C  │
│                  │ Civil works milestone hit. Photos    │ ...          │
│ MILESTONES       │ attached.                            │              │
│ # eia            │ [civil-completion-1.jpg]             │ + Invite     │
│ # structural ★   │ [civil-completion-2.jpg]             │              │
│ # electrical ●2  │  ↳ 3 replies · Last 2h ago           │              │
│ # bess           │                                      │ PINNED       │
│ # commissioning  │ Marcus Adebayo  4:38 PM              │ Site address │
│                  │ Thanks @Lerato. Filing this against  │ Access codes │
│ + Custom channel │ the structural milestone.            │              │
│                  │ [📎 Milestone: Civil Works           │              │
│                  │  Completion — Approved]              │              │
│                  │                                      │              │
│                  │ [today]                              │              │
│                  │ Naledi Khumalo  9:14 AM              │              │
│                  │ Site visit scheduled Thursday 10am   │              │
│                  │ for the BESS install inspection.     │              │
│                  │ 👍 2  👀 1                          │              │
│                  │                                      │              │
│                  │ ─────────────────────────────────────│              │
│                  │ [@ mention, drag files, type here…] │              │
│                  └──────────────────────────────────────┴──────────────┤
```

**Sidebar:** Channels grouped (`CHANNELS` for defaults + custom, `MILESTONES` for milestone threads). Unread count dot. Pinned channels (★) sort first. Click `+ Custom channel` to create.

**Timeline:** Messages grouped by day. Sender shown once per consecutive run (Slack convention). Replies summarised under root with thread-open chevron. Reactions inline below message. Entity refs (milestones, submissions) render as inline cards with status badge — clickable, deep-links to the entity.

**Composer:** Markdown editor with toolbar (basic — bold, italic, code, link). `@` triggers mention autocomplete from channel members + `@everyone`. `#` triggers channel mention autocomplete. Drag-drop attachments use the existing `<FileUploader>` (purpose: `message_attachment`). Cmd+Enter or click Send to post.

**Right pane (Members):** Active members with role badge (SP = Service Provider guest, C = Client guest). Pinned messages at the bottom. Collapsible.

### Thread view

Clicking a thread root or "↳ N replies" opens the thread in a right-side drawer (480px wide on desktop, full-screen modal on mobile). The channel timeline remains visible behind. Thread drawer shows:

- Root message at top
- Replies in chronological order below
- Composer at the bottom of the drawer
- Member list scoped to thread participants

Closing the drawer returns to the channel timeline.

### Milestone thread integration

This is the killer feature. Two directions:

**From the project workspace Tab B (milestones):**
Each milestone card has a comms icon with unread count. Clicking it opens the comms pane scoped to that milestone's thread channel. The user lands directly in `#electrical-installation` (or wherever) instead of `#general`.

**From the comms pane:**
A milestone thread shows the milestone's status at the top (pinned card with submission state, AI verification result if any, due date) — this card is read-only and auto-updates as the milestone state changes. Below it, the conversation.

When a milestone is submitted, AI-verified, approved, or rejected, a **system message** is automatically posted to the milestone's thread:

> 🤖 **Milestone update** · 4:18 PM
> Submission v2 of "EIA Report" was approved by Erin Berman-Levy (Platform Admin).
> Feedback: "Engineer's stamp now present. All NEMA Section 24 references confirmed."

System messages have a distinct visual treatment (no avatar, system badge, accent-coloured left border). Users can react and reply to them; they themselves are author-immutable.

### Global inbox

Topbar icon (envelope). Click opens a 400px panel:

```
┌─────────────────────────────────────────┐
│ INBOX                          Mark all │
│ Mentions · Unread · All                 │
├─────────────────────────────────────────┤
│ ● MENTIONED                             │
│ Marcus Adebayo · Project Alpha          │
│ #electrical-installation                │
│ "@you — can you confirm the panel       │
│ schedule by EOD?"                       │
│ 2h ago                                  │
├─────────────────────────────────────────┤
│ ● UNREAD · 4 messages                   │
│ Project Alpha · #site-updates           │
│ Latest: Lerato Mokoena · 4:32 PM        │
├─────────────────────────────────────────┤
│ ● UNREAD · 1 message                    │
│ Polokwane Hybrid · #general             │
│ Latest: Naledi Khumalo · 11:02 AM       │
└─────────────────────────────────────────┘
```

Tabs at top: **Mentions** (anywhere @-mentioned), **Unread** (channels with unread messages), **All** (recent activity across all your channels). Click any row → navigate to that channel/message.

### Notifications

Two surfaces:

1. **In-app notification bell** (existing) — gets entries for mentions, new threads in milestones you're assigned to, and replies to your messages. Uses the existing `Notification` model with new types:
   - `MESSAGE_MENTION`
   - `MESSAGE_REPLY_TO_YOU`
   - `CHANNEL_INVITE`
2. **Email digest** (production-only, scaffolded for demo) — daily summary of unreads. Not built for prototype; Resend test mode stub only.

### Empty states

- Empty channel: "No messages yet. Be the first to post." with a subtle illustration.
- Empty inbox: "You're all caught up." centred, with a small checkmark.
- Empty search: "No messages match that query."

### Search

Cmd+K global search (existing) gains a "Messages" result group. Server-side: Postgres full-text search on `Message.body` filtered by the user's accessible channels. Results show snippet with highlighted match, channel, project, author, timestamp. Click → jump to message in channel.

Postgres FTS configuration:
```sql
ALTER TABLE "Message" ADD COLUMN body_search tsvector
  GENERATED ALWAYS AS (to_tsvector('english', body)) STORED;
CREATE INDEX message_body_search_idx ON "Message" USING GIN(body_search);
```

This is added as a custom migration after `prisma migrate dev` since Prisma doesn't natively express generated tsvector columns. Document this in the migration file.

---

## Auto-setup on project creation

When a new `Project` is instantiated (per M4 flow), the project-creation Server Action also:

1. Creates `ProjectWorkspace`
2. Creates four default channels: `#general`, `#site-updates`, `#client`, `#admin`
3. For each milestone instantiated from the template, creates a corresponding `MILESTONE_THREAD` channel
4. Creates `ChannelMembership` rows:
   - Every member of the contractor company → all default channels as `MEMBER`, all milestone threads as `MEMBER`
   - All platform admins → `#admin` channel as `OBSERVER`, milestone threads as `OBSERVER`
5. Posts a system welcome message in `#general`: "Project workspace created. Add team members and start collaborating."

This must complete within the project-creation transaction. If any of it fails, the project creation rolls back.

**When a JobCard is created** (per M7 — RFQ awarded):
- The service provider's owner user is added as `GUEST` to:
  - `#site-updates` (general site visibility)
  - The specific milestone thread for the milestone the RFQ was linked to
- A system message posts in the milestone thread: "Service Provider <X> has joined this thread. Job Card #<Y> is active."

**When a JobCard transitions to Completed:**
- The service provider's membership in those channels transitions from `GUEST` to `OBSERVER`
- A system message posts the completion

**When a Client is invited to the project comms** (new flow in M4):
- Contractor selects "Invite client to communications" in the project workspace
- Modal: select client user account (or invite by email), choose channels (default selection: `#client` only)
- Client user added as `GUEST` to selected channels
- Client receives notification + email invite (mocked)

---

## Voice & tone

Brand discipline applies inside the comms pane too (see `02_DESIGN_SYSTEM.md`). Specifically:

- No emoji in system messages
- No exclamation marks in default channel names or auto-text
- Empty states use the same restrained tone as the rest of the platform
- System message colour: left border in accent-500, body in ink-700 — clearly distinct from human messages without being decorative
- User avatars: initials only, no illustrated faces
- File attachment cards: clean, ink-50 background, ink-200 border — same shape as elsewhere in the platform

The chat surface should not feel like Discord. It should feel like Linear's inline conversation threads or Stripe's internal Slack — calm, technical, professional.

---

## Demo seed for comms

The seed populates Project Alpha's workspace with realistic history so the demo has substance. Approximate ~80 messages across channels over the project's lifetime:

### `#general` (Project Alpha)
- Initial workspace creation system message (18 months ago)
- Marcus + Naledi kickoff conversation
- Periodic status updates as project progressed through stages
- Recent: discussion of the upcoming BESS install

### `#site-updates`
- Photos and updates from Lerato (Mokoena Structural) during civil works
- Site condition reports
- Weather-related delays
- Recent: BESS delivery scheduled for next week

### `#client`
- Sipho Dlamini (Spaza Holdings) joined 14 months ago
- PPA terms questions early on
- Monthly progress reports from Naledi
- Recent: BESS install briefing for client

### `#admin`
- Erin Berman-Levy observer; minimal activity
- One question about EIA documentation (which triggered the v1 rejection — visible in the rejection feedback narrative)

### Milestone threads — selected highlights

**`#eia`** (the rejected-then-approved story):
- Naledi posts v1 submission system message
- Erin's question about engineer stamp
- Marcus reply
- Erin rejection system message
- Discussion about resolving the issue
- Naledi v2 submission
- Erin approval system message
- 🎉 reactions on the approval

**`#civil-works-completion`** (Auto-Gold via marketplace):
- Lerato (Mokoena) joins as GUEST
- Site update photos
- Completion certificate posted as attachment
- System: Auto-Gold verification message
- Marcus: "Thanks Lerato — great work"
- Lerato's job card transitions to Completed — membership goes Observer
- Final review posted in JobCard linked to the thread

**`#electrical-installation`** (current submission under review):
- Active discussion, electrician questions
- Naledi posts submission system message yesterday
- Marcus asks Naledi to confirm panel schedule
- @mention drives an item into Marcus's global inbox for demo

**`#bess-integration`** (currently has RFQ posted):
- Van der Berg Engineering recently joined as GUEST
- Discussion about specs and timing
- File attached: BESS specification PDF

This dataset gives a presenter at least three demo-able moments per channel without scrolling much.

---

## Build sequence

This is **M4.5** in the milestone sequence (per updated `BUILD_PLAN.md`). It must land after Project Management (M4) because it needs projects and milestones to exist. It must land before Marketplaces (M7) because the JobCard flow's chat moves into the milestone thread.

Internal sequencing within M4.5:

1. Schema + migration + access-control helpers (`lib/comms/access.ts`)
2. ProjectWorkspace auto-creation on project create (patch M4's Server Action)
3. Milestone thread auto-creation on milestone instantiation (patch M4)
4. Channel sidebar + message timeline UI in the project workspace pane
5. Message composer with markdown + mentions + attachments (re-use `<FileUploader>`)
6. Threads (drawer UI + reply composer)
7. Reactions (toggle endpoint + inline UI)
8. Polling hooks (`useChannelMessages(channelId)`, `useInboxSummary()`)
9. Global inbox panel in topbar
10. Search integration into cmd+K
11. Entity ref rendering (milestone, submission cards inline in messages)
12. System message generation hooks (on milestone status change, submission, etc.)
13. Client invite flow
14. Seed data + demo scripted moments
15. Polish pass (animations on new-message arrival, etc.)

---

## Acceptance criteria

**M4.5 is done when:**

- Every project has a workspace with 4 default channels + N milestone threads on creation
- Sending a message persists to DB and appears in another user's view within 3–5s (polling cadence)
- Threading works (open thread, reply, return to channel)
- Attachments upload via the existing pipeline and render as inline cards
- @-mentions create notification entries and trigger inbox badge
- Service Providers joining a JobCard auto-gain `GUEST` membership in the milestone thread
- Service Provider completing a JobCard transitions to `OBSERVER` and a system message posts
- Client invite flow works — invited client lands in `#client` only, cannot see other channels
- Milestone state changes (submitted, AI-verified, approved, rejected) post system messages to the milestone thread
- Cmd+K search returns message results, filtered by accessible channels
- Global inbox shows mentions + unread channels across all the user's projects
- All Slack-style interactions feel correct: keyboard nav, message hover actions, edit own message, soft-delete with "this message was deleted" placeholder

---

## Production swap (documented now, not built)

When this goes to production, replace polling with real-time:

1. Add Pusher / Ably as a dependency
2. Create one channel per ProjectWorkspace at the realtime provider
3. Server-side, after committing a message, publish `message:created` event to the channel
4. Client-side, replace polling intervals with Pusher subscriptions; TanStack Query handles the rest

The client hooks (`useChannelMessages`) abstract the transport. The DB stays canonical; realtime is only invalidation. This means the prototype's correctness is identical to production — what changes is latency from 3s to <100ms.

Document this in the production handoff README. Estimated 2 days of work to swap.

---

## Out of scope for prototype

These are tempting but conscious omissions:

- **Direct messages (1:1, outside project context)** — meaningfully different access model; not the platform's value prop
- **Voice / video calls** — wrong category for the platform
- **Slack apps / integrations / bots beyond the SEE.AI Assistant** — the AI Assistant already lives at the platform level
- **Message reminders** — "remind me about this tomorrow"
- **Message scheduling** — "send this at 9am"
- **Threading-into-channels** ("Also send to channel" Slack pattern) — too noisy for project context
- **Custom emoji uploads** — standard emoji only
- **Channel groups / sections** — flat sidebar within each project workspace is enough
- **Cross-project channels** — every channel belongs to one project workspace
- **Mobile push notifications** — web only, in-app notifications only
- **Voice messages** — not in scope

These are all production considerations, not prototype work.
