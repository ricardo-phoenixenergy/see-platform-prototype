# M5 — Verification Engine & Tier Progression Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the AI Verification Agent (stubbed deterministic responses), Expert Verification flow, Tier Rules Engine with progression animation, tier-gated feature access, and Gold Standard Certificate mock.

**Architecture:** No schema changes needed — `MilestoneVerification`, `TierStatus`, `WalletBalance`, and all enums already exist in `prisma/schema.prisma`. M5 adds the business logic library (`lib/ai/verification-stubs.ts`, `lib/tier/rules.ts`), API endpoints, and client-side UX components on top of the existing milestone detail page.

**Tech Stack:** Next.js 15 App Router, Prisma 7, TanStack Query (client mutations), Framer Motion (overlay animations + tier-up celebration), Zod (API validation), TypeScript strict.

---

## File Map

**New files:**
- `lib/ai/verification-stubs.ts` — deterministic stub results keyed by milestone name + submission version
- `lib/tier/rules.ts` — tier threshold constants + pure calculation functions
- `server/actions/tier.ts` — `recalculateTier(companyId)` server action
- `app/api/ai/verify/route.ts` — POST: trigger AI verification (deduct 1,000 tokens, create MilestoneVerification)
- `app/api/ai/expert-verify/route.ts` — POST: request expert verification (deduct 10,000 tokens)
- `app/api/milestones/[id]/verifications/route.ts` — GET: list verifications for a milestone's latest submission
- `components/verification/ai-verify-button.tsx` — "Verify with AI" button + confirmation modal + overlay trigger
- `components/verification/ai-verification-overlay.tsx` — full-screen animated analysis overlay (log lines + result reveal)
- `components/verification/verification-result-card.tsx` — PASS/FAIL result card with findings list
- `components/verification/expert-verify-button.tsx` — "Get Expert Verification" button + modal
- `components/verification/verifications-panel.tsx` — shows all verifications for a submission
- `components/tier/tier-up-animation.tsx` — Framer Motion tier-up celebration overlay
- `components/tier/cashback-rates.tsx` — tier → cashback rate table
- `app/(app)/contractor/leads/page.tsx` — tier-gated leads stub (locked until SILVER)

**Modified files:**
- `app/(app)/contractor/projects/[id]/milestones/[milestoneId]/page.tsx` — load verifications, show verify buttons
- `components/milestone/submission-history.tsx` — pass verifications per submission
- `components/shell/sidebar.tsx` — add "Leads" nav item with tier-gate indicator
- `app/(app)/contractor/layout.tsx` — pass tier to leads gating
- `server/queries/dashboard.ts` — `getTierProgress` already exists; no changes needed

---

## Task 1: Verification Stubs Library

**Files:**
- Create: `lib/ai/verification-stubs.ts`
- Test: `lib/ai/__tests__/verification-stubs.test.ts`

The stubs must produce deterministic results so the same submission always returns the same result during demo. Results are keyed by `(milestoneName, submissionVersion)`. Unknown combinations return a default PASS.

- [ ] **Step 1: Write the failing test**

Create `lib/ai/__tests__/verification-stubs.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { generateVerificationResult } from '../verification-stubs'

describe('generateVerificationResult', () => {
  it('returns FAIL for EIA v1 with confidence 0.87', () => {
    const result = generateVerificationResult('Environmental Impact Assessment', 1)
    expect(result.status).toBe('FAIL')
    expect(result.confidence).toBe(0.87)
    expect(result.findings.some(f => f.type === 'missing')).toBe(true)
  })

  it('returns PASS for EIA v2 with confidence 0.94', () => {
    const result = generateVerificationResult('Environmental Impact Assessment', 2)
    expect(result.status).toBe('PASS')
    expect(result.confidence).toBe(0.94)
    expect(result.findings.every(f => f.type !== 'missing')).toBe(true)
  })

  it('returns PASS for unknown milestones', () => {
    const result = generateVerificationResult('Unknown Milestone', 1)
    expect(result.status).toBe('PASS')
  })

  it('returns PASS for Site Assessment Report', () => {
    const result = generateVerificationResult('Site Assessment Report', 1)
    expect(result.status).toBe('PASS')
    expect(result.confidence).toBeGreaterThan(0.9)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm run test:unit -- lib/ai/__tests__/verification-stubs.test.ts
```
Expected: FAIL — `generateVerificationResult` not found.

- [ ] **Step 3: Implement the stubs**

Create `lib/ai/verification-stubs.ts`:

