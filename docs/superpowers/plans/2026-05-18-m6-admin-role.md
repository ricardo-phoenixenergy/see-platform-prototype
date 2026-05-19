# M6 — Admin Role: Governance & Verification Queue Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Platform Admin role — real admin dashboard with live queue counts, KYC approval queue, milestone submission review portal (with approve/reject wired to tier recalculation), users & companies management, milestone template configuration, and scaffolds for financial/disputes/helpdesk/configuration pages.

**Architecture:** No new schema models needed — all models exist (KycSubmission, MilestoneSubmission, MilestoneTemplate, Company, User, TierStatus). One minor schema addition: `pendingTierUp String?` on TierStatus so the contractor sees the tier-up animation on their next dashboard load after admin approval. Admin server actions and queries live in `server/actions/admin.ts` and `server/queries/admin.ts`. All admin pages are Server Components; the submission review detail page includes a client `SubmissionReviewPanel` for the interactive approve/reject flow.

**Tech Stack:** Next.js 15 App Router, Prisma 7, Zod (form validation), Server Actions, TanStack Query (client-side refetch in review panel), TypeScript strict.

---

## File Map

**New files:**
- `server/queries/admin.ts` — admin stats, KYC queue, submissions queue, user list, template list
- `server/actions/admin.ts` — KYC decisions, submission decisions (+ tier recalc), tier override, template CRUD
- `app/(app)/admin/page.tsx` — real admin dashboard with live stats
- `app/(app)/admin/kyc/page.tsx` — KYC approval queue
- `app/(app)/admin/submissions/page.tsx` — milestone submissions queue
- `app/(app)/admin/submissions/[id]/page.tsx` — submission detail review page
- `app/(app)/admin/users/page.tsx` — users & companies list
- `app/(app)/admin/templates/page.tsx` — template list
- `app/(app)/admin/templates/new/page.tsx` — new template form
- `app/(app)/admin/templates/[id]/page.tsx` — template editor
- `app/(app)/admin/financial/page.tsx` — read-only financial scaffold
- `app/(app)/admin/disputes/page.tsx` — scaffold with example dispute
- `app/(app)/admin/helpdesk/page.tsx` — scaffold with example tickets
- `app/(app)/admin/configuration/page.tsx` — tier thresholds + cashback rates display
- `components/admin/kyc-review-panel.tsx` — KYC document viewer + action buttons (client)
- `components/admin/submission-review-panel.tsx` — submission review with artefact list + approve/reject/request-info (client)
- `components/admin/template-form.tsx` — template create/edit form (client)

**Modified files:**
- `prisma/schema.prisma` — add `pendingTierUp String?` to TierStatus
- `server/actions/tier.ts` — update `recalculateTier` to set `pendingTierUp` on upgrade
- `app/(app)/contractor/page.tsx` — check `pendingTierUp` on load, redirect `?tierUp=TIER` + clear flag
- `components/shell/sidebar.tsx` — update ADMIN_NAV to match spec

---

## Task 1: Schema Migration — pendingTierUp

**Files:**
- Modify: `prisma/schema.prisma` (TierStatus model)
- Run migration

The `TierStatus` model needs a `pendingTierUp` field so the system can signal to the contractor that their tier was upgraded after admin approves a milestone. When the contractor loads their dashboard, the server checks this flag, redirects with `?tierUp=SILVER` (or whatever tier), and clears the flag.

- [ ] **Step 1: Add pendingTierUp to TierStatus**

In `prisma/schema.prisma`, find the `TierStatus` model (currently lines 228–241) and add the new field:

```prisma
model TierStatus {
  id                    String  @id @default(cuid())
  companyId             String  @unique
  tier                  Tier    @default(BRONZE)
  compliantProjectCount Int     @default(0)
  pointsToNextTier      Int     @default(0)
  pendingTierUp         String? // set by recalculateTier on upgrade; cleared by contractor dashboard redirect

  company Company @relation(fields: [companyId], references: [id])

  updatedAt DateTime @updatedAt
}
```

- [ ] **Step 2: Run migration**

```bash
npx prisma migrate dev --name add_pending_tier_up
```
Expected: migration created and applied, Prisma client regenerated.

- [ ] **Step 3: Run typecheck**

```bash
npm run typecheck
```
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat(m6): add pendingTierUp to TierStatus for tier-upgrade notification"
```

---

## Task 2: Update recalculateTier to set pendingTierUp

**Files:**
- Modify: `server/actions/tier.ts`

When the tier upgrade happens, write the new tier into `pendingTierUp`. The contractor dashboard will read this on next load.

- [ ] **Step 1: Update recalculateTier**

Replace the content of `server/actions/tier.ts`:

```typescript
// server/actions/tier.ts
'use server'

import { db } from '@/lib/db'
import { getTierForCount } from '@/lib/tier/rules'
import type { Tier } from '@/lib/tier/rules'

export async function recalculateTier(companyId: string): Promise<{
  previousTier: Tier
  newTier: Tier
  upgraded: boolean
}> {
  const projects = await db.project.findMany({
    where: { contractorCompanyId: companyId, deletedAt: null },
    select: {
      id: true,
      milestones: {
        where: { isHardGate: true },
        select: { status: true },
      },
    },
  })

  const compliantCount = projects.filter((p) => {
    const hardGates = p.milestones
    return (
      hardGates.length > 0 &&
      hardGates.every((m) => m.status === 'APPROVED' || m.status === 'AUTO_GOLD')
    )
  }).length

  const current = await db.tierStatus.findUnique({
    where: { companyId },
    select: { tier: true },
  })
  const previousTier = (current?.tier ?? 'BRONZE') as Tier
  const newTier = getTierForCount(compliantCount)
  const upgraded = newTier !== previousTier

  await db.tierStatus.upsert({
    where: { companyId },
    update: {
      tier: newTier,
      compliantProjectCount: compliantCount,
      // Set pendingTierUp so contractor dashboard shows tier-up animation
      ...(upgraded ? { pendingTierUp: newTier } : {}),
    },
    create: {
      companyId,
      tier: newTier,
      compliantProjectCount: compliantCount,
      pendingTierUp: upgraded ? newTier : null,
    },
  })

  return { previousTier, newTier, upgraded }
}
```

- [ ] **Step 2: Typecheck**

```bash
npm run typecheck
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add server/actions/tier.ts
git commit -m "feat(m6): recalculateTier sets pendingTierUp on upgrade"
```

---

## Task 3: Contractor Dashboard — tierUp Redirect

**Files:**
- Modify: `app/(app)/contractor/page.tsx`

When the contractor loads their dashboard and `pendingTierUp` is set on their TierStatus, redirect to `?tierUp=SILVER` (or whatever tier) and clear the flag in the DB. This wires the M5 animation to admin approval.

- [ ] **Step 1: Update contractor dashboard to check pendingTierUp**

Replace `app/(app)/contractor/page.tsx` with:

```typescript
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getDashboardStats, getMilestoneWatch, getNewsItems, getTierProgress } from '@/server/queries/dashboard'
import { StatsRow } from '@/components/dashboard/stats-row'
import { TierProgressCard } from '@/components/dashboard/tier-progress-card'
import { MilestoneWatch } from '@/components/dashboard/milestone-watch'
import { NewsfeedSidebar } from '@/components/dashboard/newsfeed-sidebar'
import { AiSuggestionsCard } from '@/components/dashboard/ai-suggestions-card'
import { db } from '@/lib/db'

type Props = { searchParams: Promise<{ tierUp?: string }> }

