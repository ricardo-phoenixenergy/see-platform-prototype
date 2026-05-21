# Client CRM & Project Technical Scope Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a lightweight Client CRM to the contractor workflow (clients managed separately, multiple projects per client) and replace the flat single-select technology field with a multi-select tech scope picker that surfaces relevant detail fields per technology combination (PV, BESS, Wind, Wheeling) and a design philosophy section.

**Architecture:** A new `ClientRecord` model owned by the contractor company replaces the `externalClientName` text field. A `techScope Json?` field on `Project` stores the full multi-technology breakdown (flags + per-tech details + design objectives). The existing `technology` enum is derived from `techScope` so milestone template selection is unchanged. The project wizard expands to 5 steps with a client combobox on Step 0 and a multi-select tech picker with conditional sub-sections on Step 1.

**Tech Stack:** Next.js 15 App Router, Prisma 7 (`@prisma/adapter-pg`), React Hook Form + Zod, Tailwind, Lucide icons, TypeScript strict.

---

## File Map

**New files:**
- `lib/tech-scope.ts` — `TechScope` type + `deriveTechnology()` util
- `server/queries/clients.ts` — `getClients`, `getClientById`
- `server/actions/clients.ts` — `createClient`, `updateClient`
- `app/(app)/contractor/clients/page.tsx` — client list (server component)
- `app/(app)/contractor/clients/new/page.tsx` — create client page wrapper
- `app/(app)/contractor/clients/new/client-form.tsx` — form component (`'use client'`)
- `app/(app)/contractor/clients/[id]/page.tsx` — client detail + project list (server component)
- `components/contractor/client-picker.tsx` — combobox to search/select clients (`'use client'`)

**Modified files:**
- `prisma/schema.prisma` — add `ClientRecord` model, `Company.clientRecords`, `Project.clientRecordId`, `Project.techScope Json?`, add `WHEELING_AGREEMENT` to `DealStructure`
- `components/shell/sidebar.tsx` — add `Clients` nav item to `CONTRACTOR_NAV`
- `app/(app)/contractor/projects/new/new-project-wizard.tsx` — full rewrite (5-step wizard with client picker + tech scope)
- `server/actions/projects.ts` — update `createProject` to accept `clientRecordId` + `techScope`, derive `technology`
- `server/queries/projects.ts` — add `clientRecord` to include in `getProject`
- `app/(app)/contractor/projects/[id]/overview/page.tsx` — render techScope detail cards

---

## Task 1: Schema — ClientRecord model + Project fields

**Files:**
- Modify: `prisma/schema.prisma`
- Run: `npx prisma migrate dev`
- Run: `npx prisma generate`

- [ ] **Step 1: Add `ClientRecord` model and relations to `prisma/schema.prisma`**

Find the line `// =========================================================================` that precedes `// PROJECTS` (around line 288) and insert the following block above it:

```prisma
// =========================================================================
// CLIENT RECORDS (CRM — contractor-owned)
// =========================================================================

model ClientRecord {
  id                  String  @id @default(cuid())
  contractorCompanyId String
  name                String
  contactName         String?
  contactEmail        String?
  contactPhone        String?
  industry            String? // e.g. "Retail", "Manufacturing", "Agriculture"
  notes               String?

  contractorCompany Company   @relation("ContractorClientRecords", fields: [contractorCompanyId], references: [id])
  projects          Project[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([contractorCompanyId])
}
```

- [ ] **Step 2: Add `clientRecords` relation to `Company` model**

In `prisma/schema.prisma`, find the Company model's `hardwareOrders` line:
```prisma
  hardwareOrders Order[]
```
Add after it:
```prisma
  clientRecords  ClientRecord[] @relation("ContractorClientRecords")
```

- [ ] **Step 3: Add `clientRecordId`, `techScope` to `Project` model**

Find in the Project model:
```prisma
  clientCompanyId     String? // optional — client may not be on platform yet
  externalClientName  String? // used when clientCompanyId is null
```
Replace with:
```prisma
  clientCompanyId     String? // optional — client may not be on platform yet
  externalClientName  String? // used when clientCompanyId is null and clientRecordId is null
  clientRecordId      String? // CRM record owned by contractor company
```

Then find `  clientNeeds String?` and add `techScope Json?` after it:
```prisma
  clientNeeds String?
  techScope   Json? // TechScope type — see lib/tech-scope.ts
```

- [ ] **Step 4: Add `clientRecord` relation to `Project` model**

Find in the Project model:
```prisma
  contractorCompany Company           @relation("ContractorProjects", fields: [contractorCompanyId], references: [id])
  clientCompany     Company?          @relation("ClientProjects", fields: [clientCompanyId], references: [id])
```
Add after `clientCompany`:
```prisma
  clientRecord      ClientRecord?     @relation(fields: [clientRecordId], references: [id])
```

- [ ] **Step 5: Add `WHEELING_AGREEMENT` to `DealStructure` enum**

Find:
```prisma
enum DealStructure {
  OUTRIGHT
  PPA
  LEASE
}
```
Replace with:
```prisma
enum DealStructure {
  OUTRIGHT
  PPA
  LEASE
  WHEELING_AGREEMENT
}
```

- [ ] **Step 6: Run migration and regenerate client**

```bash
npx prisma migrate dev --name client_record_tech_scope
npx prisma generate
```

Expected: migration created and applied, client regenerated with `ClientRecord` type, `DealStructure.WHEELING_AGREEMENT`, `Project.clientRecordId`, `Project.techScope`.

- [ ] **Step 7: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat: schema — ClientRecord CRM model, Project.techScope, WHEELING_AGREEMENT"
```

---

## Task 2: TechScope type + deriveTechnology utility

**Files:**
- Create: `lib/tech-scope.ts`
- Create: `lib/__tests__/tech-scope.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `lib/__tests__/tech-scope.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { deriveTechnology } from '../tech-scope'
import type { TechScope } from '../tech-scope'

const base: TechScope = {
  hasPv: false, hasBess: false, hasWind: false, hasWheeling: false,
  designObjectives: ['SELF_CONSUMPTION'],
  exportToGrid: false,
}

describe('deriveTechnology', () => {
  it('returns SOLAR_PV when only PV is selected', () => {
    expect(deriveTechnology({ ...base, hasPv: true })).toBe('SOLAR_PV')
  })

  it('returns BESS when only BESS is selected', () => {
    expect(deriveTechnology({ ...base, hasBess: true })).toBe('BESS')
  })

  it('returns WIND when only wind is selected', () => {
    expect(deriveTechnology({ ...base, hasWind: true })).toBe('WIND')
  })

  it('returns HYBRID for PV+BESS', () => {
    expect(deriveTechnology({ ...base, hasPv: true, hasBess: true })).toBe('HYBRID')
  })

  it('returns HYBRID for PV+BESS+Wind', () => {
    expect(deriveTechnology({ ...base, hasPv: true, hasBess: true, hasWind: true })).toBe('HYBRID')
  })

  it('returns SOLAR_PV for PV+Wheeling (wheeling does not change primary tech)', () => {
    expect(deriveTechnology({ ...base, hasPv: true, hasWheeling: true })).toBe('SOLAR_PV')
  })

  it('returns SOLAR_PV when nothing selected (fallback)', () => {
    expect(deriveTechnology(base)).toBe('SOLAR_PV')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run lib/__tests__/tech-scope.test.ts
```
Expected: FAIL — `Cannot find module '../tech-scope'`

- [ ] **Step 3: Create `lib/tech-scope.ts`**

