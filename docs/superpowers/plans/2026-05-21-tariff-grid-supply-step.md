# Tariff & Grid Supply Step Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Insert a "Tariff & grid supply" step (new Step 1) into the project creation wizard, capturing the site's electricity supplier, tariff category, NMD, supply voltage, and transformer capacity — all of which drive downstream milestone requirements, grid application paths, and system sizing constraints.

**Architecture:** A new `siteInfo Json?` field is added to `Project` (same pattern as `techScope`) — no relational model needed since supply info is project-specific. A `lib/site-info.ts` module holds the `SiteInfo` TypeScript type, SA electricity supplier constants, tariff lists per supplier, and the smart guidance logic. The wizard expands from 4 to 5 steps: `['Client & site', 'Tariff & grid supply', 'System scope & design', 'Commercial', 'Review']`. The `canAdvance()` guard for Step 1 requires supplier, NMD > 0, and supply voltage at minimum.

**Tech Stack:** Next.js 15 App Router, Prisma 7, React Hook Form + Zod, TypeScript strict, Tailwind CSS, Vitest.

---

## Domain context (read before touching any code)

In South Africa, every C&I site is supplied by either:
- **Eskom directly** — large industrial / rural customers on Eskom distribution
- **A municipal utility** — most urban/suburban commercial (City Power, eThekwini, Tshwane, etc.)

Key fields and why they matter:

| Field | Why it matters |
|---|---|
| **Electricity supplier** | Determines application path, tariff structure, and interacting authority for grid approvals |
| **Tariff category** | Megaflex (Eskom TOU) vs flat rate vs LPU TOU — drives financial model and BESS arbitrage viability |
| **Is TOU tariff?** | Auto-derived from tariff selection. If TOU → BESS arbitrage is a viable design objective |
| **NMD (Notified Maximum Demand, kVA)** | Contracted max demand. SA regulations typically limit embedded generation to ≤ 100% of NMD. Determines schedule 2 / NERSA registration thresholds |
| **Supply voltage** | LV (<1 kV) / MV (1–33 kV) / HV (>33 kV). Drives protection relay requirements and who signs off applications |
| **Transformer capacity (kVA)** | Physical transformer limit. Critical for export-to-grid scenarios — export > 30% of transformer capacity often triggers reinforcement study |

---

## File map

**New files:**
- `lib/site-info.ts` — `SiteInfo` type, all SA supplier/tariff/municipality constants, `guidanceForSupplier()`

**Modified files:**
- `prisma/schema.prisma` — add `siteInfo Json?` to `Project` model
- `app/(app)/contractor/projects/new/new-project-wizard.tsx` — insert Step 1 (Tariff & grid supply), update schema + `canAdvance()`
- `server/actions/projects.ts` — add siteInfo fields to `CreateProjectSchema`, build `siteInfo` JSON in action
- `app/(app)/contractor/projects/[id]/overview/page.tsx` — add "Site supply" info card

---

## Task 1: Schema migration — add `siteInfo` to Project

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Add `siteInfo Json?` to the Project model**

In `prisma/schema.prisma`, find:
```prisma
  clientNeeds String?
  techScope   Json? // TechScope type — see lib/tech-scope.ts
```
Add `siteInfo` on the line after `techScope`:
```prisma
  clientNeeds String?
  techScope   Json? // TechScope type — see lib/tech-scope.ts
  siteInfo    Json? // SiteInfo type — see lib/site-info.ts
```

- [ ] **Step 2: Run migration**

```powershell
cd "C:\Users\ricar\OneDrive\Desktop\Phoenix Energy\SEE Prototype\see-platform-prototype"
npx prisma migrate dev --name add_project_site_info
npx prisma generate
```

Expected: migration created and applied, `Project.siteInfo` available in generated client.

- [ ] **Step 3: Run typecheck**

```powershell
npm run typecheck
```

Expected: clean.

