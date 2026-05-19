# M7 — Marketplaces: Services + Hardware Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build both marketplaces — the Service Marketplace (SP directory, RFQ-to-Job-Card lifecycle, SP role fully functional) and the Hardware Marketplace (browse by category, product detail, basic cart) — plus seed data for demo-ready state.

**Architecture:** No schema changes needed — Rfq, Bid, JobCard, JobDeliverable, JobMessage, HardwareListing, Order, OrderItem, ServiceProviderProfile all exist. Server queries/actions in `server/queries/marketplace.ts` and `server/actions/marketplace.ts`. The cart is client-only state (localStorage via a Zustand store) — no DB writes until checkout (M9). The SP role gets a fully functional dashboard, opportunity board, job cards Kanban, and job card detail. The contractor gets a service center (browse SPs, post RFQs, manage job cards) and a hardware marketplace. Chat in job cards is simple polling (same pattern as M4.5 comms).

**Tech Stack:** Next.js 15 App Router, Prisma 7, TanStack Query (client mutations), Zustand (cart state), Zod (form validation), Framer Motion (Kanban drag is stretch — static columns for now), TypeScript strict.

---

## File Map

**New files:**
- `server/queries/marketplace.ts` — SP profiles, hardware, RFQs, job cards, bids
- `server/actions/marketplace.ts` — createRfq, submitBid, acceptBid, uploadDeliverable, submitDeliverable, addJobMessage
- `lib/cart-store.ts` — Zustand cart store (client-only)
- `app/(app)/contractor/marketplace/page.tsx` — hardware browse (category nav + grid)
- `app/(app)/contractor/marketplace/[id]/page.tsx` — hardware product detail
- `app/(app)/contractor/service-center/page.tsx` — SP directory + tabs for My RFQs / Job Cards
- `app/(app)/contractor/service-center/rfq/new/page.tsx` — RFQ creation (pre-filled from milestone)
- `app/(app)/contractor/service-center/rfq/[id]/page.tsx` — RFQ detail + bids
- `app/(app)/service-provider/page.tsx` — real SP dashboard
- `app/(app)/service-provider/opportunities/page.tsx` — open RFQ board
- `app/(app)/service-provider/opportunities/[rfqId]/page.tsx` — RFQ detail + bid form
- `app/(app)/service-provider/job-cards/page.tsx` — Kanban (4 columns)
- `app/(app)/service-provider/job-cards/[id]/page.tsx` — job card detail
- `app/(app)/service-provider/profile/page.tsx` — SP profile editor
- `components/marketplace/sp-card.tsx` — service provider card (directory listing)
- `components/marketplace/hardware-product-card.tsx` — hardware product card
- `components/marketplace/rfq-form.tsx` — RFQ creation form (client)
- `components/marketplace/bid-form.tsx` — bid submission modal (client)
- `components/marketplace/job-card-kanban.tsx` — Kanban board (client, static columns)
- `components/marketplace/cart-sidebar.tsx` — cart drawer (client)

**Modified files:**
- `prisma/seed.ts` — add seed RFQs, bids, job card (demo narrative)
- `components/shell/sidebar.tsx` — update SERVICE_PROVIDER_NAV
- `app/(app)/contractor/projects/[id]/milestones/[milestoneId]/page.tsx` — fix "Get service" link to `/contractor/service-center/rfq/new?milestone=X`

---

## Task 1: Seed RFQs, Bids, and Job Card

**Files:**
- Modify: `prisma/seed.ts`

The demo needs pre-seeded marketplace data so both roles show real content on first login.

- [ ] **Step 1: Add seed data to `prisma/seed.ts`**

Find the section after `console.log('  ✓ Hardware listings')` (around line 700) and add before the O&M Readings section:

```typescript
  // -------------------------------------------------------------------------
  // RFQs, Bids, Job Card (Marketplace demo data)
  // -------------------------------------------------------------------------

  // Open RFQ — Structural Engineering needed for Project Alpha
  const rfqStructural = await db.rfq.upsert({
    where: { id: 'rfq-alpha-structural' },
    update: {},
    create: {
      id: 'rfq-alpha-structural',
      projectId: projectAlpha.id,
      milestoneId: 'ms-alpha-4', // Structural Engineering Report milestone
      category: 'STRUCTURAL_CIVILS',
      title: 'Structural Engineering Report — Spaza Soweto Retail Solar PPA',
      description: 'Require a SACPCMP-registered structural engineer to produce a roof loading analysis and mounting system specification for a 450kW commercial solar installation on a retail centre.',
      scopeOfWork: 'Roof structural assessment, loading calculations per SANS 10160-2, mounting system specification, PE-stamped report, drawings.',
      budgetCentsMax: 85_000_00,
      deadlineDays: 21,
      status: 'OPEN',
    },
  })

  // Open RFQ — Grid Connection Application
  await db.rfq.upsert({
    where: { id: 'rfq-alpha-grid' },
    update: {},
    create: {
      id: 'rfq-alpha-grid',
      projectId: projectAlpha.id,
      category: 'ENGINEERING',
      title: 'Grid Connection Application Support — 450kW Embedded Generation',
      description: 'Require an electrical engineer to prepare and submit the grid connection application to City Power for a 450kW embedded generation installation.',
      scopeOfWork: 'Single-line diagram, protection relay specification, grid application submission, liaison with City Power.',
      budgetCentsMax: 35_000_00,
      deadlineDays: 30,
      status: 'OPEN',
    },
  })

  // Bid on the structural RFQ from Lerato's company (Mokoena Engineering)
  const bidStructural = await db.bid.upsert({
    where: { id: 'bid-structural-mokoena' },
    update: {},
    create: {
      id: 'bid-structural-mokoena',
      rfqId: rfqStructural.id,
      providerCompanyId: mokoena.id,
      amountCents: 72_000_00,
      proposalText: 'We have completed 80+ commercial solar structural assessments across Gauteng. Our team is SACPCMP registered and we carry full PI insurance. Turnaround: 14 working days from site visit. Includes two revision cycles and PE stamp.',
      estimatedDays: 18,
      status: 'SUBMITTED',
    },
  })

  // Awarded RFQ for Kruger Farm (already in progress — shows the full lifecycle)
  const rfqKrugerEia = await db.rfq.upsert({
    where: { id: 'rfq-kruger-eia' },
    update: {},
    create: {
      id: 'rfq-kruger-eia',
      projectId: projectKruger.id,
      category: 'LEGAL',
      title: 'Environmental Impact Assessment — Kruger Family Farm 120kW',
      description: 'Completed EIA for the Kruger Family Farm 120kW hybrid solar installation.',
      scopeOfWork: 'Full EIA including public participation, wetland assessment, NEMA compliance.',
      budgetCentsMax: 45_000_00,
      deadlineDays: 60,
      status: 'AWARDED',
    },
  })

  const bidKrugerAccepted = await db.bid.upsert({
    where: { id: 'bid-kruger-eia-mokoena' },
    update: {},
    create: {
      id: 'bid-kruger-eia-mokoena',
      rfqId: rfqKrugerEia.id,
      providerCompanyId: mokoena.id,
      amountCents: 38_500_00,
      proposalText: 'Completed over 40 EIAs for renewable energy projects. Wetland specialist on team. NEMA-compliant reports.',
      estimatedDays: 45,
      status: 'ACCEPTED',
    },
  })

  // Job card from the awarded Kruger EIA bid
  await db.jobCard.upsert({
    where: { id: 'jobcard-kruger-eia' },
    update: {},
    create: {
      id: 'jobcard-kruger-eia',
      rfqId: rfqKrugerEia.id,
      providerCompanyId: mokoena.id,
      scopeOfWork: 'Full EIA including public participation, wetland assessment, NEMA compliance. PE-stamped report and supporting hydrological model.',
      amountCents: 38_500_00,
      escrowStatus: 'LOCKED',
      status: 'ACTIVE',
      deliverables: {
        create: [
          {
            id: 'del-kruger-eia-v1',
            name: 'EIA Draft v1.pdf',
            url: 'https://example.com/seed/eia-draft-v1.pdf',
            version: 1,
          },
        ],
      },
      messages: {
        create: [
          {
            senderUserId: lerato.id,
            body: 'Site visit completed on 12 May. Draft report in progress — will upload for review by 20 May.',
          },
          {
            senderUserId: marcus.id,
            body: 'Thanks Lerato. Please ensure section 4.3 covers the stormwater management plan in detail — admin flagged this on the previous version.',
          },
        ],
      },
    },
  })

  console.log('  ✓ RFQs, bids, job card (marketplace demo data)')
```

- [ ] **Step 2: Run seed to apply**

```bash
npm run db:seed:demo
```
Expected: `✓ RFQs, bids, job card (marketplace demo data)` in output.

- [ ] **Step 3: Commit**

```bash
git add prisma/seed.ts
git commit -m "feat(m7): seed RFQs, bids, job card for marketplace demo"
```

---

## Task 2: Server Queries + Actions

**Files:**
- Create: `server/queries/marketplace.ts`
- Create: `server/actions/marketplace.ts`

- [ ] **Step 1: Create `server/queries/marketplace.ts`**