export default async function ContractorDashboardPage({ searchParams }: Props) {
  const session = await auth()
  if (!session) redirect('/login')

  const companyId = session.user.companyId
  const { tierUp } = await searchParams

  // Check for pending tier upgrade notification (set by admin approval via recalculateTier)
  if (!tierUp) {
    const tierStatus = await db.tierStatus.findUnique({
      where: { companyId },
      select: { pendingTierUp: true },
    })
    if (tierStatus?.pendingTierUp) {
      // Clear the flag and redirect to show the animation
      await db.tierStatus.update({
        where: { companyId },
        data: { pendingTierUp: null },
      })
      redirect(`/contractor?tierUp=${tierStatus.pendingTierUp}`)
    }
  }

  const [stats, milestones, newsItems, tierProgress] = await Promise.all([
    getDashboardStats(companyId),
    getMilestoneWatch(companyId),
    getNewsItems(),
    getTierProgress(companyId),
  ])

  const statItems = [
    { label: 'Active projects', value: String(stats.activeProjects), sub: 'across all stages' },
    { label: 'Operational sites', value: String(stats.operationalSites), sub: 'generating today' },
    { label: 'Portfolio capacity', value: `${stats.totalPortfolioKw.toLocaleString()} kW`, sub: 'total installed' },
    { label: 'Token balance', value: stats.tokenBalance.toLocaleString(), sub: 'SEE tokens' },
  ]

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink-900">Dashboard</h1>
        <p className="text-sm text-ink-500 mt-1">Adebayo Renewables — {tierProgress.tier.charAt(0) + tierProgress.tier.slice(1).toLowerCase()} tier</p>
      </div>

      <StatsRow stats={statItems} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <MilestoneWatch milestones={milestones} />
          <AiSuggestionsCard />
          <TierProgressCard
            tier={tierProgress.tier}
            compliantProjectCount={tierProgress.compliantProjectCount}
            nextTierAt={tierProgress.nextTierAt}
            progressPercent={tierProgress.progressPercent}
          />
        </div>

        <div className="lg:col-span-1">
          <NewsfeedSidebar items={newsItems} />
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Typecheck**

```bash
npm run typecheck
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add "app/(app)/contractor/page.tsx"
git commit -m "feat(m6): contractor dashboard checks pendingTierUp, redirects for animation"
```

---

## Task 4: Admin Queries Library

**Files:**
- Create: `server/queries/admin.ts`

All admin-specific read queries in one file.

- [ ] **Step 1: Create `server/queries/admin.ts`**

```typescript
// server/queries/admin.ts

import { db } from '@/lib/db'

export async function getAdminStats() {
  const [totalUsers, totalCompanies, totalProjects, kycPending, submissionsPending] = await Promise.all([
    db.user.count({ where: { deletedAt: null } }),
    db.company.count({ where: { deletedAt: null } }),
    db.project.count({ where: { deletedAt: null } }),
    db.kycSubmission.count({ where: { status: 'PENDING' } }),
    db.milestoneSubmission.count({ where: { status: { in: ['PENDING', 'UNDER_REVIEW'] } } }),
  ])
  return { totalUsers, totalCompanies, totalProjects, kycPending, submissionsPending }
}

export async function getKycQueue() {
  return db.kycSubmission.findMany({
    where: { status: { in: ['PENDING', 'REQUEST_INFO'] } },
    include: {
      company: { select: { id: true, name: true, type: true, registrationNo: true, vatNo: true } },
    },
    orderBy: { createdAt: 'asc' },
  })
}

export async function getKycSubmission(id: string) {
  return db.kycSubmission.findUnique({
    where: { id },
    include: {
      company: { select: { id: true, name: true, type: true, registrationNo: true, vatNo: true } },
    },
  })
}

export async function getSubmissionsQueue() {
  return db.milestoneSubmission.findMany({
    where: { status: { in: ['PENDING', 'UNDER_REVIEW'] } },
    include: {
      milestone: {
        select: {
          id: true,
          name: true,
          isHardGate: true,
          requiredArtefacts: true,
          project: {
            select: {
              id: true,
              name: true,
              contractorCompanyId: true,
              contractorCompany: { select: { name: true } },
            },
          },
        },
      },
      verifications: {
        select: { id: true, type: true, status: true, qualityRating: true },
      },
    },
    orderBy: { createdAt: 'asc' },
  })
}

export async function getSubmissionDetail(id: string) {
  return db.milestoneSubmission.findUnique({
    where: { id },
    include: {
      milestone: {
        select: {
          id: true,
          name: true,
          description: true,
          isHardGate: true,
          requiredArtefacts: true,
          project: {
            select: {
              id: true,
              name: true,
              contractorCompanyId: true,
              contractorCompany: { select: { id: true, name: true } },
            },
          },
        },
      },
      verifications: {
        select: {
          id: true,
          type: true,
          status: true,
          qualityRating: true,
          findings: true,
          notes: true,
          costTokens: true,
          completedAt: true,
        },
        orderBy: { createdAt: 'asc' },
      },
    },
  })
}

export async function getAllUsersAndCompanies() {
  return db.company.findMany({
    where: { deletedAt: null },
    include: {
      memberships: {
        include: { user: { select: { id: true, name: true, email: true } } },
      },
      tierStatus: { select: { tier: true, compliantProjectCount: true } },
      kycSubmissions: { select: { status: true }, orderBy: { createdAt: 'desc' }, take: 1 },
    },
    orderBy: { createdAt: 'desc' },
  })
}

export async function getTemplates() {
  return db.milestoneTemplate.findMany({
    include: { items: { orderBy: { order: 'asc' } } },
    orderBy: { createdAt: 'desc' },
  })
}

export async function getTemplate(id: string) {
  return db.milestoneTemplate.findUnique({
    where: { id },
    include: { items: { orderBy: { order: 'asc' } } },
  })
}
```

- [ ] **Step 2: Typecheck**

```bash
npm run typecheck
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add server/queries/admin.ts
git commit -m "feat(m6): admin queries — stats, KYC queue, submissions queue, users, templates"
```

---

## Task 5: Admin Server Actions

**Files:**
- Create: `server/actions/admin.ts`

- [ ] **Step 1: Create `server/actions/admin.ts`**

```typescript
// server/actions/admin.ts
'use server'

import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { recalculateTier } from './tier'
import { z } from 'zod'

// ─── KYC ─────────────────────────────────────────────────────────────────────

const kycDecisionSchema = z.object({
  submissionId: z.string(),
  reason: z.string().optional(),
})

export async function approveKyc(formData: FormData) {
  const { submissionId } = kycDecisionSchema.parse({
    submissionId: formData.get('submissionId'),
  })
  await db.kycSubmission.update({
    where: { id: submissionId },
    data: { status: 'APPROVED', reviewedAt: new Date() },
  })
  revalidatePath('/admin/kyc')
}

export async function rejectKyc(formData: FormData) {
  const { submissionId, reason } = kycDecisionSchema.parse({
    submissionId: formData.get('submissionId'),
    reason: formData.get('reason') ?? undefined,
  })
  await db.kycSubmission.update({
    where: { id: submissionId },
    data: { status: 'REJECTED', rejectionReason: reason ?? null, reviewedAt: new Date() },
  })
  revalidatePath('/admin/kyc')
}

export async function requestKycInfo(formData: FormData) {
  const { submissionId, reason } = kycDecisionSchema.parse({
    submissionId: formData.get('submissionId'),
    reason: formData.get('reason') ?? undefined,
  })
  await db.kycSubmission.update({
    where: { id: submissionId },
    data: { status: 'REQUEST_INFO', rejectionReason: reason ?? null, reviewedAt: new Date() },
  })
  revalidatePath('/admin/kyc')
}

// ─── SUBMISSIONS ─────────────────────────────────────────────────────────────

const submissionDecisionSchema = z.object({
  submissionId: z.string(),
  feedback: z.string().optional(),
})

export async function approveSubmission(formData: FormData) {
  const { submissionId } = submissionDecisionSchema.parse({
    submissionId: formData.get('submissionId'),
  })

  const submission = await db.milestoneSubmission.findUnique({
    where: { id: submissionId },
    include: {
      milestone: {
        select: {
          id: true,
          project: { select: { contractorCompanyId: true } },
        },
      },
    },
  })
  if (!submission) throw new Error('Submission not found')

  // Update submission + milestone status atomically
  await db.$transaction([
    db.milestoneSubmission.update({
      where: { id: submissionId },
      data: { status: 'APPROVED', reviewedAt: new Date() },
    }),
    db.milestone.update({
      where: { id: submission.milestone.id },
      data: { status: 'APPROVED' },
    }),
  ])

  // Recalculate tier (sets pendingTierUp if upgraded)
  await recalculateTier(submission.milestone.project.contractorCompanyId)

  revalidatePath('/admin/submissions')
  revalidatePath(`/admin/submissions/${submissionId}`)
}

export async function rejectSubmission(formData: FormData) {
  const { submissionId, feedback } = submissionDecisionSchema.parse({
    submissionId: formData.get('submissionId'),
    feedback: formData.get('feedback') ?? undefined,
  })

  const submission = await db.milestoneSubmission.findUnique({
    where: { id: submissionId },
    include: { milestone: { select: { id: true } } },
  })
  if (!submission) throw new Error('Submission not found')

  await db.$transaction([
    db.milestoneSubmission.update({
      where: { id: submissionId },
      data: { status: 'REJECTED', feedback: feedback ?? null, reviewedAt: new Date() },
    }),
    db.milestone.update({
      where: { id: submission.milestone.id },
      data: { status: 'ACTION_REQUIRED' },
    }),
  ])

  revalidatePath('/admin/submissions')
  revalidatePath(`/admin/submissions/${submissionId}`)
}

export async function requestSubmissionInfo(formData: FormData) {
  const { submissionId, feedback } = submissionDecisionSchema.parse({
    submissionId: formData.get('submissionId'),
    feedback: formData.get('feedback') ?? undefined,
  })

  const submission = await db.milestoneSubmission.findUnique({
    where: { id: submissionId },
    include: { milestone: { select: { id: true } } },
  })
  if (!submission) throw new Error('Submission not found')

  await db.$transaction([
    db.milestoneSubmission.update({
      where: { id: submissionId },
      data: { status: 'REQUEST_INFO', feedback: feedback ?? null, reviewedAt: new Date() },
    }),
    db.milestone.update({
      where: { id: submission.milestone.id },
      data: { status: 'ACTION_REQUIRED' },
    }),
  ])

  revalidatePath('/admin/submissions')
  revalidatePath(`/admin/submissions/${submissionId}`)
}

// ─── TIER OVERRIDE ───────────────────────────────────────────────────────────

const tierOverrideSchema = z.object({
  companyId: z.string(),
  tier: z.enum(['BRONZE', 'SILVER', 'GOLD', 'PLATINUM']),
})

export async function overrideTier(formData: FormData) {
  const { companyId, tier } = tierOverrideSchema.parse({
    companyId: formData.get('companyId'),
    tier: formData.get('tier'),
  })
  await db.tierStatus.upsert({
    where: { companyId },
    update: { tier },
    create: { companyId, tier },
  })
  revalidatePath('/admin/users')
}

// ─── TEMPLATES ───────────────────────────────────────────────────────────────

const templateItemSchema = z.object({
  order: z.coerce.number(),
  name: z.string().min(1),
  description: z.string().min(1),
  phase: z.string(),
  isHardGate: z.boolean().default(true),
  estimatedDays: z.coerce.number().optional(),
})

const createTemplateSchema = z.object({
  name: z.string().min(1),
  technology: z.string(),
  minSizeKw: z.coerce.number().optional(),
  maxSizeKw: z.coerce.number().optional(),
  items: z.array(templateItemSchema).min(1),
})

export async function createTemplate(data: z.infer<typeof createTemplateSchema>) {
  const parsed = createTemplateSchema.parse(data)
  const template = await db.milestoneTemplate.create({
    data: {
      name: parsed.name,
      technology: parsed.technology as Parameters<typeof db.milestoneTemplate.create>[0]['data']['technology'],
      minSizeKw: parsed.minSizeKw ?? null,
      maxSizeKw: parsed.maxSizeKw ?? null,
      items: {
        create: parsed.items.map((item) => ({
          order: item.order,
          name: item.name,
          description: item.description,
          phase: item.phase as Parameters<typeof db.milestoneTemplateItem.create>[0]['data']['phase'],
          isHardGate: item.isHardGate,
          requiredArtefacts: JSON.parse(JSON.stringify([{ name: 'Document', allowedTypes: ['pdf'] }])),
          estimatedDays: item.estimatedDays ?? null,
        })),
      },
    },
  })
  revalidatePath('/admin/templates')
  return template.id
}

export async function toggleTemplateActive(formData: FormData) {
  const id = z.string().parse(formData.get('id'))
  const template = await db.milestoneTemplate.findUnique({ where: { id }, select: { isActive: true } })
  if (!template) throw new Error('Template not found')
  await db.milestoneTemplate.update({
    where: { id },
    data: { isActive: !template.isActive },
  })
  revalidatePath('/admin/templates')
}
```

- [ ] **Step 2: Typecheck**

```bash
npm run typecheck
```

Fix any type errors from Technology/DealStructure enum usage. The Prisma-generated enums will be available from `@/lib/generated/prisma/client`. If `Technology` or `ProjectStage` imports are needed, add:
```typescript
import type { Technology, ProjectStage } from '@/lib/generated/prisma/client'
```
and use them to cast the string values properly. If the `as` cast approach causes type errors, use:
```typescript
technology: parsed.technology as Technology,
phase: item.phase as ProjectStage,
```
Both should already be available via the generated Prisma client used by `db`.

- [ ] **Step 3: Commit**

```bash
git add server/actions/admin.ts
git commit -m "feat(m6): admin server actions — KYC, submissions, tier override, template CRUD"
```

---

## Task 6: Update Admin Sidebar Nav

**Files:**
- Modify: `components/shell/sidebar.tsx`

Update ADMIN_NAV to match the spec. Add icons for new items.

- [ ] **Step 1: Update ADMIN_NAV in `components/shell/sidebar.tsx`**

Replace the `ADMIN_NAV` export and add required icons. Add `ClipboardList, Scale, HelpCircle, Settings, BarChart3` to the lucide-react import:

```typescript
import {
  LayoutDashboard, FolderOpen, ShoppingBag, Wallet,
  Building2, ChevronLeft, ChevronRight, Wrench, TrendingUp, Lock,
  ClipboardList, Scale, HelpCircle, Settings, BarChart3,
} from 'lucide-react'
```

Replace the `ADMIN_NAV` constant:

```typescript
export const ADMIN_NAV: NavItem[] = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { label: 'KYC Queue', href: '/admin/kyc', icon: FolderOpen },
  { label: 'Submissions', href: '/admin/submissions', icon: ClipboardList },
  { label: 'Users & Companies', href: '/admin/users', icon: Building2 },
  { label: 'Templates', href: '/admin/templates', icon: ShoppingBag },
  { label: 'Financial', href: '/admin/financial', icon: BarChart3 },
  { label: 'Disputes', href: '/admin/disputes', icon: Scale },
  { label: 'Helpdesk', href: '/admin/helpdesk', icon: HelpCircle },
  { label: 'Configuration', href: '/admin/configuration', icon: Settings },
]
```

- [ ] **Step 2: Typecheck**

```bash
npm run typecheck
```

- [ ] **Step 3: Commit**

```bash
git add components/shell/sidebar.tsx
git commit -m "feat(m6): update admin sidebar nav to match spec"
```

---

## Task 7: Admin Dashboard Page

**Files:**
- Replace: `app/(app)/admin/page.tsx`

Real stats: total users, total projects, queue counts, recent activity (last 10 milestone submissions and KYC submissions).

- [ ] **Step 1: Implement the admin dashboard**

Replace `app/(app)/admin/page.tsx`:

```typescript
import { getAdminStats } from '@/server/queries/admin'
import { db } from '@/lib/db'
import { ClipboardList, Building2, FolderOpen, Users } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

export default async function AdminDashboardPage() {
  const [stats, recentSubmissions, recentKyc] = await Promise.all([
    getAdminStats(),
    db.milestoneSubmission.findMany({
      take: 6,
      orderBy: { createdAt: 'desc' },
      include: {
        milestone: {
          select: {
            name: true,
            project: { select: { name: true, contractorCompany: { select: { name: true } } } },
          },
        },
      },
    }),
    db.kycSubmission.findMany({
      take: 4,
      where: { status: 'PENDING' },
      include: { company: { select: { name: true, type: true } } },
      orderBy: { createdAt: 'asc' },
    }),
  ])

  const statCards = [
    { label: 'Total users', value: stats.totalUsers, icon: Users, href: '/admin/users' },
    { label: 'Total companies', value: stats.totalCompanies, icon: Building2, href: '/admin/users' },
    { label: 'Total projects', value: stats.totalProjects, icon: FolderOpen, href: '/admin/users' },
    { label: 'KYC pending', value: stats.kycPending, icon: ClipboardList, href: '/admin/kyc', alert: stats.kycPending > 0 },
    { label: 'Submissions pending', value: stats.submissionsPending, icon: ClipboardList, href: '/admin/submissions', alert: stats.submissionsPending > 0 },
  ]

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink-900">Admin</h1>
        <p className="text-sm text-ink-500 mt-1">Platform overview and queue management.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {statCards.map((card) => {
          const Icon = card.icon
          return (
            <Link
              key={card.label}
              href={card.href}
              className={cn(
                'rounded-lg border bg-white px-4 py-5 hover:border-ink-300 transition-colors',
                card.alert ? 'border-accent-400 bg-accent-500/5' : 'border-ink-200'
              )}
            >
              <div className="flex items-center gap-2 mb-2">
                <Icon className={cn('h-4 w-4', card.alert ? 'text-accent-500' : 'text-ink-400')} strokeWidth={1.5} />
                <span className="text-xs text-ink-500">{card.label}</span>
              </div>
              <p className={cn('text-2xl font-semibold tabular-nums', card.alert ? 'text-accent-600' : 'text-ink-900')}>
                {card.value}
              </p>
            </Link>
          )
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent submissions */}
        <div className="rounded-lg border border-ink-200 bg-white overflow-hidden">
          <div className="px-4 py-3 border-b border-ink-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-ink-900">Recent submissions</h2>
            <Link href="/admin/submissions" className="text-xs text-accent-600 hover:underline">View queue</Link>
          </div>
          <ul className="divide-y divide-ink-50">
            {recentSubmissions.length === 0 && (
              <li className="px-4 py-6 text-sm text-ink-400 text-center">No submissions yet.</li>
            )}
            {recentSubmissions.map((s) => (
              <li key={s.id}>
                <Link
                  href={`/admin/submissions/${s.id}`}
                  className="flex items-start gap-3 px-4 py-3 hover:bg-ink-25 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-ink-900 truncate">{s.milestone.name}</p>
                    <p className="text-xs text-ink-500 truncate">{s.milestone.project.contractorCompany.name} — {s.milestone.project.name}</p>
                  </div>
                  <span className={cn(
                    'text-[10px] font-semibold px-1.5 py-0.5 rounded-sm flex-shrink-0',
                    s.status === 'PENDING' ? 'bg-ink-100 text-ink-600' :
                    s.status === 'UNDER_REVIEW' ? 'bg-accent-500/10 text-accent-600' :
                    s.status === 'APPROVED' ? 'bg-success-500/10 text-success-600' :
                    'bg-danger-500/10 text-danger-600'
                  )}>
                    {s.status.replace('_', ' ')}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* KYC pending */}
        <div className="rounded-lg border border-ink-200 bg-white overflow-hidden">
          <div className="px-4 py-3 border-b border-ink-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-ink-900">KYC pending</h2>
            <Link href="/admin/kyc" className="text-xs text-accent-600 hover:underline">View queue</Link>
          </div>
          <ul className="divide-y divide-ink-50">
            {recentKyc.length === 0 && (
              <li className="px-4 py-6 text-sm text-ink-400 text-center">No pending KYC reviews.</li>
            )}
            {recentKyc.map((k) => (
              <li key={k.id}>
                <Link
                  href={`/admin/kyc`}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-ink-25 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-ink-900 truncate">{k.company.name}</p>
                    <p className="text-xs text-ink-500">{k.company.type}</p>
                  </div>
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-sm bg-warning-50 text-warning-700 flex-shrink-0">
                    PENDING
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Typecheck**

```bash
npm run typecheck
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add "app/(app)/admin/page.tsx"
git commit -m "feat(m6): admin dashboard — live stats, recent submissions, KYC pending"
```

---

## Task 8: KYC Review Panel Component

**Files:**
- Create: `components/admin/kyc-review-panel.tsx`

Client component: shows the KYC submission detail (document links + submitted data) and approve/reject/request-info action buttons wired to server actions.

- [ ] **Step 1: Create `components/admin/kyc-review-panel.tsx`**

```typescript
'use client'
// components/admin/kyc-review-panel.tsx

import { useState, useTransition } from 'react'
import { CheckCircle, XCircle, MessageSquare, ExternalLink, Loader2 } from 'lucide-react'
import { approveKyc, rejectKyc, requestKycInfo } from '@/server/actions/admin'
import { cn } from '@/lib/utils'

type KycSubmission = {
  id: string
  cipcDocUrl: string | null
  vatDocUrl: string | null
  directorIdUrl: string | null
  status: string
  rejectionReason: string | null
  company: {
    name: string
    type: string
    registrationNo: string | null
    vatNo: string | null
  }
  createdAt: Date
}

type Props = {
  submission: KycSubmission
  onClose: () => void
  onDecision: () => void
}

export function KycReviewPanel({ submission, onClose, onDecision }: Props) {
  const [action, setAction] = useState<'approve' | 'reject' | 'request' | null>(null)
  const [reason, setReason] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleAction(type: 'approve' | 'reject' | 'request') {
    if (type === 'approve') {
      startTransition(async () => {
        const fd = new FormData()
        fd.set('submissionId', submission.id)
        await approveKyc(fd)
        onDecision()
        onClose()
      })
      return
    }
    setAction(type)
  }

  function handleSubmitWithReason() {
    startTransition(async () => {
      const fd = new FormData()
      fd.set('submissionId', submission.id)
      fd.set('reason', reason)
      if (action === 'reject') await rejectKyc(fd)
      else await requestKycInfo(fd)
      onDecision()
      onClose()
    })
  }

  const docs = [
    { label: 'CIPC Certificate', url: submission.cipcDocUrl },
    { label: 'VAT Certificate', url: submission.vatDocUrl },
    { label: 'Director ID', url: submission.directorIdUrl },
  ].filter((d) => d.url)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/30 backdrop-blur-sm" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="bg-white rounded-xl border border-ink-200 shadow-2xl w-[520px] max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-ink-100 flex items-start justify-between">
          <div>
            <p className="text-sm font-semibold text-ink-900">{submission.company.name}</p>
            <p className="text-xs text-ink-500">{submission.company.type} · Reg: {submission.company.registrationNo ?? '—'} · VAT: {submission.company.vatNo ?? '—'}</p>
          </div>
          <button onClick={onClose} className="text-ink-400 hover:text-ink-700 text-lg leading-none">×</button>
        </div>

        {/* Documents */}
        <div className="px-6 py-4 border-b border-ink-100 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-ink-400 mb-3">Documents</p>
          {docs.length === 0 && <p className="text-sm text-ink-400">No documents uploaded.</p>}
          {docs.map((d) => (
            <a
              key={d.label}
              href={d.url!}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-accent-600 hover:underline"
            >
              <ExternalLink className="h-3.5 w-3.5 flex-shrink-0" strokeWidth={1.5} />
              {d.label}
            </a>
          ))}
        </div>

        {/* Actions */}
        <div className="px-6 py-4 space-y-4">
          {action === null && (
            <div className="flex gap-2">
              <button
                onClick={() => handleAction('approve')}
                disabled={isPending}
                className="flex-1 flex items-center justify-center gap-1.5 h-8 rounded-md bg-ink-900 text-white text-xs font-medium hover:bg-ink-800 transition-colors disabled:opacity-50"
              >
                {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle className="h-3.5 w-3.5" strokeWidth={1.5} />}
                Approve
              </button>
              <button
                onClick={() => handleAction('request')}
                className="flex-1 flex items-center justify-center gap-1.5 h-8 rounded-md border border-ink-200 text-ink-600 text-xs font-medium hover:bg-ink-50 transition-colors"
              >
                <MessageSquare className="h-3.5 w-3.5" strokeWidth={1.5} />
                Request info
              </button>
              <button
                onClick={() => handleAction('reject')}
                className="flex-1 flex items-center justify-center gap-1.5 h-8 rounded-md border border-danger-200 text-danger-600 text-xs font-medium hover:bg-danger-50 transition-colors"
              >
                <XCircle className="h-3.5 w-3.5" strokeWidth={1.5} />
                Reject
              </button>
            </div>
          )}

          {action !== null && (
            <div className="space-y-3">
              <p className="text-sm font-medium text-ink-900">
                {action === 'reject' ? 'Rejection reason' : 'Request details'}
              </p>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                placeholder={action === 'reject' ? 'Explain why this KYC was rejected…' : 'Specify what additional information is needed…'}
                className="w-full rounded-md border border-ink-200 px-3 py-2 text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-accent-500/20 resize-none"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSubmitWithReason}
                  disabled={isPending || !reason.trim()}
                  className={cn(
                    'flex-1 h-8 rounded-md text-white text-xs font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5',
                    action === 'reject' ? 'bg-danger-600 hover:bg-danger-700' : 'bg-ink-900 hover:bg-ink-800'
                  )}
                >
                  {isPending && <Loader2 className="h-3 w-3 animate-spin" />}
                  {action === 'reject' ? 'Confirm rejection' : 'Send request'}
                </button>
                <button onClick={() => setAction(null)} className="h-8 px-3 rounded-md border border-ink-200 text-ink-600 text-xs hover:bg-ink-50 transition-colors">
                  Back
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Typecheck**

```bash
npm run typecheck
```

- [ ] **Step 3: Commit**

```bash
git add components/admin/kyc-review-panel.tsx
git commit -m "feat(m6): KYC review panel component"
```

---

## Task 9: KYC Queue Page

**Files:**
- Create: `app/(app)/admin/kyc/page.tsx`

- [ ] **Step 1: Create `app/(app)/admin/kyc/page.tsx`**

```typescript
'use client'

import { useState, useEffect } from 'react'
import { KycReviewPanel } from '@/components/admin/kyc-review-panel'
import { cn } from '@/lib/utils'

type KycItem = {
  id: string
  status: string
  createdAt: string
  rejectionReason: string | null
  cipcDocUrl: string | null
  vatDocUrl: string | null
  directorIdUrl: string | null
  company: { name: string; type: string; registrationNo: string | null; vatNo: string | null }
}

export default function KycQueuePage() {
  const [items, setItems] = useState<KycItem[]>([])
  const [selected, setSelected] = useState<KycItem | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  async function load() {
    const res = await fetch('/api/admin/kyc')
    if (res.ok) {
      const data = await res.json() as { submissions: KycItem[] }
      setItems(data.submissions)
    }
    setIsLoading(false)
  }

  useEffect(() => { void load() }, [])

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h2 className="text-base font-semibold text-ink-900">KYC Queue</h2>
        <p className="text-sm text-ink-500">Review company KYC submissions — approve, reject, or request additional information.</p>
      </div>

      {isLoading && (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => <div key={i} className="h-14 rounded-md bg-ink-50 animate-pulse" />)}
        </div>
      )}

      {!isLoading && items.length === 0 && (
        <div className="flex flex-col items-center py-16 text-center">
          <p className="text-sm font-medium text-ink-900">No pending KYC submissions</p>
          <p className="text-xs text-ink-500 mt-1">All submissions have been reviewed.</p>
        </div>
      )}

      {!isLoading && items.length > 0 && (
        <div className="rounded-lg border border-ink-200 bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-ink-25 border-b border-ink-100">
                <th className="px-4 py-3 text-left text-xs font-semibold text-ink-500">Company</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-ink-500">Type</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-ink-500">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-ink-500">Submitted</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-50">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-ink-25 transition-colors">
                  <td className="px-4 py-3 font-medium text-ink-900">{item.company.name}</td>
                  <td className="px-4 py-3 text-ink-500">{item.company.type}</td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      'text-[10px] font-semibold px-1.5 py-0.5 rounded-sm',
                      item.status === 'PENDING' ? 'bg-ink-100 text-ink-600' : 'bg-warning-50 text-warning-700'
                    )}>
                      {item.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-ink-500 text-xs">
                    {new Date(item.createdAt).toLocaleDateString('en-ZA')}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setSelected(item)}
                      className="text-xs text-accent-600 hover:underline font-medium"
                    >
                      Review
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <KycReviewPanel
          submission={{ ...selected, createdAt: new Date(selected.createdAt) }}
          onClose={() => setSelected(null)}
          onDecision={() => { void load() }}
        />
      )}
    </div>
  )
}
```

- [ ] **Step 2: Create the KYC API route**

Create `app/api/admin/kyc/route.ts`:

```typescript
// app/api/admin/kyc/route.ts

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getKycQueue } from '@/server/queries/admin'

export async function GET() {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const submissions = await getKycQueue()
  return NextResponse.json({ submissions })
}
```

- [ ] **Step 3: Typecheck**

```bash
npm run typecheck
```

- [ ] **Step 4: Commit**

```bash
git add "app/(app)/admin/kyc/page.tsx" app/api/admin/kyc/route.ts
git commit -m "feat(m6): KYC queue page + API route"
```

---

## Task 10: Submission Review Panel + Queue Page

**Files:**
- Create: `components/admin/submission-review-panel.tsx`
- Create: `app/(app)/admin/submissions/page.tsx`
- Create: `app/(app)/admin/submissions/[id]/page.tsx`
- Create: `app/api/admin/submissions/route.ts`

- [ ] **Step 1: Create `components/admin/submission-review-panel.tsx`**

```typescript
'use client'
// components/admin/submission-review-panel.tsx

import { useState, useTransition } from 'react'
import { CheckCircle, XCircle, MessageSquare, ExternalLink, Loader2, ShieldCheck, AlertTriangle } from 'lucide-react'
import { approveSubmission, rejectSubmission, requestSubmissionInfo } from '@/server/actions/admin'
import { cn } from '@/lib/utils'

type Artefact = { name: string; url: string; fileSize?: number }
type Verification = { id: string; type: string; status: string; qualityRating: string | null }

type Submission = {
  id: string
  status: string
  notes: string | null
  feedback: string | null
  artefacts: Artefact[]
  verifications: Verification[]
  milestone: {
    id: string
    name: string
    description: string | null
    isHardGate: boolean
    requiredArtefacts: Array<{ name: string; allowedTypes: string[] }>
    project: {
      id: string
      name: string
      contractorCompany: { id: string; name: string }
    }
  }
}

type Props = {
  submission: Submission
  onDecision?: () => void
}

const STATUS_COLOUR: Record<string, string> = {
  PASS: 'text-success-600',
  FAIL: 'text-danger-600',
  IN_PROGRESS: 'text-ink-400',
  INCONCLUSIVE: 'text-warning-600',
}

export function SubmissionReviewPanel({ submission, onDecision }: Props) {
  const [action, setAction] = useState<'reject' | 'request' | null>(null)
  const [feedback, setFeedback] = useState('')
  const [isPending, startTransition] = useTransition()
  const [done, setDone] = useState(false)

  const artefacts = submission.artefacts as Artefact[]
  const isDecided = ['APPROVED', 'REJECTED'].includes(submission.status) || done

  function handleApprove() {
    startTransition(async () => {
      const fd = new FormData()
      fd.set('submissionId', submission.id)
      await approveSubmission(fd)
      setDone(true)
      onDecision?.()
    })
  }

  function handleSubmitWithFeedback() {
    startTransition(async () => {
      const fd = new FormData()
      fd.set('submissionId', submission.id)
      fd.set('feedback', feedback)
      if (action === 'reject') await rejectSubmission(fd)
      else await requestSubmissionInfo(fd)
      setDone(true)
      onDecision?.()
    })
  }

  return (
    <div className="space-y-6">
      {/* Context */}
      <div className="rounded-md bg-ink-25 border border-ink-200 px-4 py-3 space-y-0.5">
        <p className="text-xs text-ink-500">
          <span className="font-medium text-ink-700">{submission.milestone.project.contractorCompany.name}</span>
          {' '}·{' '}{submission.milestone.project.name}
        </p>
        <p className="text-sm font-semibold text-ink-900">{submission.milestone.name}</p>
        {submission.milestone.isHardGate && (
          <span className="inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded-sm bg-ink-900 text-white">Hard gate</span>
        )}
        {submission.notes && (
          <p className="text-xs text-ink-500 pt-1">Note from contractor: {submission.notes}</p>
        )}
      </div>

      {/* Artefact checklist */}
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-ink-400">Submitted artefacts</p>
        {artefacts.length === 0 && <p className="text-sm text-ink-400">No artefacts submitted.</p>}
        {artefacts.map((a, i) => (
          <a
            key={i}
            href={a.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-accent-600 hover:underline"
          >
            <ExternalLink className="h-3.5 w-3.5 flex-shrink-0" strokeWidth={1.5} />
            {a.name}
            {a.fileSize && <span className="text-xs text-ink-400">({Math.round(a.fileSize / 1024)} KB)</span>}
          </a>
        ))}
      </div>

      {/* Required artefacts checklist */}
      {(submission.milestone.requiredArtefacts as Array<{ name: string }>).length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-ink-400">Required artefacts check</p>
          <ul className="space-y-1">
            {(submission.milestone.requiredArtefacts as Array<{ name: string }>).map((req, i) => {
              const found = artefacts.some((a) =>
                a.name.toLowerCase().includes(req.name.toLowerCase())
              )
              return (
                <li key={i} className="flex items-center gap-2 text-sm">
                  {found
                    ? <CheckCircle className="h-3.5 w-3.5 text-success-500 flex-shrink-0" strokeWidth={1.5} />
                    : <AlertTriangle className="h-3.5 w-3.5 text-warning-500 flex-shrink-0" strokeWidth={1.5} />
                  }
                  <span className={found ? 'text-ink-700' : 'text-warning-700'}>{req.name}</span>
                </li>
              )
            })}
          </ul>
        </div>
      )}

      {/* Verifications */}
      {submission.verifications.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-ink-400">Verifications</p>
          {submission.verifications.map((v) => (
            <div key={v.id} className="flex items-center gap-2 text-sm">
              <ShieldCheck className="h-3.5 w-3.5 text-ink-400 flex-shrink-0" strokeWidth={1.5} />
              <span className="text-ink-600">{v.type.replace('_', ' ')}</span>
              <span className={cn('font-medium', STATUS_COLOUR[v.status] ?? 'text-ink-600')}>{v.status}</span>
              {v.qualityRating && <span className="text-xs text-ink-400">({v.qualityRating})</span>}
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      {!isDecided && (
        <div className="space-y-3 pt-2 border-t border-ink-100">
          {action === null && (
            <div className="flex gap-2">
              <button
                onClick={handleApprove}
                disabled={isPending}
                className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-md bg-ink-900 text-white text-sm font-medium hover:bg-ink-800 transition-colors disabled:opacity-50"
              >
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" strokeWidth={1.5} />}
                Approve
              </button>
              <button
                onClick={() => setAction('request')}
                className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-md border border-ink-200 text-ink-600 text-sm font-medium hover:bg-ink-50 transition-colors"
              >
                <MessageSquare className="h-4 w-4" strokeWidth={1.5} />
                Request info
              </button>
              <button
                onClick={() => setAction('reject')}
                className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-md border border-danger-200 text-danger-600 text-sm font-medium hover:bg-danger-50 transition-colors"
              >
                <XCircle className="h-4 w-4" strokeWidth={1.5} />
                Reject
              </button>
            </div>
          )}

          {action !== null && (
            <div className="space-y-3">
              <p className="text-sm font-medium text-ink-900">
                {action === 'reject' ? 'Rejection feedback' : 'Request details'}
              </p>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                rows={4}
                placeholder={
                  action === 'reject'
                    ? 'Explain what was missing or incorrect. This will be shown to the contractor.'
                    : 'Specify what additional information or artefacts are required.'
                }
                className="w-full rounded-md border border-ink-200 px-3 py-2 text-sm placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-accent-500/20 resize-none"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSubmitWithFeedback}
                  disabled={isPending || !feedback.trim()}
                  className={cn(
                    'flex-1 h-8 rounded-md text-white text-xs font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5',
                    action === 'reject' ? 'bg-danger-600 hover:bg-danger-700' : 'bg-ink-900 hover:bg-ink-800'
                  )}
                >
                  {isPending && <Loader2 className="h-3 w-3 animate-spin" />}
                  {action === 'reject' ? 'Confirm rejection' : 'Send request'}
                </button>
                <button
                  onClick={() => setAction(null)}
                  className="h-8 px-3 rounded-md border border-ink-200 text-ink-600 text-xs hover:bg-ink-50 transition-colors"
                >
                  Back
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {isDecided && (
        <div className="rounded-md bg-success-500/5 border border-success-500/20 px-4 py-3">
          <p className="text-sm font-medium text-success-700">Decision recorded.</p>
          <p className="text-xs text-ink-500 mt-0.5">The contractor will be notified of the outcome.</p>
        </div>
      )}

      {submission.feedback && submission.status !== 'PENDING' && (
        <div className="rounded-md bg-ink-25 border border-ink-200 px-4 py-3">
          <p className="text-xs font-medium text-ink-500 mb-1">Admin feedback</p>
          <p className="text-sm text-ink-700">{submission.feedback}</p>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Create the submissions API route**

Create `app/api/admin/submissions/route.ts`:

```typescript
// app/api/admin/submissions/route.ts

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getSubmissionsQueue } from '@/server/queries/admin'

export async function GET() {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const submissions = await getSubmissionsQueue()
  return NextResponse.json({ submissions })
}
```

- [ ] **Step 3: Create `app/(app)/admin/submissions/page.tsx`**

```typescript
import { getSubmissionsQueue } from '@/server/queries/admin'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { ShieldCheck } from 'lucide-react'

export default async function SubmissionsQueuePage() {
  const submissions = await getSubmissionsQueue()

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h2 className="text-base font-semibold text-ink-900">Submissions Queue</h2>
        <p className="text-sm text-ink-500">Review milestone artefact submissions from contractors.</p>
      </div>

      {submissions.length === 0 && (
        <div className="flex flex-col items-center py-16 text-center">
          <p className="text-sm font-medium text-ink-900">No pending submissions</p>
          <p className="text-xs text-ink-500 mt-1">All submissions have been reviewed.</p>
        </div>
      )}

      {submissions.length > 0 && (
        <div className="rounded-lg border border-ink-200 bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-ink-25 border-b border-ink-100">
                <th className="px-4 py-3 text-left text-xs font-semibold text-ink-500">Milestone</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-ink-500">Contractor</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-ink-500">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-ink-500">Verified</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-ink-500">Submitted</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-50">
              {submissions.map((s) => (
                <tr key={s.id} className="hover:bg-ink-25 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-ink-900">{s.milestone.name}</p>
                    <p className="text-xs text-ink-500">{s.milestone.project.name}</p>
                  </td>
                  <td className="px-4 py-3 text-ink-600">{s.milestone.project.contractorCompany.name}</td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      'text-[10px] font-semibold px-1.5 py-0.5 rounded-sm',
                      s.status === 'PENDING' ? 'bg-ink-100 text-ink-600' : 'bg-accent-500/10 text-accent-600'
                    )}>
                      {s.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {s.verifications.length > 0 ? (
                      <div className="flex items-center gap-1">
                        <ShieldCheck className="h-3.5 w-3.5 text-success-500" strokeWidth={1.5} />
                        <span className="text-xs text-ink-600">{s.verifications.length}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-ink-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-ink-500">
                    {new Date(s.createdAt).toLocaleDateString('en-ZA')}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/admin/submissions/${s.id}`} className="text-xs text-accent-600 hover:underline font-medium">
                      Review
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Create `app/(app)/admin/submissions/[id]/page.tsx`**

```typescript
import { notFound } from 'next/navigation'
import { getSubmissionDetail } from '@/server/queries/admin'
import { SubmissionReviewPanel } from '@/components/admin/submission-review-panel'
import Link from 'next/link'

type Props = { params: Promise<{ id: string }> }

export default async function SubmissionDetailPage({ params }: Props) {
  const { id } = await params
  const submission = await getSubmissionDetail(id)
  if (!submission) notFound()

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-2 text-xs text-ink-400">
        <Link href="/admin/submissions" className="hover:text-ink-700 transition-colors">Submissions</Link>
        <span>/</span>
        <span className="text-ink-600">{submission.milestone.name}</span>
      </div>

      <div>
        <h2 className="text-base font-semibold text-ink-900">Submission Review</h2>
      </div>

      <SubmissionReviewPanel
        submission={{
          ...submission,
          artefacts: submission.artefacts as Array<{ name: string; url: string; fileSize?: number }>,
          verifications: submission.verifications.map((v) => ({
            ...v,
            status: v.status as string,
            qualityRating: v.qualityRating as string | null,
          })),
          milestone: {
            ...submission.milestone,
            description: submission.milestone.description ?? '',
            requiredArtefacts: submission.milestone.requiredArtefacts as Array<{ name: string; allowedTypes: string[] }>,
          },
        }}
      />
    </div>
  )
}
```

- [ ] **Step 5: Typecheck**

```bash
npm run typecheck
```

Fix any JSON field casting errors. The `submission.artefacts` and `submission.milestone.requiredArtefacts` are Prisma `Json` type — cast them with `as` in the page component. If there are `undefined` vs `null` issues on string fields, use the nullish coalescing patterns already present.

- [ ] **Step 6: Commit**

```bash
git add components/admin/submission-review-panel.tsx "app/(app)/admin/submissions/" app/api/admin/submissions/route.ts
git commit -m "feat(m6): submission review panel, queue page, and detail page"
```

---

## Task 11: Users & Companies Page

**Files:**
- Create: `app/(app)/admin/users/page.tsx`

- [ ] **Step 1: Create `app/(app)/admin/users/page.tsx`**

```typescript
import { getAllUsersAndCompanies } from '@/server/queries/admin'
import { overrideTier } from '@/server/actions/admin'
import { cn } from '@/lib/utils'

const TIER_COLOURS: Record<string, string> = {
  BRONZE: '#A56A3E', SILVER: '#8B95A0', GOLD: '#C9A03E', PLATINUM: '#6E7A8A',
}

export default async function UsersPage() {
  const companies = await getAllUsersAndCompanies()

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div>
        <h2 className="text-base font-semibold text-ink-900">Users & Companies</h2>
        <p className="text-sm text-ink-500">{companies.length} companies on the platform.</p>
      </div>

      <div className="rounded-lg border border-ink-200 bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-ink-25 border-b border-ink-100">
              <th className="px-4 py-3 text-left text-xs font-semibold text-ink-500">Company</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-ink-500">Type</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-ink-500">KYC</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-ink-500">Tier</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-ink-500">Members</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-ink-500">Set tier</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-50">
            {companies.map((company) => {
              const kycStatus = company.kycSubmissions[0]?.status ?? null
              const tier = company.tierStatus?.tier ?? null
              const colour = tier ? (TIER_COLOURS[tier] ?? '#8B95A0') : null
              return (
                <tr key={company.id} className="hover:bg-ink-25 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-ink-900">{company.name}</p>
                    <p className="text-xs text-ink-400">{company.registrationNo ?? '—'}</p>
                  </td>
                  <td className="px-4 py-3 text-ink-500">{company.type}</td>
                  <td className="px-4 py-3">
                    {kycStatus ? (
                      <span className={cn(
                        'text-[10px] font-semibold px-1.5 py-0.5 rounded-sm',
                        kycStatus === 'APPROVED' ? 'bg-success-500/10 text-success-600' :
                        kycStatus === 'REJECTED' ? 'bg-danger-500/10 text-danger-600' :
                        'bg-ink-100 text-ink-600'
                      )}>
                        {kycStatus}
                      </span>
                    ) : <span className="text-xs text-ink-400">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    {tier ? (
                      <span
                        className="text-[10px] font-semibold px-1.5 py-0.5 rounded-sm"
                        style={{ color: colour!, backgroundColor: `${colour!}18`, border: `1px solid ${colour!}40` }}
                      >
                        {tier}
                      </span>
                    ) : <span className="text-xs text-ink-400">—</span>}
                  </td>
                  <td className="px-4 py-3 text-ink-500">
                    {company.memberships.map((m) => m.user.name ?? m.user.email).join(', ')}
                  </td>
                  <td className="px-4 py-3">
                    {tier && (
                      <form action={overrideTier}>
                        <input type="hidden" name="companyId" value={company.id} />
                        <select
                          name="tier"
                          defaultValue={tier}
                          onChange={(e) => {
                            const form = e.target.closest('form') as HTMLFormElement
                            form.requestSubmit()
                          }}
                          className="text-xs border border-ink-200 rounded px-1.5 py-0.5 text-ink-700 bg-white cursor-pointer"
                        >
                          <option value="BRONZE">Bronze</option>
                          <option value="SILVER">Silver</option>
                          <option value="GOLD">Gold</option>
                          <option value="PLATINUM">Platinum</option>
                        </select>
                      </form>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Typecheck**

```bash
npm run typecheck
```

Note: the `onChange` on `<select>` submitting a form is a client-side DOM operation in a Server Component — this will cause a hydration mismatch. Replace with a client wrapper. If typecheck flags this, convert the row's tier cell to a small `'use client'` component:

Create `components/admin/tier-override-select.tsx`:

```typescript
'use client'

import { overrideTier } from '@/server/actions/admin'
import { useRef } from 'react'

type Props = { companyId: string; currentTier: string }

export function TierOverrideSelect({ companyId, currentTier }: Props) {
  const formRef = useRef<HTMLFormElement>(null)
  return (
    <form ref={formRef} action={overrideTier}>
      <input type="hidden" name="companyId" value={companyId} />
      <select
        name="tier"
        defaultValue={currentTier}
        onChange={() => formRef.current?.requestSubmit()}
        className="text-xs border border-ink-200 rounded px-1.5 py-0.5 text-ink-700 bg-white cursor-pointer"
      >
        <option value="BRONZE">Bronze</option>
        <option value="SILVER">Silver</option>
        <option value="GOLD">Gold</option>
        <option value="PLATINUM">Platinum</option>
      </select>
    </form>
  )
}
```

Then in `app/(app)/admin/users/page.tsx`, replace the form cell with `<TierOverrideSelect companyId={company.id} currentTier={tier} />` and `import { TierOverrideSelect } from '@/components/admin/tier-override-select'`.

- [ ] **Step 3: Commit**

```bash
git add "app/(app)/admin/users/page.tsx" components/admin/tier-override-select.tsx
git commit -m "feat(m6): users & companies page with tier override control"
```

---

## Task 12: Templates List + Editor

**Files:**
- Create: `app/(app)/admin/templates/page.tsx`
- Create: `app/(app)/admin/templates/new/page.tsx`
- Create: `app/(app)/admin/templates/[id]/page.tsx`
- Create: `components/admin/template-form.tsx`

- [ ] **Step 1: Create `components/admin/template-form.tsx`**

```typescript
'use client'
// components/admin/template-form.tsx
// Basic form (list-and-form, not drag-drop — per spec stretch note).

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, Loader2 } from 'lucide-react'
import { createTemplate } from '@/server/actions/admin'

const TECHNOLOGIES = ['SOLAR_PV', 'WIND', 'BATTERY_STORAGE', 'HYBRID', 'BIOGAS', 'OTHER']
const PHASES = ['PLANNING', 'DESIGN', 'PROCUREMENT', 'CONSTRUCTION', 'COMMISSIONING', 'OPERATIONAL', 'DECOMMISSIONED']

type Item = { order: number; name: string; description: string; phase: string; isHardGate: boolean; estimatedDays: string }

const emptyItem = (order: number): Item => ({ order, name: '', description: '', phase: 'PLANNING', isHardGate: true, estimatedDays: '' })

type Props = {
  defaultValues?: {
    name: string
    technology: string
    minSizeKw: string
    maxSizeKw: string
    items: Item[]
  }
}

export function TemplateForm({ defaultValues }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [name, setName] = useState(defaultValues?.name ?? '')
  const [technology, setTechnology] = useState(defaultValues?.technology ?? 'SOLAR_PV')
  const [minSizeKw, setMinSizeKw] = useState(defaultValues?.minSizeKw ?? '')
  const [maxSizeKw, setMaxSizeKw] = useState(defaultValues?.maxSizeKw ?? '')
  const [items, setItems] = useState<Item[]>(defaultValues?.items ?? [emptyItem(1)])
  const [error, setError] = useState<string | null>(null)

  function addItem() {
    setItems((prev) => [...prev, emptyItem(prev.length + 1)])
  }

  function removeItem(i: number) {
    setItems((prev) => prev.filter((_, idx) => idx !== i).map((item, idx) => ({ ...item, order: idx + 1 })))
  }

  function updateItem(i: number, field: keyof Item, value: string | boolean) {
    setItems((prev) => prev.map((item, idx) => idx === i ? { ...item, [field]: value } : item))
  }

  function handleSubmit() {
    setError(null)
    if (!name.trim()) { setError('Template name is required.'); return }
    if (items.some((it) => !it.name.trim())) { setError('All milestone items must have a name.'); return }

    startTransition(async () => {
      try {
        await createTemplate({
          name,
          technology,
          minSizeKw: minSizeKw ? Number(minSizeKw) : undefined,
          maxSizeKw: maxSizeKw ? Number(maxSizeKw) : undefined,
          items: items.map((it) => ({
            order: it.order,
            name: it.name,
            description: it.description,
            phase: it.phase,
            isHardGate: it.isHardGate,
            estimatedDays: it.estimatedDays ? Number(it.estimatedDays) : undefined,
          })),
        })
        router.push('/admin/templates')
        router.refresh()
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to save template.')
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Metadata */}
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2 space-y-1">
          <label className="text-xs font-medium text-ink-700">Template name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Solar C&I < 1MW Outright"
            className="w-full h-9 rounded-md border border-ink-200 px-3 text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-accent-500/20"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-ink-700">Technology</label>
          <select
            value={technology}
            onChange={(e) => setTechnology(e.target.value)}
            className="w-full h-9 rounded-md border border-ink-200 px-3 text-sm text-ink-900 bg-white focus:outline-none focus:ring-2 focus:ring-accent-500/20"
          >
            {TECHNOLOGIES.map((t) => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <label className="text-xs font-medium text-ink-700">Min size (kW)</label>
            <input
              type="number"
              value={minSizeKw}
              onChange={(e) => setMinSizeKw(e.target.value)}
              placeholder="0"
              className="w-full h-9 rounded-md border border-ink-200 px-3 text-sm placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-accent-500/20"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-ink-700">Max size (kW)</label>
            <input
              type="number"
              value={maxSizeKw}
              onChange={(e) => setMaxSizeKw(e.target.value)}
              placeholder="1000"
              className="w-full h-9 rounded-md border border-ink-200 px-3 text-sm placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-accent-500/20"
            />
          </div>
        </div>
      </div>

      {/* Milestone items */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-widest text-ink-400">Milestone items</p>
          <button
            onClick={addItem}
            className="flex items-center gap-1.5 text-xs text-accent-600 hover:underline font-medium"
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={2} />
            Add item
          </button>
        </div>

        {items.map((item, i) => (
          <div key={i} className="rounded-md border border-ink-200 bg-ink-25 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-ink-500">#{item.order}</span>
              <button onClick={() => removeItem(i)} className="text-ink-300 hover:text-danger-500 transition-colors">
                <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-1">
                <label className="text-xs font-medium text-ink-700">Name</label>
                <input
                  value={item.name}
                  onChange={(e) => updateItem(i, 'name', e.target.value)}
                  placeholder="e.g., Environmental Impact Assessment"
                  className="w-full h-8 rounded-md border border-ink-200 px-3 text-sm placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-accent-500/20"
                />
              </div>
              <div className="col-span-2 space-y-1">
                <label className="text-xs font-medium text-ink-700">Description</label>
                <input
                  value={item.description}
                  onChange={(e) => updateItem(i, 'description', e.target.value)}
                  placeholder="What the contractor must submit"
                  className="w-full h-8 rounded-md border border-ink-200 px-3 text-sm placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-accent-500/20"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-ink-700">Phase</label>
                <select
                  value={item.phase}
                  onChange={(e) => updateItem(i, 'phase', e.target.value)}
                  className="w-full h-8 rounded-md border border-ink-200 px-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-accent-500/20"
                >
                  {PHASES.map((p) => <option key={p} value={p}>{p.replace('_', ' ')}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-ink-700">Est. days</label>
                <input
                  type="number"
                  value={item.estimatedDays}
                  onChange={(e) => updateItem(i, 'estimatedDays', e.target.value)}
                  placeholder="14"
                  className="w-full h-8 rounded-md border border-ink-200 px-3 text-sm placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-accent-500/20"
                />
              </div>
              <div className="flex items-center gap-2 col-span-2">
                <input
                  type="checkbox"
                  id={`hard-gate-${i}`}
                  checked={item.isHardGate}
                  onChange={(e) => updateItem(i, 'isHardGate', e.target.checked)}
                  className="h-4 w-4 rounded border-ink-300 text-accent-600 focus:ring-accent-500/20"
                />
                <label htmlFor={`hard-gate-${i}`} className="text-xs text-ink-700">Hard gate (blocks project stage progression)</label>
              </div>
            </div>
          </div>
        ))}
      </div>

      {error && <p className="text-sm text-danger-600">{error}</p>}

      <div className="flex gap-2 pt-2">
        <button
          onClick={handleSubmit}
          disabled={isPending}
          className="flex items-center justify-center gap-1.5 h-9 px-4 rounded-md bg-ink-900 text-white text-sm font-medium hover:bg-ink-800 transition-colors disabled:opacity-50"
        >
          {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          Save template
        </button>
        <button
          onClick={() => router.back()}
          className="h-9 px-4 rounded-md border border-ink-200 text-ink-600 text-sm hover:bg-ink-50 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create `app/(app)/admin/templates/page.tsx`**

```typescript
import { getTemplates } from '@/server/queries/admin'
import { toggleTemplateActive } from '@/server/actions/admin'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

export default async function TemplatesPage() {
  const templates = await getTemplates()

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-ink-900">Milestone Templates</h2>
          <p className="text-sm text-ink-500">{templates.length} templates configured.</p>
        </div>
        <Link
          href="/admin/templates/new"
          className="flex items-center gap-1.5 h-8 px-3 rounded-md bg-ink-900 text-white text-xs font-medium hover:bg-ink-800 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" strokeWidth={2} />
          New template
        </Link>
      </div>

      <div className="space-y-3">
        {templates.map((t) => (
          <div key={t.id} className="rounded-lg border border-ink-200 bg-white px-5 py-4 flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-sm font-semibold text-ink-900">{t.name}</p>
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-sm bg-ink-100 text-ink-600">v{t.version}</span>
                <span className={cn(
                  'text-[10px] font-semibold px-1.5 py-0.5 rounded-sm',
                  t.isActive ? 'bg-success-500/10 text-success-600' : 'bg-ink-100 text-ink-400'
                )}>
                  {t.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <p className="text-xs text-ink-500">{t.technology.replace('_', ' ')} · {t.items.length} milestones</p>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <Link href={`/admin/templates/${t.id}`} className="text-xs text-accent-600 hover:underline font-medium">Edit</Link>
              <form action={toggleTemplateActive}>
                <input type="hidden" name="id" value={t.id} />
                <button type="submit" className="text-xs text-ink-500 hover:text-ink-700 transition-colors">
                  {t.isActive ? 'Deactivate' : 'Activate'}
                </button>
              </form>
            </div>
          </div>
        ))}

        {templates.length === 0 && (
          <div className="flex flex-col items-center py-12 text-center">
            <p className="text-sm font-medium text-ink-900">No templates yet</p>
            <p className="text-xs text-ink-500 mt-1">Create the first milestone template to enable project initialisation.</p>
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Create `app/(app)/admin/templates/new/page.tsx`**

```typescript
import { TemplateForm } from '@/components/admin/template-form'

export default function NewTemplatePage() {
  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h2 className="text-base font-semibold text-ink-900">New Template</h2>
        <p className="text-sm text-ink-500">Define the milestone sequence for a project type.</p>
      </div>
      <TemplateForm />
    </div>
  )
}
```

- [ ] **Step 4: Create `app/(app)/admin/templates/[id]/page.tsx`**

```typescript
import { notFound } from 'next/navigation'
import { getTemplate } from '@/server/queries/admin'
import { TemplateForm } from '@/components/admin/template-form'

type Props = { params: Promise<{ id: string }> }

export default async function TemplateEditorPage({ params }: Props) {
  const { id } = await params
  const template = await getTemplate(id)
  if (!template) notFound()

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h2 className="text-base font-semibold text-ink-900">Edit Template</h2>
        <p className="text-sm text-ink-500">{template.name} · v{template.version}</p>
      </div>
      <TemplateForm
        defaultValues={{
          name: template.name,
          technology: template.technology,
          minSizeKw: template.minSizeKw?.toString() ?? '',
          maxSizeKw: template.maxSizeKw?.toString() ?? '',
          items: template.items.map((item) => ({
            order: item.order,
            name: item.name,
            description: item.description,
            phase: item.phase,
            isHardGate: item.isHardGate,
            estimatedDays: item.estimatedDays?.toString() ?? '',
          })),
        }}
      />
    </div>
  )
}
```

- [ ] **Step 5: Typecheck**

```bash
npm run typecheck
```

- [ ] **Step 6: Commit**

```bash
git add components/admin/template-form.tsx "app/(app)/admin/templates/"
git commit -m "feat(m6): milestone template list, new template form, and editor"
```

---

## Task 13: Scaffold Pages (Financial, Disputes, Helpdesk, Configuration)

**Files:**
- Create: `app/(app)/admin/financial/page.tsx`
- Create: `app/(app)/admin/disputes/page.tsx`
- Create: `app/(app)/admin/helpdesk/page.tsx`
- Create: `app/(app)/admin/configuration/page.tsx`

- [ ] **Step 1: Create financial page**

Create `app/(app)/admin/financial/page.tsx`:

```typescript
import { db } from '@/lib/db'
import { BarChart3 } from 'lucide-react'

export default async function FinancialPage() {
  const [invoiceCount, paymentCount] = await Promise.all([
    db.invoice.count(),
    db.payment.count(),
  ])

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-base font-semibold text-ink-900">Financial & Escrow</h2>
        <p className="text-sm text-ink-500">Read-only financial overview. Full reconciliation tools available in M9.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {[
          { label: 'Total invoices', value: invoiceCount },
          { label: 'Total payments', value: paymentCount },
          { label: 'Escrow holds', value: '—' },
        ].map((stat) => (
          <div key={stat.label} className="rounded-lg border border-ink-200 bg-white px-4 py-5">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="h-4 w-4 text-ink-400" strokeWidth={1.5} />
              <span className="text-xs text-ink-500">{stat.label}</span>
            </div>
            <p className="text-2xl font-semibold text-ink-900 tabular-nums">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-md border border-ink-100 bg-ink-25 px-4 py-3">
        <p className="text-xs text-ink-500">Full EFT reconciliation queue, escrow management, and commission payout batch will be added in M9 (Payments, Licensing & Wallet).</p>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create disputes page**

Create `app/(app)/admin/disputes/page.tsx`:

```typescript
import { Scale } from 'lucide-react'

const EXAMPLE_DISPUTE = {
  id: 'ex-1',
  ref: 'DIS-2026-001',
  type: 'Milestone rejection contested',
  parties: 'Adebayo Renewables vs. Platform Admin',
  status: 'Under review',
  opened: '2026-05-10',
}

export default function DisputesPage() {
  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-base font-semibold text-ink-900">Disputes</h2>
        <p className="text-sm text-ink-500">Active dispute resolution cases.</p>
      </div>

      <div className="rounded-lg border border-ink-200 bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-ink-25 border-b border-ink-100">
              <th className="px-4 py-3 text-left text-xs font-semibold text-ink-500">Ref</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-ink-500">Type</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-ink-500">Parties</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-ink-500">Status</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-ink-500">Opened</th>
            </tr>
          </thead>
          <tbody>
            <tr className="hover:bg-ink-25 transition-colors">
              <td className="px-4 py-3 font-medium text-ink-900">{EXAMPLE_DISPUTE.ref}</td>
              <td className="px-4 py-3 text-ink-600">{EXAMPLE_DISPUTE.type}</td>
              <td className="px-4 py-3 text-ink-500 text-xs">{EXAMPLE_DISPUTE.parties}</td>
              <td className="px-4 py-3">
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-sm bg-warning-50 text-warning-700">
                  {EXAMPLE_DISPUTE.status}
                </span>
              </td>
              <td className="px-4 py-3 text-xs text-ink-500">{EXAMPLE_DISPUTE.opened}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="flex flex-col items-center py-8 text-center text-ink-400">
        <Scale className="h-8 w-8 mb-2" strokeWidth={1.5} />
        <p className="text-sm">Full dispute resolution workflow coming in a future release.</p>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Create helpdesk page**

Create `app/(app)/admin/helpdesk/page.tsx`:

```typescript
const EXAMPLE_TICKETS = [
  { id: 't1', ref: 'HLP-001', subject: 'Cannot upload CIPC document', company: 'Ntaba Solar', status: 'Open', created: '2026-05-14' },
  { id: 't2', ref: 'HLP-002', subject: 'Token balance not updated after tutorial', company: 'SunTec Installations', status: 'Closed', created: '2026-05-12' },
  { id: 't3', ref: 'HLP-003', subject: 'Milestone marked locked when it should be available', company: 'Adebayo Renewables', status: 'Open', created: '2026-05-16' },
]

export default function HelpdeskPage() {
  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-base font-semibold text-ink-900">Helpdesk</h2>
        <p className="text-sm text-ink-500">Support tickets from platform users.</p>
      </div>

      <div className="rounded-lg border border-ink-200 bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-ink-25 border-b border-ink-100">
              <th className="px-4 py-3 text-left text-xs font-semibold text-ink-500">Ref</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-ink-500">Subject</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-ink-500">Company</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-ink-500">Status</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-ink-500">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-50">
            {EXAMPLE_TICKETS.map((t) => (
              <tr key={t.id} className="hover:bg-ink-25 transition-colors">
                <td className="px-4 py-3 font-medium text-ink-900">{t.ref}</td>
                <td className="px-4 py-3 text-ink-700">{t.subject}</td>
                <td className="px-4 py-3 text-ink-500">{t.company}</td>
                <td className="px-4 py-3">
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-sm ${t.status === 'Open' ? 'bg-accent-500/10 text-accent-600' : 'bg-ink-100 text-ink-500'}`}>
                    {t.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-ink-500">{t.created}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Create configuration page**

Create `app/(app)/admin/configuration/page.tsx`:

```typescript
import { TIER_THRESHOLDS, TIER_CASHBACK_RATES, TIER_ORDER } from '@/lib/tier/rules'

export default function ConfigurationPage() {
  return (
    <div className="p-6 max-w-3xl mx-auto space-y-8">
      <div>
        <h2 className="text-base font-semibold text-ink-900">Configuration</h2>
        <p className="text-sm text-ink-500">Platform-wide rules and settings. Editing is coming in a future release.</p>
      </div>

      {/* Tier thresholds */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-ink-400">Tier progression thresholds</h3>
        <div className="rounded-lg border border-ink-200 bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-ink-25 border-b border-ink-100">
                <th className="px-4 py-3 text-left text-xs font-semibold text-ink-500">Tier</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-ink-500">Min. compliant projects</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-ink-500">Cashback rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-50">
              {TIER_ORDER.map((tier) => (
                <tr key={tier} className="hover:bg-ink-25">
                  <td className="px-4 py-3 font-medium text-ink-900">{tier.charAt(0) + tier.slice(1).toLowerCase()}</td>
                  <td className="px-4 py-3 text-right text-ink-600 tabular-nums">{TIER_THRESHOLDS[tier]}</td>
                  <td className="px-4 py-3 text-right text-ink-600 tabular-nums">{TIER_CASHBACK_RATES[tier]}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-ink-400">Threshold editing will be available in a future configuration release.</p>
      </div>

      {/* Token earning amounts */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-ink-400">Token earning events</h3>
        <div className="rounded-lg border border-ink-200 bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-ink-25 border-b border-ink-100">
                <th className="px-4 py-3 text-left text-xs font-semibold text-ink-500">Event</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-ink-500">Tokens awarded</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-50">
              {[
                { event: 'Complete onboarding tutorial', tokens: 100 },
                { event: 'Create first project', tokens: 100 },
                { event: 'Submit first service request', tokens: 100 },
                { event: 'Upload existing project', tokens: 1000 },
                { event: 'AI verification (cost)', tokens: -1000 },
                { event: 'Expert verification (cost)', tokens: -10000 },
              ].map((row) => (
                <tr key={row.event} className="hover:bg-ink-25">
                  <td className="px-4 py-3 text-ink-700">{row.event}</td>
                  <td className={`px-4 py-3 text-right font-semibold tabular-nums ${row.tokens > 0 ? 'text-success-600' : 'text-danger-600'}`}>
                    {row.tokens > 0 ? `+${row.tokens.toLocaleString()}` : row.tokens.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Typecheck**

```bash
npm run typecheck
```

- [ ] **Step 6: Commit**

```bash
git add "app/(app)/admin/financial/page.tsx" "app/(app)/admin/disputes/page.tsx" "app/(app)/admin/helpdesk/page.tsx" "app/(app)/admin/configuration/page.tsx"
git commit -m "feat(m6): admin scaffold pages — financial, disputes, helpdesk, configuration"
```

---

## Task 14: Final Checks

- [ ] **Step 1: Run all unit tests**

```bash
npm run test:unit
```
Expected: 23 tests PASS (existing M5 tests).

- [ ] **Step 2: Run typecheck**

```bash
npm run typecheck
```
Expected: 0 errors.

- [ ] **Step 3: Run lint**

```bash
npm run lint
```
Expected: 0 errors (warnings OK if pre-existing).

- [ ] **Step 4: Final commit**

```bash
git add .
git commit -m "feat: M6 — Admin Role complete"
```

---

## Spec Coverage Self-Review

| Requirement | Covered by |
|---|---|
| Admin dashboard — system stats, queue counts | Task 7 |
| KYC Queue — approve/reject/request-info | Tasks 8, 9 |
| Submissions Queue — table, decision buttons | Task 10 |
| Submission review — artefact list, required checklist, verifications | Task 10 (`SubmissionReviewPanel`) |
| Submission approval triggers tier recalculation | Tasks 2, 5 (`approveSubmission` calls `recalculateTier`) |
| Tier-up animation wired to admin approval | Tasks 2, 3 (`pendingTierUp` → contractor dashboard redirect) |
| Users & Companies — list, tier override | Task 11 |
| Template list + basic form editor | Task 12 |
| Template activate/deactivate | Task 12 (`toggleTemplateActive`) |
| Financial & Escrow — read-only scaffold | Task 13 |
| Disputes — scaffold with example | Task 13 |
| Helpdesk — scaffold with example tickets | Task 13 |
| Configuration — tier thresholds, cashback rates, token earning | Task 13 |
| Admin sidebar updated to spec | Task 6 |

**Known deferred to M9:**
- Reconciliation Queue (EFT proof of payment review) — M9 builds the full payment rails
- Enterprise Accounts management — M9

**Known deferred to M10:**
- Notification Engine configuration (beyond the display in Configuration page)
- Dispute Resolution Center full workflow
