# M8 — End-Client Role: O&M Monitoring & Plant Dashboards Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the End-Client role (standard plant dashboard with paywall, portfolio, O&M schedule, documents), the Enterprise Operations dashboard for Sipho/Spaza Holdings, and upgrade the Contractor monitoring tab with real Recharts charts using seeded O&M data.

**Architecture:** No schema changes needed — OmReading, OmEvent, OmLicense, Site, ProjectDocument all exist. Seed adds Tess de Wet (standard client), an active OmLicense (AI tier) for Kruger Farm, OmEvents, and ProjectDocuments. Client layout detects Enterprise status (Spaza Holdings company ID) and renders the appropriate nav/dashboard. Recharts renders from 30 days of daily OmReading data. The plant dashboard paywall gates the charts behind an OmLicense; for demo purposes, Kruger Farm is seeded as ACTIVE and Durbanville Mall is paywalled.

**Tech Stack:** Next.js 15 App Router, Recharts (already in package.json), Prisma 7, TypeScript strict, Server Components default, Framer Motion for the license activation animation stub.

---

## File Map

**New files:**
- `server/queries/client.ts` — plant dashboard data, portfolio, O&M events, documents
- `server/actions/client.ts` — createOmEvent
- `app/(app)/client/page.tsx` — routing redirect (Enterprise vs standard vs portfolio vs plant)
- `app/(app)/client/plant/[siteId]/page.tsx` — plant dashboard (paywall or active)
- `app/(app)/client/portfolio/page.tsx` — multi-site overview
- `app/(app)/client/o-and-m/page.tsx` — O&M schedule
- `app/(app)/client/documents/page.tsx` — document repository
- `app/(app)/client/enterprise/page.tsx` — redirect to /operations
- `app/(app)/client/enterprise/operations/page.tsx` — Spaza Operations dashboard
- `app/(app)/client/enterprise/reports/page.tsx` — reports scaffold
- `app/(app)/client/enterprise/integrations/page.tsx` — integrations scaffold
- `app/(app)/client/enterprise/admin/page.tsx` — admin scaffold
- `components/client/plant-charts.tsx` — Recharts components (4 charts + multi-brand selector)
- `components/client/paywall-gate.tsx` — paywall UI
- `components/client/om-event-form.tsx` — create O&M event modal (client)

**Modified files:**
- `prisma/seed.ts` — add Tess user, OmLicense (AI, ACTIVE) for Kruger Farm, OmEvents × 4, ProjectDocuments × 3
- `app/(auth)/login/login-form.tsx` — add Tess to demo user buttons
- `components/shell/sidebar.tsx` — update CLIENT_NAV + add ENTERPRISE_CLIENT_NAV
- `app/(app)/client/layout.tsx` — detect Enterprise, use correct nav + topbar
- `app/(app)/contractor/projects/[id]/monitoring/page.tsx` — real Recharts charts for OPERATIONAL projects

---

## Task 1: Seed Updates

**Files:**
- Modify: `prisma/seed.ts`
- Modify: `app/(auth)/login/login-form.tsx`

- [ ] **Step 1: Add Tess de Wet user, OmLicense for Kruger Farm, OmEvents, ProjectDocuments to `prisma/seed.ts`**

Find the line `console.log('  ✓ Users')` (around line 97) and add Tess before it:

```typescript
  const tess = await db.user.upsert({
    where: { email: 'tess@durbanvillemall.co.za' },
    update: {},
    create: {
      email: 'tess@durbanvillemall.co.za',
      name: 'Tess de Wet',
      emailVerified: new Date(),
      passwordHash,
    },
  })
```

Find the `console.log('  ✓ Memberships')` line and add Tess's membership before it:

```typescript
  await db.membership.upsert({
    where: { userId_companyId: { userId: tess.id, companyId: durbanville.id } },
    update: {},
    create: { userId: tess.id, companyId: durbanville.id, role: 'CLIENT', isOwner: true },
  })
```

After the `console.log('  ✓ RFQs, bids, job card (marketplace demo data)')` line, add:

```typescript
  // -------------------------------------------------------------------------
  // O&M License — Kruger Farm (AI tier, ACTIVE — for contractor monitoring + client demo)
  // -------------------------------------------------------------------------

  await db.omLicense.upsert({
    where: { id: 'license-kruger-ai' },
    update: {},
    create: {
      id: 'license-kruger-ai',
      projectId: projectKruger.id,
      licenseeCompanyId: kruger.id,
      viewerType: 'CLIENT',
      tier: 'AI',
      status: 'ACTIVE',
      monthlyFeeCents: 1_200_00,
      activatedAt: daysAgo(180),
      nextBillingAt: daysFromNow(15),
      resellerCompanyId: adebayo.id,
      commissionRate: 0.20,
    },
  })

  await db.omLicense.upsert({
    where: { id: 'license-kruger-epc' },
    update: {},
    create: {
      id: 'license-kruger-epc',
      projectId: projectKruger.id,
      licenseeCompanyId: adebayo.id,
      viewerType: 'EPC',
      tier: 'AI',
      status: 'ACTIVE',
      monthlyFeeCents: 0,
      activatedAt: daysAgo(180),
      nextBillingAt: daysFromNow(15),
    },
  })

  console.log('  ✓ O&M licenses (Kruger Farm — AI tier, active)')

  // -------------------------------------------------------------------------
  // O&M Events — Kruger Farm (maintenance history)
  // -------------------------------------------------------------------------

  const omEvents = [
    {
      id: 'ome-1', projectId: projectKruger.id, type: 'MAINTENANCE' as const,
      title: 'Quarterly inverter service', description: 'SunSynk inverter firmware update + capacitor check.',
      scheduledAt: daysAgo(45), completedAt: daysAgo(44),
    },
    {
      id: 'ome-2', projectId: projectKruger.id, type: 'CLEANING' as const,
      title: 'Panel cleaning — North array',
      description: 'Dust accumulation identified via performance drop. 48 panels cleaned.',
      scheduledAt: daysAgo(22), completedAt: daysAgo(21),
    },
    {
      id: 'ome-3', projectId: projectKruger.id, type: 'INSPECTION' as const,
      title: 'Semi-annual electrical inspection',
      description: 'Full installation inspection per COC requirements. No defects found.',
      scheduledAt: daysFromNow(14),
    },
    {
      id: 'ome-4', projectId: projectKruger.id, type: 'CLEANING' as const,
      title: 'Panel cleaning — South array',
      scheduledAt: daysFromNow(28),
    },
  ]

  for (const event of omEvents) {
    await db.omEvent.upsert({
      where: { id: event.id },
      update: {},
      create: event,
    })
  }

  console.log('  ✓ O&M events (Kruger Farm)')

  // -------------------------------------------------------------------------
  // Project Documents — Kruger Farm
  // -------------------------------------------------------------------------

  const docs = [
    {
      id: 'doc-kruger-1', projectId: projectKruger.id, uploadedBy: marcus.id,
      category: 'Commissioning Certificate', name: 'Commissioning Certificate — Kruger Farm 120kW.pdf',
      url: 'https://example.com/seed/kruger-commissioning-cert.pdf', fileSize: 1_200_000,
    },
    {
      id: 'doc-kruger-2', projectId: projectKruger.id, uploadedBy: marcus.id,
      category: 'Warranty',
      name: 'SunSynk 8kW Inverter Warranty Registration.pdf',
      url: 'https://example.com/seed/kruger-inverter-warranty.pdf', fileSize: 340_000,
    },
    {
      id: 'doc-kruger-3', projectId: projectKruger.id, uploadedBy: marcus.id,
      category: 'O&M Manual', name: 'Operations & Maintenance Manual — Kruger Hybrid System.pdf',
      url: 'https://example.com/seed/kruger-om-manual.pdf', fileSize: 4_800_000,
    },
  ]

  for (const doc of docs) {
    await db.projectDocument.upsert({
      where: { id: doc.id },
      update: {},
      create: doc,
    })
  }

  console.log('  ✓ Project documents (Kruger Farm)')
```

Also update the summary log at the end (find the line with `Users: 5` and update the count):

```typescript
  console.log(`   Users: 6 | Companies: 6 | Projects: 3 | Milestones: 8 | Hardware: 5 | O&M readings: 30 | News: 5`)
```