```typescript
// lib/tech-scope.ts

export type PvMountingType = 'ROOFTOP' | 'GROUND_MOUNT' | 'CARPORT'
export type BessChemistry = 'LFP' | 'NMC' | 'VRLA'
export type WheelingAgreementType = 'VIRTUAL_NET_METERING' | 'OPEN_ACCESS' | 'BILATERAL'
export type DesignObjective = 'SELF_CONSUMPTION' | 'PEAK_SHAVING' | 'BACKUP' | 'GRID_EXPORT'

export type TechScope = {
  // Technology flags — at least one must be true
  hasPv: boolean
  hasBess: boolean
  hasWind: boolean
  hasWheeling: boolean

  // PV details (present when hasPv)
  pvCapacityKwp?: number
  pvPanelBrand?: string
  pvInverterBrand?: string
  pvMountingType?: PvMountingType

  // BESS details (present when hasBess)
  bessCapacityKwh?: number
  bessPowerKw?: number
  bessChemistry?: BessChemistry
  bessBrandModel?: string
  bessAutonomyHours?: number

  // Wind details (present when hasWind)
  windCapacityKw?: number
  windTurbineModel?: string
  windHubHeightM?: number

  // Wheeling (present when hasWheeling)
  wheelingAgreementType?: WheelingAgreementType
  wheelingDistanceKm?: number
  wheelingTradingPartner?: string

  // Design philosophy (always)
  designObjectives: DesignObjective[]
  targetBackupHours?: number
  exportToGrid: boolean
}

export type DerivedTechnology = 'SOLAR_PV' | 'WIND' | 'BESS' | 'HYBRID'

export function deriveTechnology(scope: TechScope): DerivedTechnology {
  const primaryCount = [scope.hasPv, scope.hasBess, scope.hasWind].filter(Boolean).length
  if (primaryCount > 1) return 'HYBRID'
  if (scope.hasBess) return 'BESS'
  if (scope.hasWind) return 'WIND'
  return 'SOLAR_PV' // hasPv true or nothing selected (fallback)
}

export const DESIGN_OBJECTIVE_LABELS: Record<DesignObjective, string> = {
  SELF_CONSUMPTION: 'Self-consumption',
  PEAK_SHAVING: 'Peak shaving / demand management',
  BACKUP: 'Backup / load-shedding resilience',
  GRID_EXPORT: 'Grid export / revenue generation',
}

export const BESS_CHEMISTRY_LABELS: Record<BessChemistry, string> = {
  LFP: 'Lithium Iron Phosphate (LFP)',
  NMC: 'Lithium Nickel Manganese Cobalt (NMC)',
  VRLA: 'Lead-acid (VRLA)',
}

export const MOUNTING_TYPE_LABELS: Record<PvMountingType, string> = {
  ROOFTOP: 'Rooftop',
  GROUND_MOUNT: 'Ground mount',
  CARPORT: 'Carport / shade structure',
}

export const WHEELING_TYPE_LABELS: Record<WheelingAgreementType, string> = {
  VIRTUAL_NET_METERING: 'Virtual Net Metering (VNM)',
  OPEN_ACCESS: 'Open Access / Third-party access',
  BILATERAL: 'Bilateral Power Purchase Agreement',
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run lib/__tests__/tech-scope.test.ts
```
Expected: 7 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/tech-scope.ts lib/__tests__/tech-scope.test.ts
git commit -m "feat: TechScope type + deriveTechnology utility with tests"
```

---

## Task 3: Client queries and server actions

**Files:**
- Create: `server/queries/clients.ts`
- Create: `server/actions/clients.ts`

- [ ] **Step 1: Create `server/queries/clients.ts`**

```typescript
// server/queries/clients.ts
import { db } from '@/lib/db'

export async function getClients(contractorCompanyId: string) {
  return db.clientRecord.findMany({
    where: { contractorCompanyId },
    include: {
      _count: { select: { projects: true } },
    },
    orderBy: { name: 'asc' },
  })
}

export type ClientWithCount = Awaited<ReturnType<typeof getClients>>[number]

export async function getClientById(id: string, contractorCompanyId: string) {
  return db.clientRecord.findFirst({
    where: { id, contractorCompanyId },
    include: {
      projects: {
        where: { deletedAt: null },
        include: {
          site: { select: { city: true, province: true } },
          milestones: { select: { status: true } },
        },
        orderBy: { updatedAt: 'desc' },
      },
    },
  })
}
```

- [ ] **Step 2: Create `server/actions/clients.ts`**

```typescript
// server/actions/clients.ts
'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'

const clientSchema = z.object({
  name: z.string().min(2, 'Client name required'),
  contactName: z.string().optional(),
  contactEmail: z.string().email('Invalid email').optional().or(z.literal('')),
  contactPhone: z.string().optional(),
  industry: z.string().optional(),
  notes: z.string().optional(),
})

export async function createClient(data: unknown) {
  const session = await auth()
  if (!session) throw new Error('Unauthorised')

  const parsed = clientSchema.safeParse(data)
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? 'Invalid data')

  const client = await db.clientRecord.create({
    data: {
      contractorCompanyId: session.user.companyId,
      name: parsed.data.name,
      contactName: parsed.data.contactName || null,
      contactEmail: parsed.data.contactEmail || null,
      contactPhone: parsed.data.contactPhone || null,
      industry: parsed.data.industry || null,
      notes: parsed.data.notes || null,
    },
  })

  revalidatePath('/contractor/clients')
  return client.id
}

export async function updateClient(id: string, data: unknown) {
  const session = await auth()
  if (!session) throw new Error('Unauthorised')

  const parsed = clientSchema.safeParse(data)
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? 'Invalid data')

  // Verify ownership
  const existing = await db.clientRecord.findFirst({
    where: { id, contractorCompanyId: session.user.companyId },
  })
  if (!existing) throw new Error('Client not found')

  await db.clientRecord.update({
    where: { id },
    data: {
      name: parsed.data.name,
      contactName: parsed.data.contactName || null,
      contactEmail: parsed.data.contactEmail || null,
      contactPhone: parsed.data.contactPhone || null,
      industry: parsed.data.industry || null,
      notes: parsed.data.notes || null,
    },
  })

  revalidatePath(`/contractor/clients/${id}`)
  revalidatePath('/contractor/clients')
}
```

- [ ] **Step 3: Commit**

```bash
git add server/queries/clients.ts server/actions/clients.ts
git commit -m "feat: client CRM queries and server actions"
```

---

## Task 4: Client pages (list, new, detail)

**Files:**
- Create: `app/(app)/contractor/clients/page.tsx`
- Create: `app/(app)/contractor/clients/new/page.tsx`
- Create: `app/(app)/contractor/clients/new/client-form.tsx`
- Create: `app/(app)/contractor/clients/[id]/page.tsx`

- [ ] **Step 1: Create client list page `app/(app)/contractor/clients/page.tsx`**

```typescript
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getClients } from '@/server/queries/clients'
import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { cn, formatDate } from '@/lib/utils'
import { Users, Plus, Building2, FolderOpen } from 'lucide-react'