- [ ] **Step 4: Commit**

```powershell
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat: schema — add Project.siteInfo Json field"
```

---

## Task 2: `lib/site-info.ts` — types and constants

**Files:**
- Create: `lib/site-info.ts`
- Create: `lib/__tests__/site-info.test.ts`

- [ ] **Step 1: Write the failing test**

Create `lib/__tests__/site-info.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { isTOUTariff, guidanceForSupplier, ESKOM_TARIFFS, MUNICIPAL_TARIFFS } from '../site-info'

describe('isTOUTariff', () => {
  it('returns true for Megaflex', () => {
    expect(isTOUTariff('ESKOM', 'MEGAFLEX')).toBe(true)
  })

  it('returns false for Businessrate', () => {
    expect(isTOUTariff('ESKOM', 'BUSINESSRATE')).toBe(false)
  })

  it('returns true for LPU TOU', () => {
    expect(isTOUTariff('MUNICIPAL', 'LPU_TOU')).toBe(true)
  })

  it('returns false for SPU', () => {
    expect(isTOUTariff('MUNICIPAL', 'SPU')).toBe(false)
  })

  it('returns false for unknown tariff', () => {
    expect(isTOUTariff('ESKOM', 'UNKNOWN')).toBe(false)
  })
})

describe('guidanceForSupplier', () => {
  it('returns Eskom guidance for ESKOM', () => {
    const g = guidanceForSupplier('ESKOM')
    expect(g).toContain('Eskom')
  })

  it('returns municipal guidance for MUNICIPAL', () => {
    const g = guidanceForSupplier('MUNICIPAL')
    expect(g).toContain('municipal')
  })
})

describe('tariff lists', () => {
  it('all Eskom tariffs have a value and label', () => {
    ESKOM_TARIFFS.forEach(t => {
      expect(t.value).toBeTruthy()
      expect(t.label).toBeTruthy()
      expect(typeof t.isTOU).toBe('boolean')
    })
  })

  it('all municipal tariffs have a value and label', () => {
    MUNICIPAL_TARIFFS.forEach(t => {
      expect(t.value).toBeTruthy()
      expect(t.label).toBeTruthy()
      expect(typeof t.isTOU).toBe('boolean')
    })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```powershell
npx vitest run lib/__tests__/site-info.test.ts
```

Expected: FAIL — `Cannot find module '../site-info'`

- [ ] **Step 3: Create `lib/site-info.ts`**

```typescript
// lib/site-info.ts

export type ElectricitySupplier = 'ESKOM' | 'MUNICIPAL'
export type SupplyVoltage = 'LV' | 'MV' | 'HV'

export type SiteInfo = {
  supplier: ElectricitySupplier
  municipalityName?: string       // when supplier === 'MUNICIPAL'
  tariffName?: string             // value from ESKOM_TARIFFS or MUNICIPAL_TARIFFS
  isTOU: boolean                  // auto-derived from tariffName; affects BESS arbitrage indicator
  nmdKva: number                  // Notified Maximum Demand — gates embedded generation size
  supplyVoltage: SupplyVoltage
  transformerCapacityKva?: number // physical transformer limit; relevant for export scenarios
  accountNumber?: string          // utility account / meter reference (optional, for records)
}

// ── Tariff definitions ────────────────────────────────────────────────────────

type TariffOption = { value: string; label: string; isTOU: boolean }

export const ESKOM_TARIFFS: TariffOption[] = [
  { value: 'MEGAFLEX',       label: 'Megaflex (TOU)',              isTOU: true  },
  { value: 'MINIFLEX',       label: 'Miniflex',                    isTOU: false },
  { value: 'RURAFLEX',       label: 'Ruraflex',                    isTOU: false },
  { value: 'NIGHTSAVE_URBAN',label: 'Nightsave Urban (TOU)',       isTOU: true  },
  { value: 'BUSINESSRATE',   label: 'Businessrate',                isTOU: false },
  { value: 'HOMEFLEX',       label: 'Homeflex (TOU)',              isTOU: true  },
  { value: 'ESKOM_OTHER',    label: 'Other Eskom tariff',          isTOU: false },
]