- [ ] **Step 2: Add Tess to demo users in `app/(auth)/login/login-form.tsx`**

Find the `DEMO_USERS` array and add Tess after Sipho:

```typescript
const DEMO_USERS = [
  { name: 'Marcus Adebayo', role: 'Contractor — Silver tier', email: 'marcus@adebayorenewables.co.za', destination: '/contractor' },
  { name: 'Lerato Mokoena', role: 'Service Provider', email: 'lerato@mokoenaeng.co.za', destination: '/service-provider' },
  { name: 'Sipho Dlamini', role: 'End-Client — Enterprise', email: 'sipho@spazaholdings.co.za', destination: '/client' },
  { name: 'Tess de Wet', role: 'End-Client — Standard', email: 'tess@durbanvillemall.co.za', destination: '/client' },
  { name: 'Erin Berman-Levy', role: 'Platform Admin', email: 'erin@see.platform', destination: '/admin' },
]
```

- [ ] **Step 3: Run seed**

```bash
npm run db:seed:demo
```
Expected output includes `✓ O&M licenses`, `✓ O&M events`, `✓ Project documents`.

- [ ] **Step 4: Typecheck**

```bash
npm run typecheck
```

- [ ] **Step 5: Commit**

```bash
git add prisma/seed.ts "app/(auth)/login/login-form.tsx"
git commit -m "feat(m8): seed Tess user, OmLicense/events/docs for Kruger Farm demo"
```

---

## Task 2: Server Queries + Actions

**Files:**
- Create: `server/queries/client.ts`
- Create: `server/actions/client.ts`

- [ ] **Step 1: Create `server/queries/client.ts`**

```typescript
// server/queries/client.ts

import { db } from '@/lib/db'

export async function getClientProjects(companyId: string) {
  return db.project.findMany({
    where: { clientCompanyId: companyId, deletedAt: null },
    include: {
      site: true,
      contractorCompany: { select: { name: true } },
      omLicenses: {
        where: { viewerType: 'CLIENT', status: 'ACTIVE' },
        select: { id: true, tier: true, status: true },
        take: 1,
      },
    },
    orderBy: { createdAt: 'desc' },
  })
}

export async function getPlantData(projectId: string) {
  const [project, readings, events] = await Promise.all([
    db.project.findUnique({
      where: { id: projectId },
      include: {
        site: true,
        contractorCompany: { select: { name: true } },
        omLicenses: {
          where: { viewerType: 'CLIENT' },
          select: { id: true, tier: true, status: true },
          take: 1,
        },
      },
    }),
    db.omReading.findMany({
      where: { projectId },
      orderBy: { recordedAt: 'asc' },
      take: 30,
    }),
    db.omEvent.findMany({
      where: { projectId },
      orderBy: { scheduledAt: 'asc' },
      take: 10,
    }),
  ])
  return { project, readings, events }
}

export async function getOmReadings(projectId: string, days = 30) {
  const since = new Date()
  since.setDate(since.getDate() - days)
  return db.omReading.findMany({
    where: { projectId, recordedAt: { gte: since } },
    orderBy: { recordedAt: 'asc' },
  })
}

export async function getOmEvents(projectId: string) {
  return db.omEvent.findMany({
    where: { projectId },
    orderBy: { scheduledAt: 'asc' },
  })
}

export async function getProjectDocuments(projectId: string) {
  return db.projectDocument.findMany({
    where: { projectId },
    orderBy: { createdAt: 'desc' },
  })
}

// Checks if the client company has an active OmLicense on a given project
export async function getActiveLicense(projectId: string, companyId: string) {
  return db.omLicense.findFirst({
    where: {
      projectId,
      licenseeCompanyId: companyId,
      viewerType: 'CLIENT',
      status: 'ACTIVE',
    },
    select: { id: true, tier: true },
  })
}

// Enterprise check: returns true if companyId is Spaza Holdings (hard-coded for M8 demo)
// Full EnterpriseLicense model wired in M9
export const SPAZA_COMPANY_ID = 'company-spaza'

export function isEnterpriseCompany(companyId: string) {
  return companyId === SPAZA_COMPANY_ID
}
```

- [ ] **Step 2: Create `server/actions/client.ts`**

```typescript
// server/actions/client.ts
'use server'

import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { z } from 'zod'
import type { OmEventType } from '@/lib/generated/prisma/client'

const createEventSchema = z.object({
  projectId: z.string(),
  type: z.string(),
  title: z.string().min(2),
  description: z.string().optional(),
  scheduledAt: z.string().datetime(),
})

export async function createOmEvent(data: z.infer<typeof createEventSchema>) {
  const parsed = createEventSchema.parse(data)
  await db.omEvent.create({
    data: {
      projectId: parsed.projectId,
      type: parsed.type as OmEventType,
      title: parsed.title,
      description: parsed.description ?? null,
      scheduledAt: new Date(parsed.scheduledAt),
    },
  })
  revalidatePath('/client/o-and-m')
}
```

- [ ] **Step 3: Typecheck**

```bash
npm run typecheck
```

- [ ] **Step 4: Commit**

```bash
git add server/queries/client.ts server/actions/client.ts
git commit -m "feat(m8): client queries and actions"
```

---

## Task 3: Client Layout + Nav + Routing

**Files:**
- Modify: `components/shell/sidebar.tsx` — add ENTERPRISE_CLIENT_NAV
- Modify: `app/(app)/client/layout.tsx` — Enterprise detection, correct nav
- Replace: `app/(app)/client/page.tsx` — routing redirect

- [ ] **Step 1: Add ENTERPRISE_CLIENT_NAV to `components/shell/sidebar.tsx`**

Add imports for `Layers` and `Link2`:
```typescript
import {
  // existing imports ...
  Layers, Link2,
} from 'lucide-react'
```

Add the new nav constant after `CLIENT_NAV`:
```typescript
export const CLIENT_NAV: NavItem[] = [
  { label: 'Plant Dashboard', href: '/client/plant', icon: LayoutDashboard },
  { label: 'Portfolio', href: '/client/portfolio', icon: FolderOpen },
  { label: 'O&M Schedule', href: '/client/o-and-m', icon: Wrench },
  { label: 'Documents', href: '/client/documents', icon: ClipboardList },
]

export const ENTERPRISE_CLIENT_NAV: NavItem[] = [
  { label: 'Operations', href: '/client/enterprise/operations', icon: LayoutDashboard },
  { label: 'Reports', href: '/client/enterprise/reports', icon: BarChart3 },
  { label: 'Integrations', href: '/client/enterprise/integrations', icon: Link2 },
  { label: 'Admin', href: '/client/enterprise/admin', icon: Settings },
]
```

Note: `CLIENT_NAV` currently has `Portfolio` and `My Sites` — replace both entries entirely with the new 4-item list above. `ClipboardList`, `BarChart3`, `Settings`, `Link2` are already imported or need to be added to the lucide import.

- [ ] **Step 2: Update `app/(app)/client/layout.tsx`**

Replace with:

```typescript
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Topbar } from '@/components/shell/topbar'
import { Sidebar, CLIENT_NAV, ENTERPRISE_CLIENT_NAV } from '@/components/shell/sidebar'
import { isEnterpriseCompany } from '@/server/queries/client'

export default async function ClientLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session || session.user.role !== 'CLIENT') redirect('/login')

  const isEnterprise = isEnterpriseCompany(session.user.companyId)

  return (
    <div className="flex h-screen bg-ink-25 overflow-hidden">
      <Sidebar navItems={isEnterprise ? ENTERPRISE_CLIENT_NAV : CLIENT_NAV} />
      <div className="flex flex-col flex-1 overflow-hidden min-w-0">
        <Topbar />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Replace `app/(app)/client/page.tsx`**

```typescript
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { isEnterpriseCompany, getClientProjects } from '@/server/queries/client'