export default async function ClientsPage() {
  const session = await auth()
  if (!session) redirect('/login')

  const clients = await getClients(session.user.companyId)

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink-900">Clients</h1>
          <p className="text-sm text-ink-500 mt-1">
            {clients.length} client{clients.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Link
          href="/contractor/clients/new"
          className={cn(buttonVariants({ variant: 'primary', size: 'sm' }), 'inline-flex items-center gap-1.5')}
        >
          <Plus className="h-4 w-4" />
          New client
        </Link>
      </div>

      {clients.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No clients yet"
          description="Add your first client, then attach projects to them."
          action={{ label: 'New client', href: '/contractor/clients/new' }}
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {clients.map((client) => (
            <Link
              key={client.id}
              href={`/contractor/clients/${client.id}`}
              className="rounded-lg border border-ink-200 bg-white p-5 hover:border-ink-300 hover:shadow-sm transition-all flex flex-col gap-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="h-9 w-9 rounded-md bg-ink-100 flex items-center justify-center flex-shrink-0">
                  <Building2 className="h-4 w-4 text-ink-500" strokeWidth={1.5} />
                </div>
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-sm bg-ink-100 text-ink-500 flex-shrink-0">
                  {client._count.projects} project{client._count.projects !== 1 ? 's' : ''}
                </span>
              </div>
              <div>
                <p className="text-sm font-semibold text-ink-900 leading-tight">{client.name}</p>
                {client.industry && (
                  <p className="text-xs text-ink-500 mt-0.5">{client.industry}</p>
                )}
                {client.contactName && (
                  <p className="text-xs text-ink-400 mt-1">{client.contactName}</p>
                )}
              </div>
              <p className="text-[10px] text-ink-400 mt-auto">
                Added {formatDate(client.createdAt)}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Create client form component `app/(app)/contractor/clients/new/client-form.tsx`**

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { createClient } from '@/server/actions/clients'

const schema = z.object({
  name: z.string().min(2, 'Client name required'),
  contactName: z.string().optional(),
  contactEmail: z.string().email('Invalid email').optional().or(z.literal('')),
  contactPhone: z.string().optional(),
  industry: z.string().optional(),
  notes: z.string().optional(),
})
type FormData = z.infer<typeof schema>

const INDUSTRIES = [
  'Agriculture', 'Commercial Real Estate', 'Education', 'Healthcare',
  'Hospitality', 'Industrial / Manufacturing', 'Mining', 'Municipality',
  'Religious', 'Residential Estate', 'Retail', 'Telecommunications', 'Other',
]

export function ClientForm() {
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
  })

  async function onSubmit(data: FormData) {
    setError(null)
    try {
      const id = await createClient(data)
      router.push(`/contractor/clients/${id}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create client')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit as Parameters<typeof handleSubmit>[0])} className="space-y-5">
      <div className="space-y-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-ink-400">Company</p>
        <Input
          label="Client / company name"
          placeholder="e.g. Spaza Holdings (Pty) Ltd"
          {...(errors.name?.message ? { error: errors.name.message } : {})}
          {...register('name')}
        />
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-ink-900">Industry</label>
          <select
            {...register('industry')}
            className="h-10 w-full rounded-md border border-ink-200 bg-white px-3 text-sm text-ink-900 focus:border-accent-500 focus:outline-none focus:shadow-ring"
          >
            <option value="">Select industry (optional)</option>
            {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
          </select>
        </div>
      </div>

      <div className="space-y-4 pt-2 border-t border-ink-100">
        <p className="text-xs font-semibold uppercase tracking-widest text-ink-400">Primary contact</p>
        <Input label="Contact name" placeholder="e.g. Sipho Dlamini" {...register('contactName')} />
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Email"
            type="email"
            placeholder="sipho@spazaholdings.co.za"
            {...(errors.contactEmail?.message ? { error: errors.contactEmail.message } : {})}
            {...register('contactEmail')}
          />
          <Input label="Phone" type="tel" placeholder="+27 11 000 0000" {...register('contactPhone')} />
        </div>
      </div>

      <div className="space-y-2 pt-2 border-t border-ink-100">
        <label className="text-sm font-medium text-ink-900">Notes <span className="text-ink-400 font-normal">(optional)</span></label>
        <textarea
          {...register('notes')}
          rows={3}
          placeholder="Any useful context about this client…"
          className="w-full rounded-md border border-ink-200 bg-white px-3 py-2 text-sm text-ink-900 placeholder:text-ink-400 focus:border-accent-500 focus:outline-none focus:shadow-ring resize-none"
        />
      </div>

      {error && <p className="text-sm text-danger-500">{error}</p>}

      <div className="flex items-center gap-3 pt-1">
        <Button type="submit" loading={isSubmitting}>Create client</Button>
        <button
          type="button"
          onClick={() => router.back()}
          className="text-sm text-ink-500 hover:text-ink-700 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
```

- [ ] **Step 3: Create new client page `app/(app)/contractor/clients/new/page.tsx`**

```typescript
import { ClientForm } from './client-form'

export default function NewClientPage() {
  return (
    <div className="p-6 max-w-xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-ink-900">New client</h1>
        <p className="text-sm text-ink-500 mt-1">
          Add a client record. You can attach multiple projects to them.
        </p>
      </div>
      <ClientForm />
    </div>
  )
}
```

- [ ] **Step 4: Create client detail page `app/(app)/contractor/clients/[id]/page.tsx`**

```typescript
import { auth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { getClientById } from '@/server/queries/clients'
import { ProjectCard } from '@/components/project/project-card'
import { EmptyState } from '@/components/ui/empty-state'
import { buttonVariants } from '@/components/ui/button'
import Link from 'next/link'
import { cn, formatDate } from '@/lib/utils'
import { Building2, Mail, Phone, User, FolderOpen, Plus } from 'lucide-react'

type Props = { params: Promise<{ id: string }> }

export default async function ClientDetailPage({ params }: Props) {
  const session = await auth()
  if (!session) redirect('/login')

  const { id } = await params
  const client = await getClientById(id, session.user.companyId)
  if (!client) notFound()

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 rounded-lg bg-ink-100 flex items-center justify-center flex-shrink-0">
            <Building2 className="h-5 w-5 text-ink-500" strokeWidth={1.5} />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-ink-900">{client.name}</h1>
            {client.industry && <p className="text-sm text-ink-500 mt-0.5">{client.industry}</p>}
            <p className="text-xs text-ink-400 mt-1">Client since {formatDate(client.createdAt)}</p>
          </div>
        </div>
        <Link
          href={`/contractor/projects/new?clientId=${client.id}`}
          className={cn(buttonVariants({ variant: 'primary', size: 'sm' }), 'inline-flex items-center gap-1.5 flex-shrink-0')}
        >
          <Plus className="h-4 w-4" />
          New project
        </Link>
      </div>

      {/* Contact info */}
      {(client.contactName || client.contactEmail || client.contactPhone) && (
        <div className="rounded-lg border border-ink-200 bg-white px-5 py-4 flex flex-wrap gap-5">
          {client.contactName && (
            <div className="flex items-center gap-2">
              <User className="h-3.5 w-3.5 text-ink-400" strokeWidth={1.5} />
              <span className="text-sm text-ink-700">{client.contactName}</span>
            </div>
          )}
          {client.contactEmail && (
            <a href={`mailto:${client.contactEmail}`} className="flex items-center gap-2 hover:text-accent-600 transition-colors">
              <Mail className="h-3.5 w-3.5 text-ink-400" strokeWidth={1.5} />
              <span className="text-sm text-ink-700">{client.contactEmail}</span>
            </a>
          )}
          {client.contactPhone && (
            <a href={`tel:${client.contactPhone}`} className="flex items-center gap-2 hover:text-accent-600 transition-colors">
              <Phone className="h-3.5 w-3.5 text-ink-400" strokeWidth={1.5} />
              <span className="text-sm text-ink-700">{client.contactPhone}</span>
            </a>
          )}
        </div>
      )}

      {client.notes && (
        <div className="rounded-lg border border-ink-100 bg-ink-25 px-5 py-4">
          <p className="text-xs font-semibold text-ink-400 uppercase tracking-widest mb-1.5">Notes</p>
          <p className="text-sm text-ink-700 leading-relaxed">{client.notes}</p>
        </div>
      )}

      {/* Projects */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-ink-900">
            Projects
            <span className="ml-2 text-ink-400 font-normal">({client.projects.length})</span>
          </h2>
        </div>

        {client.projects.length === 0 ? (
          <EmptyState
            icon={FolderOpen}
            title="No projects yet"
            description="Create the first project for this client."
            action={{ label: 'New project', href: `/contractor/projects/new?clientId=${client.id}` }}
          />
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {client.projects.map(project => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
```

Note: `ProjectCard` expects `ProjectWithRelations` from `server/queries/projects.ts`. The `getClientById` query includes the same shape. If there's a type mismatch, cast with `project as ProjectWithRelations` or add `clientRecord` to the include in `getProjects`.

- [ ] **Step 5: Commit**

```bash
git add "app/(app)/contractor/clients/"
git commit -m "feat: client CRM pages — list, create, detail with project grid"
```

---

## Task 5: Sidebar Clients nav item + ClientPicker component

**Files:**
- Modify: `components/shell/sidebar.tsx`
- Create: `components/contractor/client-picker.tsx`

- [ ] **Step 1: Add `Clients` nav item to `CONTRACTOR_NAV`**

In `components/shell/sidebar.tsx`, find:
```typescript
import {
  LayoutDashboard, FolderOpen, ShoppingBag, Wallet,
  Building2, ChevronLeft, ChevronRight, Wrench, TrendingUp, Lock,
  ClipboardList, Scale, HelpCircle, Settings, BarChart3, Briefcase, User, Link2, Layers,
} from 'lucide-react'
```
Add `Users` to the import:
```typescript
import {
  LayoutDashboard, FolderOpen, ShoppingBag, Wallet,
  Building2, ChevronLeft, ChevronRight, Wrench, TrendingUp, Lock,
  ClipboardList, Scale, HelpCircle, Settings, BarChart3, Briefcase, User, Link2, Layers, Users,
} from 'lucide-react'
```

Then find:
```typescript
export const CONTRACTOR_NAV: NavItem[] = [
  { label: 'Dashboard', href: '/contractor', icon: LayoutDashboard },
  { label: 'Projects', href: '/contractor/projects', icon: FolderOpen },
  { label: 'Marketplace', href: '/contractor/marketplace', icon: ShoppingBag },
```
Replace with:
```typescript
export const CONTRACTOR_NAV: NavItem[] = [
  { label: 'Dashboard', href: '/contractor', icon: LayoutDashboard },
  { label: 'Projects', href: '/contractor/projects', icon: FolderOpen },
  { label: 'Clients', href: '/contractor/clients', icon: Users },
  { label: 'Marketplace', href: '/contractor/marketplace', icon: ShoppingBag },
```

- [ ] **Step 2: Create `components/contractor/client-picker.tsx`**

This is a combobox that searches existing clients by name, plus an "Add new client" option that navigates to `/contractor/clients/new`.

```typescript
'use client'

import { useState, useRef, useEffect } from 'react'
import { Search, Plus, Building2, ChevronDown, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export type ClientOption = {
  id: string
  name: string
  industry?: string | null
  contactName?: string | null
}

type Props = {
  clients: ClientOption[]
  value: string // clientRecordId
  onChange: (clientId: string, clientName: string) => void
  onClearToManual: () => void // clear selection, fall back to manual name input
  error?: string
}

export function ClientPicker({ clients, value, onChange, onClearToManual, error }: Props) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)

  const selected = clients.find(c => c.id === value)

  const filtered = clients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.contactName ?? '').toLowerCase().includes(search.toLowerCase())
  )

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (selected) {
    return (
      <div className="flex items-center gap-3 rounded-md border border-accent-500 bg-accent-50 px-4 py-3">
        <div className="h-7 w-7 rounded bg-ink-100 flex items-center justify-center flex-shrink-0">
          <Building2 className="h-3.5 w-3.5 text-ink-500" strokeWidth={1.5} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-ink-900 truncate">{selected.name}</p>
          {selected.industry && <p className="text-xs text-ink-500">{selected.industry}</p>}
        </div>
        <button
          type="button"
          onClick={onClearToManual}
          className="text-ink-400 hover:text-ink-700 flex-shrink-0"
          aria-label="Clear client selection"
        >
          <X className="h-4 w-4" strokeWidth={1.5} />
        </button>
      </div>
    )
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className={cn(
          'w-full flex items-center gap-2 h-10 rounded-md border bg-white px-3 text-sm text-left transition-colors',
          open ? 'border-accent-500 shadow-ring' : 'border-ink-200 hover:border-ink-300',
          error ? 'border-danger-500' : ''
        )}
      >
        <Search className="h-3.5 w-3.5 text-ink-400 flex-shrink-0" strokeWidth={1.5} />
        <span className="flex-1 text-ink-400">Search existing clients…</span>
        <ChevronDown className="h-3.5 w-3.5 text-ink-400 flex-shrink-0" strokeWidth={1.5} />
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 rounded-md border border-ink-200 bg-white shadow-lg z-20 overflow-hidden">
          <div className="p-2 border-b border-ink-100">
            <input
              autoFocus
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Type to search…"
              className="w-full h-8 px-3 text-sm rounded border border-ink-200 focus:border-accent-500 focus:outline-none"
            />
          </div>
          <ul className="max-h-48 overflow-y-auto py-1">
            {filtered.length === 0 && (
              <li className="px-3 py-2 text-xs text-ink-400">No clients match &ldquo;{search}&rdquo;</li>
            )}
            {filtered.map(client => (
              <li key={client.id}>
                <button
                  type="button"
                  onClick={() => { onChange(client.id, client.name); setOpen(false); setSearch('') }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-ink-50 text-left transition-colors"
                >
                  <div className="h-6 w-6 rounded bg-ink-100 flex items-center justify-center flex-shrink-0">
                    <Building2 className="h-3 w-3 text-ink-400" strokeWidth={1.5} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink-900 truncate">{client.name}</p>
                    {client.industry && <p className="text-[10px] text-ink-400">{client.industry}</p>}
                  </div>
                </button>
              </li>
            ))}
          </ul>
          <div className="border-t border-ink-100 p-2">
            <a
              href="/contractor/clients/new"
              className="flex items-center gap-2 px-3 py-2 text-sm text-accent-600 hover:bg-accent-50 rounded transition-colors"
            >
              <Plus className="h-3.5 w-3.5" strokeWidth={2} />
              Add new client
            </a>
          </div>
        </div>
      )}

      {error && <p className="text-xs text-danger-500 mt-1">{error}</p>}
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add components/shell/sidebar.tsx components/contractor/client-picker.tsx
git commit -m "feat: Clients nav item + ClientPicker combobox component"
```

---

## Task 6: Updated project wizard + createProject action

**Files:**
- Modify: `app/(app)/contractor/projects/new/new-project-wizard.tsx` (full rewrite)
- Modify: `server/actions/projects.ts`

The wizard now has **5 steps**:
- Step 0: Client & Site
- Step 1: Technology Scope (multi-select + conditional detail fields)
- Step 2: System Sizing & Design Philosophy
- Step 3: Commercial
- Step 4: Review

- [ ] **Step 1: Rewrite `app/(app)/contractor/projects/new/new-project-wizard.tsx`**

```typescript
'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ClientPicker, type ClientOption } from '@/components/contractor/client-picker'
import { createProject } from '@/server/actions/projects'
import { cn } from '@/lib/utils'
import {
  DESIGN_OBJECTIVE_LABELS, BESS_CHEMISTRY_LABELS,
  MOUNTING_TYPE_LABELS, WHEELING_TYPE_LABELS,
} from '@/lib/tech-scope'
import type { DesignObjective } from '@/lib/tech-scope'

// ── Form schema ──────────────────────────────────────────────────────────────

const optNum = z.preprocess(
  v => (v === '' || v === undefined || v === null ? undefined : Number(v)),
  z.number().positive().optional()
)

const schema = z.object({
  // Step 0
  clientRecordId: z.string().optional(),
  clientName: z.string().min(2, 'Client name required'),
  name: z.string().min(3, 'Project name must be at least 3 characters'),
  addressLine: z.string().min(2, 'Address required'),
  city: z.string().min(2, 'City required'),
  province: z.string().min(2, 'Province required'),

  // Step 1 — tech flags (validated in step)
  hasPv: z.boolean(),
  hasBess: z.boolean(),
  hasWind: z.boolean(),
  hasWheeling: z.boolean(),

  // PV
  pvCapacityKwp: optNum,
  pvPanelBrand: z.string().optional(),
  pvInverterBrand: z.string().optional(),
  pvMountingType: z.enum(['ROOFTOP', 'GROUND_MOUNT', 'CARPORT']).optional(),

  // BESS
  bessCapacityKwh: optNum,
  bessPowerKw: optNum,
  bessChemistry: z.enum(['LFP', 'NMC', 'VRLA']).optional(),
  bessBrandModel: z.string().optional(),
  bessAutonomyHours: optNum,

  // Wind
  windCapacityKw: optNum,
  windTurbineModel: z.string().optional(),
  windHubHeightM: optNum,

  // Wheeling
  wheelingAgreementType: z.enum(['VIRTUAL_NET_METERING', 'OPEN_ACCESS', 'BILATERAL']).optional(),
  wheelingDistanceKm: optNum,
  wheelingTradingPartner: z.string().optional(),

  // Step 2
  systemSizeKw: z.coerce.number().positive('Must be positive'),
  gridConnectionStatus: z.enum(['GRID_TIED', 'OFF_GRID', 'GRID_TIED_WITH_BACKUP']),
  designObjectives: z.array(z.enum(['SELF_CONSUMPTION', 'PEAK_SHAVING', 'BACKUP', 'GRID_EXPORT'])),
  exportToGrid: z.boolean(),
  targetBackupHours: optNum,

  // Step 3
  dealStructure: z.enum(['OUTRIGHT', 'PPA', 'LEASE', 'WHEELING_AGREEMENT']),
  clientNeeds: z.string().optional(),
})

type FormData = z.infer<typeof schema>

// ── Constants ─────────────────────────────────────────────────────────────────

const STEPS = ['Client & site', 'Tech scope', 'System design', 'Commercial', 'Review']

const SA_PROVINCES = [
  'Eastern Cape', 'Free State', 'Gauteng', 'KwaZulu-Natal',
  'Limpopo', 'Mpumalanga', 'Northern Cape', 'North West', 'Western Cape',
]

const GRID_OPTIONS = [
  { value: 'GRID_TIED', label: 'Grid-tied' },
  { value: 'OFF_GRID', label: 'Off-grid' },
  { value: 'GRID_TIED_WITH_BACKUP', label: 'Grid-tied with backup' },
] as const

const DEAL_OPTIONS = [
  { value: 'OUTRIGHT', label: 'Outright purchase' },
  { value: 'PPA', label: 'Power Purchase Agreement (PPA)' },
  { value: 'LEASE', label: 'Lease' },
  { value: 'WHEELING_AGREEMENT', label: 'Wheeling / Energy trading agreement' },
] as const

// ── Component ─────────────────────────────────────────────────────────────────

type Props = { clients: ClientOption[]; defaultClientId?: string }

export function NewProjectWizard({ clients, defaultClientId }: Props) {
  const [step, setStep] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const { register, handleSubmit, watch, setValue, control, formState: { errors, isSubmitting } } = useForm<FormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
    defaultValues: {
      clientRecordId: defaultClientId ?? '',
      clientName: '',
      hasPv: true,
      hasBess: false,
      hasWind: false,
      hasWheeling: false,
      designObjectives: ['SELF_CONSUMPTION'],
      exportToGrid: false,
      gridConnectionStatus: 'GRID_TIED',
      dealStructure: 'PPA',
    },
  })

  const values = watch()

  const anyTechSelected = values.hasPv || values.hasBess || values.hasWind || values.hasWheeling

  async function onSubmit(data: FormData) {
    setError(null)
    const result = await createProject(data)
    if (result.ok) {
      router.push(`/contractor/projects/${result.projectId}`)
    } else {
      setError(result.error)
    }
  }

  function canAdvance(): boolean {
    if (step === 0) {
      return !!(values.clientName?.length >= 2 && values.name?.length >= 3 &&
        values.addressLine?.length >= 2 && values.city?.length >= 2 && values.province?.length >= 2)
    }
    if (step === 1) return anyTechSelected
    if (step === 2) {
      return !!(values.systemSizeKw > 0 && values.designObjectives?.length > 0)
    }
    return true
  }

  const isLastStep = step === STEPS.length - 1

  return (
    <div className="space-y-6">
      {/* Step indicator */}
      <div className="flex items-center gap-0">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center flex-1">
            <div className="flex items-center gap-2">
              <div className={cn(
                'h-6 w-6 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0',
                i < step ? 'bg-ink-900 text-white' :
                i === step ? 'bg-accent-500 text-white' :
                'bg-ink-100 text-ink-400'
              )}>
                {i < step ? '✓' : i + 1}
              </div>
              <span className={cn('text-xs hidden sm:block', i === step ? 'text-ink-900 font-medium' : 'text-ink-400')}>
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={cn('flex-1 h-px mx-3', i < step ? 'bg-ink-300' : 'bg-ink-100')} />
            )}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit as Parameters<typeof handleSubmit>[0])}>

        {/* ── Step 0: Client & Site ── */}
        {step === 0 && (
          <div className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-ink-900">Client</label>
              <ClientPicker
                clients={clients}
                value={values.clientRecordId ?? ''}
                onChange={(id, name) => {
                  setValue('clientRecordId', id)
                  setValue('clientName', name)
                }}
                onClearToManual={() => {
                  setValue('clientRecordId', '')
                  setValue('clientName', '')
                }}
              />
              {!values.clientRecordId && (
                <div className="mt-2">
                  <Input
                    label="Or enter client name manually"
                    placeholder="e.g. Durbanville Mall Management"
                    {...(errors.clientName?.message ? { error: errors.clientName.message } : {})}
                    {...register('clientName')}
                  />
                </div>
              )}
            </div>

            <Input
              label="Project name"
              placeholder="e.g. Soweto Retail Solar PPA"
              {...(errors.name?.message ? { error: errors.name.message } : {})}
              {...register('name')}
            />

            <div className="space-y-3 pt-2 border-t border-ink-100">
              <p className="text-xs font-semibold uppercase tracking-widest text-ink-400">Site location</p>
              <Input
                label="Site address"
                placeholder="45 Klipspruit Valley Road"
                {...(errors.addressLine?.message ? { error: errors.addressLine.message } : {})}
                {...register('addressLine')}
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="City"
                  placeholder="Soweto"
                  {...(errors.city?.message ? { error: errors.city.message } : {})}
                  {...register('city')}
                />
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-ink-900">Province</label>
                  <select
                    {...register('province')}
                    className="h-10 w-full rounded-md border border-ink-200 bg-white px-3 text-sm text-ink-900 focus:border-accent-500 focus:outline-none focus:shadow-ring"
                  >
                    <option value="">Select province</option>
                    {SA_PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                  {errors.province && <p className="text-xs text-danger-500">{errors.province.message}</p>}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Step 1: Technology Scope ── */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="space-y-3">
              <p className="text-sm font-medium text-ink-900">Select all technologies included in this project</p>
              {!anyTechSelected && (
                <p className="text-xs text-danger-500">Select at least one technology to continue.</p>
              )}
              <div className="grid grid-cols-2 gap-3">
                {([
                  { field: 'hasPv', label: 'Solar PV', sub: 'Photovoltaic generation' },
                  { field: 'hasBess', label: 'Battery Storage', sub: 'BESS / energy storage' },
                  { field: 'hasWind', label: 'Wind', sub: 'Wind turbine generation' },
                  { field: 'hasWheeling', label: 'Wheeling / Trading', sub: 'Energy trading via grid' },
                ] as const).map(({ field, label, sub }) => (
                  <label key={field} className={cn(
                    'flex items-start gap-3 rounded-md border px-4 py-3 cursor-pointer transition-colors',
                    values[field] ? 'border-accent-500 bg-accent-50' : 'border-ink-200 hover:bg-ink-50'
                  )}>
                    <input type="checkbox" {...register(field)} className="mt-0.5 accent-accent-600" />
                    <div>
                      <p className="text-sm font-medium text-ink-900">{label}</p>
                      <p className="text-xs text-ink-500">{sub}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* PV details */}
            {values.hasPv && (
              <div className="space-y-3 rounded-md border border-ink-200 p-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-ink-400">Solar PV details</p>
                <div className="grid grid-cols-2 gap-3">
                  <Input label="PV capacity (kWp)" type="number" placeholder="500" {...register('pvCapacityKwp')} />
                  <Input label="Panel brand / model" placeholder="e.g. Jinko Tiger Neo" {...register('pvPanelBrand')} />
                  <Input label="Inverter brand" placeholder="e.g. SMA Sunny Tripower" {...register('pvInverterBrand')} />
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-ink-900">Mounting type</label>
                    <select {...register('pvMountingType')} className="h-10 w-full rounded-md border border-ink-200 bg-white px-3 text-sm focus:border-accent-500 focus:outline-none">
                      <option value="">Select…</option>
                      {(Object.entries(MOUNTING_TYPE_LABELS) as [string, string][]).map(([v, l]) => (
                        <option key={v} value={v}>{l}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* BESS details */}
            {values.hasBess && (
              <div className="space-y-3 rounded-md border border-ink-200 p-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-ink-400">Battery Storage details</p>
                <div className="grid grid-cols-2 gap-3">
                  <Input label="Energy capacity (kWh)" type="number" placeholder="200" {...register('bessCapacityKwh')} />
                  <Input label="Power rating (kW)" type="number" placeholder="100" {...register('bessPowerKw')} />
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-ink-900">Battery chemistry</label>
                    <select {...register('bessChemistry')} className="h-10 w-full rounded-md border border-ink-200 bg-white px-3 text-sm focus:border-accent-500 focus:outline-none">
                      <option value="">Select…</option>
                      {(Object.entries(BESS_CHEMISTRY_LABELS) as [string, string][]).map(([v, l]) => (
                        <option key={v} value={v}>{l}</option>
                      ))}
                    </select>
                  </div>
                  <Input label="Brand / model" placeholder="e.g. Dyness B5" {...register('bessBrandModel')} />
                </div>
                <Input label="Target backup autonomy (hours)" type="number" placeholder="4" hint="Hours of full-load backup required" {...register('bessAutonomyHours')} />
              </div>
            )}

            {/* Wind details */}
            {values.hasWind && (
              <div className="space-y-3 rounded-md border border-ink-200 p-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-ink-400">Wind details</p>
                <div className="grid grid-cols-2 gap-3">
                  <Input label="Wind capacity (kW)" type="number" placeholder="250" {...register('windCapacityKw')} />
                  <Input label="Turbine model" placeholder="e.g. Vestas V90" {...register('windTurbineModel')} />
                  <Input label="Hub height (m)" type="number" placeholder="80" {...register('windHubHeightM')} />
                </div>
              </div>
            )}

            {/* Wheeling details */}
            {values.hasWheeling && (
              <div className="space-y-3 rounded-md border border-ink-200 p-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-ink-400">Wheeling / Energy trading details</p>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-ink-900">Agreement type</label>
                  <select {...register('wheelingAgreementType')} className="h-10 w-full rounded-md border border-ink-200 bg-white px-3 text-sm focus:border-accent-500 focus:outline-none">
                    <option value="">Select…</option>
                    {(Object.entries(WHEELING_TYPE_LABELS) as [string, string][]).map(([v, l]) => (
                      <option key={v} value={v}>{l}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input label="Wheeling distance (km)" type="number" placeholder="15" {...register('wheelingDistanceKm')} />
                  <Input label="Trading partner / offtaker" placeholder="e.g. City Power" {...register('wheelingTradingPartner')} />
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Step 2: System Sizing & Design Philosophy ── */}
        {step === 2 && (
          <div className="space-y-5">
            <div className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-ink-400">System sizing</p>
              <Input
                label="Total rated AC capacity (kW)"
                type="number"
                placeholder="450"
                hint="Total AC inverter output — used for tier tracking and milestone selection"
                {...(errors.systemSizeKw?.message ? { error: errors.systemSizeKw.message } : {})}
                {...register('systemSizeKw')}
              />

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-ink-900">Grid connection</label>
                <div className="space-y-2">
                  {GRID_OPTIONS.map(opt => (
                    <label key={opt.value} className={cn(
                      'flex items-center gap-3 rounded-md border px-4 py-3 cursor-pointer transition-colors',
                      values.gridConnectionStatus === opt.value ? 'border-accent-500 bg-accent-50' : 'border-ink-200 hover:bg-ink-50'
                    )}>
                      <input type="radio" value={opt.value} {...register('gridConnectionStatus')} className="accent-accent-600" />
                      <span className="text-sm font-medium text-ink-900">{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t border-ink-100">
              <p className="text-xs font-semibold uppercase tracking-widest text-ink-400">Design objectives</p>
              <p className="text-xs text-ink-500">Select all that apply — these drive the design and O&amp;M approach.</p>
              <div className="grid grid-cols-1 gap-2">
                {(Object.entries(DESIGN_OBJECTIVE_LABELS) as [DesignObjective, string][]).map(([val, label]) => (
                  <label key={val} className={cn(
                    'flex items-center gap-3 rounded-md border px-4 py-3 cursor-pointer transition-colors',
                    values.designObjectives?.includes(val) ? 'border-accent-500 bg-accent-50' : 'border-ink-200 hover:bg-ink-50'
                  )}>
                    <Controller
                      name="designObjectives"
                      control={control}
                      render={({ field }) => (
                        <input
                          type="checkbox"
                          checked={field.value?.includes(val) ?? false}
                          onChange={e => {
                            const current = field.value ?? []
                            field.onChange(
                              e.target.checked
                                ? [...current, val]
                                : current.filter(v => v !== val)
                            )
                          }}
                          className="accent-accent-600"
                        />
                      )}
                    />
                    <span className="text-sm font-medium text-ink-900">{label}</span>
                  </label>
                ))}
              </div>
              {errors.designObjectives && (
                <p className="text-xs text-danger-500">Select at least one design objective.</p>
              )}
            </div>

            <div className="flex items-center gap-3 pt-2 border-t border-ink-100">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" {...register('exportToGrid')} className="accent-accent-600" />
                <span className="text-sm font-medium text-ink-900">Export surplus energy to grid (bidirectional metering)</span>
              </label>
            </div>

            {(values.hasBess || values.gridConnectionStatus === 'OFF_GRID') && (
              <Input
                label="Target backup autonomy (hours)"
                type="number"
                placeholder="4"
                hint="Total hours of backup at full site load"
                {...register('targetBackupHours')}
              />
            )}
          </div>
        )}

        {/* ── Step 3: Commercial ── */}
        {step === 3 && (
          <div className="space-y-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-ink-900">Deal structure</label>
              <div className="space-y-2">
                {DEAL_OPTIONS
                  .filter(o => o.value !== 'WHEELING_AGREEMENT' || values.hasWheeling)
                  .map(opt => (
                    <label key={opt.value} className={cn(
                      'flex items-center gap-3 rounded-md border px-4 py-3 cursor-pointer transition-colors',
                      values.dealStructure === opt.value ? 'border-accent-500 bg-accent-50' : 'border-ink-200 hover:bg-ink-50'
                    )}>
                      <input type="radio" value={opt.value} {...register('dealStructure')} className="accent-accent-600" />
                      <span className="text-sm font-medium text-ink-900">{opt.label}</span>
                    </label>
                  ))}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-ink-900">
                Client needs / motivation <span className="text-ink-400 font-normal">(optional)</span>
              </label>
              <textarea
                {...register('clientNeeds')}
                rows={3}
                placeholder="e.g. Reduce energy costs by 60%, achieve grid independence within 18 months"
                className="w-full rounded-md border border-ink-200 bg-white px-3 py-2 text-sm text-ink-900 placeholder:text-ink-400 focus:border-accent-500 focus:outline-none focus:shadow-ring resize-none"
              />
            </div>
          </div>
        )}

        {/* ── Step 4: Review ── */}
        {step === 4 && (
          <div className="space-y-4">
            <div className="rounded-md border border-ink-200 divide-y divide-ink-100">
              {[
                { label: 'Client', value: values.clientName },
                { label: 'Project name', value: values.name },
                { label: 'Location', value: `${values.city}, ${values.province}` },
                {
                  label: 'Technologies',
                  value: [
                    values.hasPv && 'Solar PV',
                    values.hasBess && 'BESS',
                    values.hasWind && 'Wind',
                    values.hasWheeling && 'Wheeling',
                  ].filter(Boolean).join(' + '),
                },
                { label: 'System size', value: `${values.systemSizeKw} kW AC` },
                { label: 'Grid connection', value: GRID_OPTIONS.find(o => o.value === values.gridConnectionStatus)?.label },
                { label: 'Deal structure', value: DEAL_OPTIONS.find(o => o.value === values.dealStructure)?.label },
                {
                  label: 'Design objectives',
                  value: values.designObjectives?.map(o => DESIGN_OBJECTIVE_LABELS[o]).join(', '),
                },
              ].map(row => (
                <div key={row.label} className="flex items-start justify-between px-4 py-3 gap-4">
                  <span className="text-xs text-ink-400 uppercase tracking-widest flex-shrink-0 w-36">{row.label}</span>
                  <span className="text-sm font-medium text-ink-900 text-right">{row.value ?? '—'}</span>
                </div>
              ))}
            </div>
            <div className="rounded-md bg-accent-50 border border-accent-100 px-4 py-3">
              <p className="text-xs text-accent-700 font-medium">Milestone template assigned automatically</p>
              <p className="text-xs text-accent-600 mt-0.5">
                Based on technology mix · {values.systemSizeKw} kW · {values.dealStructure}
              </p>
            </div>
            {error && <p className="text-sm text-danger-500">{error}</p>}
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6">
          <Button type="button" variant="ghost" onClick={() => setStep(s => s - 1)} disabled={step === 0}>
            Back
          </Button>
          {isLastStep ? (
            <Button type="submit" loading={isSubmitting}>Create project</Button>
          ) : (
            <Button type="button" onClick={() => setStep(s => s + 1)} disabled={!canAdvance()}>
              Continue
            </Button>
          )}
        </div>
      </form>
    </div>
  )
}
```

- [ ] **Step 2: Update the page that renders the wizard to load clients and pass `defaultClientId`**

Open `app/(app)/contractor/projects/new/page.tsx`. Replace its content with:

```typescript
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getClients } from '@/server/queries/clients'
import { NewProjectWizard } from './new-project-wizard'

type Props = { searchParams: Promise<{ clientId?: string }> }

export default async function NewProjectPage({ searchParams }: Props) {
  const session = await auth()
  if (!session) redirect('/login')

  const [clients, params] = await Promise.all([
    getClients(session.user.companyId),
    searchParams,
  ])

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-ink-900">New project</h1>
        <p className="text-sm text-ink-500 mt-1">Fill in the project details across the steps below.</p>
      </div>
      <NewProjectWizard
        clients={clients.map(c => ({
          id: c.id,
          name: c.name,
          industry: c.industry,
          contactName: c.contactName,
        }))}
        defaultClientId={params.clientId}
      />
    </div>
  )
}
```

- [ ] **Step 3: Update `server/actions/projects.ts` — accept techScope + clientRecordId, derive technology**

Replace the `CreateProjectSchema` and `createProject` function. Find:

```typescript
const CreateProjectSchema = z.object({
  name: z.string().min(3, 'Project name must be at least 3 characters'),
  clientName: z.string().min(2, 'Client name required'),
  technology: z.enum(['SOLAR_PV', 'WIND', 'BESS', 'HYBRID']),
  systemSizeKw: z.coerce.number().positive('System size must be positive'),
  dealStructure: z.enum(['OUTRIGHT', 'PPA', 'LEASE']),
  gridConnectionStatus: z.enum(['GRID_TIED', 'OFF_GRID', 'GRID_TIED_WITH_BACKUP']),
  addressLine: z.string().min(2),
  city: z.string().min(2),
  province: z.string().min(2),
  clientNeeds: z.string().optional(),
})
```

Replace with:

```typescript
const optNum = z.preprocess(
  v => (v === '' || v === undefined || v === null ? undefined : Number(v)),
  z.number().positive().optional()
)

const CreateProjectSchema = z.object({
  clientRecordId: z.string().optional(),
  clientName: z.string().min(2, 'Client name required'),
  name: z.string().min(3, 'Project name must be at least 3 characters'),
  addressLine: z.string().min(2),
  city: z.string().min(2),
  province: z.string().min(2),
  clientNeeds: z.string().optional(),

  // Tech scope
  hasPv: z.boolean(),
  hasBess: z.boolean(),
  hasWind: z.boolean(),
  hasWheeling: z.boolean(),
  pvCapacityKwp: optNum,
  pvPanelBrand: z.string().optional(),
  pvInverterBrand: z.string().optional(),
  pvMountingType: z.enum(['ROOFTOP', 'GROUND_MOUNT', 'CARPORT']).optional(),
  bessCapacityKwh: optNum,
  bessPowerKw: optNum,
  bessChemistry: z.enum(['LFP', 'NMC', 'VRLA']).optional(),
  bessBrandModel: z.string().optional(),
  bessAutonomyHours: optNum,
  windCapacityKw: optNum,
  windTurbineModel: z.string().optional(),
  windHubHeightM: optNum,
  wheelingAgreementType: z.enum(['VIRTUAL_NET_METERING', 'OPEN_ACCESS', 'BILATERAL']).optional(),
  wheelingDistanceKm: optNum,
  wheelingTradingPartner: z.string().optional(),

  // System design
  systemSizeKw: z.coerce.number().positive('System size must be positive'),
  gridConnectionStatus: z.enum(['GRID_TIED', 'OFF_GRID', 'GRID_TIED_WITH_BACKUP']),
  designObjectives: z.array(z.enum(['SELF_CONSUMPTION', 'PEAK_SHAVING', 'BACKUP', 'GRID_EXPORT'])),
  exportToGrid: z.boolean(),
  targetBackupHours: optNum,

  // Commercial
  dealStructure: z.enum(['OUTRIGHT', 'PPA', 'LEASE', 'WHEELING_AGREEMENT']),
})
```

Then find the line:
```typescript
  const data = parsed.data
```

Replace the block from there through the `project.create` call data with:

```typescript
  const data = parsed.data

  // Build techScope JSON
  const techScope = {
    hasPv: data.hasPv,
    hasBess: data.hasBess,
    hasWind: data.hasWind,
    hasWheeling: data.hasWheeling,
    ...(data.hasPv ? {
      pvCapacityKwp: data.pvCapacityKwp,
      pvPanelBrand: data.pvPanelBrand || undefined,
      pvInverterBrand: data.pvInverterBrand || undefined,
      pvMountingType: data.pvMountingType,
    } : {}),
    ...(data.hasBess ? {
      bessCapacityKwh: data.bessCapacityKwh,
      bessPowerKw: data.bessPowerKw,
      bessChemistry: data.bessChemistry,
      bessBrandModel: data.bessBrandModel || undefined,
      bessAutonomyHours: data.bessAutonomyHours,
    } : {}),
    ...(data.hasWind ? {
      windCapacityKw: data.windCapacityKw,
      windTurbineModel: data.windTurbineModel || undefined,
      windHubHeightM: data.windHubHeightM,
    } : {}),
    ...(data.hasWheeling ? {
      wheelingAgreementType: data.wheelingAgreementType,
      wheelingDistanceKm: data.wheelingDistanceKm,
      wheelingTradingPartner: data.wheelingTradingPartner || undefined,
    } : {}),
    designObjectives: data.designObjectives,
    exportToGrid: data.exportToGrid,
    targetBackupHours: data.targetBackupHours,
  }

  // Derive Technology enum for milestone template selection
  const primaryCount = [data.hasPv, data.hasBess, data.hasWind].filter(Boolean).length
  const technology = (
    primaryCount > 1 ? 'HYBRID' :
    data.hasBess ? 'BESS' :
    data.hasWind ? 'WIND' :
    'SOLAR_PV'
  ) as 'SOLAR_PV' | 'WIND' | 'BESS' | 'HYBRID'
```

Then in the `proj.create` data block, find `technology: data.technology,` and replace with:
```typescript
          technology,
          techScope,
          ...(data.clientRecordId ? { clientRecordId: data.clientRecordId } : {}),
```

And find `externalClientName: data.clientName,` — keep it as-is (it stores the plain text name for display regardless).

Also find `gridConnectionStatus: data.gridConnectionStatus,` and update `storageSizeKwh` mapping below it:
```typescript
          gridConnectionStatus: data.gridConnectionStatus,
          ...(data.hasBess && data.bessCapacityKwh ? { storageSizeKwh: data.bessCapacityKwh } : {}),
```

- [ ] **Step 4: Update `server/queries/projects.ts` to include `clientRecord` in `getProject`**

In `getProject`, find:
```typescript
      clientCompany: { select: { name: true } },
```
Add after it:
```typescript
      clientRecord: { select: { id: true, name: true } },
```

- [ ] **Step 5: Run typecheck to confirm no errors**

```bash
npm run typecheck
```
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add "app/(app)/contractor/projects/new/" server/actions/projects.ts server/queries/projects.ts
git commit -m "feat: 5-step project wizard — client picker + multi-tech scope + design philosophy"
```

---

## Task 7: Updated project overview page

**Files:**
- Modify: `app/(app)/contractor/projects/[id]/overview/page.tsx`

Show the techScope details in structured cards below the main info table.

- [ ] **Step 1: Update the overview page**

Replace the file content with:

```typescript
import { auth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { getProject } from '@/server/queries/projects'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDate } from '@/lib/utils'
import type { TechScope } from '@/lib/tech-scope'
import {
  DESIGN_OBJECTIVE_LABELS, BESS_CHEMISTRY_LABELS,
  MOUNTING_TYPE_LABELS, WHEELING_TYPE_LABELS,
} from '@/lib/tech-scope'

type Props = { params: Promise<{ id: string }> }

const TECH_LABELS: Record<string, string> = {
  SOLAR_PV: 'Solar PV', WIND: 'Wind', BESS: 'BESS', HYBRID: 'Hybrid',
}
const DEAL_LABELS: Record<string, string> = {
  OUTRIGHT: 'Outright', PPA: 'PPA', LEASE: 'Lease', WHEELING_AGREEMENT: 'Wheeling agreement',
}
const GRID_LABELS: Record<string, string> = {
  GRID_TIED: 'Grid-tied', OFF_GRID: 'Off-grid', GRID_TIED_WITH_BACKUP: 'Grid-tied with backup',
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between py-3 first:pt-0 last:pb-0">
      <dt className="text-xs text-ink-400 uppercase tracking-widest w-44 flex-shrink-0">{label}</dt>
      <dd className="text-sm text-ink-900 text-right flex-1">{value}</dd>
    </div>
  )
}

export default async function OverviewPage({ params }: Props) {
  const { id } = await params
  const session = await auth()
  if (!session) redirect('/login')

  const project = await getProject(id, session.user.companyId)
  if (!project) notFound()

  const scope = project.techScope as TechScope | null

  const clientName = project.clientRecord?.name ?? project.clientCompany?.name ?? project.externalClientName ?? '—'

  const technologies = scope
    ? [
        scope.hasPv && 'Solar PV',
        scope.hasBess && 'Battery Storage (BESS)',
        scope.hasWind && 'Wind',
        scope.hasWheeling && 'Wheeling / Energy Trading',
      ].filter(Boolean).join(', ')
    : TECH_LABELS[project.technology] ?? project.technology

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6 overflow-y-auto h-full">

      {/* Main info */}
      <Card>
        <CardHeader><CardTitle>Project details</CardTitle></CardHeader>
        <CardContent>
          <dl className="divide-y divide-ink-100">
            <InfoRow label="Client" value={clientName} />
            <InfoRow label="Technologies" value={technologies} />
            <InfoRow label="System size" value={`${project.systemSizeKw} kW AC${project.storageSizeKwh ? ` + ${project.storageSizeKwh} kWh storage` : ''}`} />
            <InfoRow label="Deal structure" value={DEAL_LABELS[project.dealStructure] ?? project.dealStructure} />
            <InfoRow label="Grid connection" value={GRID_LABELS[project.gridConnectionStatus] ?? project.gridConnectionStatus} />
            <InfoRow label="Site" value={`${project.site.addressLine}, ${project.site.city}, ${project.site.province}`} />
            <InfoRow label="Created" value={formatDate(project.createdAt)} />
          </dl>
        </CardContent>
      </Card>

      {/* Tech scope detail cards */}
      {scope && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

          {scope.hasPv && (
            <Card>
              <CardHeader><CardTitle>Solar PV</CardTitle></CardHeader>
              <CardContent>
                <dl className="divide-y divide-ink-100">
                  {scope.pvCapacityKwp && <InfoRow label="Capacity" value={`${scope.pvCapacityKwp} kWp`} />}
                  {scope.pvPanelBrand && <InfoRow label="Panel brand" value={scope.pvPanelBrand} />}
                  {scope.pvInverterBrand && <InfoRow label="Inverter brand" value={scope.pvInverterBrand} />}
                  {scope.pvMountingType && <InfoRow label="Mounting" value={MOUNTING_TYPE_LABELS[scope.pvMountingType]} />}
                </dl>
              </CardContent>
            </Card>
          )}

          {scope.hasBess && (
            <Card>
              <CardHeader><CardTitle>Battery Storage</CardTitle></CardHeader>
              <CardContent>
                <dl className="divide-y divide-ink-100">
                  {scope.bessCapacityKwh && <InfoRow label="Capacity" value={`${scope.bessCapacityKwh} kWh`} />}
                  {scope.bessPowerKw && <InfoRow label="Power rating" value={`${scope.bessPowerKw} kW`} />}
                  {scope.bessChemistry && <InfoRow label="Chemistry" value={BESS_CHEMISTRY_LABELS[scope.bessChemistry]} />}
                  {scope.bessBrandModel && <InfoRow label="Brand / model" value={scope.bessBrandModel} />}
                  {scope.bessAutonomyHours && <InfoRow label="Target autonomy" value={`${scope.bessAutonomyHours} hours`} />}
                </dl>
              </CardContent>
            </Card>
          )}

          {scope.hasWind && (
            <Card>
              <CardHeader><CardTitle>Wind</CardTitle></CardHeader>
              <CardContent>
                <dl className="divide-y divide-ink-100">
                  {scope.windCapacityKw && <InfoRow label="Capacity" value={`${scope.windCapacityKw} kW`} />}
                  {scope.windTurbineModel && <InfoRow label="Turbine model" value={scope.windTurbineModel} />}
                  {scope.windHubHeightM && <InfoRow label="Hub height" value={`${scope.windHubHeightM} m`} />}
                </dl>
              </CardContent>
            </Card>
          )}

          {scope.hasWheeling && (
            <Card>
              <CardHeader><CardTitle>Wheeling / Trading</CardTitle></CardHeader>
              <CardContent>
                <dl className="divide-y divide-ink-100">
                  {scope.wheelingAgreementType && <InfoRow label="Agreement type" value={WHEELING_TYPE_LABELS[scope.wheelingAgreementType]} />}
                  {scope.wheelingDistanceKm && <InfoRow label="Wheeling distance" value={`${scope.wheelingDistanceKm} km`} />}
                  {scope.wheelingTradingPartner && <InfoRow label="Trading partner" value={scope.wheelingTradingPartner} />}
                </dl>
              </CardContent>
            </Card>
          )}

          {(scope.designObjectives?.length > 0) && (
            <Card className="sm:col-span-2">
              <CardHeader><CardTitle>Design philosophy</CardTitle></CardHeader>
              <CardContent>
                <dl className="divide-y divide-ink-100">
                  <InfoRow
                    label="Objectives"
                    value={scope.designObjectives.map(o => DESIGN_OBJECTIVE_LABELS[o]).join(', ')}
                  />
                  {scope.targetBackupHours && <InfoRow label="Backup autonomy" value={`${scope.targetBackupHours} hours`} />}
                  <InfoRow label="Grid export" value={scope.exportToGrid ? 'Yes — bidirectional metering' : 'No'} />
                </dl>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {project.clientNeeds && (
        <Card>
          <CardHeader><CardTitle>Client needs</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm text-ink-700 leading-relaxed">{project.clientNeeds}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Run typecheck + lint**

```bash
npm run typecheck && npm run lint
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add "app/(app)/contractor/projects/[id]/overview/page.tsx"
git commit -m "feat: project overview — tech scope detail cards per technology + design philosophy"
```

---

## Self-Review

**1. Spec coverage:**
- ✅ Client CRM — ClientRecord model, create/edit/list/detail pages, sidebar nav
- ✅ Multiple projects per client — client detail page shows project grid; new project pre-fills clientId from URL
- ✅ Multi-select technology — PV, BESS, Wind, Wheeling with conditional sub-fields per selection
- ✅ Design philosophy — designObjectives (multi-select), exportToGrid, targetBackupHours
- ✅ Wheeling / Energy Trading — tech flag + agreement type + WHEELING_AGREEMENT deal structure
- ✅ Project overview shows full tech scope breakdown
- ✅ Existing `technology` enum + milestone template selection unchanged

**2. Placeholder scan:** None — every step contains actual code.

**3. Type consistency:**
- `TechScope` type defined in Task 2 and imported in Tasks 6 + 7 — consistent.
- `deriveTechnology` in `lib/tech-scope.ts` is used inline in Task 6 (server action) — same logic.
- `ClientOption` type exported from `client-picker.tsx`, imported in wizard — consistent.
- `getClientById` returns `projects` with `site` + `milestones` — matches `ProjectCard` expected shape.