export const MUNICIPAL_TARIFFS: TariffOption[] = [
  { value: 'LPU_TOU',         label: 'Large Power User (LPU) — TOU',      isTOU: true  },
  { value: 'LPU_FLAT',        label: 'Large Power User (LPU) — Flat rate', isTOU: false },
  { value: 'SPU',             label: 'Small Power User (SPU)',             isTOU: false },
  { value: 'COMMERCIAL_TOU',  label: 'Commercial — TOU',                  isTOU: true  },
  { value: 'COMMERCIAL_FLAT', label: 'Commercial — Flat rate',            isTOU: false },
  { value: 'GENERAL_SUPPLY',  label: 'General Supply',                    isTOU: false },
  { value: 'MUNICIPAL_OTHER', label: 'Other municipal tariff',            isTOU: false },
]

// ── Municipality list ─────────────────────────────────────────────────────────

export const SA_MUNICIPALITIES: string[] = [
  'City Power (Johannesburg)',
  'City of Tshwane',
  'Ekurhuleni',
  'eThekwini (Durban)',
  'City of Cape Town',
  'Mangaung (Bloemfontein)',
  'Nelson Mandela Bay (Gqeberha)',
  'Buffalo City (East London)',
  'Sol Plaatje (Kimberley)',
  'Msunduzi (Pietermaritzburg)',
  'Drakenstein (Paarl)',
  'Stellenbosch',
  'George',
  'Polokwane',
  'Emalahleni (Witbank)',
  'Steve Tshwete (Middelburg)',
  'Matlosana (Klerksdorp)',
  'Rustenburg',
  'Thulamela (Thohoyandou)',
  'Mbombela (Nelspruit)',
  'Other municipality',
]

// ── Supply voltage labels ─────────────────────────────────────────────────────

export const SUPPLY_VOLTAGE_OPTIONS: { value: SupplyVoltage; label: string; sub: string }[] = [
  { value: 'LV', label: 'Low Voltage (LV)', sub: '< 1 kV — typical small to medium commercial' },
  { value: 'MV', label: 'Medium Voltage (MV)', sub: '1–33 kV — large commercial / industrial' },
  { value: 'HV', label: 'High Voltage (HV)', sub: '> 33 kV — very large industrial / transmission' },
]

// ── Utility functions ─────────────────────────────────────────────────────────

const ALL_TARIFFS: TariffOption[] = [...ESKOM_TARIFFS, ...MUNICIPAL_TARIFFS]

export function isTOUTariff(supplier: ElectricitySupplier, tariffValue: string): boolean {
  const match = ALL_TARIFFS.find(t => t.value === tariffValue)
  return match?.isTOU ?? false
}

export function getTariffsForSupplier(supplier: ElectricitySupplier): TariffOption[] {
  if (supplier === 'ESKOM') return ESKOM_TARIFFS
  return MUNICIPAL_TARIFFS
}