```typescript
// server/queries/marketplace.ts

import { db } from '@/lib/db'

export async function getServiceProviders(category?: string) {
  return db.serviceProviderProfile.findMany({
    where: category ? { categories: { has: category as Parameters<typeof db.serviceProviderProfile.findMany>[0]['where']['categories']['has'] } } : undefined,
    include: {
      company: { select: { id: true, name: true, logoUrl: true } },
    },
    orderBy: { rating: 'desc' },
  })
}

export async function getServiceProvider(companyId: string) {
  return db.serviceProviderProfile.findUnique({
    where: { companyId },
    include: {
      company: { select: { id: true, name: true, logoUrl: true, registrationNo: true } },
    },
  })
}

export async function getHardwareListings(category?: string) {
  return db.hardwareListing.findMany({
    where: category ? { category: category as Parameters<typeof db.hardwareListing.findMany>[0]['where']['category'] } : undefined,
    orderBy: { priceCents: 'asc' },
  })
}

export async function getHardwareListing(id: string) {
  return db.hardwareListing.findUnique({ where: { id } })
}

export async function getContractorRfqs(companyId: string) {
  return db.rfq.findMany({
    where: { project: { contractorCompanyId: companyId } },
    include: {
      milestone: { select: { name: true } },
      project: { select: { name: true } },
      bids: { select: { id: true, status: true, amountCents: true, estimatedDays: true, providerCompany: { select: { name: true } }, proposalText: true } },
      jobCard: { select: { id: true, status: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
}

export async function getRfqDetail(id: string) {
  return db.rfq.findUnique({
    where: { id },
    include: {
      milestone: { select: { name: true } },
      project: { select: { name: true, contractorCompanyId: true } },
      bids: {
        include: {
          providerCompany: {
            include: { serviceProviderProfile: { select: { rating: true, ratingCount: true, categories: true } } },
          },
        },
        orderBy: { createdAt: 'asc' },
      },
      jobCard: { select: { id: true, status: true } },
    },
  })
}

export async function getSpJobCards(companyId: string) {
  return db.jobCard.findMany({
    where: { providerCompanyId: companyId },
    include: {
      rfq: { select: { title: true, category: true, project: { select: { name: true } } } },
      deliverables: { orderBy: { createdAt: 'desc' }, take: 1 },
    },
    orderBy: { createdAt: 'desc' },
  })
}

export async function getJobCardDetail(id: string) {
  return db.jobCard.findUnique({
    where: { id },
    include: {
      rfq: {
        select: {
          title: true,
          description: true,
          scopeOfWork: true,
          category: true,
          project: {
            select: {
              name: true,
              stage: true,
              systemSizeKw: true,
              contractorCompanyId: true,
              contractorCompany: { select: { name: true } },
            },
          },
        },
      },
      deliverables: { orderBy: { version: 'asc' } },
      messages: { orderBy: { createdAt: 'asc' } },
    },
  })
}

export async function getOpenRfqsForSp(categories: string[]) {
  return db.rfq.findMany({
    where: {
      status: 'OPEN',
      category: { in: categories as Parameters<typeof db.rfq.findMany>[0]['where']['category']['in'] },
    },
    include: {
      project: { select: { name: true, systemSizeKw: true, stage: true } },
      milestone: { select: { name: true } },
      bids: { select: { id: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
}

export async function getSpProfile(companyId: string) {
  return db.serviceProviderProfile.findUnique({ where: { companyId } })
}

export async function getSpStats(companyId: string) {
  const [activeJobs, allJobs, bids] = await Promise.all([
    db.jobCard.count({ where: { providerCompanyId: companyId, status: 'ACTIVE' } }),
    db.jobCard.findMany({
      where: { providerCompanyId: companyId, status: { in: ['COMPLETED'] } },
      select: { amountCents: true },
    }),
    db.bid.count({ where: { providerCompanyId: companyId } }),
  ])
  const revenueEarnedCents = allJobs.reduce((sum, j) => sum + j.amountCents, 0)
  return { activeJobs, revenueEarnedCents, totalBids: bids, completedJobs: allJobs.length }
}
```

- [ ] **Step 2: Create `server/actions/marketplace.ts`**

```typescript
// server/actions/marketplace.ts
'use server'

import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { z } from 'zod'
import type { ServiceCategory } from '@/lib/generated/prisma/client'

// ─── RFQ ─────────────────────────────────────────────────────────────────────

const createRfqSchema = z.object({
  projectId: z.string(),
  milestoneId: z.string().optional(),
  category: z.string(),
  title: z.string().min(5),
  description: z.string().min(10),
  scopeOfWork: z.string().min(10),
  budgetCentsMax: z.coerce.number().optional(),
  deadlineDays: z.coerce.number().optional(),
})

export async function createRfq(data: z.infer<typeof createRfqSchema>) {
  const parsed = createRfqSchema.parse(data)
  const rfq = await db.rfq.create({
    data: {
      projectId: parsed.projectId,
      milestoneId: parsed.milestoneId ?? null,
      category: parsed.category as ServiceCategory,
      title: parsed.title,
      description: parsed.description,
      scopeOfWork: parsed.scopeOfWork,
      budgetCentsMax: parsed.budgetCentsMax ? Math.round(parsed.budgetCentsMax * 100) : null,
      deadlineDays: parsed.deadlineDays ?? null,
      status: 'OPEN',
    },
  })
  revalidatePath('/contractor/service-center')
  return rfq.id
}

// ─── BID ─────────────────────────────────────────────────────────────────────

const submitBidSchema = z.object({
  rfqId: z.string(),
  companyId: z.string(),
  amountCents: z.coerce.number().positive(),
  proposalText: z.string().min(20),
  estimatedDays: z.coerce.number().positive(),
})

export async function submitBid(data: z.infer<typeof submitBidSchema>) {
  const parsed = submitBidSchema.parse(data)
  // Check no existing bid from this company
  const existing = await db.bid.findFirst({
    where: { rfqId: parsed.rfqId, providerCompanyId: parsed.companyId },
  })
  if (existing) throw new Error('You have already submitted a bid for this RFQ.')

  const bid = await db.bid.create({
    data: {
      rfqId: parsed.rfqId,
      providerCompanyId: parsed.companyId,
      amountCents: Math.round(parsed.amountCents * 100),
      proposalText: parsed.proposalText,
      estimatedDays: parsed.estimatedDays,
      status: 'SUBMITTED',
    },
  })
  revalidatePath(`/service-provider/opportunities/${parsed.rfqId}`)
  return bid.id
}

// ─── ACCEPT BID → CREATE JOB CARD ────────────────────────────────────────────

export async function acceptBid(formData: FormData) {
  const bidId = z.string().parse(formData.get('bidId'))
  const bid = await db.bid.findUnique({
    where: { id: bidId },
    include: { rfq: { select: { id: true, scopeOfWork: true, status: true } } },
  })
  if (!bid) throw new Error('Bid not found')
  if (bid.rfq.status === 'AWARDED') throw new Error('RFQ already awarded')

  await db.$transaction([
    db.bid.update({ where: { id: bidId }, data: { status: 'ACCEPTED' } }),
    db.bid.updateMany({
      where: { rfqId: bid.rfqId, id: { not: bidId } },
      data: { status: 'REJECTED' },
    }),
    db.rfq.update({ where: { id: bid.rfqId }, data: { status: 'AWARDED' } }),
    db.jobCard.create({
      data: {
        rfqId: bid.rfqId,
        providerCompanyId: bid.providerCompanyId,
        scopeOfWork: bid.rfq.scopeOfWork,
        amountCents: bid.amountCents,
        escrowStatus: 'LOCKED',
        status: 'ACTIVE',
      },
    }),
  ])

  revalidatePath('/contractor/service-center')
  revalidatePath(`/contractor/service-center/rfq/${bid.rfqId}`)
}

// ─── JOB CARD ────────────────────────────────────────────────────────────────

const deliverableSchema = z.object({
  jobCardId: z.string(),
  name: z.string().min(1),
  url: z.string().url(),
})

export async function addDeliverable(data: z.infer<typeof deliverableSchema>) {
  const parsed = deliverableSchema.parse(data)
  const existing = await db.jobDeliverable.count({ where: { jobCardId: parsed.jobCardId } })
  await db.jobDeliverable.create({
    data: {
      jobCardId: parsed.jobCardId,
      name: parsed.name,
      url: parsed.url,
      version: existing + 1,
    },
  })
  revalidatePath(`/service-provider/job-cards/${parsed.jobCardId}`)
}

export async function submitDeliverable(formData: FormData) {
  const jobCardId = z.string().parse(formData.get('jobCardId'))
  await db.jobCard.update({
    where: { id: jobCardId },
    data: { status: 'PENDING_REVIEW' },
  })
  revalidatePath(`/service-provider/job-cards/${jobCardId}`)
  revalidatePath('/service-provider/job-cards')
}

const messageSchema = z.object({
  jobCardId: z.string(),
  senderUserId: z.string(),
  body: z.string().min(1),
})

export async function addJobMessage(data: z.infer<typeof messageSchema>) {
  const parsed = messageSchema.parse(data)
  await db.jobMessage.create({
    data: { jobCardId: parsed.jobCardId, senderUserId: parsed.senderUserId, body: parsed.body },
  })
  revalidatePath(`/service-provider/job-cards/${parsed.jobCardId}`)
}

// ─── SP PROFILE ──────────────────────────────────────────────────────────────

const updateProfileSchema = z.object({
  companyId: z.string(),
  headline: z.string().min(5),
  description: z.string().min(20),
  categories: z.array(z.string()).min(1),
  hourlyRateCents: z.coerce.number().optional(),
  serviceAreas: z.array(z.string()),
})

export async function updateSpProfile(data: z.infer<typeof updateProfileSchema>) {
  const parsed = updateProfileSchema.parse(data)
  await db.serviceProviderProfile.upsert({
    where: { companyId: parsed.companyId },
    update: {
      headline: parsed.headline,
      description: parsed.description,
      categories: parsed.categories as ServiceCategory[],
      hourlyRateCents: parsed.hourlyRateCents ? Math.round(parsed.hourlyRateCents * 100) : null,
      serviceAreas: parsed.serviceAreas,
    },
    create: {
      companyId: parsed.companyId,
      headline: parsed.headline,
      description: parsed.description,
      categories: parsed.categories as ServiceCategory[],
      hourlyRateCents: parsed.hourlyRateCents ? Math.round(parsed.hourlyRateCents * 100) : null,
      serviceAreas: parsed.serviceAreas,
    },
  })
  revalidatePath('/service-provider/profile')
}
```

- [ ] **Step 3: Typecheck**

```bash
npm run typecheck
```
Expected: no errors. The `has` filter for ServiceCategory array fields in Prisma may need a type assertion — if so, use `category as unknown as ServiceCategory` pattern.

- [ ] **Step 4: Commit**