export default async function ClientIndexPage() {
  const session = await auth()
  if (!session) redirect('/login')
  const companyId = session.user.companyId

  if (isEnterpriseCompany(companyId)) {
    redirect('/client/enterprise/operations')
  }

  // Standard client: redirect to first project's plant or portfolio
  const projects = await getClientProjects(companyId)
  if (projects.length === 1) {
    redirect(`/client/plant/${projects[0].siteId}`)
  }
  redirect('/client/portfolio')
}
```

- [ ] **Step 4: Typecheck**

```bash
npm run typecheck
```

- [ ] **Step 5: Commit**

```bash
git add components/shell/sidebar.tsx "app/(app)/client/layout.tsx" "app/(app)/client/page.tsx"
git commit -m "feat(m8): client layout — Enterprise detection, correct nav, routing"
```

---

## Task 4: Plant Charts Component

**Files:**
- Create: `components/client/plant-charts.tsx`

This is the core Recharts component used by both the client plant dashboard and the contractor monitoring tab. It receives OmReading data and renders 4 charts + multi-brand selector tabs.

- [ ] **Step 1: Create `components/client/plant-charts.tsx`**

```typescript
'use client'
// components/client/plant-charts.tsx
// Recharts charts for O&M plant data. Used in client plant dashboard + contractor monitoring.