```typescript
// lib/ai/verification-stubs.ts
// Deterministic AI verification stubs. Same input → same output for demo consistency.

export type FindingType = 'verified' | 'warning' | 'missing'

export type VerificationFinding = {
  type: FindingType
  text: string
}

export type VerificationStubResult = {
  status: 'PASS' | 'FAIL'
  confidence: number // 0–1
  findings: VerificationFinding[]
  recommendation?: string
}

type VersionedResult = Record<number, VerificationStubResult>
type StubMap = Record<string, VersionedResult>

const STUBS: StubMap = {
  'Environmental Impact Assessment': {
    1: {
      status: 'FAIL',
      confidence: 0.87,
      findings: [
        { type: 'verified', text: 'Document signed by registered Environmental Assessment Practitioner' },
        { type: 'verified', text: 'Public participation period documented (45 days, exceeds minimum)' },
        { type: 'verified', text: 'Site-specific environmental factors addressed' },
        { type: 'missing', text: 'Section 4.3 (stormwater runoff impacts) does not adequately address the adjacent wetland' },
        { type: 'missing', text: 'Engineer stamp absent — required per NEMA Section 24' },
        { type: 'warning', text: 'Storm water management plan referenced but supporting hydrological model not attached' },
      ],
      recommendation: 'Revise section 4.3 with a full hydrological assessment of the adjacent wetland and obtain engineer stamp before resubmission.',
    },
    2: {
      status: 'PASS',
      confidence: 0.94,
      findings: [
        { type: 'verified', text: 'Document signed and stamped by registered EAP and engineer' },
        { type: 'verified', text: 'Public participation period documented (45 days, exceeds 30-day minimum)' },
        { type: 'verified', text: 'Section 4.3 fully revised with hydrological model — wetland impacts addressed' },
        { type: 'verified', text: 'Mitigation measures align with NEMA Section 24' },
        { type: 'verified', text: 'Storm water management plan and supporting model attached' },
        { type: 'warning', text: 'Minor: residual risk register could be expanded — recommend in next revision' },
      ],
    },
  },
  'Site Assessment Report': {
    1: {
      status: 'PASS',
      confidence: 0.96,
      findings: [
        { type: 'verified', text: 'Site coordinates and cadastral details confirmed against title deed' },
        { type: 'verified', text: 'Shadow analysis and irradiance data included (PVSyst output attached)' },
        { type: 'verified', text: 'Grid proximity and connection voltage documented' },
        { type: 'verified', text: 'Structural assessment preliminary — roof loading capacity noted' },
        { type: 'warning', text: 'Shading objects identified — recommend further analysis at detailed design stage' },
      ],
    },
  },
  'Structural Engineering Report': {
    1: {
      status: 'PASS',
      confidence: 0.93,
      findings: [
        { type: 'verified', text: 'Signed and sealed by registered Professional Engineer (Pr.Eng)' },
        { type: 'verified', text: 'Roof loading calculations per SANS 10160-2 confirmed' },
        { type: 'verified', text: 'Mounting system specification included and approved' },
        { type: 'verified', text: 'Wind loading calculations for coastal zone completed' },
        { type: 'warning', text: 'Drawings reference revision A — confirm final revision before construction' },
      ],
    },
  },
  'Grid Connection Application': {
    1: {
      status: 'PASS',
      confidence: 0.91,
      findings: [
        { type: 'verified', text: 'Application submitted to correct distributor (Eskom / municipality confirmed)' },
        { type: 'verified', text: 'Single-line diagram included and matches system size' },
        { type: 'verified', text: 'Protection relay specification included' },
        { type: 'warning', text: 'Response timeline from distributor not yet confirmed — track externally' },
      ],
    },
  },
  'Financial Close Documentation': {
    1: {
      status: 'PASS',
      confidence: 0.89,
      findings: [
        { type: 'verified', text: 'PPA agreement signed by both parties and correctly structured' },
        { type: 'verified', text: 'Bank confirmation letter for project finance included' },
        { type: 'verified', text: 'Insurance certificates provided (CAR, public liability, professional indemnity)' },
        { type: 'warning', text: 'Escrow account opening confirmation pending — required before drawdown' },
      ],
    },
  },
  'Construction Commencement': {
    1: {
      status: 'PASS',
      confidence: 0.92,
      findings: [
        { type: 'verified', text: 'Municipal building permit attached and valid' },
        { type: 'verified', text: 'Contractor registration (NHBRC or equivalent) confirmed' },
        { type: 'verified', text: 'Site safety plan (SHE plan) signed by responsible person' },
        { type: 'verified', text: 'Construction programme (Gantt chart) submitted' },
        { type: 'warning', text: 'SACPCMP registration of responsible person — verify before site handover' },
      ],
    },
  },
  'Commissioning Certificate': {
    1: {
      status: 'PASS',
      confidence: 0.97,
      findings: [
        { type: 'verified', text: 'Commissioning test results within spec (generation vs. design model <5% deviation)' },
        { type: 'verified', text: 'Certificate of Compliance (CoC) from registered electrician attached' },
        { type: 'verified', text: 'Grid connection confirmed and metering installed' },
        { type: 'verified', text: 'Performance monitoring active and baseline reading captured' },
      ],
    },
  },
  'Operational Handover': {
    1: {
      status: 'PASS',
      confidence: 0.95,
      findings: [
        { type: 'verified', text: 'As-built drawings match installed system' },
        { type: 'verified', text: "O&M manual handed to client and receipt acknowledged" },
        { type: 'verified', text: 'Warranty certificates registered (panels, inverters, mounting)' },
        { type: 'verified', text: 'Client training completion records included' },
      ],
    },
  },
}

function defaultPass(): VerificationStubResult {
  return {
    status: 'PASS',
    confidence: 0.90,
    findings: [
      { type: 'verified', text: 'Document structure meets platform requirements' },
      { type: 'verified', text: 'Required signatures present' },
      { type: 'warning', text: 'Automated analysis limited for this document type — expert review recommended for full assurance' },
    ],
  }
}

export function generateVerificationResult(
  milestoneName: string,
  submissionVersion: number
): VerificationStubResult {
  const stub = STUBS[milestoneName]
  if (!stub) return defaultPass()
  return stub[submissionVersion] ?? stub[Math.max(...Object.keys(stub).map(Number))] ?? defaultPass()
}

export const AI_VERIFICATION_LOG_LINES = [
  'Parsing document structure…',
  'Extracting key sections…',
  'Cross-referencing milestone requirements…',
  'Validating signatures and stamps…',
  'Checking against regulatory standards…',
  'Generating compliance report…',
]

export const AI_VERIFICATION_COST_TOKENS = 1_000
export const EXPERT_VERIFICATION_COST_TOKENS = 10_000
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npm run test:unit -- lib/ai/__tests__/verification-stubs.test.ts
```
Expected: 4 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/ai/verification-stubs.ts lib/ai/__tests__/verification-stubs.test.ts
git commit -m "feat(m5): deterministic AI verification stubs"
```

---

## Task 2: Tier Rules Library

**Files:**
- Create: `lib/tier/rules.ts`
- Test: `lib/tier/__tests__/rules.test.ts`

The tier thresholds (BRONZE→3, SILVER→8, GOLD→15) are already defined in `server/queries/dashboard.ts`. This task extracts them into a canonical module so the server action and API can share them.

- [ ] **Step 1: Write the failing test**

Create `lib/tier/__tests__/rules.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { getTierForCount, TIER_THRESHOLDS, getCashbackRate } from '../rules'

describe('getTierForCount', () => {
  it('returns BRONZE for 0 projects', () => {
    expect(getTierForCount(0)).toBe('BRONZE')
  })
  it('returns BRONZE for 2 projects', () => {
    expect(getTierForCount(2)).toBe('BRONZE')
  })
  it('returns SILVER at threshold (3)', () => {
    expect(getTierForCount(3)).toBe('SILVER')
  })
  it('returns SILVER for 5 projects', () => {
    expect(getTierForCount(5)).toBe('SILVER')
  })
  it('returns GOLD at threshold (8)', () => {
    expect(getTierForCount(8)).toBe('GOLD')
  })
  it('returns PLATINUM at threshold (15)', () => {
    expect(getTierForCount(15)).toBe('PLATINUM')
  })
  it('returns PLATINUM for any count above 15', () => {
    expect(getTierForCount(100)).toBe('PLATINUM')
  })
})