```bash
git add server/queries/marketplace.ts server/actions/marketplace.ts
git commit -m "feat(m7): marketplace queries and server actions"
```

---

## Task 3: Cart Store (Zustand)

**Files:**
- Create: `lib/cart-store.ts`

The cart is client-only. No DB writes until M9 checkout. Zustand with localStorage persistence.

- [ ] **Step 1: Create `lib/cart-store.ts`**

```typescript
// lib/cart-store.ts
// Client-only cart state. Persisted in localStorage. No DB writes until M9 checkout.

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type CartItem = {
  id: string
  name: string
  manufacturer: string
  priceCents: number
  qty: number
  imageUrl: string | null
}

type CartStore = {
  items: CartItem[]
  addItem: (item: Omit<CartItem, 'qty'>) => void
  removeItem: (id: string) => void
  updateQty: (id: string, qty: number) => void
  clear: () => void
  totalCents: () => number
  itemCount: () => number
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) => {
        const existing = get().items.find((i) => i.id === item.id)
        if (existing) {
          set({ items: get().items.map((i) => i.id === item.id ? { ...i, qty: i.qty + 1 } : i) })
        } else {
          set({ items: [...get().items, { ...item, qty: 1 }] })
        }
      },
      removeItem: (id) => set({ items: get().items.filter((i) => i.id !== id) }),
      updateQty: (id, qty) => {
        if (qty <= 0) {
          set({ items: get().items.filter((i) => i.id !== id) })
        } else {
          set({ items: get().items.map((i) => i.id === id ? { ...i, qty } : i) })
        }
      },
      clear: () => set({ items: [] }),
      totalCents: () => get().items.reduce((sum, i) => sum + i.priceCents * i.qty, 0),
      itemCount: () => get().items.reduce((sum, i) => sum + i.qty, 0),
    }),
    { name: 'see-cart' }
  )
)
```

- [ ] **Step 2: Typecheck**

```bash
npm run typecheck
```

- [ ] **Step 3: Commit**

```bash
git add lib/cart-store.ts
git commit -m "feat(m7): Zustand cart store (client-only, localStorage)"
```

---

## Task 4: Hardware Marketplace Pages

**Files:**
- Create: `app/(app)/contractor/marketplace/page.tsx`
- Create: `app/(app)/contractor/marketplace/[id]/page.tsx`
- Create: `components/marketplace/hardware-product-card.tsx`

- [ ] **Step 1: Create `components/marketplace/hardware-product-card.tsx`**

```typescript
'use client'
// components/marketplace/hardware-product-card.tsx

import { useCartStore } from '@/lib/cart-store'
import { ShoppingCart, CheckCircle } from 'lucide-react'
import { useState } from 'react'

type Props = {
  id: string
  manufacturer: string
  model: string
  description: string
  priceCents: number
  stockQty: number
  imageUrl: string | null
  category: string
}

export function HardwareProductCard({ id, manufacturer, model, description, priceCents, stockQty, imageUrl, category }: Props) {
  const addItem = useCartStore((s) => s.addItem)
  const items = useCartStore((s) => s.items)
  const [added, setAdded] = useState(false)
  const inCart = items.find((i) => i.id === id)

  function handleAdd() {
    addItem({ id, name: `${manufacturer} ${model}`, manufacturer, priceCents, imageUrl })
    setAdded(true)
    setTimeout(() => setAdded(false), 1800)
  }

  return (
    <div className="rounded-lg border border-ink-200 bg-white overflow-hidden flex flex-col hover:border-ink-300 transition-colors">
      <div className="h-40 bg-ink-50 flex items-center justify-center">
        {imageUrl
          ? <img src={imageUrl} alt={model} className="h-full w-full object-contain p-4" />
          : <span className="text-xs text-ink-400">{category.replace('_', ' ')}</span>
        }
      </div>
      <div className="p-4 flex flex-col flex-1 gap-2">
        <div>
          <p className="text-xs text-ink-400 font-medium">{manufacturer}</p>
          <p className="text-sm font-semibold text-ink-900 leading-tight">{model}</p>
        </div>
        <p className="text-xs text-ink-500 line-clamp-2 flex-1">{description}</p>
        <div className="flex items-center justify-between mt-2">
          <div>
            <p className="text-base font-semibold text-ink-900">R {(priceCents / 100).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</p>
            <p className="text-[10px] text-ink-400">{stockQty > 0 ? `${stockQty} in stock` : 'Out of stock'}</p>
          </div>
          <button
            onClick={handleAdd}
            disabled={stockQty === 0}
            className="flex items-center gap-1.5 h-8 px-3 rounded-md bg-ink-900 text-white text-xs font-medium hover:bg-ink-800 transition-colors disabled:opacity-40"
          >
            {added
              ? <><CheckCircle className="h-3.5 w-3.5" strokeWidth={1.5} />Added</>
              : <><ShoppingCart className="h-3.5 w-3.5" strokeWidth={1.5} />{inCart ? `In cart (${inCart.qty})` : 'Add to cart'}</>
            }
          </button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create `app/(app)/contractor/marketplace/page.tsx`**

```typescript
import { getHardwareListings } from '@/server/queries/marketplace'
import { HardwareProductCard } from '@/components/marketplace/hardware-product-card'
import Link from 'next/link'
import { cn } from '@/lib/utils'

const CATEGORIES = [
  { value: '', label: 'All' },
  { value: 'SOLAR_PANEL', label: 'Solar Panels' },
  { value: 'BATTERY', label: 'Batteries' },
  { value: 'INVERTER', label: 'Inverters' },
  { value: 'GENERATOR', label: 'Generators' },
  { value: 'ACCESSORY', label: 'Accessories' },
]

type Props = { searchParams: Promise<{ category?: string }> }