import { useState } from 'react'
import {
  LineChart, Line, AreaChart, Area, ScatterChart, Scatter,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts'
import { cn } from '@/lib/utils'

const BRANDS = ['SunSynk', 'Victron', 'WEG', 'Deye'] as const

type OmReading = {
  recordedAt: string | Date
  productionKwh: number
  batterySoCPercent: number | null
  consumptionKwh: number | null
  irradianceWM2: number | null
}

type Props = {
  readings: OmReading[]
  tier: 'BASIC' | 'PREMIUM' | 'AI'
}

function fmt(date: string | Date) {
  const d = new Date(date)
  return `${d.getDate()}/${d.getMonth() + 1}`
}

export function PlantCharts({ readings, tier }: Props) {
  const [brand, setBrand] = useState<(typeof BRANDS)[number]>('SunSynk')

  // Production history (line chart, last 30 days)
  const productionData = readings.map((r) => ({
    date: fmt(r.recordedAt),
    kWh: Math.round(r.productionKwh * 10) / 10,
  }))

  // Battery SoC (area chart)
  const socData = readings.map((r) => ({
    date: fmt(r.recordedAt),
    soc: r.batterySoCPercent ?? 0,
  }))

  // Performance vs irradiance (scatter)
  const scatterData = readings
    .filter((r) => r.irradianceWM2 != null)
    .map((r) => ({
      irradiance: Math.round(r.irradianceWM2!),
      production: Math.round(r.productionKwh * 10) / 10,
    }))

  // Self-consumption ratio (donut)
  const totalProduction = readings.reduce((s, r) => s + r.productionKwh, 0)
  const totalConsumption = readings.reduce((s, r) => s + (r.consumptionKwh ?? 0), 0)
  const selfConsumed = Math.min(totalProduction, totalConsumption)
  const exported = Math.max(0, totalProduction - totalConsumption)
  const selfConsumptionPct = totalProduction > 0 ? Math.round((selfConsumed / totalProduction) * 100) : 0
  const donutData = [
    { name: 'Self-consumed', value: Math.round(selfConsumed) },
    { name: 'Exported', value: Math.round(exported) },
  ]

  // KPI row
  const totalYield = readings.reduce((s, r) => s + r.productionKwh, 0)
  const co2Saved = totalYield * 0.93 // kg CO₂ per kWh (Eskom grid factor)
  const avgSoc = readings.reduce((s, r) => s + (r.batterySoCPercent ?? 0), 0) / (readings.length || 1)

  return (
    <div className="space-y-6">
      {/* Multi-brand selector */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-ink-400">Data source</p>
        <div className="flex gap-1">
          {BRANDS.map((b) => (
            <button
              key={b}
              onClick={() => setBrand(b)}
              className={cn(
                'h-7 px-3 rounded-full text-xs font-medium border transition-colors',
                brand === b
                  ? 'bg-ink-900 text-white border-ink-900'
                  : 'bg-white text-ink-500 border-ink-200 hover:border-ink-400'
              )}
            >
              {b}
            </button>
          ))}
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Total yield (30 days)', value: `${Math.round(totalYield).toLocaleString()} kWh` },
          { label: 'CO₂ saved', value: `${Math.round(co2Saved).toLocaleString()} kg` },
          { label: 'Avg battery SoC', value: `${Math.round(avgSoc)}%` },
          { label: 'Self-consumption', value: `${selfConsumptionPct}%` },
        ].map((kpi) => (
          <div key={kpi.label} className="rounded-lg border border-ink-200 bg-white px-4 py-3">
            <p className="text-xs text-ink-500">{kpi.label}</p>
            <p className="text-lg font-semibold text-ink-900 tabular-nums mt-0.5">{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Charts grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Production history */}
        <div className="rounded-lg border border-ink-200 bg-white p-4">
          <p className="text-xs font-semibold text-ink-700 mb-4">Production — last 30 days (kWh)</p>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={productionData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9ca3af' }} interval={4} />
              <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 6, border: '1px solid #e5e7eb' }}
                formatter={(v: number) => [`${v} kWh`, 'Production']}
              />
              <Line type="monotone" dataKey="kWh" stroke="#3E5BEA" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Battery SoC */}
        <div className="rounded-lg border border-ink-200 bg-white p-4">
          <p className="text-xs font-semibold text-ink-700 mb-4">Battery state of charge (%)</p>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={socData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="socGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3E5BEA" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#3E5BEA" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9ca3af' }} interval={4} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#9ca3af' }} />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 6, border: '1px solid #e5e7eb' }}
                formatter={(v: number) => [`${v}%`, 'SoC']}
              />
              <ReferenceLine y={20} stroke="#f87171" strokeDasharray="4 2" />
              <Area type="monotone" dataKey="soc" stroke="#3E5BEA" strokeWidth={2} fill="url(#socGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Performance vs irradiance */}
        <div className="rounded-lg border border-ink-200 bg-white p-4">
          <p className="text-xs font-semibold text-ink-700 mb-4">Performance vs irradiance (W/m²)</p>
          <ResponsiveContainer width="100%" height={180}>
            <ScatterChart margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="irradiance" name="Irradiance" tick={{ fontSize: 10, fill: '#9ca3af' }} label={{ value: 'W/m²', position: 'insideBottomRight', fontSize: 10, fill: '#9ca3af' }} />
              <YAxis dataKey="production" name="Production" tick={{ fontSize: 10, fill: '#9ca3af' }} />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 6, border: '1px solid #e5e7eb' }}
                formatter={(v: number, name: string) => [name === 'production' ? `${v} kWh` : `${v} W/m²`, name]}
              />
              <Scatter data={scatterData} fill="#3E5BEA" opacity={0.7} />
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        {/* Self-consumption donut */}
        <div className="rounded-lg border border-ink-200 bg-white p-4">
          <p className="text-xs font-semibold text-ink-700 mb-4">Self-consumption ratio (30 days)</p>
          <div className="flex items-center justify-center gap-8 h-[180px]">
            <ResponsiveContainer width="50%" height="100%">
              <PieChart>
                <Pie
                  data={donutData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={72}
                  paddingAngle={2}
                  dataKey="value"
                >
                  <Cell fill="#3E5BEA" />
                  <Cell fill="#e5e7eb" />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2">
              <div>
                <p className="text-2xl font-semibold text-ink-900">{selfConsumptionPct}%</p>
                <p className="text-xs text-ink-500">self-consumed</p>
              </div>
              <div className="space-y-1">
                {donutData.map((d, i) => (
                  <div key={d.name} className="flex items-center gap-2 text-xs text-ink-500">
                    <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: i === 0 ? '#3E5BEA' : '#e5e7eb' }} />
                    {d.name}: {d.value.toLocaleString()} kWh
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI prescriptive alerts (AI tier only) */}
      {tier === 'AI' && (
        <div className="rounded-lg border border-accent-200 bg-accent-500/5 p-4 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-accent-600">
            SEE.AI Prescriptive Maintenance
          </p>
          {[
            { severity: 'MEDIUM', msg: 'Inverter 1 efficiency dropped 2.8% over last 7 days — schedule cleaning of heat sink fins.' },
            { severity: 'LOW', msg: 'Panel soiling index elevated for North array — cleaning recommended before end of month.' },
            { severity: 'INFO', msg: 'Battery cycle count on track — projected to reach 80% SoH in approximately 4.2 years.' },
          ].map((alert, i) => (
            <div key={i} className="flex items-start gap-2 text-sm">
              <span className={cn(
                'text-[10px] font-semibold px-1.5 py-0.5 rounded-sm flex-shrink-0 mt-0.5',
                alert.severity === 'MEDIUM' ? 'bg-warning-50 text-warning-700' :
                alert.severity === 'LOW' ? 'bg-ink-100 text-ink-600' :
                'bg-accent-500/10 text-accent-600'
              )}>
                {alert.severity}
              </span>
              <p className="text-ink-700">{alert.msg}</p>
            </div>
          ))}
        </div>
      )}
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
git add components/client/plant-charts.tsx
git commit -m "feat(m8): PlantCharts Recharts component — 4 charts + multi-brand selector + AI alerts"
```

---

## Task 5: Paywall Gate Component + Standard Client Pages

**Files:**
- Create: `components/client/paywall-gate.tsx`
- Create: `app/(app)/client/plant/[siteId]/page.tsx`
- Create: `app/(app)/client/portfolio/page.tsx`

- [ ] **Step 1: Create `components/client/paywall-gate.tsx`**

```typescript
// components/client/paywall-gate.tsx

import { Lock, Zap } from 'lucide-react'

const TIERS = [
  {
    name: 'Basic', price: 'R 450/mo',
    features: ['30-day production history', 'Battery SoC tracking', 'Monthly performance report'],
  },
  {
    name: 'Premium', price: 'R 850/mo',
    features: ['Everything in Basic', '12-month analytics', 'Performance benchmarking', 'Maintenance scheduling'],
    highlight: true,
  },
  {
    name: 'AI', price: 'R 1,200/mo',
    features: ['Everything in Premium', 'Prescriptive maintenance alerts', 'Fault prediction', 'Carbon reporting'],
  },
]

type Props = { projectName: string; epcName: string }

export function PaywallGate({ projectName, epcName }: Props) {
  return (
    <div className="p-6 max-w-3xl mx-auto space-y-8">
      <div className="flex flex-col items-center text-center py-8 space-y-4">
        <div className="h-14 w-14 rounded-full bg-ink-100 flex items-center justify-center">
          <Lock className="h-6 w-6 text-ink-400" strokeWidth={1.5} />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-ink-900">Activate your plant dashboard</h2>
          <p className="text-sm text-ink-500 mt-1 max-w-sm">
            Unlock real-time monitoring, performance analytics, and maintenance scheduling for {projectName}.
          </p>
        </div>
        <div className="flex gap-3">
          <button className="h-9 px-4 rounded-md bg-ink-900 text-white text-sm font-medium hover:bg-ink-800 transition-colors flex items-center gap-2">
            <Zap className="h-4 w-4" strokeWidth={1.5} />
            Contact {epcName}
          </button>
          <button className="h-9 px-4 rounded-md border border-ink-200 text-ink-600 text-sm hover:bg-ink-50 transition-colors">
            Activate myself
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {TIERS.map((tier) => (
          <div
            key={tier.name}
            className={`rounded-lg border p-4 space-y-3 ${tier.highlight ? 'border-accent-400 bg-accent-500/5' : 'border-ink-200 bg-white'}`}
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-ink-900">{tier.name}</p>
              {tier.highlight && <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-sm bg-accent-500 text-white">Popular</span>}
            </div>
            <p className="text-lg font-semibold text-ink-900">{tier.price}</p>
            <ul className="space-y-1.5">
              {tier.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-xs text-ink-600">
                  <span className="text-accent-500 font-bold mt-0.5">✓</span>
                  {f}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create `app/(app)/client/plant/[siteId]/page.tsx`**

```typescript
import { auth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { getOmReadings, getActiveLicense } from '@/server/queries/client'
import { PlantCharts } from '@/components/client/plant-charts'
import { PaywallGate } from '@/components/client/paywall-gate'

type Props = { params: Promise<{ siteId: string }> }

export default async function PlantDashboardPage({ params }: Props) {
  const session = await auth()
  if (!session) redirect('/login')

  const { siteId } = await params
  const companyId = session.user.companyId

  const project = await db.project.findFirst({
    where: { siteId, clientCompanyId: companyId },
    include: {
      site: true,
      contractorCompany: { select: { name: true } },
    },
  })
  if (!project) notFound()

  const [license, readings] = await Promise.all([
    getActiveLicense(project.id, companyId),
    project.stage === 'OPERATIONAL' ? getOmReadings(project.id) : Promise.resolve([]),
  ])

  const isActive = !!license && project.stage === 'OPERATIONAL'

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-base font-semibold text-ink-900">{project.name}</h1>
          <p className="text-xs text-ink-500 mt-0.5">
            {project.site.addressLine}, {project.site.city} · {project.systemSizeKw} kW ·
            Managed by {project.contractorCompany.name}
          </p>
        </div>
        {license && (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-sm bg-success-500/10 text-success-600 flex-shrink-0">
            {license.tier} license active
          </span>
        )}
      </div>

      {!isActive && (
        <PaywallGate
          projectName={project.name}
          epcName={project.contractorCompany.name}
        />
      )}

      {isActive && readings.length > 0 && (
        <PlantCharts
          readings={readings.map((r) => ({
            recordedAt: r.recordedAt.toISOString(),
            productionKwh: r.productionKwh,
            batterySoCPercent: r.batterySoCPercent,
            consumptionKwh: r.consumptionKwh,
            irradianceWM2: r.irradianceWM2,
          }))}
          tier={license.tier}
        />
      )}

      {isActive && readings.length === 0 && (
        <div className="flex flex-col items-center py-12 text-center">
          <p className="text-sm font-medium text-ink-900">No readings yet</p>
          <p className="text-xs text-ink-500 mt-1">Monitoring data will appear once your inverter is connected.</p>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Create `app/(app)/client/portfolio/page.tsx`**

```typescript
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getClientProjects } from '@/server/queries/client'
import Link from 'next/link'
import { cn } from '@/lib/utils'

const STAGE_LABEL: Record<string, string> = {
  PLANNING: 'Planning', DESIGN: 'Design', PROCUREMENT: 'Procurement',
  CONSTRUCTION: 'Construction', COMMISSIONING: 'Commissioning',
  OPERATIONAL: 'Operational', DECOMMISSIONED: 'Decommissioned',
}

export default async function PortfolioPage() {
  const session = await auth()
  if (!session) redirect('/login')

  const projects = await getClientProjects(session.user.companyId)

  const totalKw = projects.reduce((s, p) => s + p.systemSizeKw, 0)
  const operationalCount = projects.filter((p) => p.stage === 'OPERATIONAL').length

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-base font-semibold text-ink-900">Portfolio</h1>
        <p className="text-sm text-ink-500">{projects.length} site{projects.length !== 1 ? 's' : ''} · {totalKw.toLocaleString()} kW total · {operationalCount} operational</p>
      </div>

      {projects.length === 0 && (
        <div className="flex flex-col items-center py-16 text-center">
          <p className="text-sm font-medium text-ink-900">No sites yet</p>
          <p className="text-xs text-ink-500 mt-1">Your energy installations will appear here once your contractor creates your project.</p>
        </div>
      )}

      <div className="space-y-3">
        {projects.map((project) => {
          const license = project.omLicenses[0]
          return (
            <Link
              key={project.id}
              href={`/client/plant/${project.siteId}`}
              className="flex items-start gap-4 rounded-lg border border-ink-200 bg-white px-5 py-4 hover:border-ink-300 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-ink-900">{project.name}</p>
                <p className="text-xs text-ink-500 mt-0.5">
                  {project.site.city}, {project.site.province} · {project.systemSizeKw} kW · {project.contractorCompany.name}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {license && (
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-sm bg-success-500/10 text-success-600">
                    {license.tier}
                  </span>
                )}
                <span className={cn(
                  'text-[10px] font-semibold px-1.5 py-0.5 rounded-sm',
                  project.stage === 'OPERATIONAL' ? 'bg-success-500/10 text-success-600' : 'bg-ink-100 text-ink-600'
                )}>
                  {STAGE_LABEL[project.stage] ?? project.stage}
                </span>
              </div>
            </Link>
          )
        })}
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
git add "components/client/paywall-gate.tsx" "app/(app)/client/plant/" "app/(app)/client/portfolio/"
git commit -m "feat(m8): plant dashboard (paywall + active charts) + portfolio page"
```

---

## Task 6: O&M Schedule + Documents

**Files:**
- Create: `components/client/om-event-form.tsx`
- Create: `app/(app)/client/o-and-m/page.tsx`
- Create: `app/(app)/client/documents/page.tsx`

- [ ] **Step 1: Create `components/client/om-event-form.tsx`**

```typescript
'use client'
// components/client/om-event-form.tsx

import { useState, useTransition } from 'react'
import { Loader2 } from 'lucide-react'
import { createOmEvent } from '@/server/actions/client'

const EVENT_TYPES = [
  { value: 'MAINTENANCE', label: 'Maintenance' },
  { value: 'CLEANING', label: 'Panel Cleaning' },
  { value: 'INSPECTION', label: 'Inspection' },
  { value: 'REPAIR', label: 'Repair' },
  { value: 'CLIENT_MEETING', label: 'Client Meeting' },
  { value: 'SITE_VISIT', label: 'Site Visit' },
]

type Props = { projectId: string; onClose: () => void; onCreated: () => void }

export function OmEventForm({ projectId, onClose, onCreated }: Props) {
  const [isPending, startTransition] = useTransition()
  const [type, setType] = useState('MAINTENANCE')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [scheduledAt, setScheduledAt] = useState('')
  const [error, setError] = useState<string | null>(null)

  function handleSubmit() {
    setError(null)
    if (!title.trim() || !scheduledAt) { setError('Title and date are required.'); return }
    startTransition(async () => {
      try {
        await createOmEvent({
          projectId,
          type,
          title,
          description: description || undefined,
          scheduledAt: new Date(scheduledAt).toISOString(),
        })
        onCreated()
        onClose()
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to create event.')
      }
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/30 backdrop-blur-sm" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="bg-white rounded-xl border border-ink-200 shadow-2xl w-[440px] p-6 space-y-4">
        <p className="text-sm font-semibold text-ink-900">Schedule maintenance event</p>

        <div className="space-y-1">
          <label className="text-xs font-medium text-ink-700">Type</label>
          <select value={type} onChange={(e) => setType(e.target.value)}
            className="w-full h-9 rounded-md border border-ink-200 px-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-accent-500/20"
          >
            {EVENT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-ink-700">Title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Quarterly inverter service"
            className="w-full h-9 rounded-md border border-ink-200 px-3 text-sm placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-accent-500/20"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-ink-700">Date</label>
          <input type="date" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)}
            className="w-full h-9 rounded-md border border-ink-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent-500/20"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-ink-700">Notes (optional)</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2}
            placeholder="Additional details…"
            className="w-full rounded-md border border-ink-200 px-3 py-2 text-sm placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-accent-500/20 resize-none"
          />
        </div>

        {error && <p className="text-sm text-danger-600">{error}</p>}

        <div className="flex gap-2">
          <button onClick={handleSubmit} disabled={isPending}
            className="flex-1 flex items-center justify-center gap-1.5 h-8 rounded-md bg-ink-900 text-white text-xs font-medium hover:bg-ink-800 transition-colors disabled:opacity-50"
          >
            {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Schedule
          </button>
          <button onClick={onClose} className="h-8 px-3 rounded-md border border-ink-200 text-ink-600 text-xs hover:bg-ink-50 transition-colors">
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create `app/(app)/client/o-and-m/page.tsx`**

```typescript
'use client'

import { useState, useEffect } from 'react'
import { OmEventForm } from '@/components/client/om-event-form'
import { Plus, CheckCircle, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

type OmEvent = {
  id: string; projectId: string; type: string; title: string
  description: string | null; scheduledAt: string; completedAt: string | null
}

const TYPE_LABEL: Record<string, string> = {
  MAINTENANCE: 'Maintenance', CLEANING: 'Cleaning', INSPECTION: 'Inspection',
  REPAIR: 'Repair', CLIENT_MEETING: 'Meeting', SITE_VISIT: 'Site Visit', ALERT: 'Alert',
}

export default function OmSchedulePage() {
  const [events, setEvents] = useState<OmEvent[]>([])
  const [showForm, setShowForm] = useState(false)
  const [projectId, setProjectId] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  async function load() {
    const res = await fetch('/api/client/om-events')
    if (res.ok) {
      const data = await res.json() as { events: OmEvent[]; projectId: string }
      setEvents(data.events)
      setProjectId(data.projectId)
    }
    setIsLoading(false)
  }

  useEffect(() => { void load() }, [])

  const upcoming = events.filter((e) => new Date(e.scheduledAt) >= new Date() && !e.completedAt)
  const past = events.filter((e) => new Date(e.scheduledAt) < new Date() || e.completedAt)

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-ink-900">O&M Schedule</h2>
          <p className="text-sm text-ink-500">Maintenance history and upcoming events.</p>
        </div>
        {projectId && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 h-8 px-3 rounded-md bg-ink-900 text-white text-xs font-medium hover:bg-ink-800 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={2} />
            Schedule event
          </button>
        )}
      </div>

      {isLoading && <div className="h-48 rounded-md bg-ink-50 animate-pulse" />}

      {!isLoading && (
        <div className="space-y-6">
          <div className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-ink-400">Upcoming ({upcoming.length})</h3>
            {upcoming.length === 0 && <p className="text-sm text-ink-500 py-3">No upcoming events.</p>}
            {upcoming.map((e) => (
              <div key={e.id} className="flex items-start gap-3 rounded-lg border border-ink-200 bg-white px-4 py-3">
                <Clock className="h-4 w-4 text-accent-500 flex-shrink-0 mt-0.5" strokeWidth={1.5} />
                <div>
                  <p className="text-sm font-medium text-ink-900">{e.title}</p>
                  <p className="text-xs text-ink-500">
                    {TYPE_LABEL[e.type] ?? e.type} · {new Date(e.scheduledAt).toLocaleDateString('en-ZA')}
                  </p>
                  {e.description && <p className="text-xs text-ink-400 mt-0.5">{e.description}</p>}
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-ink-400">History ({past.length})</h3>
            {past.length === 0 && <p className="text-sm text-ink-500 py-3">No past events.</p>}
            {past.map((e) => (
              <div key={e.id} className={cn('flex items-start gap-3 rounded-lg border px-4 py-3', e.completedAt ? 'border-success-500/20 bg-success-50/20' : 'border-ink-100 bg-ink-25')}>
                <CheckCircle className={cn('h-4 w-4 flex-shrink-0 mt-0.5', e.completedAt ? 'text-success-500' : 'text-ink-300')} strokeWidth={1.5} />
                <div>
                  <p className="text-sm font-medium text-ink-900">{e.title}</p>
                  <p className="text-xs text-ink-500">
                    {TYPE_LABEL[e.type] ?? e.type} · {new Date(e.scheduledAt).toLocaleDateString('en-ZA')}
                    {e.completedAt && ` · completed ${new Date(e.completedAt).toLocaleDateString('en-ZA')}`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showForm && projectId && (
        <OmEventForm
          projectId={projectId}
          onClose={() => setShowForm(false)}
          onCreated={() => { void load() }}
        />
      )}
    </div>
  )
}
```

- [ ] **Step 3: Create the O&M events API route**

Create `app/api/client/om-events/route.ts`:

```typescript
// app/api/client/om-events/route.ts

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getClientProjects, getOmEvents } from '@/server/queries/client'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const projects = await getClientProjects(session.user.companyId)
  const operationalProject = projects.find((p) => p.stage === 'OPERATIONAL') ?? projects[0]

  if (!operationalProject) {
    return NextResponse.json({ events: [], projectId: '' })
  }

  const events = await getOmEvents(operationalProject.id)
  return NextResponse.json({ events, projectId: operationalProject.id })
}
```

- [ ] **Step 4: Create `app/(app)/client/documents/page.tsx`**

```typescript
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getClientProjects, getProjectDocuments } from '@/server/queries/client'
import { ExternalLink, FileText } from 'lucide-react'

export default async function DocumentsPage() {
  const session = await auth()
  if (!session) redirect('/login')

  const projects = await getClientProjects(session.user.companyId)
  const docsPerProject = await Promise.all(
    projects.map(async (p) => ({
      project: p,
      docs: await getProjectDocuments(p.id),
    }))
  )

  const totalDocs = docsPerProject.reduce((s, p) => s + p.docs.length, 0)

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h2 className="text-base font-semibold text-ink-900">Documents</h2>
        <p className="text-sm text-ink-500">{totalDocs} document{totalDocs !== 1 ? 's' : ''} across {projects.length} project{projects.length !== 1 ? 's' : ''}.</p>
      </div>

      {docsPerProject.map(({ project, docs }) => (
        docs.length > 0 && (
          <div key={project.id} className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-ink-400">{project.name}</h3>
            {docs.map((doc) => (
              <a
                key={doc.id}
                href={doc.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-3 rounded-lg border border-ink-200 bg-white px-4 py-3 hover:border-ink-300 transition-colors"
              >
                <FileText className="h-4 w-4 text-ink-400 flex-shrink-0 mt-0.5" strokeWidth={1.5} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-ink-900 truncate">{doc.name}</p>
                  <p className="text-xs text-ink-500">{doc.category} · {Math.round(doc.fileSize / 1024)} KB</p>
                </div>
                <ExternalLink className="h-3.5 w-3.5 text-ink-400 flex-shrink-0 mt-0.5" strokeWidth={1.5} />
              </a>
            ))}
          </div>
        )
      ))}

      {totalDocs === 0 && (
        <div className="flex flex-col items-center py-16 text-center">
          <FileText className="h-8 w-8 text-ink-300 mb-3" strokeWidth={1.5} />
          <p className="text-sm font-medium text-ink-900">No documents yet</p>
          <p className="text-xs text-ink-500 mt-1">Commissioning certificates, warranties, and reports will appear here.</p>
        </div>
      )}
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
git add "components/client/om-event-form.tsx" "app/(app)/client/o-and-m/" "app/(app)/client/documents/" app/api/client/
git commit -m "feat(m8): O&M schedule + documents pages"
```

---

## Task 7: Enterprise Dashboard (Sipho / Spaza Holdings)

**Files:**
- Create: `app/(app)/client/enterprise/page.tsx` (redirect)
- Create: `app/(app)/client/enterprise/operations/page.tsx`
- Create: `app/(app)/client/enterprise/reports/page.tsx`
- Create: `app/(app)/client/enterprise/integrations/page.tsx`
- Create: `app/(app)/client/enterprise/admin/page.tsx`

- [ ] **Step 1: Create `app/(app)/client/enterprise/page.tsx`**

```typescript
import { redirect } from 'next/navigation'
export default function EnterprisePage() {
  redirect('/client/enterprise/operations')
}
```

- [ ] **Step 2: Create `app/(app)/client/enterprise/operations/page.tsx`**

The Spaza Holdings Operations dashboard. Hard-coded narrative data for demo.

```typescript
import { BarChart3, Leaf, Wrench, Zap, AlertTriangle, CheckCircle } from 'lucide-react'

const SITES = [
  { name: 'Spaza Soweto', capacity: 450, todayKwh: 1_890, targetKwh: 2_025, status: 'GREEN' },
  { name: 'Spaza Sandton', capacity: 280, todayKwh: 1_042, targetKwh: 1_120, status: 'GREEN' },
  { name: 'Spaza Boksburg', capacity: 180, todayKwh: 540, targetKwh: 756, status: 'AMBER' },
]

const ALERTS = [
  { severity: 'MEDIUM', site: 'Spaza Boksburg', msg: 'Production 28% below expected — irradiance data suggests panel soiling.' },
  { severity: 'INFO', site: 'Spaza Soweto', msg: 'Monthly performance report available.' },
  { severity: 'LOW', site: 'Spaza Sandton', msg: 'Scheduled cleaning due in 8 days.' },
]

export default function EnterpriseOperationsPage() {
  const totalCapacity = SITES.reduce((s, site) => s + site.capacity, 0)
  const totalToday = SITES.reduce((s, site) => s + site.todayKwh, 0)
  const carbonSavedKg = Math.round(totalToday * 0.93)
  const carbonTargetPct = 38 // Spaza is 38% of the way to 50% renewable target

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      {/* Co-branded header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <p className="text-xs font-semibold tracking-widest uppercase text-ink-400">SEE Platform × Spaza Holdings</p>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink-900">Operations</h1>
          <p className="text-sm text-ink-500 mt-0.5">Integrated renewable energy monitoring — {SITES.length} sites, {totalCapacity} kW</p>
        </div>
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-sm bg-ink-900 text-white flex-shrink-0 mt-1">Enterprise</span>
      </div>

      {/* Portfolio summary */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: 'Total capacity', value: `${totalCapacity} kW`, icon: Zap },
          { label: 'Production today', value: `${totalToday.toLocaleString()} kWh`, icon: BarChart3 },
          { label: 'Carbon avoided (today)', value: `${carbonSavedKg.toLocaleString()} kg`, icon: Leaf },
          { label: 'Renewable target progress', value: `${carbonTargetPct}% of 50%`, icon: CheckCircle },
        ].map((kpi) => {
          const Icon = kpi.icon
          return (
            <div key={kpi.label} className="rounded-lg border border-ink-200 bg-white px-4 py-5">
              <div className="flex items-center gap-2 mb-2">
                <Icon className="h-4 w-4 text-ink-400" strokeWidth={1.5} />
                <span className="text-xs text-ink-500">{kpi.label}</span>
              </div>
              <p className="text-xl font-semibold text-ink-900 tabular-nums">{kpi.value}</p>
            </div>
          )
        })}
      </div>

      {/* Site table */}
      <div className="rounded-lg border border-ink-200 bg-white overflow-hidden">
        <div className="px-4 py-3 border-b border-ink-100">
          <h2 className="text-sm font-semibold text-ink-900">Site performance</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-ink-25 border-b border-ink-100">
              <th className="px-4 py-3 text-left text-xs font-semibold text-ink-500">Site</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-ink-500">Capacity</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-ink-500">Today (kWh)</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-ink-500">Target (kWh)</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-ink-500">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-50">
            {SITES.map((site) => (
              <tr key={site.name}>
                <td className="px-4 py-3 font-medium text-ink-900">{site.name}</td>
                <td className="px-4 py-3 text-right text-ink-600 tabular-nums">{site.capacity} kW</td>
                <td className="px-4 py-3 text-right text-ink-900 font-semibold tabular-nums">{site.todayKwh.toLocaleString()}</td>
                <td className="px-4 py-3 text-right text-ink-500 tabular-nums">{site.targetKwh.toLocaleString()}</td>
                <td className="px-4 py-3">
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-sm ${site.status === 'GREEN' ? 'bg-success-500/10 text-success-600' : 'bg-warning-50 text-warning-700'}`}>
                    {site.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Alerts feed */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-ink-900">Alerts</h2>
        {ALERTS.map((alert, i) => (
          <div key={i} className="flex items-start gap-3 rounded-lg border border-ink-200 bg-white px-4 py-3">
            <AlertTriangle className={`h-4 w-4 flex-shrink-0 mt-0.5 ${alert.severity === 'MEDIUM' ? 'text-warning-500' : 'text-ink-400'}`} strokeWidth={1.5} />
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-ink-900">{alert.site}</p>
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-sm ${alert.severity === 'MEDIUM' ? 'bg-warning-50 text-warning-700' : 'bg-ink-100 text-ink-600'}`}>
                  {alert.severity}
                </span>
              </div>
              <p className="text-xs text-ink-600 mt-0.5">{alert.msg}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Carbon target progress */}
      <div className="rounded-lg border border-ink-200 bg-white p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-ink-900">Renewable energy target — 2027</h2>
          <p className="text-sm font-semibold text-ink-900">{carbonTargetPct}%</p>
        </div>
        <p className="text-xs text-ink-500">Spaza Holdings target: 50% of total energy from renewables by end of 2027. Currently at 38%.</p>
        <div className="h-2 bg-ink-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-accent-500 rounded-full transition-all"
            style={{ width: `${(carbonTargetPct / 50) * 100}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-ink-400">
          <span>Current: {carbonTargetPct}% renewable</span>
          <span>Target: 50% by 2027</span>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Create `app/(app)/client/enterprise/reports/page.tsx`**

```typescript
import { FileText, Download } from 'lucide-react'

const REPORTS = [
  { id: 'r1', name: 'Monthly Performance Report — April 2026', type: 'Monthly Performance', date: '2026-05-01', size: '1.2 MB' },
  { id: 'r2', name: 'Quarterly Carbon Report — Q1 2026', type: 'Quarterly Carbon', date: '2026-04-01', size: '890 KB' },
  { id: 'r3', name: 'Annual Maintenance Summary — 2025', type: 'Annual Maintenance', date: '2026-01-15', size: '3.4 MB' },
  { id: 'r4', name: 'Monthly Performance Report — March 2026', type: 'Monthly Performance', date: '2026-04-01', size: '1.1 MB' },
]

export default function EnterpriseReportsPage() {
  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-base font-semibold text-ink-900">Reports</h2>
        <p className="text-sm text-ink-500">{REPORTS.length} reports available.</p>
      </div>

      <div className="rounded-lg border border-ink-200 bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-ink-25 border-b border-ink-100">
              <th className="px-4 py-3 text-left text-xs font-semibold text-ink-500">Report</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-ink-500">Type</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-ink-500">Date</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-ink-500">Size</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-50">
            {REPORTS.map((r) => (
              <tr key={r.id} className="hover:bg-ink-25 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-ink-400 flex-shrink-0" strokeWidth={1.5} />
                    <span className="text-ink-900 font-medium">{r.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-ink-500">{r.type}</td>
                <td className="px-4 py-3 text-ink-500">{new Date(r.date).toLocaleDateString('en-ZA')}</td>
                <td className="px-4 py-3 text-right text-ink-400 text-xs">{r.size}</td>
                <td className="px-4 py-3 text-right">
                  <button className="flex items-center gap-1.5 text-xs text-accent-600 hover:underline ml-auto">
                    <Download className="h-3.5 w-3.5" strokeWidth={1.5} />
                    Download
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Create `app/(app)/client/enterprise/integrations/page.tsx`**

```typescript
import { Link2, Webhook, Database, Activity } from 'lucide-react'

const API_KEYS = [
  { name: 'Production API Key', created: '2025-11-01', lastUsed: '2026-05-18', prefix: 'sk_live_spaza_' },
]

const WEBHOOKS = [
  { name: 'Spaza ERP Integration', url: 'https://erp.spazaholdings.co.za/webhooks/see', events: ['alert.raised', 'milestone.hit'], lastStatus: 'SUCCESS', lastDelivery: '2026-05-18 09:14' },
  { name: 'Finance System', url: 'https://finance.spazaholdings.co.za/api/see', events: ['threshold.breached'], lastStatus: 'SUCCESS', lastDelivery: '2026-05-17 16:30' },
]

const EXPORTS = [
  { name: 'Daily performance CSV', schedule: 'Daily', format: 'CSV', destination: 'S3: s3://spaza-analytics/see/', lastRun: '2026-05-18 01:00', status: 'SUCCESS' },
  { name: 'Weekly energy report', schedule: 'Weekly', format: 'JSON', destination: 'SFTP: sftp.spazaholdings.co.za', lastRun: '2026-05-12 02:00', status: 'SUCCESS' },
]

export default function EnterpriseIntegrationsPage() {
  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      <div>
        <h2 className="text-base font-semibold text-ink-900">Integrations</h2>
        <p className="text-sm text-ink-500">API access, webhooks, and data exports for Spaza Holdings.</p>
      </div>

      {/* API Access */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Link2 className="h-4 w-4 text-ink-400" strokeWidth={1.5} />
          <h3 className="text-sm font-semibold text-ink-900">API Access</h3>
        </div>
        <div className="rounded-md bg-ink-25 border border-ink-200 px-4 py-3 text-xs text-ink-600">
          Base URL: <code className="font-mono text-ink-900">https://api.see.platform/v1/enterprise/spaza-holdings</code>
          <span className="ml-3 text-ink-400">· 1,000 requests/minute · 47,392 calls this month</span>
        </div>
        {API_KEYS.map((key) => (
          <div key={key.name} className="flex items-center gap-4 rounded-lg border border-ink-200 bg-white px-4 py-3">
            <div className="flex-1">
              <p className="text-sm font-medium text-ink-900">{key.name}</p>
              <p className="text-xs text-ink-500 font-mono mt-0.5">{key.prefix}••••••••••••</p>
            </div>
            <p className="text-xs text-ink-400">Last used {new Date(key.lastUsed).toLocaleDateString('en-ZA')}</p>
            <button className="text-xs text-accent-600 hover:underline">Rotate</button>
          </div>
        ))}
      </div>

      {/* Webhooks */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Webhook className="h-4 w-4 text-ink-400" strokeWidth={1.5} />
            <h3 className="text-sm font-semibold text-ink-900">Webhooks</h3>
          </div>
        </div>
        {WEBHOOKS.map((wh) => (
          <div key={wh.name} className="rounded-lg border border-ink-200 bg-white px-4 py-3 space-y-1">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-ink-900">{wh.name}</p>
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-sm bg-success-500/10 text-success-600 flex-shrink-0">{wh.lastStatus}</span>
            </div>
            <p className="text-xs text-ink-500 font-mono truncate">{wh.url}</p>
            <p className="text-xs text-ink-400">Events: {wh.events.join(', ')} · Last delivery: {wh.lastDelivery}</p>
          </div>
        ))}
      </div>

      {/* Scheduled exports */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Database className="h-4 w-4 text-ink-400" strokeWidth={1.5} />
          <h3 className="text-sm font-semibold text-ink-900">Scheduled exports</h3>
        </div>
        {EXPORTS.map((ex) => (
          <div key={ex.name} className="flex items-center gap-4 rounded-lg border border-ink-200 bg-white px-4 py-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-ink-900">{ex.name}</p>
              <p className="text-xs text-ink-500 truncate">{ex.schedule} · {ex.format} → {ex.destination}</p>
            </div>
            <p className="text-xs text-ink-400 flex-shrink-0">Last run {new Date(ex.lastRun).toLocaleDateString('en-ZA')}</p>
            <button className="text-xs text-accent-600 hover:underline flex-shrink-0">Download last</button>
          </div>
        ))}
      </div>

      {/* Inbound feeds */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-ink-400" strokeWidth={1.5} />
          <h3 className="text-sm font-semibold text-ink-900">Inbound feeds</h3>
        </div>
        <div className="rounded-lg border border-ink-200 bg-white px-4 py-3 flex items-center gap-4">
          <div className="flex-1">
            <p className="text-sm font-medium text-ink-900">Spaza smart meter network</p>
            <p className="text-xs text-ink-500">Type: Energy meter telemetry · 847 records this month</p>
          </div>
          <p className="text-xs text-ink-400">Last sync: 2026-05-18 08:00</p>
          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-sm bg-success-500/10 text-success-600">ACTIVE</span>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Create `app/(app)/client/enterprise/admin/page.tsx`**

```typescript
import { Users, FileText, BarChart3 } from 'lucide-react'

const SEATS = [
  { name: 'Sipho Dlamini', email: 'sipho@spazaholdings.co.za', role: 'ENTERPRISE_ADMIN', lastActive: '2026-05-18', status: 'ACTIVE' },
  { name: 'Nomsa Zulu', email: 'nomsa@spazaholdings.co.za', role: 'ENTERPRISE_FINANCE', lastActive: '2026-05-16', status: 'ACTIVE' },
  { name: 'Thabo Nkosi', email: 'thabo@spazaholdings.co.za', role: 'ENTERPRISE_OPS', lastActive: '2026-05-15', status: 'ACTIVE' },
  { name: 'Palesa Mokoena', email: 'palesa@spazaholdings.co.za', role: 'ENTERPRISE_VIEWER', lastActive: '2026-05-10', status: 'ACTIVE' },
]

const ROLE_LABEL: Record<string, string> = {
  ENTERPRISE_ADMIN: 'Admin', ENTERPRISE_FINANCE: 'Finance',
  ENTERPRISE_OPS: 'Operations', ENTERPRISE_VIEWER: 'Viewer',
}

export default function EnterpriseAdminPage() {
  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      <div>
        <h2 className="text-base font-semibold text-ink-900">Admin</h2>
        <p className="text-sm text-ink-500">Seats, contract details, and usage for your Enterprise license.</p>
      </div>

      {/* Seats */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-ink-400" strokeWidth={1.5} />
            <h3 className="text-sm font-semibold text-ink-900">Seats</h3>
          </div>
          <p className="text-xs text-ink-500">Using 4 of 10 seats. Adding more seats increases monthly fee.</p>
        </div>
        <div className="rounded-lg border border-ink-200 bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-ink-25 border-b border-ink-100">
                <th className="px-4 py-3 text-left text-xs font-semibold text-ink-500">Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-ink-500">Role</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-ink-500">Last active</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-ink-500">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-50">
              {SEATS.map((seat) => (
                <tr key={seat.email} className="hover:bg-ink-25">
                  <td className="px-4 py-3">
                    <p className="font-medium text-ink-900">{seat.name}</p>
                    <p className="text-xs text-ink-400">{seat.email}</p>
                  </td>
                  <td className="px-4 py-3 text-ink-500 text-xs">{ROLE_LABEL[seat.role] ?? seat.role}</td>
                  <td className="px-4 py-3 text-xs text-ink-500">{new Date(seat.lastActive).toLocaleDateString('en-ZA')}</td>
                  <td className="px-4 py-3">
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-sm bg-success-500/10 text-success-600">{seat.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button className="h-7 px-3 rounded-md border border-ink-200 text-ink-600 text-xs hover:bg-ink-50 transition-colors">
          Invite seat
        </button>
      </div>

      {/* Contract details */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-ink-400" strokeWidth={1.5} />
          <h3 className="text-sm font-semibold text-ink-900">Contract details</h3>
        </div>
        <div className="rounded-lg border border-ink-200 bg-white px-5 py-4 space-y-2 text-sm">
          {[
            { label: 'Contract reference', value: 'ENT-2025-SPAZA-001' },
            { label: 'Start date', value: '1 November 2025' },
            { label: 'Review cadence', value: 'Annual (next: November 2026)' },
            { label: 'Pricing structure', value: 'R 8,500 base + R 250/seat + R 1,200/integration' },
          ].map((row) => (
            <div key={row.label} className="flex justify-between">
              <span className="text-ink-500">{row.label}</span>
              <span className="font-medium text-ink-900">{row.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Usage this period */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-ink-400" strokeWidth={1.5} />
          <h3 className="text-sm font-semibold text-ink-900">Usage this period</h3>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: 'API calls', value: '47,392', of: '500,000' },
            { label: 'Webhook deliveries', value: '1,284', of: '—' },
            { label: 'Data exports', value: '18', of: '—' },
            { label: 'Active seats', value: '4', of: '10' },
          ].map((m) => (
            <div key={m.label} className="rounded-lg border border-ink-200 bg-white px-4 py-3">
              <p className="text-xs text-ink-500">{m.label}</p>
              <p className="text-xl font-semibold text-ink-900 tabular-nums mt-0.5">{m.value}</p>
              {m.of !== '—' && <p className="text-[10px] text-ink-400">of {m.of}</p>}
            </div>
          ))}
        </div>
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
git add "app/(app)/client/enterprise/"
git commit -m "feat(m8): Enterprise dashboard — Operations, Reports, Integrations, Admin"
```

---

## Task 8: Contractor Monitoring Tab (Real Charts)

**Files:**
- Modify: `app/(app)/contractor/projects/[id]/monitoring/page.tsx`

Replace the "coming in M8" stub with a real monitoring dashboard using `PlantCharts`. For OPERATIONAL projects only.

- [ ] **Step 1: Replace monitoring page**

```typescript
import { auth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { getProject } from '@/server/queries/projects'
import { getOmReadings } from '@/server/queries/client'
import { PlantCharts } from '@/components/client/plant-charts'
import { Activity } from 'lucide-react'

type Props = { params: Promise<{ id: string }> }

export default async function MonitoringPage({ params }: Props) {
  const { id } = await params
  const session = await auth()
  if (!session) redirect('/login')

  const project = await getProject(id, session.user.companyId)
  if (!project) notFound()

  if (project.stage !== 'OPERATIONAL') {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center p-6">
        <Activity className="h-8 w-8 text-ink-300 mb-3" strokeWidth={1.5} />
        <p className="text-sm font-medium text-ink-900">Monitoring unlocks at Operational stage</p>
        <p className="text-xs text-ink-500 mt-1 max-w-sm">
          O&M dashboards, plant performance, and prescriptive maintenance alerts will be available once this project reaches the Operational stage.
        </p>
      </div>
    )
  }

  const readings = await getOmReadings(id)

  return (
    <div className="p-6 overflow-y-auto h-full max-w-6xl mx-auto">
      <div className="mb-6">
        <h2 className="text-base font-semibold text-ink-900">O&M Monitoring</h2>
        <p className="text-xs text-ink-500 mt-0.5">{project.name} · {project.systemSizeKw} kW · Last 30 days</p>
      </div>

      {readings.length === 0 && (
        <p className="text-sm text-ink-500">No monitoring data available yet.</p>
      )}

      {readings.length > 0 && (
        <PlantCharts
          readings={readings.map((r) => ({
            recordedAt: r.recordedAt.toISOString(),
            productionKwh: r.productionKwh,
            batterySoCPercent: r.batterySoCPercent,
            consumptionKwh: r.consumptionKwh,
            irradianceWM2: r.irradianceWM2,
          }))}
          tier="AI"
        />
      )}
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
git add "app/(app)/contractor/projects/[id]/monitoring/page.tsx"
git commit -m "feat(m8): contractor monitoring tab with real Recharts O&M charts"
```

---

## Task 9: Final Checks

- [ ] **Step 1: Run unit tests**

```bash
npm run test:unit
```
Expected: 23 tests PASS.

- [ ] **Step 2: Typecheck**

```bash
npm run typecheck
```
Expected: 0 errors.

- [ ] **Step 3: Lint**

```bash
npm run lint
```
Expected: 0 errors.

- [ ] **Step 4: Update CLAUDE.md**

Change current milestone to M9.

- [ ] **Step 5: Final commit**

```bash
git add .
git commit -m "feat: M8 — End-Client role, O&M monitoring, Enterprise dashboard complete"
```

---

## Spec Coverage Self-Review

| Requirement | Covered by |
|---|---|
| End-client sidebar nav (Plant / Portfolio / O&M / Documents) | Task 3 |
| Plant dashboard paywall (Contact installer / Activate myself) | Task 5 (`PaywallGate`) |
| Plant dashboard active state with 4 Recharts charts | Task 4 + 5 |
| Multi-brand selector (WEG / Victron / SunSynk / Deye) | Task 4 |
| AI prescriptive maintenance alerts | Task 4 |
| Performance metrics row (yield, CO₂, SoC, self-consumption) | Task 4 |
| Portfolio dashboard (multi-site table) | Task 5 |
| O&M Schedule (upcoming/past events, create event) | Task 6 |
| Documents repository (grouped by project) | Task 6 |
| Enterprise detection → Enterprise nav/routing | Task 3 |
| Enterprise Operations dashboard (Spaza narrative) | Task 7 |
| Enterprise site table + carbon target progress | Task 7 |
| Enterprise alerts feed | Task 7 |
| Enterprise Reports scaffold | Task 7 |
| Enterprise Integrations (API keys, webhooks, exports, feeds) | Task 7 |
| Enterprise Admin (seats, contract, usage) | Task 7 |
| Contractor monitoring tab with real charts | Task 8 |
| Tess de Wet demo login button | Task 1 |
| Active OmLicense for Kruger Farm (AI tier) | Task 1 |
| Seed OmEvents + ProjectDocuments for Kruger Farm | Task 1 |

**Known deferred to M9:**
- License activation flow (EFT payment — the full M9 commercial substrate)
- Enterprise paywall (for non-enterprise clients on projects without a license)
- Real EnterpriseLicense model wiring (currently hard-coded company ID detection)
- Contractor Tab C paywall (EPC license activation)