describe('getCashbackRate', () => {
  it('returns 2% for BRONZE', () => {
    expect(getCashbackRate('BRONZE')).toBe(2)
  })
  it('returns 5% for SILVER', () => {
    expect(getCashbackRate('SILVER')).toBe(5)
  })
  it('returns 8% for GOLD', () => {
    expect(getCashbackRate('GOLD')).toBe(8)
  })
  it('returns 12% for PLATINUM', () => {
    expect(getCashbackRate('PLATINUM')).toBe(12)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm run test:unit -- lib/tier/__tests__/rules.test.ts
```
Expected: FAIL — `getTierForCount` not found.

- [ ] **Step 3: Implement**

Create `lib/tier/rules.ts`:

```typescript
// lib/tier/rules.ts
// Canonical tier thresholds and calculation functions.

export type Tier = 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM'

export const TIER_THRESHOLDS: Record<Tier, number> = {
  BRONZE: 0,
  SILVER: 3,
  GOLD: 8,
  PLATINUM: 15,
}

// Cashback percentages earned on hardware/token purchases
export const TIER_CASHBACK_RATES: Record<Tier, number> = {
  BRONZE: 2,
  SILVER: 5,
  GOLD: 8,
  PLATINUM: 12,
}

export const TIER_ORDER: Tier[] = ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM']

export function getTierForCount(compliantProjectCount: number): Tier {
  if (compliantProjectCount >= TIER_THRESHOLDS.PLATINUM) return 'PLATINUM'
  if (compliantProjectCount >= TIER_THRESHOLDS.GOLD) return 'GOLD'
  if (compliantProjectCount >= TIER_THRESHOLDS.SILVER) return 'SILVER'
  return 'BRONZE'
}

export function getCashbackRate(tier: Tier): number {
  return TIER_CASHBACK_RATES[tier]
}

export function getNextTier(tier: Tier): Tier | null {
  const idx = TIER_ORDER.indexOf(tier)
  return idx < TIER_ORDER.length - 1 ? (TIER_ORDER[idx + 1] ?? null) : null
}

export function getCountToNextTier(tier: Tier, currentCount: number): number | null {
  const next = getNextTier(tier)
  if (!next) return null
  return Math.max(0, TIER_THRESHOLDS[next] - currentCount)
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npm run test:unit -- lib/tier/__tests__/rules.test.ts
```
Expected: 11 tests PASS.

- [ ] **Step 5: Update `server/queries/dashboard.ts` to import from canonical module**

Modify `server/queries/dashboard.ts` lines 57–69 to use `lib/tier/rules.ts`:

```typescript
import { getTierForCount, getCountToNextTier } from '@/lib/tier/rules'

export async function getTierProgress(companyId: string) {
  const tier = await db.tierStatus.findUnique({ where: { companyId } })
  const currentTier = (tier?.tier ?? 'BRONZE') as Tier
  const count = tier?.compliantProjectCount ?? 0
  const next = getCountToNextTier(currentTier, count)

  return {
    tier: currentTier,
    compliantProjectCount: count,
    nextTierAt: next !== null ? (count + next) : null,
    countToNextTier: next,
    progressPercent: next !== null
      ? Math.min(100, Math.round((count / (count + next)) * 100))
      : 100,
  }
}
```

- [ ] **Step 6: Commit**

```bash
git add lib/tier/rules.ts lib/tier/__tests__/rules.test.ts server/queries/dashboard.ts
git commit -m "feat(m5): tier rules engine — thresholds, cashback rates, progression helpers"
```

---

## Task 3: Tier Recalculation Server Action

**Files:**
- Create: `server/actions/tier.ts`
- Test: (integration — no unit test needed; tier action calls DB)

This action is called after a milestone is approved or auto-golded. It counts completed milestones, derives the tier, and updates `TierStatus`. It returns `{ previousTier, newTier, upgraded }` so the caller can trigger the tier-up animation.

- [ ] **Step 1: Create `server/actions/tier.ts`**

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
  // Count distinct projects where ALL hard-gate milestones are APPROVED or AUTO_GOLD
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

  await db.tierStatus.upsert({
    where: { companyId },
    update: { tier: newTier, compliantProjectCount: compliantCount },
    create: { companyId, tier: newTier, compliantProjectCount: compliantCount },
  })

  return { previousTier, newTier, upgraded: newTier !== previousTier }
}
```

- [ ] **Step 2: Run typecheck to confirm no errors**

```bash
npm run typecheck
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add server/actions/tier.ts
git commit -m "feat(m5): tier recalculation server action"
```

---

## Task 4: AI Verify API Endpoint

**Files:**
- Create: `app/api/ai/verify/route.ts`
- Create: `app/api/milestones/[id]/verifications/route.ts`

- [ ] **Step 1: Create the AI verify endpoint**

Create `app/api/ai/verify/route.ts`:

```typescript
// app/api/ai/verify/route.ts
// POST { submissionId } — triggers AI verification, deducts 1,000 tokens, saves result

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { generateVerificationResult, AI_VERIFICATION_COST_TOKENS } from '@/lib/ai/verification-stubs'
import { z } from 'zod'

const bodySchema = z.object({ submissionId: z.string() })

export async function POST(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const companyId = session.user.companyId
  if (!companyId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: z.infer<typeof bodySchema>
  try {
    body = bodySchema.parse(await req.json())
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  // Verify ownership: submission → milestone → project → contractor company
  const submission = await db.milestoneSubmission.findFirst({
    where: {
      id: body.submissionId,
      milestone: { project: { contractorCompanyId: companyId } },
    },
    include: {
      milestone: { select: { name: true } },
    },
  })
  if (!submission) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Check tokens
  const wallet = await db.walletBalance.findUnique({ where: { companyId } })
  if ((wallet?.tokens ?? 0) < AI_VERIFICATION_COST_TOKENS) {
    return NextResponse.json({ error: 'Insufficient tokens' }, { status: 402 })
  }

  // Generate deterministic result
  const result = generateVerificationResult(submission.milestone.name, submission.version)

  // Persist verification + deduct tokens in a transaction
  const [verification] = await db.$transaction([
    db.milestoneVerification.create({
      data: {
        submissionId: body.submissionId,
        type: 'AI_AGENT',
        status: result.status === 'PASS' ? 'PASS' : 'FAIL',
        costTokens: AI_VERIFICATION_COST_TOKENS,
        qualityRating: result.status === 'PASS' ? 'GREEN' : 'AMBER',
        findings: JSON.parse(JSON.stringify(result.findings)),
        notes: result.recommendation ?? null,
        completedAt: new Date(),
      },
    }),
    db.walletBalance.update({
      where: { companyId },
      data: { tokens: { decrement: AI_VERIFICATION_COST_TOKENS } },
    }),
    db.tokenTransaction.create({
      data: {
        companyId,
        type: 'DEBIT',
        amount: AI_VERIFICATION_COST_TOKENS,
        description: `AI verification — ${submission.milestone.name}`,
      },
    }),
  ])

  return NextResponse.json({
    verification: {
      id: verification.id,
      status: verification.status,
      costTokens: verification.costTokens,
      findings: result.findings,
      confidence: result.confidence,
      recommendation: result.recommendation ?? null,
    },
  })
}
```

- [ ] **Step 2: Create the milestones verifications endpoint**

Create `app/api/milestones/[id]/verifications/route.ts`:

```typescript
// app/api/milestones/[id]/verifications/route.ts
// GET — returns verifications for the latest submission of a milestone

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const companyId = session.user.companyId
  if (!companyId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: milestoneId } = await params

  const milestone = await db.milestone.findFirst({
    where: {
      id: milestoneId,
      project: { contractorCompanyId: companyId },
    },
    select: {
      submissions: {
        orderBy: { version: 'desc' },
        take: 1,
        select: {
          id: true,
          version: true,
          verifications: {
            orderBy: { createdAt: 'asc' },
            select: {
              id: true,
              type: true,
              status: true,
              qualityRating: true,
              costTokens: true,
              findings: true,
              notes: true,
              completedAt: true,
              createdAt: true,
            },
          },
        },
      },
    },
  })

  if (!milestone) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const latestSubmission = milestone.submissions[0]
  return NextResponse.json({
    submissionId: latestSubmission?.id ?? null,
    submissionVersion: latestSubmission?.version ?? null,
    verifications: latestSubmission?.verifications ?? [],
  })
}
```

- [ ] **Step 3: Run typecheck**

```bash
npm run typecheck
```
Expected: no errors. Fix any that appear (likely `TokenTransaction` type — check `schema.prisma` for `TokenTransaction.type` enum values and use the correct one, or cast with `as` if needed).

Note: `TokenTransaction` in the schema has a `type` field — check what enum it uses. If it's `TransactionType` with value `DEBIT`, use that. If the schema uses a different approach, adjust accordingly:

```bash
grep -n "TokenTransaction\|TransactionType\|enum.*Type" prisma/schema.prisma | head -20
```

- [ ] **Step 4: Commit**

```bash
git add app/api/ai/verify/route.ts app/api/milestones/[id]/verifications/route.ts
git commit -m "feat(m5): AI verify API + milestone verifications list endpoint"
```

---

## Task 5: Expert Verify API Endpoint

**Files:**
- Create: `app/api/ai/expert-verify/route.ts`

- [ ] **Step 1: Create the expert verify endpoint**

Create `app/api/ai/expert-verify/route.ts`:

```typescript
// app/api/ai/expert-verify/route.ts
// POST { submissionId } — requests expert verification, deducts 10,000 tokens

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { EXPERT_VERIFICATION_COST_TOKENS } from '@/lib/ai/verification-stubs'
import { z } from 'zod'

const bodySchema = z.object({ submissionId: z.string() })

export async function POST(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const companyId = session.user.companyId
  if (!companyId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: z.infer<typeof bodySchema>
  try {
    body = bodySchema.parse(await req.json())
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const submission = await db.milestoneSubmission.findFirst({
    where: {
      id: body.submissionId,
      milestone: { project: { contractorCompanyId: companyId } },
    },
    include: { milestone: { select: { name: true } } },
  })
  if (!submission) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const wallet = await db.walletBalance.findUnique({ where: { companyId } })
  if ((wallet?.tokens ?? 0) < EXPERT_VERIFICATION_COST_TOKENS) {
    return NextResponse.json({ error: 'Insufficient tokens' }, { status: 402 })
  }

  const [verification] = await db.$transaction([
    db.milestoneVerification.create({
      data: {
        submissionId: body.submissionId,
        type: 'EXPERT',
        status: 'IN_PROGRESS',
        costTokens: EXPERT_VERIFICATION_COST_TOKENS,
        findings: JSON.parse(JSON.stringify([])),
      },
    }),
    db.walletBalance.update({
      where: { companyId },
      data: { tokens: { decrement: EXPERT_VERIFICATION_COST_TOKENS } },
    }),
    db.tokenTransaction.create({
      data: {
        companyId,
        type: 'DEBIT',
        amount: EXPERT_VERIFICATION_COST_TOKENS,
        description: `Expert verification — ${submission.milestone.name}`,
      },
    }),
  ])

  return NextResponse.json({ verificationId: verification.id, status: 'IN_PROGRESS' }, { status: 201 })
}
```

- [ ] **Step 2: Run typecheck**

```bash
npm run typecheck
```

- [ ] **Step 3: Commit**

```bash
git add app/api/ai/expert-verify/route.ts
git commit -m "feat(m5): expert verification request endpoint"
```

---

## Task 6: AI Verification UX Components

**Files:**
- Create: `components/verification/ai-verification-overlay.tsx`
- Create: `components/verification/verification-result-card.tsx`
- Create: `components/verification/ai-verify-button.tsx`

- [ ] **Step 1: Create the animated overlay**

Create `components/verification/ai-verification-overlay.tsx`:

```typescript
'use client'
// components/verification/ai-verification-overlay.tsx
// Full-screen animated overlay: log lines appear one by one, then result reveals.

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AI_VERIFICATION_LOG_LINES } from '@/lib/ai/verification-stubs'
import type { VerificationStubResult } from '@/lib/ai/verification-stubs'

type Props = {
  milestoneName: string
  onComplete: (result: VerificationStubResult & { confidence: number }) => void
}

// The overlay itself drives the visual timing; the actual API call happens in the parent.
// Parent calls this with the already-resolved result once the API returns.

type Phase = 'analysing' | 'complete'

export function AiVerificationOverlay({ milestoneName, onComplete }: Props) {
  // We don't use this component to show results — it shows the analysis phase only.
  // Parent passes the result via onComplete when the API call finishes.
  const [visibleLines, setVisibleLines] = useState<string[]>([])
  const [phase, setPhase] = useState<Phase>('analysing')

  useEffect(() => {
    let i = 0
    const interval = setInterval(() => {
      const line = AI_VERIFICATION_LOG_LINES[i]
      if (line) setVisibleLines((prev) => [...prev, line])
      i++
      if (i >= AI_VERIFICATION_LOG_LINES.length) {
        clearInterval(interval)
      }
    }, 900)
    return () => clearInterval(interval)
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-ink-950/90 backdrop-blur-sm"
    >
      <div className="w-full max-w-md px-6">
        <p className="text-[11px] font-semibold tracking-widest text-ink-400 uppercase mb-6 text-center">
          SEE.AI Verification Agent
        </p>
        <p className="text-lg font-semibold text-white mb-8 text-center">{milestoneName}</p>

        {/* Progress bar */}
        <div className="h-0.5 bg-ink-800 rounded-full mb-8 overflow-hidden">
          <motion.div
            className="h-full bg-accent-500"
            initial={{ width: '0%' }}
            animate={{ width: `${(visibleLines.length / AI_VERIFICATION_LOG_LINES.length) * 100}%` }}
            transition={{ ease: 'linear' }}
          />
        </div>

        {/* Log lines */}
        <div className="space-y-2 min-h-[160px]">
          <AnimatePresence>
            {visibleLines.map((line, i) => (
              <motion.p
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-sm text-ink-300 font-mono"
              >
                <span className="text-accent-500 mr-2">›</span>
                {line}
              </motion.p>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  )
}
```

- [ ] **Step 2: Create the result card**

Create `components/verification/verification-result-card.tsx`:

```typescript
'use client'
// components/verification/verification-result-card.tsx

import { motion } from 'framer-motion'
import { CheckCircle, XCircle, AlertTriangle, ShieldCheck, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

type Finding = {
  type: 'verified' | 'warning' | 'missing'
  text: string
}

type VerificationRecord = {
  id: string
  type: 'AI_AGENT' | 'EXPERT' | 'AUTO_GOLD_MARKETPLACE'
  status: 'PASS' | 'FAIL' | 'INCONCLUSIVE' | 'IN_PROGRESS'
  qualityRating: 'RED' | 'AMBER' | 'GREEN' | 'GOLD' | null
  costTokens: number
  findings: Finding[]
  notes: string | null
  confidence?: number | null
  completedAt: string | null
  createdAt: string
}

type Props = {
  verification: VerificationRecord
  animate?: boolean
}

const FINDING_ICON: Record<string, React.ElementType> = {
  verified: CheckCircle,
  warning: AlertTriangle,
  missing: XCircle,
}

const FINDING_CLASS: Record<string, string> = {
  verified: 'text-success-500',
  warning: 'text-warning-500',
  missing: 'text-danger-500',
}

export function VerificationResultCard({ verification, animate = false }: Props) {
  const isPending = verification.status === 'IN_PROGRESS'
  const isPass = verification.status === 'PASS'
  const isFail = verification.status === 'FAIL'

  const TypeLabel =
    verification.type === 'AI_AGENT'
      ? 'AI Verification'
      : verification.type === 'EXPERT'
      ? 'Expert Verification'
      : 'Auto-Gold (Marketplace)'

  const Wrapper = animate ? motion.div : 'div'
  const animProps = animate
    ? { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.4 } }
    : {}

  return (
    <Wrapper
      {...animProps}
      className={cn(
        'rounded-lg border p-4 space-y-3',
        isPending && 'border-ink-200 bg-ink-25',
        isPass && 'border-success-500/30 bg-emerald-50/30',
        isFail && 'border-danger-500/30 bg-red-50/30',
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          {isPending ? (
            <Clock className="h-4 w-4 text-ink-400" strokeWidth={1.5} />
          ) : isPass ? (
            <ShieldCheck className="h-4 w-4 text-success-500" strokeWidth={1.5} />
          ) : (
            <XCircle className="h-4 w-4 text-danger-500" strokeWidth={1.5} />
          )}
          <span className="text-sm font-semibold text-ink-900">{TypeLabel}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-ink-400">
          {verification.confidence != null && (
            <span className="font-medium text-ink-600">{Math.round(verification.confidence * 100)}% confident</span>
          )}
          <span>{verification.costTokens.toLocaleString()} tokens</span>
        </div>
      </div>

      {/* Status badge */}
      {!isPending && (
        <div className={cn(
          'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold',
          isPass ? 'bg-success-500/10 text-success-600' : 'bg-danger-500/10 text-danger-600'
        )}>
          {isPass ? 'PASS' : 'FAIL'}
          {verification.qualityRating && (
            <span className="opacity-70">— {verification.qualityRating}</span>
          )}
        </div>
      )}

      {isPending && (
        <p className="text-sm text-ink-500">
          Expert review in progress. You will be notified when the review is complete.
        </p>
      )}

      {/* Findings */}
      {verification.findings.length > 0 && (
        <ul className="space-y-1.5">
          {verification.findings.map((f, i) => {
            const Icon = FINDING_ICON[f.type] ?? CheckCircle
            const cls = FINDING_CLASS[f.type] ?? 'text-ink-500'
            return (
              <li key={i} className="flex items-start gap-2 text-sm">
                <Icon className={cn('h-3.5 w-3.5 mt-0.5 flex-shrink-0', cls)} strokeWidth={1.5} />
                <span className="text-ink-700">{f.text}</span>
              </li>
            )
          })}
        </ul>
      )}

      {/* Recommendation */}
      {verification.notes && (
        <div className="rounded-sm bg-warning-50 border border-warning-200 px-3 py-2">
          <p className="text-xs font-medium text-warning-700 mb-0.5">Recommendation</p>
          <p className="text-xs text-ink-600">{verification.notes}</p>
        </div>
      )}
    </Wrapper>
  )
}
```

- [ ] **Step 3: Create the AI verify button (orchestrator)**

Create `components/verification/ai-verify-button.tsx`:

```typescript
'use client'
// components/verification/ai-verify-button.tsx
// Manages the full AI verification flow: confirm → overlay → result.

import { useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { Zap, Loader2 } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { AI_VERIFICATION_COST_TOKENS } from '@/lib/ai/verification-stubs'
import type { VerificationStubResult } from '@/lib/ai/verification-stubs'
import { AiVerificationOverlay } from './ai-verification-overlay'
import { VerificationResultCard } from './verification-result-card'

type ApiResult = VerificationStubResult & {
  verification: {
    id: string
    status: string
    costTokens: number
    findings: VerificationStubResult['findings']
    confidence: number
    recommendation: string | null
  }
}

type Props = {
  submissionId: string
  milestoneName: string
  milestoneId: string
  tokenBalance: number
}

type Phase = 'idle' | 'confirming' | 'analysing' | 'done'

export function AiVerifyButton({ submissionId, milestoneName, milestoneId, tokenBalance }: Props) {
  const [phase, setPhase] = useState<Phase>('idle')
  const [result, setResult] = useState<ApiResult['verification'] | null>(null)
  const queryClient = useQueryClient()

  const canAfford = tokenBalance >= AI_VERIFICATION_COST_TOKENS

  const verify = useMutation<ApiResult, Error>({
    mutationFn: async () => {
      const res = await fetch('/api/ai/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submissionId }),
      })
      if (!res.ok) {
        const err = await res.json() as { error?: string }
        throw new Error(err.error ?? 'Verification failed')
      }
      return res.json() as Promise<ApiResult>
    },
    onSuccess: (data) => {
      setResult(data.verification)
      setPhase('done')
      void queryClient.invalidateQueries({ queryKey: ['milestone-verifications', milestoneId] })
    },
    onError: () => {
      setPhase('idle')
    },
  })

  function handleConfirm() {
    setPhase('analysing')
    verify.mutate()
  }

  if (phase === 'done' && result) {
    return (
      <VerificationResultCard
        verification={{
          id: result.id,
          type: 'AI_AGENT',
          status: result.status as 'PASS' | 'FAIL',
          qualityRating: result.status === 'PASS' ? 'GREEN' : 'AMBER',
          costTokens: result.costTokens,
          findings: result.findings,
          notes: result.recommendation,
          confidence: result.confidence,
          completedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        }}
        animate
      />
    )
  }

  return (
    <>
      {phase === 'idle' && (
        <button
          onClick={() => setPhase('confirming')}
          disabled={!canAfford}
          className="flex items-center gap-2 h-8 px-3 rounded-md border border-accent-400 text-accent-600 text-xs font-medium hover:bg-accent-500/5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          title={canAfford ? undefined : 'Insufficient tokens'}
        >
          <Zap className="h-3.5 w-3.5" strokeWidth={1.5} />
          Verify with AI — {AI_VERIFICATION_COST_TOKENS.toLocaleString()} tokens
        </button>
      )}

      {phase === 'confirming' && (
        <div className="rounded-md border border-ink-200 bg-ink-25 p-4 space-y-3">
          <p className="text-sm font-medium text-ink-900">Confirm AI Verification</p>
          <p className="text-xs text-ink-500">
            The AI Verification Agent will analyse your submission against milestone requirements.
            This action costs <span className="font-semibold text-ink-800">{AI_VERIFICATION_COST_TOKENS.toLocaleString()} tokens</span> and cannot be undone.
          </p>
          <p className="text-xs text-ink-400">Your balance after: {(tokenBalance - AI_VERIFICATION_COST_TOKENS).toLocaleString()} tokens</p>
          <div className="flex gap-2">
            <button
              onClick={handleConfirm}
              className="h-7 px-3 rounded-md bg-ink-900 text-white text-xs font-medium hover:bg-ink-800 transition-colors"
            >
              Confirm — Verify now
            </button>
            <button
              onClick={() => setPhase('idle')}
              className="h-7 px-3 rounded-md border border-ink-200 text-ink-600 text-xs hover:bg-ink-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {phase === 'analysing' && (
        <div className="flex items-center gap-2 text-sm text-ink-500">
          <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.5} />
          Analysing submission…
        </div>
      )}

      {/* Full-screen overlay during analysis */}
      <AnimatePresence>
        {phase === 'analysing' && (
          <AiVerificationOverlay
            milestoneName={milestoneName}
            onComplete={() => {/* handled by mutation */}}
          />
        )}
      </AnimatePresence>
    </>
  )
}
```

- [ ] **Step 4: Run typecheck**

```bash
npm run typecheck
```
Fix any errors before committing.

- [ ] **Step 5: Commit**

```bash
git add components/verification/
git commit -m "feat(m5): AI verification UX — overlay animation, result card, confirm flow"
```

---

## Task 7: Expert Verification UX

**Files:**
- Create: `components/verification/expert-verify-button.tsx`

- [ ] **Step 1: Create the expert verify button + modal**

Create `components/verification/expert-verify-button.tsx`:

```typescript
'use client'
// components/verification/expert-verify-button.tsx

import { useState } from 'react'
import { Star, Loader2 } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { EXPERT_VERIFICATION_COST_TOKENS } from '@/lib/ai/verification-stubs'

type Props = {
  submissionId: string
  milestoneId: string
  tokenBalance: number
}

export function ExpertVerifyButton({ submissionId, milestoneId, tokenBalance }: Props) {
  const [open, setOpen] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const queryClient = useQueryClient()
  const canAfford = tokenBalance >= EXPERT_VERIFICATION_COST_TOKENS

  const request = useMutation<{ verificationId: string }, Error>({
    mutationFn: async () => {
      const res = await fetch('/api/ai/expert-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submissionId }),
      })
      if (!res.ok) {
        const err = await res.json() as { error?: string }
        throw new Error(err.error ?? 'Failed to request expert verification')
      }
      return res.json() as Promise<{ verificationId: string }>
    },
    onSuccess: () => {
      setSubmitted(true)
      setOpen(false)
      void queryClient.invalidateQueries({ queryKey: ['milestone-verifications', milestoneId] })
    },
  })

  if (submitted) {
    return (
      <div className="flex items-center gap-2 text-xs text-ink-500">
        <Star className="h-3.5 w-3.5 text-tier-gold" strokeWidth={1.5} />
        Expert verification requested — you will be notified when the review is complete.
      </div>
    )
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        disabled={!canAfford}
        className="flex items-center gap-2 h-8 px-3 rounded-md border border-ink-200 text-ink-600 text-xs font-medium hover:bg-ink-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        title={canAfford ? undefined : 'Insufficient tokens'}
      >
        <Star className="h-3.5 w-3.5" strokeWidth={1.5} />
        Expert verification — {EXPERT_VERIFICATION_COST_TOKENS.toLocaleString()} tokens
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/30 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false) }}
        >
          <div className="bg-white rounded-xl border border-ink-200 shadow-2xl w-[440px] p-6 space-y-4">
            <div>
              <p className="text-sm font-semibold text-ink-900 mb-1">Request Expert Verification</p>
              <p className="text-xs text-ink-500">
                A qualified independent expert will review your submission and provide a colour-coded quality rating
                (RED / AMBER / GREEN / GOLD). Expert reviews typically complete within 2–5 business days.
              </p>
            </div>
            <div className="rounded-md bg-ink-25 border border-ink-200 px-4 py-3 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-ink-500">Cost</span>
                <span className="font-semibold text-ink-900">{EXPERT_VERIFICATION_COST_TOKENS.toLocaleString()} tokens</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-500">Balance after</span>
                <span className={tokenBalance - EXPERT_VERIFICATION_COST_TOKENS < 0 ? 'text-danger-500 font-medium' : 'text-ink-700'}>
                  {(tokenBalance - EXPERT_VERIFICATION_COST_TOKENS).toLocaleString()} tokens
                </span>
              </div>
            </div>
            {request.error && (
              <p className="text-xs text-danger-500">{request.error.message}</p>
            )}
            <div className="flex gap-2">
              <button
                onClick={() => request.mutate()}
                disabled={request.isPending}
                className="flex-1 h-8 flex items-center justify-center gap-1.5 rounded-md bg-ink-900 text-white text-xs font-medium hover:bg-ink-800 transition-colors disabled:opacity-50"
              >
                {request.isPending && <Loader2 className="h-3 w-3 animate-spin" strokeWidth={2} />}
                Confirm request
              </button>
              <button
                onClick={() => setOpen(false)}
                className="h-8 px-3 rounded-md border border-ink-200 text-ink-600 text-xs hover:bg-ink-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
```

- [ ] **Step 2: Run typecheck**

```bash
npm run typecheck
```

- [ ] **Step 3: Commit**

```bash
git add components/verification/expert-verify-button.tsx
git commit -m "feat(m5): expert verification request modal"
```

---

## Task 8: Wire Verification into Milestone Detail Page

**Files:**
- Modify: `app/(app)/contractor/projects/[id]/milestones/[milestoneId]/page.tsx`
- Create: `components/verification/verifications-panel.tsx`

The milestone detail page already loads `milestone.submissions`. We need to:
1. Also fetch `verifications` on the latest submission
2. Add a `VerificationsPanel` between the submission form and history
3. Show verify buttons when the milestone is UNDER_REVIEW or SUBMITTED

- [ ] **Step 1: Create the verifications panel (client component)**

Create `components/verification/verifications-panel.tsx`:

```typescript
'use client'
// components/verification/verifications-panel.tsx
// Loads verifications for the latest submission and renders result cards + action buttons.

import { useQuery } from '@tanstack/react-query'
import { VerificationResultCard } from './verification-result-card'
import { AiVerifyButton } from './ai-verify-button'
import { ExpertVerifyButton } from './expert-verify-button'

type VerificationRecord = {
  id: string
  type: 'AI_AGENT' | 'EXPERT' | 'AUTO_GOLD_MARKETPLACE'
  status: 'PASS' | 'FAIL' | 'INCONCLUSIVE' | 'IN_PROGRESS'
  qualityRating: 'RED' | 'AMBER' | 'GREEN' | 'GOLD' | null
  costTokens: number
  findings: Array<{ type: 'verified' | 'warning' | 'missing'; text: string }>
  notes: string | null
  confidence?: number | null
  completedAt: string | null
  createdAt: string
}

type Props = {
  milestoneId: string
  milestoneName: string
  tokenBalance: number
  showVerifyButtons: boolean // only when milestone is SUBMITTED or UNDER_REVIEW
}

export function VerificationsPanel({ milestoneId, milestoneName, tokenBalance, showVerifyButtons }: Props) {
  const { data, isLoading } = useQuery<{
    submissionId: string | null
    submissionVersion: number | null
    verifications: VerificationRecord[]
  }>({
    queryKey: ['milestone-verifications', milestoneId],
    queryFn: async () => {
      const res = await fetch(`/api/milestones/${milestoneId}/verifications`)
      if (!res.ok) throw new Error('Failed to load verifications')
      return res.json()
    },
  })

  if (isLoading) {
    return <div className="h-12 rounded-md bg-ink-50 animate-pulse" />
  }

  const verifications = data?.verifications ?? []
  const submissionId = data?.submissionId ?? null

  // Has AI verification already been done for this submission?
  const hasAiVerification = verifications.some((v) => v.type === 'AI_AGENT')
  const hasExpertVerification = verifications.some((v) => v.type === 'EXPERT')

  if (verifications.length === 0 && !showVerifyButtons) return null

  return (
    <div className="space-y-3">
      {verifications.length > 0 && (
        <h3 className="text-xs font-semibold uppercase tracking-widest text-ink-400">Verification results</h3>
      )}
      {verifications.map((v) => (
        <VerificationResultCard key={v.id} verification={v} />
      ))}

      {showVerifyButtons && submissionId && (
        <div className="space-y-2">
          {verifications.length === 0 && (
            <h3 className="text-xs font-semibold uppercase tracking-widest text-ink-400">Verification</h3>
          )}
          <p className="text-xs text-ink-400">
            Optional — run AI or expert verification to strengthen your submission before admin review.
          </p>
          <div className="flex flex-wrap gap-2">
            {!hasAiVerification && (
              <AiVerifyButton
                submissionId={submissionId}
                milestoneName={milestoneName}
                milestoneId={milestoneId}
                tokenBalance={tokenBalance}
              />
            )}
            {!hasExpertVerification && (
              <ExpertVerifyButton
                submissionId={submissionId}
                milestoneId={milestoneId}
                tokenBalance={tokenBalance}
              />
            )}
          </div>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Update the milestone detail page**

Replace the content of `app/(app)/contractor/projects/[id]/milestones/[milestoneId]/page.tsx` with the version that:
- Fetches token balance alongside the milestone
- Shows `<VerificationsPanel>` when milestone is SUBMITTED or UNDER_REVIEW

```typescript
import { auth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SubmissionForm } from '@/components/milestone/submission-form'
import { SubmissionHistory } from '@/components/milestone/submission-history'
import { VerificationsPanel } from '@/components/verification/verifications-panel'
import { buttonVariants } from '@/components/ui/button'
import Link from 'next/link'
import { Lock, Wrench } from 'lucide-react'
import { cn } from '@/lib/utils'

type Props = { params: Promise<{ id: string; milestoneId: string }> }

const SUBMITTABLE_STATUSES = ['AVAILABLE', 'IN_PROGRESS', 'ACTION_REQUIRED']
const REVIEW_STATUSES = ['SUBMITTED', 'UNDER_REVIEW']

export default async function MilestoneDetailPage({ params }: Props) {
  const { id: projectId, milestoneId } = await params
  const session = await auth()
  if (!session) redirect('/login')

  const [milestone, wallet] = await Promise.all([
    db.milestone.findFirst({
      where: {
        id: milestoneId,
        projectId,
        project: { contractorCompanyId: session.user.companyId },
      },
      include: {
        submissions: { orderBy: { version: 'desc' } },
      },
    }),
    db.walletBalance.findUnique({
      where: { companyId: session.user.companyId },
      select: { tokens: true },
    }),
  ])

  if (!milestone) notFound()

  const tokenBalance = wallet?.tokens ?? 0
  const canSubmit = SUBMITTABLE_STATUSES.includes(milestone.status)
  const isLocked = milestone.status === 'LOCKED'
  const isApproved = milestone.status === 'APPROVED' || milestone.status === 'AUTO_GOLD'
  const isUnderReview = REVIEW_STATUSES.includes(milestone.status)

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs text-ink-400 mb-2">
          <Link href={`/contractor/projects/${projectId}/milestones`} className="hover:text-ink-700 transition-colors">
            Milestones
          </Link>
          <span>/</span>
          <span className="text-ink-600">{milestone.name}</span>
        </div>
        <h2 className="text-xl font-semibold tracking-tight text-ink-900">{milestone.name}</h2>
        {milestone.description && (
          <p className="text-sm text-ink-500 mt-1">{milestone.description}</p>
        )}
      </div>

      {isLocked && (
        <div className="flex flex-col items-center py-12 text-center">
          <Lock className="h-8 w-8 text-ink-300 mb-3" strokeWidth={1.5} />
          <p className="text-sm font-medium text-ink-900">Milestone locked</p>
          <p className="text-xs text-ink-500 mt-1">Complete the previous milestone to unlock this one.</p>
        </div>
      )}

      {isApproved && (
        <Card className="border-success-500/30 bg-emerald-50/30">
          <CardContent className="pt-6">
            <p className="text-sm font-medium text-ink-900">
              {milestone.status === 'AUTO_GOLD' ? 'Auto-verified — Gold standard' : 'Approved'}
            </p>
            <p className="text-xs text-ink-500 mt-1">
              This milestone has been verified and approved. No further action required.
            </p>
          </CardContent>
        </Card>
      )}

      {canSubmit && (
        <Card>
          <CardHeader>
            <CardTitle>Submit artefacts</CardTitle>
          </CardHeader>
          <CardContent>
            <SubmissionForm milestoneId={milestoneId} projectId={projectId} />
          </CardContent>
        </Card>
      )}

      {isUnderReview && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm font-medium text-ink-900">Submission under review</p>
            <p className="text-xs text-ink-500 mt-1">
              Your submission is with the platform admin for review. You will be notified of the outcome.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Verification panel — show when under review or submitted */}
      {(isUnderReview || canSubmit) && milestone.submissions.length > 0 && (
        <VerificationsPanel
          milestoneId={milestoneId}
          milestoneName={milestone.name}
          tokenBalance={tokenBalance}
          showVerifyButtons={isUnderReview}
        />
      )}

      {canSubmit && (
        <div className="rounded-md border border-ink-200 bg-ink-25 px-4 py-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-ink-900">Need professional support?</p>
            <p className="text-xs text-ink-500 mt-0.5">
              Find a verified service provider for this milestone. Deliverables submitted by an SP are auto-verified Gold.
            </p>
          </div>
          <Link
            href={`/contractor/marketplace?milestone=${milestoneId}`}
            className={cn(buttonVariants({ variant: 'secondary', size: 'sm' }), 'flex-shrink-0 gap-2')}
          >
            <Wrench className="h-4 w-4" />
            Get service
          </Link>
        </div>
      )}

      {milestone.submissions.length > 0 && (
        <SubmissionHistory submissions={milestone.submissions} />
      )}
    </div>
  )
}
```

- [ ] **Step 3: Run typecheck**

```bash
npm run typecheck
```

- [ ] **Step 4: Commit**

```bash
git add components/verification/verifications-panel.tsx app/\(app\)/contractor/projects/\[id\]/milestones/\[milestoneId\]/page.tsx
git commit -m "feat(m5): wire verification panel into milestone detail page"
```

---

## Task 9: Tier-Up Animation

**Files:**
- Create: `components/tier/tier-up-animation.tsx`

This component is mounted by the contractor layout or dashboard when the tier changes. For the prototype, it triggers on page load if `tierUpgraded=true` is in the URL query (set by the server action after approval — M6 will wire this). The animation can also be previewed via a demo button in the dashboard.

- [ ] **Step 1: Create the animation**

Create `components/tier/tier-up-animation.tsx`:

```typescript
'use client'
// components/tier/tier-up-animation.tsx
// Framer Motion tier-up celebration. Triggered by ?tierUp=SILVER in URL.

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

type Tier = 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM'

const TIER_COLOURS: Record<Tier, string> = {
  BRONZE: '#CD7F32',
  SILVER: '#9EA3AD',
  GOLD: '#F59E0B',
  PLATINUM: '#7C3AED',
}

const TIER_LABELS: Record<Tier, string> = {
  BRONZE: 'Bronze',
  SILVER: 'Silver',
  GOLD: 'Gold',
  PLATINUM: 'Platinum',
}

export function TierUpAnimation() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const tierParam = searchParams.get('tierUp') as Tier | null
  const [visible, setVisible] = useState(!!tierParam && tierParam in TIER_COLOURS)

  useEffect(() => {
    if (!visible) return
    const t = setTimeout(() => {
      setVisible(false)
      // Remove query param without re-render
      const params = new URLSearchParams(searchParams.toString())
      params.delete('tierUp')
      const qs = params.toString()
      router.replace(pathname + (qs ? `?${qs}` : ''))
    }, 4000)
    return () => clearTimeout(t)
  }, [visible, pathname, router, searchParams])

  if (!tierParam || !TIER_COLOURS[tierParam]) return null

  const colour = TIER_COLOURS[tierParam]
  const label = TIER_LABELS[tierParam]

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center pointer-events-none"
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-ink-950/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Card */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 280 }}
            className="relative z-10 flex flex-col items-center gap-4 px-12 py-10 bg-white rounded-2xl shadow-2xl"
          >
            {/* Tier dot */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.15, type: 'spring', stiffness: 400, damping: 15 }}
              className="h-16 w-16 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg"
              style={{ backgroundColor: colour }}
            >
              {label[0]}
            </motion.div>

            <div className="text-center">
              <p className="text-xs font-semibold tracking-widest text-ink-400 uppercase mb-1">Tier upgrade</p>
              <p className="text-2xl font-semibold text-ink-900">
                You&apos;re now{' '}
                <span style={{ color: colour }}>{label}</span>
              </p>
              <p className="text-sm text-ink-500 mt-1">New benefits and higher cashback rates are now active.</p>
            </div>

            {/* Particle dots */}
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute h-2 w-2 rounded-full"
                style={{ backgroundColor: colour }}
                initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                animate={{
                  x: Math.cos((i / 8) * Math.PI * 2) * 80,
                  y: Math.sin((i / 8) * Math.PI * 2) * 80,
                  opacity: 0,
                  scale: 0,
                }}
                transition={{ delay: 0.1, duration: 0.8, ease: 'easeOut' }}
              />
            ))}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