export default async function HardwareMarketplacePage({ searchParams }: Props) {
  const { category } = await searchParams
  const listings = await getHardwareListings(category || undefined)

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-base font-semibold text-ink-900">Hardware Marketplace</h1>
        <p className="text-sm text-ink-500">Solar panels, batteries, inverters, and accessories from verified suppliers.</p>
      </div>

      {/* Category nav */}
      <div className="flex gap-2 flex-wrap">
        {CATEGORIES.map((cat) => (
          <Link
            key={cat.value}
            href={cat.value ? `/contractor/marketplace?category=${cat.value}` : '/contractor/marketplace'}
            className={cn(
              'h-7 px-3 rounded-full text-xs font-medium transition-colors border',
              (category ?? '') === cat.value
                ? 'bg-ink-900 text-white border-ink-900'
                : 'bg-white text-ink-600 border-ink-200 hover:border-ink-400'
            )}
          >
            {cat.label}
          </Link>
        ))}
      </div>

      {/* Product grid */}
      {listings.length === 0 && (
        <div className="flex flex-col items-center py-16 text-center">
          <p className="text-sm font-medium text-ink-900">No products in this category</p>
        </div>
      )}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {listings.map((listing) => (
          <HardwareProductCard
            key={listing.id}
            id={listing.id}
            manufacturer={listing.manufacturer}
            model={listing.model}
            description={listing.description}
            priceCents={listing.priceCents}
            stockQty={listing.stockQty}
            imageUrl={listing.imageUrl}
            category={listing.category}
          />
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Create `app/(app)/contractor/marketplace/[id]/page.tsx`**

```typescript
import { notFound } from 'next/navigation'
import { getHardwareListing } from '@/server/queries/marketplace'
import { HardwareProductCard } from '@/components/marketplace/hardware-product-card'

type Props = { params: Promise<{ id: string }> }

export default async function ProductDetailPage({ params }: Props) {
  const { id } = await params
  const listing = await getHardwareListing(id)
  if (!listing) notFound()

  const specs = listing.specs as Record<string, string | number>

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Image */}
        <div className="rounded-lg border border-ink-200 bg-ink-50 h-64 flex items-center justify-center">
          {listing.imageUrl
            ? <img src={listing.imageUrl} alt={listing.model} className="h-full w-full object-contain p-6" />
            : <span className="text-sm text-ink-400">{listing.category.replace('_', ' ')}</span>
          }
        </div>

        {/* Details */}
        <div className="space-y-4">
          <div>
            <p className="text-xs font-semibold text-ink-400 uppercase tracking-widest mb-1">{listing.manufacturer}</p>
            <h1 className="text-xl font-semibold text-ink-900">{listing.model}</h1>
            <p className="text-sm text-ink-500 mt-1">{listing.description}</p>
          </div>
          <p className="text-2xl font-semibold text-ink-900">
            R {(listing.priceCents / 100).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-ink-400">{listing.stockQty > 0 ? `${listing.stockQty} units in stock` : 'Out of stock'}</p>

          <HardwareProductCard
            id={listing.id}
            manufacturer={listing.manufacturer}
            model={listing.model}
            description={listing.description}
            priceCents={listing.priceCents}
            stockQty={listing.stockQty}
            imageUrl={listing.imageUrl}
            category={listing.category}
          />
        </div>
      </div>

      {/* Specs */}
      <div className="rounded-lg border border-ink-200 bg-white overflow-hidden">
        <div className="px-4 py-3 border-b border-ink-100">
          <h2 className="text-sm font-semibold text-ink-900">Specifications</h2>
        </div>
        <table className="w-full text-sm">
          <tbody className="divide-y divide-ink-50">
            {Object.entries(specs).map(([key, value]) => (
              <tr key={key}>
                <td className="px-4 py-2 text-ink-500 font-medium capitalize w-1/3">{key.replace(/([A-Z])/g, ' $1').trim()}</td>
                <td className="px-4 py-2 text-ink-900">{String(value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Typecheck**

```bash
npm run typecheck
```

- [ ] **Step 5: Commit**

```bash
git add components/marketplace/hardware-product-card.tsx "app/(app)/contractor/marketplace/"
git commit -m "feat(m7): hardware marketplace browse + product detail"
```

---

## Task 5: Service Center (Contractor)

**Files:**
- Create: `app/(app)/contractor/service-center/page.tsx`
- Create: `app/(app)/contractor/service-center/rfq/new/page.tsx`
- Create: `app/(app)/contractor/service-center/rfq/[id]/page.tsx`
- Create: `components/marketplace/sp-card.tsx`
- Create: `components/marketplace/rfq-form.tsx`
- Modify: `app/(app)/contractor/projects/[id]/milestones/[milestoneId]/page.tsx` — fix "Get service" link

- [ ] **Step 1: Create `components/marketplace/sp-card.tsx`**

```typescript
// components/marketplace/sp-card.tsx

import { Star, MapPin } from 'lucide-react'
import Link from 'next/link'

const CATEGORY_LABELS: Record<string, string> = {
  STRUCTURAL_CIVILS: 'Structural & Civils',
  ENGINEERING: 'Engineering',
  LEGAL: 'Legal',
  LOGISTICS_PLANT_HIRE: 'Logistics & Plant Hire',
  FINANCE_INSURANCE: 'Finance & Insurance',
}

type Props = {
  companyId: string
  name: string
  headline: string
  categories: string[]
  serviceAreas: string[]
  rating: number | null
  ratingCount: number
  postRfqHref?: string
}

export function SpCard({ companyId, name, headline, categories, serviceAreas, rating, ratingCount, postRfqHref }: Props) {
  return (
    <div className="rounded-lg border border-ink-200 bg-white p-5 space-y-3 hover:border-ink-300 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-ink-900">{name}</p>
          <p className="text-xs text-ink-500 mt-0.5 line-clamp-2">{headline}</p>
        </div>
        {rating != null && (
          <div className="flex items-center gap-1 flex-shrink-0">
            <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" strokeWidth={1.5} />
            <span className="text-sm font-semibold text-ink-900">{rating.toFixed(1)}</span>
            <span className="text-xs text-ink-400">({ratingCount})</span>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-1">
        {categories.map((cat) => (
          <span key={cat} className="text-[10px] font-medium px-1.5 py-0.5 rounded-sm bg-ink-100 text-ink-600">
            {CATEGORY_LABELS[cat] ?? cat}
          </span>
        ))}
      </div>

      {serviceAreas.length > 0 && (
        <div className="flex items-center gap-1 text-xs text-ink-400">
          <MapPin className="h-3 w-3 flex-shrink-0" strokeWidth={1.5} />
          {serviceAreas.slice(0, 2).join(', ')}{serviceAreas.length > 2 ? ` +${serviceAreas.length - 2}` : ''}
        </div>
      )}

      {postRfqHref && (
        <Link
          href={postRfqHref}
          className="inline-flex items-center h-7 px-3 rounded-md bg-ink-900 text-white text-xs font-medium hover:bg-ink-800 transition-colors"
        >
          Post RFQ
        </Link>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Create `components/marketplace/rfq-form.tsx`**

```typescript
'use client'
// components/marketplace/rfq-form.tsx

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { createRfq } from '@/server/actions/marketplace'

const CATEGORIES = [
  { value: 'STRUCTURAL_CIVILS', label: 'Structural & Civils' },
  { value: 'ENGINEERING', label: 'Engineering' },
  { value: 'LEGAL', label: 'Legal' },
  { value: 'LOGISTICS_PLANT_HIRE', label: 'Logistics & Plant Hire' },
  { value: 'FINANCE_INSURANCE', label: 'Finance & Insurance' },
]

type Props = {
  projectId: string
  milestoneId?: string
  milestoneName?: string
}

export function RfqForm({ projectId, milestoneId, milestoneName }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [category, setCategory] = useState('STRUCTURAL_CIVILS')
  const [title, setTitle] = useState(milestoneName ? `Service provider needed — ${milestoneName}` : '')
  const [description, setDescription] = useState('')
  const [scopeOfWork, setScopeOfWork] = useState('')
  const [budget, setBudget] = useState('')
  const [deadlineDays, setDeadlineDays] = useState('')
  const [error, setError] = useState<string | null>(null)

  function handleSubmit() {
    setError(null)
    if (!title.trim() || !description.trim() || !scopeOfWork.trim()) {
      setError('Title, description, and scope of work are required.')
      return
    }
    startTransition(async () => {
      try {
        const rfqId = await createRfq({
          projectId,
          milestoneId,
          category,
          title,
          description,
          scopeOfWork,
          budgetCentsMax: budget ? Number(budget) : undefined,
          deadlineDays: deadlineDays ? Number(deadlineDays) : undefined,
        })
        router.push(`/contractor/service-center/rfq/${rfqId}`)
        router.refresh()
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to post RFQ.')
      }
    })
  }

  return (
    <div className="space-y-5">
      {milestoneName && (
        <div className="rounded-md bg-accent-500/5 border border-accent-200 px-3 py-2 text-xs text-accent-700">
          Linked to milestone: <span className="font-semibold">{milestoneName}</span>
        </div>
      )}

      <div className="space-y-1">
        <label className="text-xs font-medium text-ink-700">Category</label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full h-9 rounded-md border border-ink-200 px-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-accent-500/20"
        >
          {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-ink-700">Title</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g., Structural Engineering Report — 450kW Retail Solar"
          className="w-full h-9 rounded-md border border-ink-200 px-3 text-sm placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-accent-500/20"
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-ink-700">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder="Brief description of what you need…"
          className="w-full rounded-md border border-ink-200 px-3 py-2 text-sm placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-accent-500/20 resize-none"
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-ink-700">Scope of work</label>
        <textarea
          value={scopeOfWork}
          onChange={(e) => setScopeOfWork(e.target.value)}
          rows={4}
          placeholder="Detailed scope: deliverables, standards, certifications required…"
          className="w-full rounded-md border border-ink-200 px-3 py-2 text-sm placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-accent-500/20 resize-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-xs font-medium text-ink-700">Budget max (ZAR)</label>
          <input
            type="number"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            placeholder="85000"
            className="w-full h-9 rounded-md border border-ink-200 px-3 text-sm placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-accent-500/20"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-ink-700">Deadline (days)</label>
          <input
            type="number"
            value={deadlineDays}
            onChange={(e) => setDeadlineDays(e.target.value)}
            placeholder="21"
            className="w-full h-9 rounded-md border border-ink-200 px-3 text-sm placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-accent-500/20"
          />
        </div>
      </div>

      {error && <p className="text-sm text-danger-600">{error}</p>}

      <button
        onClick={handleSubmit}
        disabled={isPending}
        className="flex items-center justify-center gap-1.5 h-9 px-4 rounded-md bg-ink-900 text-white text-sm font-medium hover:bg-ink-800 transition-colors disabled:opacity-50"
      >
        {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
        Post RFQ
      </button>
    </div>
  )
}
```

- [ ] **Step 3: Create `app/(app)/contractor/service-center/page.tsx`**

```typescript
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getContractorRfqs, getServiceProviders } from '@/server/queries/marketplace'
import { SpCard } from '@/components/marketplace/sp-card'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Plus } from 'lucide-react'

type Props = { searchParams: Promise<{ tab?: string; category?: string }> }

const STATUS_CLASS: Record<string, string> = {
  OPEN: 'bg-ink-100 text-ink-600',
  REVIEWING_BIDS: 'bg-accent-500/10 text-accent-600',
  AWARDED: 'bg-success-500/10 text-success-600',
  CANCELLED: 'bg-danger-500/10 text-danger-600',
}

const JC_STATUS_CLASS: Record<string, string> = {
  ACTIVE: 'bg-accent-500/10 text-accent-600',
  PENDING_REVIEW: 'bg-warning-50 text-warning-700',
  COMPLETED: 'bg-success-500/10 text-success-600',
  DISPUTED: 'bg-danger-500/10 text-danger-600',
}

export default async function ServiceCenterPage({ searchParams }: Props) {
  const session = await auth()
  if (!session) redirect('/login')

  const { tab = 'browse' } = await searchParams
  const companyId = session.user.companyId

  const [rfqs, providers] = await Promise.all([
    tab !== 'browse' ? getContractorRfqs(companyId) : Promise.resolve([]),
    tab === 'browse' ? getServiceProviders() : Promise.resolve([]),
  ])

  const openRfqs = rfqs.filter((r) => ['OPEN', 'REVIEWING_BIDS'].includes(r.status))
  const jobCards = rfqs.filter((r) => r.jobCard)

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-semibold text-ink-900">Service Centre</h1>
          <p className="text-sm text-ink-500">Find verified service providers and manage your project RFQs.</p>
        </div>
        {tab !== 'browse' && (
          <Link
            href="/contractor/service-center/rfq/new"
            className="flex items-center gap-1.5 h-8 px-3 rounded-md bg-ink-900 text-white text-xs font-medium hover:bg-ink-800 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={2} />
            Post RFQ
          </Link>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-ink-200">
        {[
          { key: 'browse', label: 'Browse Providers' },
          { key: 'rfqs', label: `My RFQs${openRfqs.length > 0 ? ` (${openRfqs.length})` : ''}` },
          { key: 'jobs', label: `Job Cards${jobCards.length > 0 ? ` (${jobCards.length})` : ''}` },
        ].map((t) => (
          <Link
            key={t.key}
            href={`/contractor/service-center?tab=${t.key}`}
            className={cn(
              'px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
              tab === t.key ? 'border-ink-900 text-ink-900' : 'border-transparent text-ink-500 hover:text-ink-700'
            )}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {/* Browse providers */}
      {tab === 'browse' && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {providers.map((sp) => (
            <SpCard
              key={sp.companyId}
              companyId={sp.companyId}
              name={sp.company.name}
              headline={sp.headline}
              categories={sp.categories}
              serviceAreas={sp.serviceAreas}
              rating={sp.rating}
              ratingCount={sp.ratingCount}
              postRfqHref={`/contractor/service-center/rfq/new?provider=${sp.companyId}`}
            />
          ))}
          {providers.length === 0 && (
            <p className="text-sm text-ink-500 col-span-2 py-8 text-center">No service providers registered yet.</p>
          )}
        </div>
      )}

      {/* My RFQs */}
      {tab === 'rfqs' && (
        <div className="space-y-3">
          {openRfqs.length === 0 && (
            <div className="flex flex-col items-center py-12 text-center">
              <p className="text-sm font-medium text-ink-900">No open RFQs</p>
              <p className="text-xs text-ink-500 mt-1">Post an RFQ to find a service provider for a milestone.</p>
            </div>
          )}
          {rfqs.map((rfq) => (
            <Link
              key={rfq.id}
              href={`/contractor/service-center/rfq/${rfq.id}`}
              className="flex items-start gap-4 rounded-lg border border-ink-200 bg-white px-5 py-4 hover:border-ink-300 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-ink-900 truncate">{rfq.title}</p>
                <p className="text-xs text-ink-500">{rfq.project.name}{rfq.milestone ? ` · ${rfq.milestone.name}` : ''}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-xs text-ink-400">{rfq.bids.length} bid{rfq.bids.length !== 1 ? 's' : ''}</span>
                <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded-sm', STATUS_CLASS[rfq.status] ?? 'bg-ink-100 text-ink-600')}>
                  {rfq.status.replace('_', ' ')}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Job Cards */}
      {tab === 'jobs' && (
        <div className="space-y-3">
          {jobCards.length === 0 && (
            <div className="flex flex-col items-center py-12 text-center">
              <p className="text-sm font-medium text-ink-900">No active job cards</p>
              <p className="text-xs text-ink-500 mt-1">Job cards are created when you accept a bid on an RFQ.</p>
            </div>
          )}
          {jobCards.map((rfq) => (
            rfq.jobCard && (
              <Link
                key={rfq.jobCard.id}
                href={`/service-provider/job-cards/${rfq.jobCard.id}`}
                className="flex items-start gap-4 rounded-lg border border-ink-200 bg-white px-5 py-4 hover:border-ink-300 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-ink-900 truncate">{rfq.title}</p>
                  <p className="text-xs text-ink-500">{rfq.project.name}</p>
                </div>
                <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded-sm flex-shrink-0', JC_STATUS_CLASS[rfq.jobCard.status] ?? 'bg-ink-100 text-ink-600')}>
                  {rfq.jobCard.status.replace('_', ' ')}
                </span>
              </Link>
            )
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Create `app/(app)/contractor/service-center/rfq/new/page.tsx`**

```typescript
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { RfqForm } from '@/components/marketplace/rfq-form'

type Props = { searchParams: Promise<{ milestone?: string }> }

export default async function NewRfqPage({ searchParams }: Props) {
  const session = await auth()
  if (!session) redirect('/login')

  const { milestone: milestoneId } = await searchParams
  const companyId = session.user.companyId

  const [projects, milestone] = await Promise.all([
    db.project.findMany({
      where: { contractorCompanyId: companyId, deletedAt: null },
      select: { id: true, name: true },
      orderBy: { createdAt: 'desc' },
    }),
    milestoneId
      ? db.milestone.findFirst({
          where: { id: milestoneId, project: { contractorCompanyId: companyId } },
          select: { id: true, name: true, projectId: true },
        })
      : Promise.resolve(null),
  ])

  const defaultProjectId = milestone?.projectId ?? projects[0]?.id ?? ''

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-base font-semibold text-ink-900">Post RFQ</h2>
        <p className="text-sm text-ink-500">Invite verified service providers to bid on this work.</p>
      </div>

      {projects.length === 0 && (
        <p className="text-sm text-danger-600">No projects found. Create a project before posting an RFQ.</p>
      )}

      {projects.length > 0 && (
        <RfqForm
          projectId={defaultProjectId}
          milestoneId={milestone?.id}
          milestoneName={milestone?.name}
        />
      )}
    </div>
  )
}
```

- [ ] **Step 5: Create `app/(app)/contractor/service-center/rfq/[id]/page.tsx`**

```typescript
import { notFound } from 'next/navigation'
import { getRfqDetail } from '@/server/queries/marketplace'
import { acceptBid } from '@/server/actions/marketplace'
import { cn } from '@/lib/utils'
import { Star } from 'lucide-react'
import Link from 'next/link'

const CATEGORY_LABELS: Record<string, string> = {
  STRUCTURAL_CIVILS: 'Structural & Civils', ENGINEERING: 'Engineering',
  LEGAL: 'Legal', LOGISTICS_PLANT_HIRE: 'Logistics & Plant Hire', FINANCE_INSURANCE: 'Finance & Insurance',
}

type Props = { params: Promise<{ id: string }> }

export default async function RfqDetailPage({ params }: Props) {
  const { id } = await params
  const rfq = await getRfqDetail(id)
  if (!rfq) notFound()

  const isAwarded = rfq.status === 'AWARDED'

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-2 text-xs text-ink-400">
        <Link href="/contractor/service-center?tab=rfqs" className="hover:text-ink-700">Service Centre</Link>
        <span>/</span>
        <span className="text-ink-600">{rfq.title}</span>
      </div>

      <div className="rounded-md bg-ink-25 border border-ink-200 px-5 py-4 space-y-1">
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-base font-semibold text-ink-900">{rfq.title}</h2>
          <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded-sm flex-shrink-0',
            isAwarded ? 'bg-success-500/10 text-success-600' : 'bg-ink-100 text-ink-600'
          )}>
            {rfq.status.replace('_', ' ')}
          </span>
        </div>
        <p className="text-xs text-ink-500">{rfq.project.name}{rfq.milestone ? ` · ${rfq.milestone.name}` : ''} · {CATEGORY_LABELS[rfq.category] ?? rfq.category}</p>
        <p className="text-sm text-ink-700 mt-2">{rfq.description}</p>
        <div className="pt-2 space-y-1">
          <p className="text-xs font-semibold text-ink-700">Scope of work</p>
          <p className="text-xs text-ink-600 whitespace-pre-line">{rfq.scopeOfWork}</p>
        </div>
        {rfq.budgetCentsMax && (
          <p className="text-xs text-ink-500 pt-1">Budget max: <span className="font-medium text-ink-700">R {(rfq.budgetCentsMax / 100).toLocaleString('en-ZA')}</span></p>
        )}
      </div>

      {/* Bids */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-ink-400">
          Bids ({rfq.bids.length})
        </h3>

        {rfq.bids.length === 0 && (
          <p className="text-sm text-ink-500 py-4">No bids yet. Service providers will be notified when you post an RFQ.</p>
        )}

        {rfq.bids.map((bid) => (
          <div
            key={bid.id}
            className={cn(
              'rounded-lg border p-4 space-y-3',
              bid.status === 'ACCEPTED' ? 'border-success-500/30 bg-success-50/20' : 'border-ink-200 bg-white'
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-ink-900">{bid.providerCompany.name}</p>
                  {bid.status === 'ACCEPTED' && (
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-sm bg-success-500/10 text-success-600">Accepted</span>
                  )}
                  {bid.status === 'REJECTED' && (
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-sm bg-ink-100 text-ink-400">Rejected</span>
                  )}
                </div>
                {bid.providerCompany.serviceProviderProfile && (
                  <div className="flex items-center gap-1 mt-0.5">
                    <Star className="h-3 w-3 text-amber-400 fill-amber-400" strokeWidth={1.5} />
                    <span className="text-xs text-ink-600">{bid.providerCompany.serviceProviderProfile.rating?.toFixed(1)}</span>
                    <span className="text-xs text-ink-400">({bid.providerCompany.serviceProviderProfile.ratingCount} reviews)</span>
                  </div>
                )}
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-sm font-semibold text-ink-900">R {(bid.amountCents / 100).toLocaleString('en-ZA')}</p>
                <p className="text-xs text-ink-400">{bid.estimatedDays} days</p>
              </div>
            </div>

            <p className="text-sm text-ink-600">{bid.proposalText}</p>

            {!isAwarded && bid.status === 'SUBMITTED' && (
              <form action={acceptBid}>
                <input type="hidden" name="bidId" value={bid.id} />
                <button
                  type="submit"
                  className="h-7 px-3 rounded-md bg-ink-900 text-white text-xs font-medium hover:bg-ink-800 transition-colors"
                >
                  Accept bid — create job card
                </button>
              </form>
            )}
          </div>
        ))}

        {isAwarded && rfq.jobCard && (
          <div className="rounded-md border border-success-500/20 bg-success-50/20 px-4 py-3">
            <p className="text-sm font-medium text-ink-900">Job card created</p>
            <p className="text-xs text-ink-500 mt-0.5">The service provider has been notified and work has begun.</p>
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 6: Fix the "Get service" link in milestone detail page**

In `app/(app)/contractor/projects/[id]/milestones/[milestoneId]/page.tsx`, update the href from `/contractor/marketplace?milestone=${milestoneId}` to `/contractor/service-center/rfq/new?milestone=${milestoneId}`:

```typescript
// Find:
href={`/contractor/marketplace?milestone=${milestoneId}`}
// Replace with:
href={`/contractor/service-center/rfq/new?milestone=${milestoneId}`}
```

- [ ] **Step 7: Typecheck**

```bash
npm run typecheck
```

- [ ] **Step 8: Commit**

```bash
git add "components/marketplace/" "app/(app)/contractor/service-center/" "app/(app)/contractor/projects/[id]/milestones/[milestoneId]/page.tsx"
git commit -m "feat(m7): service center — SP directory, RFQ form, bid acceptance"
```

---

## Task 6: Service Provider Role — Dashboard + Opportunities

**Files:**
- Replace: `app/(app)/service-provider/page.tsx`
- Create: `app/(app)/service-provider/opportunities/page.tsx`
- Create: `app/(app)/service-provider/opportunities/[rfqId]/page.tsx`
- Create: `components/marketplace/bid-form.tsx`
- Modify: `components/shell/sidebar.tsx` — update SERVICE_PROVIDER_NAV

- [ ] **Step 1: Update SERVICE_PROVIDER_NAV in sidebar.tsx**

Replace the `SERVICE_PROVIDER_NAV` constant:

```typescript
import { /* existing icons */, Briefcase, User } from 'lucide-react'
// Add Briefcase and User to the lucide import list

export const SERVICE_PROVIDER_NAV: NavItem[] = [
  { label: 'Dashboard', href: '/service-provider', icon: LayoutDashboard },
  { label: 'Opportunities', href: '/service-provider/opportunities', icon: FolderOpen },
  { label: 'Job Cards', href: '/service-provider/job-cards', icon: Briefcase },
  { label: 'Profile', href: '/service-provider/profile', icon: User },
]
```

- [ ] **Step 2: Replace `app/(app)/service-provider/page.tsx`**

```typescript
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getSpStats, getOpenRfqsForSp, getSpProfile } from '@/server/queries/marketplace'
import Link from 'next/link'
import { Briefcase, DollarSign, TrendingUp, Star } from 'lucide-react'

export default async function ServiceProviderDashboardPage() {
  const session = await auth()
  if (!session) redirect('/login')
  const companyId = session.user.companyId

  const [stats, profile] = await Promise.all([
    getSpStats(companyId),
    getSpProfile(companyId),
  ])

  const opportunities = profile
    ? await getOpenRfqsForSp(profile.categories as string[])
    : []

  const statCards = [
    { label: 'Active jobs', value: stats.activeJobs, icon: Briefcase },
    { label: 'Revenue earned', value: `R ${(stats.revenueEarnedCents / 100).toLocaleString('en-ZA')}`, icon: DollarSign },
    { label: 'Completed jobs', value: stats.completedJobs, icon: TrendingUp },
    { label: 'Total bids', value: stats.totalBids, icon: Star },
  ]

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink-900">Dashboard</h1>
        {profile && <p className="text-sm text-ink-500 mt-1">{profile.headline}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon
          return (
            <div key={card.label} className="rounded-lg border border-ink-200 bg-white px-4 py-5">
              <div className="flex items-center gap-2 mb-2">
                <Icon className="h-4 w-4 text-ink-400" strokeWidth={1.5} />
                <span className="text-xs text-ink-500">{card.label}</span>
              </div>
              <p className="text-2xl font-semibold text-ink-900 tabular-nums">{card.value}</p>
            </div>
          )
        })}
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-ink-900">New opportunities matching your profile</h2>
          <Link href="/service-provider/opportunities" className="text-xs text-accent-600 hover:underline">View all</Link>
        </div>
        {opportunities.length === 0 && (
          <p className="text-sm text-ink-500 py-6 text-center">No open opportunities matching your categories right now.</p>
        )}
        <div className="space-y-3">
          {opportunities.slice(0, 3).map((rfq) => (
            <Link
              key={rfq.id}
              href={`/service-provider/opportunities/${rfq.id}`}
              className="flex items-start gap-4 rounded-lg border border-ink-200 bg-white px-5 py-4 hover:border-ink-300 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-ink-900 truncate">{rfq.title}</p>
                <p className="text-xs text-ink-500 truncate">{rfq.project.name} · {rfq.project.systemSizeKw} kW</p>
              </div>
              {rfq.budgetCentsMax && (
                <p className="text-xs font-medium text-ink-700 flex-shrink-0">Up to R {(rfq.budgetCentsMax / 100).toLocaleString('en-ZA')}</p>
              )}
              <span className="text-xs text-ink-400 flex-shrink-0">{rfq.bids.length} bid{rfq.bids.length !== 1 ? 's' : ''}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Create `app/(app)/service-provider/opportunities/page.tsx`**

```typescript
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getOpenRfqsForSp, getSpProfile } from '@/server/queries/marketplace'
import Link from 'next/link'

const CATEGORY_LABELS: Record<string, string> = {
  STRUCTURAL_CIVILS: 'Structural & Civils', ENGINEERING: 'Engineering',
  LEGAL: 'Legal', LOGISTICS_PLANT_HIRE: 'Logistics & Plant Hire', FINANCE_INSURANCE: 'Finance & Insurance',
}

export default async function OpportunitiesPage() {
  const session = await auth()
  if (!session) redirect('/login')

  const profile = await getSpProfile(session.user.companyId)
  const rfqs = profile ? await getOpenRfqsForSp(profile.categories as string[]) : []

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-base font-semibold text-ink-900">Opportunity Board</h2>
        <p className="text-sm text-ink-500">Open RFQs matching your service categories.</p>
      </div>

      {rfqs.length === 0 && (
        <div className="flex flex-col items-center py-16 text-center">
          <p className="text-sm font-medium text-ink-900">No opportunities right now</p>
          <p className="text-xs text-ink-500 mt-1">New RFQs matching your categories will appear here.</p>
        </div>
      )}

      <div className="space-y-3">
        {rfqs.map((rfq) => (
          <Link
            key={rfq.id}
            href={`/service-provider/opportunities/${rfq.id}`}
            className="flex items-start gap-4 rounded-lg border border-ink-200 bg-white px-5 py-4 hover:border-ink-300 transition-colors"
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-ink-900">{rfq.title}</p>
              <p className="text-xs text-ink-500 mt-0.5">
                {rfq.project.name} · {rfq.project.systemSizeKw} kW · {CATEGORY_LABELS[rfq.category] ?? rfq.category}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1 flex-shrink-0">
              {rfq.budgetCentsMax && (
                <p className="text-xs font-medium text-ink-700">Up to R {(rfq.budgetCentsMax / 100).toLocaleString('en-ZA')}</p>
              )}
              <p className="text-xs text-ink-400">{rfq.bids.length} bid{rfq.bids.length !== 1 ? 's' : ''}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Create `components/marketplace/bid-form.tsx`**

```typescript
'use client'
// components/marketplace/bid-form.tsx

import { useState, useTransition } from 'react'
import { Loader2 } from 'lucide-react'
import { submitBid } from '@/server/actions/marketplace'

type Props = {
  rfqId: string
  companyId: string
  onSuccess: () => void
}

export function BidForm({ rfqId, companyId, onSuccess }: Props) {
  const [isPending, startTransition] = useTransition()
  const [amount, setAmount] = useState('')
  const [proposalText, setProposalText] = useState('')
  const [estimatedDays, setEstimatedDays] = useState('')
  const [error, setError] = useState<string | null>(null)

  function handleSubmit() {
    setError(null)
    if (!amount || !proposalText.trim() || !estimatedDays) {
      setError('All fields are required.')
      return
    }
    startTransition(async () => {
      try {
        await submitBid({
          rfqId,
          companyId,
          amountCents: Number(amount),
          proposalText,
          estimatedDays: Number(estimatedDays),
        })
        onSuccess()
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to submit bid.')
      }
    })
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-xs font-medium text-ink-700">Bid amount (ZAR)</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="72000"
            className="w-full h-9 rounded-md border border-ink-200 px-3 text-sm placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-accent-500/20"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-ink-700">Estimated days</label>
          <input
            type="number"
            value={estimatedDays}
            onChange={(e) => setEstimatedDays(e.target.value)}
            placeholder="18"
            className="w-full h-9 rounded-md border border-ink-200 px-3 text-sm placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-accent-500/20"
          />
        </div>
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium text-ink-700">Proposal</label>
        <textarea
          value={proposalText}
          onChange={(e) => setProposalText(e.target.value)}
          rows={4}
          placeholder="Describe your approach, relevant experience, and why you're the right fit…"
          className="w-full rounded-md border border-ink-200 px-3 py-2 text-sm placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-accent-500/20 resize-none"
        />
      </div>
      {error && <p className="text-sm text-danger-600">{error}</p>}
      <button
        onClick={handleSubmit}
        disabled={isPending}
        className="flex items-center justify-center gap-1.5 h-9 px-4 rounded-md bg-ink-900 text-white text-sm font-medium hover:bg-ink-800 transition-colors disabled:opacity-50"
      >
        {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
        Submit bid
      </button>
    </div>
  )
}
```

- [ ] **Step 5: Create `app/(app)/service-provider/opportunities/[rfqId]/page.tsx`**

```typescript
import { notFound } from 'next/navigation'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getRfqDetail } from '@/server/queries/marketplace'
import { BidForm } from '@/components/marketplace/bid-form'
import Link from 'next/link'

type Props = { params: Promise<{ rfqId: string }> }

export default async function OpportunityDetailPage({ params }: Props) {
  const session = await auth()
  if (!session) redirect('/login')

  const { rfqId } = await params
  const rfq = await getRfqDetail(rfqId)
  if (!rfq || rfq.status !== 'OPEN') notFound()

  const companyId = session.user.companyId
  const alreadyBid = rfq.bids.some((b) => b.providerCompany.id === companyId)

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-2 text-xs text-ink-400">
        <Link href="/service-provider/opportunities" className="hover:text-ink-700">Opportunities</Link>
        <span>/</span>
        <span className="text-ink-600 truncate">{rfq.title}</span>
      </div>

      <div className="rounded-md bg-ink-25 border border-ink-200 px-5 py-4 space-y-2">
        <h2 className="text-base font-semibold text-ink-900">{rfq.title}</h2>
        <p className="text-xs text-ink-500">
          {rfq.project.name} · {rfq.project.contractorCompany.name} · {rfq.bids.length} bid{rfq.bids.length !== 1 ? 's' : ''}
        </p>
        <p className="text-sm text-ink-700">{rfq.description}</p>
        <div className="pt-2">
          <p className="text-xs font-semibold text-ink-700 mb-1">Scope of work</p>
          <p className="text-xs text-ink-600 whitespace-pre-line">{rfq.scopeOfWork}</p>
        </div>
        {rfq.budgetCentsMax && (
          <p className="text-xs text-ink-500">Budget: up to <span className="font-medium text-ink-700">R {(rfq.budgetCentsMax / 100).toLocaleString('en-ZA')}</span></p>
        )}
      </div>

      {alreadyBid ? (
        <div className="rounded-md bg-success-50/30 border border-success-500/20 px-4 py-3">
          <p className="text-sm font-medium text-success-700">Your bid has been submitted.</p>
          <p className="text-xs text-ink-500 mt-0.5">You will be notified when the contractor makes a decision.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-ink-900">Submit your bid</h3>
          <BidForm rfqId={rfqId} companyId={companyId} onSuccess={() => {}} />
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 6: Typecheck**

```bash
npm run typecheck
```

- [ ] **Step 7: Commit**

```bash
git add components/shell/sidebar.tsx "app/(app)/service-provider/page.tsx" "app/(app)/service-provider/opportunities/" "components/marketplace/bid-form.tsx"
git commit -m "feat(m7): SP dashboard, opportunity board, bid submission"
```

---

## Task 7: SP Job Cards

**Files:**
- Create: `app/(app)/service-provider/job-cards/page.tsx`
- Create: `app/(app)/service-provider/job-cards/[id]/page.tsx`
- Create: `components/marketplace/job-card-kanban.tsx`

- [ ] **Step 1: Create `components/marketplace/job-card-kanban.tsx`**

```typescript
'use client'
// components/marketplace/job-card-kanban.tsx

import Link from 'next/link'
import { cn } from '@/lib/utils'

type JobCardItem = {
  id: string
  title: string
  project: string
  amountCents: number
  status: 'ACTIVE' | 'PENDING_REVIEW' | 'COMPLETED' | 'DISPUTED' | 'CANCELLED'
  createdAt: string
}

type Props = { jobCards: JobCardItem[] }

const COLUMNS: { status: JobCardItem['status']; label: string }[] = [
  { status: 'ACTIVE', label: 'Active' },
  { status: 'PENDING_REVIEW', label: 'Pending Review' },
  { status: 'COMPLETED', label: 'Completed' },
]

const COLUMN_COLOURS: Record<string, string> = {
  ACTIVE: 'border-accent-200 bg-accent-500/5',
  PENDING_REVIEW: 'border-warning-200 bg-warning-50/30',
  COMPLETED: 'border-success-500/20 bg-success-50/20',
}

export function JobCardKanban({ jobCards }: Props) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      {COLUMNS.map((col) => {
        const cards = jobCards.filter((jc) => jc.status === col.status)
        return (
          <div key={col.status} className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-widest text-ink-500">{col.label}</p>
              <span className="text-xs text-ink-400 tabular-nums">{cards.length}</span>
            </div>
            {cards.length === 0 && (
              <div className={cn('rounded-lg border-2 border-dashed p-6 text-center', col.status === 'ACTIVE' ? 'border-accent-200' : 'border-ink-200')}>
                <p className="text-xs text-ink-400">No {col.label.toLowerCase()} jobs</p>
              </div>
            )}
            {cards.map((card) => (
              <Link
                key={card.id}
                href={`/service-provider/job-cards/${card.id}`}
                className={cn(
                  'block rounded-lg border p-4 space-y-2 hover:shadow-sm transition-shadow',
                  COLUMN_COLOURS[card.status] ?? 'border-ink-200 bg-white'
                )}
              >
                <p className="text-sm font-semibold text-ink-900 leading-tight">{card.title}</p>
                <p className="text-xs text-ink-500">{card.project}</p>
                <p className="text-sm font-semibold text-ink-900">
                  R {(card.amountCents / 100).toLocaleString('en-ZA')}
                </p>
              </Link>
            ))}
          </div>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 2: Create `app/(app)/service-provider/job-cards/page.tsx`**

```typescript
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getSpJobCards } from '@/server/queries/marketplace'
import { JobCardKanban } from '@/components/marketplace/job-card-kanban'

export default async function SpJobCardsPage() {
  const session = await auth()
  if (!session) redirect('/login')

  const jobCards = await getSpJobCards(session.user.companyId)

  const kanbanItems = jobCards.map((jc) => ({
    id: jc.id,
    title: jc.rfq.title,
    project: jc.rfq.project.name,
    amountCents: jc.amountCents,
    status: jc.status,
    createdAt: jc.createdAt.toISOString(),
  }))

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h2 className="text-base font-semibold text-ink-900">Job Cards</h2>
        <p className="text-sm text-ink-500">{jobCards.length} total job{jobCards.length !== 1 ? 's' : ''}.</p>
      </div>

      {jobCards.length === 0 && (
        <div className="flex flex-col items-center py-16 text-center">
          <p className="text-sm font-medium text-ink-900">No job cards yet</p>
          <p className="text-xs text-ink-500 mt-1">Win a bid on the Opportunity Board to create your first job card.</p>
        </div>
      )}

      {jobCards.length > 0 && <JobCardKanban jobCards={kanbanItems} />}
    </div>
  )
}
```

- [ ] **Step 3: Create `app/(app)/service-provider/job-cards/[id]/page.tsx`**

```typescript
import { notFound } from 'next/navigation'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getJobCardDetail } from '@/server/queries/marketplace'
import { submitDeliverable } from '@/server/actions/marketplace'
import { JobCardChat } from '@/components/marketplace/job-card-chat'
import { JobCardDeliverables } from '@/components/marketplace/job-card-deliverables'
import Link from 'next/link'
import { cn } from '@/lib/utils'

type Props = { params: Promise<{ id: string }> }

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: 'Active', PENDING_REVIEW: 'Pending Review', COMPLETED: 'Completed', DISPUTED: 'Disputed',
}

export default async function JobCardDetailPage({ params }: Props) {
  const session = await auth()
  if (!session) redirect('/login')

  const { id } = await params
  const jobCard = await getJobCardDetail(id)
  if (!jobCard) notFound()

  const isActive = jobCard.status === 'ACTIVE'
  const userId = session.user.id

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-2 text-xs text-ink-400">
        <Link href="/service-provider/job-cards" className="hover:text-ink-700">Job Cards</Link>
        <span>/</span>
        <span className="text-ink-600 truncate">{jobCard.rfq.title}</span>
      </div>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-ink-900">{jobCard.rfq.title}</h2>
          <p className="text-xs text-ink-500 mt-0.5">{jobCard.rfq.project.name} · {jobCard.rfq.project.contractorCompany.name}</p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-sm font-semibold text-ink-900">R {(jobCard.amountCents / 100).toLocaleString('en-ZA')}</p>
          <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded-sm',
            jobCard.status === 'ACTIVE' ? 'bg-accent-500/10 text-accent-600' :
            jobCard.status === 'PENDING_REVIEW' ? 'bg-warning-50 text-warning-700' :
            'bg-success-500/10 text-success-600'
          )}>
            {STATUS_LABEL[jobCard.status] ?? jobCard.status}
          </span>
        </div>
      </div>

      <div className="rounded-md bg-ink-25 border border-ink-200 px-4 py-3 space-y-1">
        <p className="text-xs font-semibold text-ink-700">Scope of work</p>
        <p className="text-xs text-ink-600 whitespace-pre-line">{jobCard.scopeOfWork}</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Deliverables */}
        <div className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-ink-400">Deliverables</h3>
          <JobCardDeliverables
            jobCardId={id}
            deliverables={jobCard.deliverables.map((d) => ({
              id: d.id, name: d.name, url: d.url, version: d.version,
              createdAt: d.createdAt.toISOString(),
            }))}
            canUpload={isActive}
          />
          {isActive && jobCard.deliverables.length > 0 && (
            <form action={submitDeliverable}>
              <input type="hidden" name="jobCardId" value={id} />
              <button
                type="submit"
                className="h-8 px-3 rounded-md bg-ink-900 text-white text-xs font-medium hover:bg-ink-800 transition-colors"
              >
                Submit for review
              </button>
            </form>
          )}
        </div>

        {/* Chat */}
        <div className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-ink-400">Messages</h3>
          <JobCardChat
            jobCardId={id}
            userId={userId}
            initialMessages={jobCard.messages.map((m) => ({
              id: m.id, senderUserId: m.senderUserId, body: m.body,
              createdAt: m.createdAt.toISOString(),
            }))}
          />
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Create `components/marketplace/job-card-deliverables.tsx`**

```typescript
'use client'
// components/marketplace/job-card-deliverables.tsx

import { useState, useTransition } from 'react'
import { addDeliverable } from '@/server/actions/marketplace'
import { ExternalLink, Upload, Loader2 } from 'lucide-react'

type Deliverable = { id: string; name: string; url: string; version: number; createdAt: string }
type Props = { jobCardId: string; deliverables: Deliverable[]; canUpload: boolean }

export function JobCardDeliverables({ jobCardId, deliverables, canUpload }: Props) {
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [localDeliverables, setLocalDeliverables] = useState(deliverables)

  function handleUpload() {
    setError(null)
    if (!name.trim() || !url.trim()) { setError('Name and URL are required.'); return }
    startTransition(async () => {
      try {
        await addDeliverable({ jobCardId, name, url })
        setLocalDeliverables((prev) => [...prev, { id: Date.now().toString(), name, url, version: prev.length + 1, createdAt: new Date().toISOString() }])
        setName('')
        setUrl('')
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Upload failed.')
      }
    })
  }

  return (
    <div className="space-y-3">
      {localDeliverables.map((d) => (
        <a key={d.id} href={d.url} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-2 text-sm text-accent-600 hover:underline"
        >
          <ExternalLink className="h-3.5 w-3.5 flex-shrink-0" strokeWidth={1.5} />
          {d.name} <span className="text-xs text-ink-400">v{d.version}</span>
        </a>
      ))}
      {localDeliverables.length === 0 && (
        <p className="text-xs text-ink-400">No deliverables uploaded yet.</p>
      )}

      {canUpload && (
        <div className="space-y-2 pt-2 border-t border-ink-100">
          <p className="text-xs font-medium text-ink-700">Upload deliverable</p>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Document name"
            className="w-full h-8 rounded-md border border-ink-200 px-3 text-sm placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-accent-500/20"
          />
          <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="File URL (paste from Blob upload)"
            className="w-full h-8 rounded-md border border-ink-200 px-3 text-sm placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-accent-500/20"
          />
          {error && <p className="text-xs text-danger-600">{error}</p>}
          <button onClick={handleUpload} disabled={isPending}
            className="flex items-center gap-1.5 h-7 px-3 rounded-md border border-ink-200 text-ink-600 text-xs hover:bg-ink-50 transition-colors disabled:opacity-50"
          >
            {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" strokeWidth={1.5} />}
            Add file
          </button>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 5: Create `components/marketplace/job-card-chat.tsx`**

```typescript
'use client'
// components/marketplace/job-card-chat.tsx

import { useState, useTransition } from 'react'
import { addJobMessage } from '@/server/actions/marketplace'
import { Send } from 'lucide-react'

type Message = { id: string; senderUserId: string; body: string; createdAt: string }
type Props = { jobCardId: string; userId: string; initialMessages: Message[] }

export function JobCardChat({ jobCardId, userId, initialMessages }: Props) {
  const [messages, setMessages] = useState(initialMessages)
  const [body, setBody] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleSend() {
    if (!body.trim()) return
    startTransition(async () => {
      await addJobMessage({ jobCardId, senderUserId: userId, body })
      setMessages((prev) => [...prev, { id: Date.now().toString(), senderUserId: userId, body, createdAt: new Date().toISOString() }])
      setBody('')
    })
  }

  return (
    <div className="rounded-lg border border-ink-200 bg-white flex flex-col" style={{ minHeight: 280 }}>
      <div className="flex-1 overflow-y-auto p-3 space-y-3 max-h-64">
        {messages.length === 0 && (
          <p className="text-xs text-ink-400 text-center py-4">No messages yet.</p>
        )}
        {messages.map((m) => {
          const isMine = m.senderUserId === userId
          return (
            <div key={m.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
              <div className={`rounded-lg px-3 py-2 max-w-[80%] text-sm ${isMine ? 'bg-ink-900 text-white' : 'bg-ink-100 text-ink-900'}`}>
                {m.body}
              </div>
            </div>
          )
        })}
      </div>
      <div className="border-t border-ink-100 p-2 flex gap-2">
        <input
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
          placeholder="Type a message…"
          className="flex-1 h-8 rounded-md border border-ink-200 px-3 text-sm placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-accent-500/20"
        />
        <button onClick={handleSend} disabled={isPending || !body.trim()}
          className="h-8 w-8 rounded-md bg-ink-900 text-white flex items-center justify-center hover:bg-ink-800 transition-colors disabled:opacity-50"
        >
          <Send className="h-3.5 w-3.5" strokeWidth={1.5} />
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 6: Typecheck**

```bash
npm run typecheck
```

- [ ] **Step 7: Commit**

```bash
git add "components/marketplace/job-card-kanban.tsx" "components/marketplace/job-card-deliverables.tsx" "components/marketplace/job-card-chat.tsx" "app/(app)/service-provider/job-cards/"
git commit -m "feat(m7): SP job cards — Kanban, detail, deliverables, chat"
```

---

## Task 8: SP Profile + Final Checks

**Files:**
- Create: `app/(app)/service-provider/profile/page.tsx`

- [ ] **Step 1: Create `app/(app)/service-provider/profile/page.tsx`**

```typescript
'use client'

import { useState, useTransition, useEffect } from 'react'
import { updateSpProfile } from '@/server/actions/marketplace'
import { Loader2 } from 'lucide-react'

const ALL_CATEGORIES = [
  { value: 'STRUCTURAL_CIVILS', label: 'Structural & Civils' },
  { value: 'ENGINEERING', label: 'Engineering' },
  { value: 'LEGAL', label: 'Legal' },
  { value: 'LOGISTICS_PLANT_HIRE', label: 'Logistics & Plant Hire' },
  { value: 'FINANCE_INSURANCE', label: 'Finance & Insurance' },
]
const SA_PROVINCES = ['Western Cape', 'Gauteng', 'Eastern Cape', 'KwaZulu-Natal', 'Northern Cape', 'Limpopo', 'Mpumalanga', 'North West', 'Free State']

export default function SpProfilePage() {
  const [isPending, startTransition] = useTransition()
  const [headline, setHeadline] = useState('')
  const [description, setDescription] = useState('')
  const [categories, setCategories] = useState<string[]>([])
  const [serviceAreas, setServiceAreas] = useState<string[]>([])
  const [hourlyRate, setHourlyRate] = useState('')
  const [saved, setSaved] = useState(false)
  const [companyId, setCompanyId] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Load existing profile via API
    fetch('/api/sp/profile')
      .then((r) => r.json())
      .then((data: { profile: { companyId: string; headline: string; description: string; categories: string[]; serviceAreas: string[]; hourlyRateCents: number | null } | null; companyId: string }) => {
        setCompanyId(data.companyId)
        if (data.profile) {
          setHeadline(data.profile.headline)
          setDescription(data.profile.description)
          setCategories(data.profile.categories)
          setServiceAreas(data.profile.serviceAreas)
          setHourlyRate(data.profile.hourlyRateCents ? String(data.profile.hourlyRateCents / 100) : '')
        }
      })
      .catch(() => {})
  }, [])

  function toggleCategory(cat: string) {
    setCategories((prev) => prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat])
  }

  function toggleArea(area: string) {
    setServiceAreas((prev) => prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area])
  }

  function handleSave() {
    setError(null)
    if (!headline.trim() || !description.trim() || categories.length === 0) {
      setError('Headline, description, and at least one category are required.')
      return
    }
    startTransition(async () => {
      try {
        await updateSpProfile({
          companyId,
          headline,
          description,
          categories,
          serviceAreas,
          hourlyRateCents: hourlyRate ? Number(hourlyRate) : undefined,
        })
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to save profile.')
      }
    })
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-base font-semibold text-ink-900">Profile</h2>
        <p className="text-sm text-ink-500">How contractors see you on the platform.</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-1">
          <label className="text-xs font-medium text-ink-700">Headline</label>
          <input value={headline} onChange={(e) => setHeadline(e.target.value)}
            placeholder="e.g., Structural & Civil Engineering for Solar PV"
            className="w-full h-9 rounded-md border border-ink-200 px-3 text-sm placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-accent-500/20"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-ink-700">Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4}
            placeholder="Describe your firm, experience, registrations, and specialisations…"
            className="w-full rounded-md border border-ink-200 px-3 py-2 text-sm placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-accent-500/20 resize-none"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-ink-700">Hourly rate (ZAR)</label>
          <input type="number" value={hourlyRate} onChange={(e) => setHourlyRate(e.target.value)}
            placeholder="1500"
            className="w-full h-9 rounded-md border border-ink-200 px-3 text-sm placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-accent-500/20"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium text-ink-700">Service categories</label>
          <div className="flex flex-wrap gap-2">
            {ALL_CATEGORIES.map((cat) => (
              <button key={cat.value} onClick={() => toggleCategory(cat.value)}
                className={`h-7 px-3 rounded-full text-xs font-medium border transition-colors ${categories.includes(cat.value) ? 'bg-ink-900 text-white border-ink-900' : 'bg-white text-ink-600 border-ink-200 hover:border-ink-400'}`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium text-ink-700">Service areas</label>
          <div className="flex flex-wrap gap-2">
            {SA_PROVINCES.map((area) => (
              <button key={area} onClick={() => toggleArea(area)}
                className={`h-7 px-3 rounded-full text-xs font-medium border transition-colors ${serviceAreas.includes(area) ? 'bg-ink-900 text-white border-ink-900' : 'bg-white text-ink-600 border-ink-200 hover:border-ink-400'}`}
              >
                {area}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && <p className="text-sm text-danger-600">{error}</p>}

      <button onClick={handleSave} disabled={isPending}
        className="flex items-center justify-center gap-1.5 h-9 px-4 rounded-md bg-ink-900 text-white text-sm font-medium hover:bg-ink-800 transition-colors disabled:opacity-50"
      >
        {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
        {saved ? 'Saved' : 'Save profile'}
      </button>
    </div>
  )
}
```

- [ ] **Step 2: Create `app/api/sp/profile/route.ts`**

```typescript
// app/api/sp/profile/route.ts

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getSpProfile } from '@/server/queries/marketplace'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const profile = await getSpProfile(session.user.companyId)
  return NextResponse.json({ profile, companyId: session.user.companyId })
}
```

- [ ] **Step 3: Run all unit tests**

```bash
npm run test:unit
```
Expected: 23 tests PASS.

- [ ] **Step 4: Typecheck**

```bash
npm run typecheck
```
Expected: 0 errors.

- [ ] **Step 5: Lint**

```bash
npm run lint
```
Expected: 0 errors.

- [ ] **Step 6: Commit everything**

```bash
git add "app/(app)/service-provider/profile/" app/api/sp/
git commit -m "feat(m7): SP profile editor + API route"
git add .
git commit -m "feat: M7 — Marketplaces complete"
```

---

## Spec Coverage Self-Review

| Requirement | Covered by |
|---|---|
| Service Provider directory with 5 categories | Task 5 (`SpCard`, service center browse tab) |
| "Get Service" bridge from Milestone → RFQ | Tasks 2+5 (link fixed, RFQ pre-fills from milestone) |
| RFQ creation flow | Task 5 (`RfqForm`) |
| SP role: Opportunity Board | Task 6 |
| SP role: Bid submission | Task 6 (`BidForm`) |
| SP role: Job Cards Dashboard (Kanban) | Task 7 (`JobCardKanban`) |
| SP role: Job Card detail + deliverable upload | Task 7 |
| SP role: Chat per job card | Task 7 (`JobCardChat`) |
| SP role: Dashboard with stats | Task 6 |
| SP role: Profile edit | Task 8 |
| Bid acceptance → JobCard creation | Task 2 (`acceptBid` server action) |
| Hardware browse by category | Task 4 |
| Hardware product detail + specs | Task 4 |
| Add to cart | Tasks 3+4 (Zustand store + card component) |
| Seed data for demo-ready state | Task 1 |

**Known deferred to M9:**
- Cart checkout flow (EFT/PayFast payment rails)
- Escrow locking on bid acceptance (schema has it; activation deferred)
- Cashback token calculation on hardware purchase
- SP wallet / revenue tracking
- Cart sidebar/drawer component (cart store exists, visible count in nav deferred)
- Reviews per SP (schema exists; no UI built)