export function guidanceForSupplier(supplier: ElectricitySupplier): string {
  if (supplier === 'ESKOM') {
    return 'Eskom embedded generation: systems < 1 MW require Schedule 2 notification. ' +
      'Applications submitted via Eskom C&I online portal. MV/HV connections may require ' +
      'dedicated protection relay study and Eskom approval before commissioning.'
  }
  return 'Municipal embedded generation: approval required from the local utility in addition ' +
    'to any NERSA registration. Most municipalities require a formal application, technical ' +
    'review, and anti-islanding protection before grid connection is permitted.'
}
```

- [ ] **Step 4: Run test to verify it passes**

```powershell
npx vitest run lib/__tests__/site-info.test.ts
```

Expected: all 9 tests PASS.

- [ ] **Step 5: Commit**

```powershell
git add lib/site-info.ts "lib/__tests__/site-info.test.ts"
git commit -m "feat: SiteInfo type, SA tariff constants, municipality list, guidance util"
```

---

## Task 3: Updated wizard — insert Step 1 (Tariff & grid supply)

**Files:**
- Modify: `app/(app)/contractor/projects/new/new-project-wizard.tsx`

The wizard goes from 4 to 5 steps:
`['Client & site', 'Tariff & grid supply', 'System scope & design', 'Commercial', 'Review']`

Step 1 layout (in order):
1. Electricity supplier — 2 radio tiles (Eskom / Municipal)
2. Municipality dropdown — searchable `<select>` (only when MUNICIPAL)
3. Tariff category — dynamic `<select>` based on supplier
5. Supply voltage — 3 radio tiles (LV / MV / HV)
6. NMD (kVA) — required number input
7. Transformer capacity (kVA) — optional number input
8. Account / meter number — optional text input
9. Smart guidance banner — informational, derived from `supplier`

**`canAdvance()` for step 1:** requires `supplier`, `nmdKva > 0`, `supplyVoltage`. Municipal also requires `municipalityName`.

- [ ] **Step 1: Add siteInfo fields to the form schema**

At the top of the Zod schema object, find the comment `// Step 0 — Client & site`. Insert a new section after all the Step 0 fields (after `province: z.string().min(2, 'Province required'),`):

```typescript
  // Step 1 — Tariff & grid supply
  supplier: z.enum(['ESKOM', 'MUNICIPAL']),
  municipalityName: z.string().optional(),
  tariffName: z.string().optional(),
  isTOU: z.boolean(),
  nmdKva: z.coerce.number().positive('NMD required'),
  supplyVoltage: z.enum(['LV', 'MV', 'HV']),
  transformerCapacityKva: optNum,
  accountNumber: z.string().optional(),
```

- [ ] **Step 2: Add siteInfo imports and update the STEPS constant**

At the top of the file, add to the existing imports block:

```typescript
import {
  ESKOM_TARIFFS, MUNICIPAL_TARIFFS, SA_MUNICIPALITIES,
  SUPPLY_VOLTAGE_OPTIONS, getTariffsForSupplier, guidanceForSupplier, isTOUTariff,
} from '@/lib/site-info'
import type { ElectricitySupplier } from '@/lib/site-info'
```

Change the `STEPS` constant from:
```typescript
const STEPS = ['Client & site', 'System scope & design', 'Commercial', 'Review']
```
to:
```typescript
const STEPS = ['Client & site', 'Tariff & grid supply', 'System scope & design', 'Commercial', 'Review']
```

- [ ] **Step 3: Add siteInfo default values to `useForm`**

In the `useForm` `defaultValues`, add:

```typescript
      supplier: 'MUNICIPAL' as ElectricitySupplier,
      isTOU: false,
      supplyVoltage: 'LV' as const,
      nmdKva: undefined,
```

- [ ] **Step 4: Update `canAdvance()` to handle Step 1**

In the `canAdvance()` function, the current step 1 check is for tech scope. Insert a new check before it — the old step 1 check shifts to step 2:

Replace the entire `canAdvance` function with:

```typescript
  function canAdvance(): boolean {
    if (step === 0) {
      return !!(values.clientName?.length >= 2 && values.name?.length >= 3 &&
        values.addressLine?.length >= 2 && values.city?.length >= 2 && values.province?.length >= 2)
    }
    if (step === 1) {
      if (!values.supplier) return false
      if (values.supplier === 'MUNICIPAL' && !values.municipalityName) return false
      if (!values.nmdKva || values.nmdKva <= 0) return false
      if (!values.supplyVoltage) return false
      return true
    }
    if (step === 2) {
      if (!anyTechSelected) return false
      if (needsTopology && !values.inverterTopology) return false
      if (values.hasPv && !values.pvInverterKw) return false
      if (values.hasBess && !values.hasPv && !values.bessInverterKw) return false
      if (values.hasBess && values.inverterTopology === 'SEPARATE_GTI_PCS' && !values.bessInverterKw) return false
      if (!values.designObjectives?.length) return false
      return true
    }
    return true
  }
```