```

- [ ] **Step 2: Mount in the contractor layout**

Modify `app/(app)/contractor/layout.tsx` to include `<TierUpAnimation />`:

The layout is a server component, so wrap in a Suspense boundary (required because `useSearchParams` needs it):

```typescript
import { Suspense } from 'react'
import { TierUpAnimation } from '@/components/tier/tier-up-animation'

// Inside the return, before </div>:
<Suspense fallback={null}>
  <TierUpAnimation />
</Suspense>
```

- [ ] **Step 3: Run typecheck**

```bash
npm run typecheck
```

- [ ] **Step 4: Commit**

```bash
git add components/tier/tier-up-animation.tsx app/\(app\)/contractor/layout.tsx
git commit -m "feat(m5): tier-up celebration animation (Framer Motion)"
```

---

## Task 10: Cashback Rates Display + Tier Progress Card

**Files:**
- Create: `components/tier/cashback-rates.tsx`
- Modify: `app/(app)/contractor/page.tsx` (dashboard) — update tier progress widget

- [ ] **Step 1: Create cashback rates component**

Create `components/tier/cashback-rates.tsx`:

```typescript
// components/tier/cashback-rates.tsx
// Tier → cashback rate table. Used in wallet and dashboard.

import { cn } from '@/lib/utils'
import { TIER_CASHBACK_RATES, TIER_ORDER } from '@/lib/tier/rules'
import type { Tier } from '@/lib/tier/rules'

const TIER_COLOURS: Record<Tier, string> = {
  BRONZE: '#CD7F32',
  SILVER: '#9EA3AD',
  GOLD: '#F59E0B',
  PLATINUM: '#7C3AED',
}

type Props = {
  currentTier: Tier
}

export function CashbackRates({ currentTier }: Props) {
  return (
    <div className="rounded-md border border-ink-200 overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-ink-25 border-b border-ink-100">
            <th className="px-3 py-2 text-left text-xs font-semibold text-ink-500">Tier</th>
            <th className="px-3 py-2 text-right text-xs font-semibold text-ink-500">Cashback on purchases</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-ink-50">
          {TIER_ORDER.map((tier) => {
            const isActive = tier === currentTier
            return (
              <tr
                key={tier}
                className={cn(isActive ? 'bg-white' : 'bg-ink-25/50 text-ink-400')}
              >
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2 w-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: TIER_COLOURS[tier] }}
                    />
                    <span className={cn('text-xs font-medium', isActive ? 'text-ink-900' : 'text-ink-400')}>
                      {tier.charAt(0) + tier.slice(1).toLowerCase()}
                      {isActive && <span className="ml-1.5 text-[10px] text-accent-500">current</span>}
                    </span>
                  </div>
                </td>
                <td className="px-3 py-2 text-right">
                  <span className={cn('text-xs font-semibold tabular-nums', isActive ? 'text-ink-900' : 'text-ink-300')}>
                    {TIER_CASHBACK_RATES[tier]}%
                  </span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
```

- [ ] **Step 2: Check current dashboard tier widget**

Read `app/(app)/contractor/page.tsx` to find the tier progress widget, then update it to show `<CashbackRates>` below the progress bar.

```bash
grep -n "TierProgress\|tierProgress\|tier\|cashback" app/\(app\)/contractor/page.tsx | head -20
```

Import `CashbackRates` and add it inside the tier card in the dashboard. The exact location will depend on what the dashboard currently renders — find the section rendering tier data and add `<CashbackRates currentTier={tierProgress.tier} />` below the progress bar.

- [ ] **Step 3: Run typecheck**

```bash
npm run typecheck
```

- [ ] **Step 4: Commit**

```bash
git add components/tier/cashback-rates.tsx app/\(app\)/contractor/page.tsx
git commit -m "feat(m5): cashback rates table + tier progress dashboard widget"
```

---

## Task 11: Tier-Gated Leads Section

**Files:**
- Create: `app/(app)/contractor/leads/page.tsx`
- Modify: `components/shell/sidebar.tsx` — add Leads nav item with lock indicator

The spec says "leads section locked until Silver". Add a Leads nav item to the sidebar that shows a lock badge for BRONZE users and redirects to a paywall-style locked page.

- [ ] **Step 1: Create the locked leads page**

Create `app/(app)/contractor/leads/page.tsx`:

```typescript
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getTierInfo } from '@/server/queries/dashboard'
import { Lock, TrendingUp } from 'lucide-react'
import { CashbackRates } from '@/components/tier/cashback-rates'

export default async function LeadsPage() {
  const session = await auth()
  if (!session) redirect('/login')

  const { tier } = await getTierInfo(session.user.companyId)
  const isLocked = tier === 'BRONZE'

  if (!isLocked) {
    // Silver+ users see a stub leads page
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <h2 className="text-base font-semibold text-ink-900 mb-1">Leads</h2>
        <p className="text-sm text-ink-500 mb-6">Inbound project leads from clients on the platform.</p>
        <div className="flex flex-col items-center py-16 text-center">
          <TrendingUp className="h-8 w-8 text-ink-300 mb-3" strokeWidth={1.5} />
          <p className="text-sm font-medium text-ink-900">Leads coming soon</p>
          <p className="text-xs text-ink-500 mt-1">Client project leads will appear here as the platform grows.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h2 className="text-base font-semibold text-ink-900 mb-1">Leads</h2>
        <p className="text-sm text-ink-500">Inbound project leads from clients on the platform.</p>
      </div>

      <div className="rounded-lg border border-ink-200 bg-ink-25 px-8 py-10 flex flex-col items-center text-center gap-4">
        <div className="h-12 w-12 rounded-full bg-ink-100 flex items-center justify-center">
          <Lock className="h-5 w-5 text-ink-400" strokeWidth={1.5} />
        </div>
        <div>
          <p className="text-sm font-semibold text-ink-900">Silver tier required</p>
          <p className="text-sm text-ink-500 mt-1 max-w-sm">
            Inbound client leads are available from Silver tier upwards. Complete 3 compliant projects to unlock.
          </p>
        </div>
      </div>

      <div>
        <h3 className="text-xs font-semibold uppercase tracking-widest text-ink-400 mb-3">Tier benefits</h3>
        <CashbackRates currentTier={tier} />
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Add Leads to the contractor nav with tier-gate indicator**

Modify `components/shell/sidebar.tsx`:

Add the Leads nav item to `CONTRACTOR_NAV`. Since the lock state depends on runtime tier data, add a visual lock indicator in the sidebar for the Leads item when the user is BRONZE. The sidebar receives `tierInfo` already — use it.

Find the `NavItem` type definition and add an optional `minTier` property. Modify the nav item render to show a lock icon when `tierInfo.tier === 'BRONZE'` and `item.minTier === 'SILVER'`:

In `CONTRACTOR_NAV`, add after Wallet:
```typescript
{ label: 'Leads', href: '/contractor/leads', icon: TrendingUp, minTier: 'SILVER' as const },
```

In the nav item render, show a lock badge:
```tsx
{item.minTier && tierInfo && tierInfo.tier === 'BRONZE' && (
  <Lock className="h-3 w-3 text-ink-300 ml-auto" strokeWidth={1.5} />
)}
```

Import `TrendingUp` and `Lock` from lucide-react in sidebar.tsx.

- [ ] **Step 3: Run typecheck**

```bash
npm run typecheck
```

- [ ] **Step 4: Commit**

```bash
git add app/\(app\)/contractor/leads/page.tsx components/shell/sidebar.tsx
git commit -m "feat(m5): tier-gated Leads section (locked at BRONZE, unlocked at SILVER+)"
```

---

## Task 12: Gold Standard Certificate Mock

**Files:**
- Create: `components/milestone/gold-certificate-button.tsx`
- Modify: `app/(app)/contractor/projects/[id]/milestones/page.tsx` — show certificate button when all milestones approved

- [ ] **Step 1: Create the certificate button**

Create `components/milestone/gold-certificate-button.tsx`:

```typescript
'use client'
// components/milestone/gold-certificate-button.tsx
// Mocked PDF download — animated button, no real file generated.

import { useState } from 'react'
import { Award, Loader2, CheckCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

type Props = { projectName: string }

export function GoldCertificateButton({ projectName }: Props) {
  const [state, setState] = useState<'idle' | 'generating' | 'done'>('idle')

  function handleClick() {
    setState('generating')
    setTimeout(() => setState('done'), 2200)
    setTimeout(() => setState('idle'), 5000)
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={handleClick}
        disabled={state !== 'idle'}
        className="flex items-center gap-2 h-9 px-4 rounded-md bg-ink-900 text-white text-sm font-medium hover:bg-ink-800 transition-colors disabled:opacity-60"
      >
        {state === 'generating' ? (
          <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.5} />
        ) : state === 'done' ? (
          <CheckCircle className="h-4 w-4 text-success-400" strokeWidth={1.5} />
        ) : (
          <Award className="h-4 w-4" strokeWidth={1.5} />
        )}
        {state === 'generating'
          ? 'Generating certificate…'
          : state === 'done'
          ? 'Certificate ready'
          : 'Download Gold Standard Certificate'}
      </button>

      <AnimatePresence>
        {state === 'done' && (
          <motion.p
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            className="text-xs text-ink-400"
          >
            {projectName} — Gold Standard.pdf
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}
```

- [ ] **Step 2: Show certificate button when project is fully approved**

In `app/(app)/contractor/projects/[id]/milestones/page.tsx`, add logic to show the certificate button when all milestones are APPROVED or AUTO_GOLD:

```typescript
import { GoldCertificateButton } from '@/components/milestone/gold-certificate-button'

// After the existing completedCount calculation, add:
const allComplete = project.milestones.length > 0 &&
  project.milestones.every(m => ['APPROVED', 'AUTO_GOLD'].includes(m.status))

// In the JSX, after the header div, add:
{allComplete && (
  <div className="rounded-lg border border-amber-200 bg-amber-50/30 px-5 py-4 flex items-center justify-between gap-4">
    <div>
      <p className="text-sm font-semibold text-ink-900">All milestones complete</p>
      <p className="text-xs text-ink-500 mt-0.5">
        This project has achieved Gold Standard verification across all milestones.
      </p>
    </div>
    <GoldCertificateButton projectName={project.name} />
  </div>
)}
```

- [ ] **Step 3: Run typecheck**

```bash
npm run typecheck
```

- [ ] **Step 4: Commit**

```bash
git add components/milestone/gold-certificate-button.tsx app/\(app\)/contractor/projects/\[id\]/milestones/page.tsx
git commit -m "feat(m5): Gold Standard Certificate mock download with animation"
```

---

## Task 13: Final typecheck, lint, and unit tests

- [ ] **Step 1: Run all unit tests**

```bash
npm run test:unit
```
Expected: all tests pass (at minimum the 4 verification stubs tests and 11 tier rules tests).

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
git commit -m "feat: M5 — Verification Engine & Tier Progression complete"
```

---

## Spec Coverage Self-Review

| Requirement | Covered by |
|---|---|
| AI Verification Agent — animated analysis overlay | Task 6 (`AiVerificationOverlay`) |
| AI Verification — 2–4s log lines (6–8s total at 900ms/line × 6) | Task 6 |
| AI Verification — PASS/FAIL result card with findings | Task 6 (`VerificationResultCard`) |
| AI Verification — 1,000 token cost, deducted from wallet | Task 4 (`/api/ai/verify`) |
| Expert Verification — 10,000 tokens, goes to expert queue | Tasks 5, 7 |
| Expert Verification — colour-coded quality rating | Task 6 (`VerificationResultCard` shows qualityRating) |
| Auto-Gold — marketplace SPs | Already in schema (AUTO_GOLD status); runtime wiring in M7 |
| Tier Rules Engine: BRONZE→SILVER→GOLD→PLATINUM | Task 2 (`lib/tier/rules.ts`) |
| Tier recalculation after milestone approval | Task 3 (`server/actions/tier.ts`) |
| Tier badge throughout platform | Already in sidebar; no change needed |
| Tier-gated feature access (Leads section) | Task 11 |
| Cashback rate display per tier | Task 10 (`CashbackRates`) |
| Gold Standard Certificate mock download | Task 12 |
| Tier progression animation | Task 9 (`TierUpAnimation`) |

**Known deferred to M6:** Tier recalculation is not wired into the admin approval action yet — M6 builds the admin milestone review flow, and the `recalculateTier` server action (Task 3) will be called there.

**Known deferred to M7:** Auto-Gold wiring on marketplace SP deliverable upload.