- [ ] **Step 5: Add a `useEffect` to auto-derive `isTOU` from tariff selection**

After the `canAdvance` function, add:

```typescript
  // Auto-derive isTOU when tariff changes
  const watchedTariff = values.tariffName
  const watchedSupplier = values.supplier
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const prevTariffRef = React.useRef<string | undefined>(undefined)
  if (watchedTariff !== prevTariffRef.current) {
    prevTariffRef.current = watchedTariff
    if (watchedTariff && watchedSupplier) {
      setValue('isTOU', isTOUTariff(watchedSupplier, watchedTariff))
    }
  }
```

Add `import React from 'react'` at the top if not already present (Next.js 19 with the new JSX transform doesn't require it, so instead use `useRef` and `useEffect` directly):

```typescript
  // Auto-derive isTOU when the tariff selection changes
  const watchedTariff = values.tariffName
  React.useEffect(() => {
    if (watchedTariff && values.supplier) {
      setValue('isTOU', isTOUTariff(values.supplier, watchedTariff))
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchedTariff, values.supplier])
```

Since `'use client'` components in Next.js 15 can use hooks directly, and React is available as a global import in the file already via `useState`, use `useEffect` from the existing React import. Add `useEffect` to the existing destructuring:

Find: `import { useState } from 'react'`
Replace with: `import { useState, useEffect } from 'react'`

Then add the effect after the `pvInverterLabel` derivation:

```typescript
  useEffect(() => {
    if (values.tariffName && values.supplier) {
      setValue('isTOU', isTOUTariff(values.supplier, values.tariffName))
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values.tariffName, values.supplier])
```

Also reset tariff when supplier changes:

```typescript
  useEffect(() => {
    setValue('tariffName', undefined)
    setValue('isTOU', false)
    if (values.supplier !== 'MUNICIPAL') setValue('municipalityName', undefined)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values.supplier])
```

- [ ] **Step 6: Add the Step 1 JSX block**

After the closing `)}` of the `{step === 0 && ...}` block and before the `{step === 1 && ...}` block (which currently renders tech scope), insert:

```tsx
        {/* ── Step 1: Tariff & Grid Supply ── */}
        {step === 1 && (
          <div className="space-y-6">

            {/* Electricity supplier */}
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-ink-400">Electricity supplier</p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {([
                  { value: 'ESKOM' as const, label: 'Eskom', sub: 'Direct Eskom supply area' },
                  { value: 'MUNICIPAL' as const, label: 'Municipal utility', sub: 'City / municipality supplied' },
                ]).map(({ value, label, sub }) => (
                  <label key={value} className={cn(
                    'flex items-start gap-3 rounded-md border px-4 py-3 cursor-pointer transition-colors',
                    values.supplier === value ? 'border-accent-500 bg-accent-50' : 'border-ink-200 hover:bg-ink-50'
                  )}>
                    <input type="radio" value={value} {...register('supplier')} className="mt-0.5 accent-accent-600" />
                    <div>
                      <p className="text-sm font-medium text-ink-900">{label}</p>
                      <p className="text-xs text-ink-500">{sub}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Municipality picker */}
            {values.supplier === 'MUNICIPAL' && (
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-ink-900">Municipality / utility</label>
                <select
                  {...register('municipalityName')}
                  className="h-10 w-full rounded-md border border-ink-200 bg-white px-3 text-sm text-ink-900 focus:border-accent-500 focus:outline-none focus:shadow-ring"
                >
                  <option value="">Select municipality…</option>
                  {SA_MUNICIPALITIES.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
                {!values.municipalityName && (
                  <p className="text-xs text-danger-500">Select the supplying municipality to continue.</p>
                )}
              </div>
            )}

            {/* Tariff category */}
            {(
              <div className="space-y-2">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-ink-900">
                    Tariff category <span className="text-ink-400 font-normal">(optional — helps with financial modelling)</span>
                  </label>
                  <select
                    {...register('tariffName')}
                    className="h-10 w-full rounded-md border border-ink-200 bg-white px-3 text-sm text-ink-900 focus:border-accent-500 focus:outline-none focus:shadow-ring"
                  >
                    <option value="">Select tariff…</option>
                    {getTariffsForSupplier(values.supplier).map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
                {values.isTOU && (
                  <div className="flex items-center gap-2 rounded-md bg-accent-50 border border-accent-100 px-3 py-2">
                    <span className="text-[10px] font-semibold text-accent-600 uppercase tracking-wide">TOU tariff</span>
                    <span className="text-xs text-ink-600">BESS arbitrage and peak-shaving strategies are applicable.</span>
                  </div>
                )}
              </div>
            )}

            {/* Supply capacity */}
            <div className="space-y-4 pt-2 border-t border-ink-100">
              <p className="text-xs font-semibold uppercase tracking-widest text-ink-400">Supply capacity</p>

              <Input
                label="NMD — Notified Maximum Demand (kVA)"
                type="number"
                placeholder="500"
                hint="Your contracted maximum demand. Embedded generation typically limited to ≤ 100% of NMD."
                {...register('nmdKva')}
              />

              <div className="space-y-2">
                <p className="text-sm font-medium text-ink-900">Connection / supply voltage</p>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  {SUPPLY_VOLTAGE_OPTIONS.map(opt => (
                    <label key={opt.value} className={cn(
                      'flex items-start gap-3 rounded-md border px-3 py-2.5 cursor-pointer transition-colors',
                      values.supplyVoltage === opt.value ? 'border-accent-500 bg-accent-50' : 'border-ink-200 hover:bg-ink-50'
                    )}>
                      <input type="radio" value={opt.value} {...register('supplyVoltage')} className="mt-0.5 accent-accent-600" />
                      <div>
                        <p className="text-sm font-medium text-ink-900">{opt.label}</p>
                        <p className="text-xs text-ink-500">{opt.sub}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Transformer capacity (kVA)"
                  type="number"
                  placeholder="630"
                  hint="Optional — relevant for grid export scenarios"
                  {...register('transformerCapacityKva')}
                />
                <Input
                  label="Account / meter number"
                  placeholder="e.g. 30-4567-8901"
                  hint="Optional — utility account reference"
                  {...register('accountNumber')}
                />
              </div>
            </div>

            {/* Smart guidance note */}
            {values.supplier && (
              <div className="rounded-md bg-ink-50 border border-ink-200 px-4 py-3 space-y-1">
                <p className="text-xs font-semibold text-ink-700">Application guidance</p>
                <p className="text-xs text-ink-500 leading-relaxed">
                  {guidanceForSupplier(values.supplier)}
                </p>
              </div>
            )}
          </div>
        )}
```

- [ ] **Step 7: Shift existing step indices in the JSX**

The step 1 (tech scope) block was `{step === 1 && ...}`. It must now be `{step === 2 && ...}`. Similarly step 2 (Commercial) → 3, step 3 (Review) → 4.

Find and replace these four occurrences:

| Old | New |
|---|---|
| `{step === 1 && (` (tech scope — second occurrence after new step 1 block) | `{step === 2 && (` |
| `{/* ── Step 2: Commercial ── */}` and `{step === 2 && (` | `{/* ── Step 2: Commercial ── */}` → `{/* ── Step 3: Commercial ── */}` and `{step === 3 && (` |
| `{/* ── Step 3: Review ── */}` and `{step === 3 && (` | `{/* ── Step 4: Review ── */}` and `{step === 4 && (` |

**Important:** The tech scope step already has its own content block opened with `{step === 1 && (` — after inserting the new step 1 block, change that to `{step === 2 && (`.

- [ ] **Step 8: Update the Review step to include tariff summary rows**

In the Review step (now `step === 4`), after the `{ label: 'Location', value: ...}` row and before `{ label: 'Technologies', ...}`, add:

```tsx
                { label: 'Supplier', value: values.supplier === 'ESKOM' ? 'Eskom' : (values.municipalityName ?? 'Municipal utility') },
                { label: 'Tariff', value: values.tariffName ? `${[...ESKOM_TARIFFS, ...MUNICIPAL_TARIFFS].find(t => t.value === values.tariffName)?.label ?? values.tariffName}${values.isTOU ? ' (TOU)' : ''}` : '—' },
                { label: 'NMD', value: values.nmdKva ? `${values.nmdKva} kVA` : '—' },
                { label: 'Supply voltage', value: values.supplyVoltage },
```

- [ ] **Step 9: Run typecheck + lint**

```powershell
npm run typecheck && npm run lint
```

Expected: clean.

- [ ] **Step 10: Commit**

```powershell
git add "app/(app)/contractor/projects/new/new-project-wizard.tsx"
git commit -m "feat: insert Tariff & grid supply step — supplier, tariff, NMD, voltage"
```

---

## Task 4: Update `createProject` server action

**Files:**
- Modify: `server/actions/projects.ts`

- [ ] **Step 1: Add siteInfo import and schema fields**

Add import at the top of `server/actions/projects.ts` after the existing imports:

```typescript
import { isTOUTariff } from '@/lib/site-info'
```

In `CreateProjectSchema`, after the `clientNeeds` field and before `// Tech scope flags`, add:

```typescript
  // Tariff & grid supply
  supplier: z.enum(['ESKOM', 'MUNICIPAL']),
  municipalityName: z.string().optional(),
  tariffName: z.string().optional(),
  isTOU: z.boolean(),
  nmdKva: z.coerce.number().positive('NMD is required'),
  supplyVoltage: z.enum(['LV', 'MV', 'HV']),
  transformerCapacityKva: optNum,
  accountNumber: z.string().optional(),
```

- [ ] **Step 2: Build the `siteInfo` JSON object in `createProject`**

After the `techScope` block (after the `}` that closes the techScope object) and before the `try {` block, add:

```typescript
  const siteInfo = {
    supplier: data.supplier,
    ...(data.supplier === 'MUNICIPAL' ? { municipalityName: data.municipalityName } : {}),
    tariffName: data.tariffName || undefined,
    isTOU: data.isTOU,
    nmdKva: data.nmdKva,
    supplyVoltage: data.supplyVoltage,
    ...(data.transformerCapacityKva ? { transformerCapacityKva: data.transformerCapacityKva } : {}),
    ...(data.accountNumber ? { accountNumber: data.accountNumber } : {}),
  }
```

- [ ] **Step 3: Pass `siteInfo` to `tx.project.create`**

In the `tx.project.create({ data: { ... } })` call, find:

```typescript
          techScope,
```

Add `siteInfo` on the line after it:

```typescript
          techScope,
          siteInfo,
```

- [ ] **Step 4: Run typecheck**

```powershell
npm run typecheck
```

Expected: clean.

- [ ] **Step 5: Commit**

```powershell
git add server/actions/projects.ts
git commit -m "feat: createProject — accept and store siteInfo (tariff, NMD, voltage)"
```

---

## Task 5: Update project overview page — Site supply card

**Files:**
- Modify: `app/(app)/contractor/projects/[id]/overview/page.tsx`

- [ ] **Step 1: Add SiteInfo import**

Add to the existing lib imports:

```typescript
import type { SiteInfo } from '@/lib/site-info'
import { ESKOM_TARIFFS, MUNICIPAL_TARIFFS } from '@/lib/site-info'
```

- [ ] **Step 2: Add a "Site supply" Card between the main info card and the tech scope cards**

After the closing `</Card>` of the main info card and before `{/* Tech scope detail cards */}`, insert:

```tsx
      {/* Site supply card */}
      {project.siteInfo && (() => {
        const s = project.siteInfo as SiteInfo
        const allTariffs = [...ESKOM_TARIFFS, ...MUNICIPAL_TARIFFS]
        const tariffLabel = s.tariffName
          ? allTariffs.find(t => t.value === s.tariffName)?.label ?? s.tariffName
          : null

        const supplierLabel =
          s.supplier === 'ESKOM' ? 'Eskom' :
          (s.municipalityName ?? 'Municipal utility')

        return (
          <Card>
            <CardHeader><CardTitle>Site supply</CardTitle></CardHeader>
            <CardContent>
              <dl className="divide-y divide-ink-100">
                <InfoRow label="Supplier" value={supplierLabel} />
                {tariffLabel && (
                  <InfoRow
                    label="Tariff"
                    value={
                      <span className="flex items-center gap-2 justify-end">
                        {tariffLabel}
                        {s.isTOU && (
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-sm bg-accent-500/10 text-accent-600">TOU</span>
                        )}
                      </span>
                    }
                  />
                )}
                <InfoRow label="NMD" value={`${s.nmdKva} kVA`} />
                <InfoRow label="Supply voltage" value={s.supplyVoltage} />
                {s.transformerCapacityKva && (
                  <InfoRow label="Transformer" value={`${s.transformerCapacityKva} kVA`} />
                )}
                {s.accountNumber && (
                  <InfoRow label="Account ref." value={s.accountNumber} />
                )}
              </dl>
            </CardContent>
          </Card>
        )
      })()}
```

- [ ] **Step 3: Run typecheck + lint**

```powershell
npm run typecheck && npm run lint
```

Expected: clean.

- [ ] **Step 4: Run all tests**

```powershell
npx vitest run
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```powershell
git add "app/(app)/contractor/projects/[id]/overview/page.tsx"
git commit -m "feat: project overview — Site supply card (tariff, NMD, voltage, TOU badge)"
```

---

## Self-Review

**1. Spec coverage:**
- ✅ Electricity supplier (Eskom / Municipal / Private) — Task 3
- ✅ Municipality selection for municipal supply — Task 3
- ✅ Tariff category per supplier with TOU auto-detection — Tasks 2 + 3
- ✅ NMD (Notified Maximum Demand) — Tasks 3 + 4
- ✅ Supply voltage (LV/MV/HV) — Tasks 2 + 3
- ✅ Transformer capacity (optional) — Tasks 3 + 4
- ✅ Account/meter number (optional) — Tasks 3 + 4
- ✅ Smart guidance note per supplier — Task 3
- ✅ TOU indicator banner in form — Task 3
- ✅ Step order: Client & site → Tariff & grid supply → System scope & design → Commercial → Review — Task 3
- ✅ `siteInfo` persisted to DB — Task 4
- ✅ Overview page shows site supply card with TOU badge — Task 5
- ✅ `canAdvance()` guards: supplier + NMD + voltage required — Task 3
- ✅ Tariff visible in Review step — Task 3

**2. Placeholder scan:** No placeholders found.

**3. Type consistency:**
- `SiteInfo` type defined in Task 2, used in Tasks 3, 4, 5 — consistent
- `ElectricitySupplier` union used throughout — consistent
- `getTariffsForSupplier` called with `values.supplier` which is typed as `ElectricitySupplier` — consistent
- `isTOUTariff(supplier, tariffName)` signature matches usage in `useEffect` and server action — consistent
- `project.siteInfo as SiteInfo` cast in overview page — same pattern as `project.techScope as TechScope` — consistent
