# O&M Savings Tab Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "Savings" tab to the O&M monitoring section showing the estimated monthly electricity bill before vs. after solar, derived from the project's tariff data and inverter readings.

**Architecture:** A pure `calculateSavings()` function (no DB, no API) takes O&M readings plus tariff metadata from `project.siteInfo` and `project.techScope` and returns a structured savings breakdown. The result is computed server-side in both the contractor monitoring page and the client plant page, then passed as props to a `SavingsView` client component that renders the comparison table and daily savings chart. Tab switching is handled via `?tab=` URL search params — no client state needed, URL is shareable/bookmarkable.

**Tech Stack:** Next.js 15 App Router · Recharts · Vitest · TypeScript strict · All tariff rate data is seed-coded in `lib/tariff-rates.ts` — no external API calls.

---

## Domain context for implementers

### What data is available

**From `project.siteInfo` (JSON field, typed as `SiteInfo`):**
- `tariffName` — e.g. `'MEGAFLEX'`, `'LPU_TOU'`, `'COMMERCIAL_FLAT'` (may be undefined for old projects)
- `isTOU` — boolean, auto-derived from tariff name
- `nmdKva` — Notified Maximum Demand in kVA (the contracted peak; utility bills demand charges per kVA/month)
- `supplier` — `'ESKOM'` | `'MUNICIPAL'`

**From `project.techScope` (JSON field, typed as `TechScope`):**
- `hasBess` — boolean; BESS enables peak shaving which reduces demand charges

**From `OmReading` (30 days of daily inverter readings):**
- `productionKwh` — solar + BESS energy delivered to load
- `consumptionKwh` — total site load (nullable; estimated from productionKwh + gridImportKwh when absent)
- `gridImportKwh` — energy drawn from grid (nullable; estimated as `max(0, consumption - production)`)
- `gridExportKwh` — energy exported to grid (not used in savings calc for now)

### How savings are calculated

**Energy saving:**
- Pre-solar: `totalConsumption × energyRate`
- Post-solar: `gridImport × energyRate`
- For TOU tariffs (where hourly data isn't available): assume **40% peak / 60% off-peak** consumption split — industry-standard C&I assumption

**Demand charge saving:**
- Pre-solar: `nmdKva × demandRate` (per month — fixed regardless of readings)
- Post-solar: reduced by a fixed factor because solar + BESS reduce coincident peak demand
  - BESS present: **35%** demand reduction (active peak shaving)
  - PV-only: **15%** demand reduction (only coincident solar reduces peak)
- These are documented estimates; the disclaimer in the UI makes this explicit

**South African tariff rates used (approximate 2024/2025):**

| Tariff key | Label | Energy c/kWh | Peak c/kWh | Off-peak c/kWh | Demand c/kVA/month |
|---|---|---|---|---|---|
| MEGAFLEX | Megaflex (TOU) | 202 | 320 | 105 | 6000 |
| MINIFLEX | Miniflex | 215 | — | — | 5000 |
| RURAFLEX | Ruraflex | 180 | — | — | 3500 |
| NIGHTSAVE_URBAN | Nightsave Urban (TOU) | 166 | 280 | 85 | 5500 |
| BUSINESSRATE | Businessrate | 250 | — | — | 4500 |
| HOMEFLEX | Homeflex (TOU) | 198 | 290 | 120 | 0 |
| ESKOM_OTHER | Eskom tariff | 200 | — | — | 4500 |
| LPU_TOU | LPU (TOU) | 276 | 380 | 160 | 12000 |
| LPU_FLAT | LPU (Flat) | 260 | — | — | 11000 |
| SPU | Small Power User | 280 | — | — | 8000 |
| COMMERCIAL_TOU | Commercial (TOU) | 312 | 420 | 180 | 9000 |
| COMMERCIAL_FLAT | Commercial (Flat) | 290 | — | — | 8500 |
| GENERAL_SUPPLY | General Supply | 270 | — | — | 7000 |
| MUNICIPAL_OTHER | Municipal tariff | 250 | — | — | 7000 |
| *(fallback)* | Standard rate | 250 | — | — | 6000 |

---

## File map

| File | Status | Responsibility |
|---|---|---|
| `lib/tariff-rates.ts` | **CREATE** | Tariff name → rate data; `getTariffRate()` |
| `lib/savings-calculator.ts` | **CREATE** | `calculateSavings()` pure function |
| `lib/__tests__/savings-calculator.test.ts` | **CREATE** | Unit tests for calculator |
| `components/client/savings-view.tsx` | **CREATE** | Savings tab UI (Recharts + comparison table) |
| `app/(app)/contractor/projects/[id]/monitoring/page.tsx` | **MODIFY** | Add `searchParams`, tab nav, server-side savings calc |
| `app/(app)/client/plant/[siteId]/page.tsx` | **MODIFY** | Add same savings tab for end-client view |

---

## Task 1: Tariff rate library

**Files:**
- Create: `lib/tariff-rates.ts`

- [ ] **Step 1: Create `lib/tariff-rates.ts`**

```ts
// lib/tariff-rates.ts

export type TariffRate = {
  label: string
  energyCentsKwh: number
  peakCentsKwh: number
  offPeakCentsKwh: number
  demandCentsKva: number   // per kVA of NMD, per month
  isTOU: boolean
}

const RATES: Record<string, TariffRate> = {
  // Eskom
  MEGAFLEX:        { label: 'Megaflex (TOU)',        isTOU: true,  energyCentsKwh: 202, peakCentsKwh: 320, offPeakCentsKwh: 105, demandCentsKva: 6000 },
  MINIFLEX:        { label: 'Miniflex',              isTOU: false, energyCentsKwh: 215, peakCentsKwh: 215, offPeakCentsKwh: 215, demandCentsKva: 5000 },
  RURAFLEX:        { label: 'Ruraflex',              isTOU: false, energyCentsKwh: 180, peakCentsKwh: 180, offPeakCentsKwh: 180, demandCentsKva: 3500 },
  NIGHTSAVE_URBAN: { label: 'Nightsave Urban (TOU)', isTOU: true,  energyCentsKwh: 166, peakCentsKwh: 280, offPeakCentsKwh: 85,  demandCentsKva: 5500 },
  BUSINESSRATE:    { label: 'Businessrate',          isTOU: false, energyCentsKwh: 250, peakCentsKwh: 250, offPeakCentsKwh: 250, demandCentsKva: 4500 },
  HOMEFLEX:        { label: 'Homeflex (TOU)',         isTOU: true,  energyCentsKwh: 198, peakCentsKwh: 290, offPeakCentsKwh: 120, demandCentsKva: 0    },
  ESKOM_OTHER:     { label: 'Eskom tariff',           isTOU: false, energyCentsKwh: 200, peakCentsKwh: 200, offPeakCentsKwh: 200, demandCentsKva: 4500 },
  // Municipal
  LPU_TOU:         { label: 'LPU (TOU)',              isTOU: true,  energyCentsKwh: 276, peakCentsKwh: 380, offPeakCentsKwh: 160, demandCentsKva: 12000 },
  LPU_FLAT:        { label: 'LPU (Flat)',             isTOU: false, energyCentsKwh: 260, peakCentsKwh: 260, offPeakCentsKwh: 260, demandCentsKva: 11000 },
  SPU:             { label: 'Small Power User',       isTOU: false, energyCentsKwh: 280, peakCentsKwh: 280, offPeakCentsKwh: 280, demandCentsKva: 8000  },
  COMMERCIAL_TOU:  { label: 'Commercial (TOU)',        isTOU: true,  energyCentsKwh: 312, peakCentsKwh: 420, offPeakCentsKwh: 180, demandCentsKva: 9000  },
  COMMERCIAL_FLAT: { label: 'Commercial (Flat)',       isTOU: false, energyCentsKwh: 290, peakCentsKwh: 290, offPeakCentsKwh: 290, demandCentsKva: 8500  },
  GENERAL_SUPPLY:  { label: 'General Supply',          isTOU: false, energyCentsKwh: 270, peakCentsKwh: 270, offPeakCentsKwh: 270, demandCentsKva: 7000  },
  MUNICIPAL_OTHER: { label: 'Municipal tariff',        isTOU: false, energyCentsKwh: 250, peakCentsKwh: 250, offPeakCentsKwh: 250, demandCentsKva: 7000  },
}

const FALLBACK: TariffRate = {
  label: 'Standard rate', isTOU: false,
  energyCentsKwh: 250, peakCentsKwh: 250, offPeakCentsKwh: 250, demandCentsKva: 6000,
}

export function getTariffRate(tariffName: string | undefined): TariffRate {
  if (!tariffName) return FALLBACK
  return RATES[tariffName] ?? FALLBACK
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add lib/tariff-rates.ts
git commit -m "feat(savings): tariff rate lookup library"
```

---

## Task 2: Savings calculator + unit tests

**Files:**
- Create: `lib/savings-calculator.ts`
- Create: `lib/__tests__/savings-calculator.test.ts`

- [ ] **Step 1: Write the unit tests first**

Create `lib/__tests__/savings-calculator.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { calculateSavings } from '../savings-calculator'

const TWO_READINGS = [
  { productionKwh: 100, consumptionKwh: 80,  gridImportKwh: 0  },
  { productionKwh: 60,  consumptionKwh: 100, gridImportKwh: 40 },
]

describe('calculateSavings', () => {
  it('post-solar energy charge is less than pre-solar', () => {
    const r = calculateSavings({ readings: TWO_READINGS, tariffName: 'BUSINESSRATE', nmdKva: 500, hasBess: false })
    expect(r.postSolarEnergyRands).toBeLessThan(r.preSolarEnergyRands)
  })

  it('solarUsedKwh + gridImportKwh equals totalConsumptionKwh', () => {
    const r = calculateSavings({ readings: TWO_READINGS, tariffName: 'MEGAFLEX', nmdKva: 300, hasBess: true })
    expect(r.solarUsedKwh + r.gridImportKwh).toBe(r.totalConsumptionKwh)
  })

  it('BESS reduces demand more than PV-only on same inputs', () => {
    const withBess    = calculateSavings({ readings: TWO_READINGS, tariffName: 'LPU_TOU', nmdKva: 500, hasBess: true  })
    const withoutBess = calculateSavings({ readings: TWO_READINGS, tariffName: 'LPU_TOU', nmdKva: 500, hasBess: false })
    expect(withBess.postSolarDemandRands).toBeLessThan(withoutBess.postSolarDemandRands)
  })

  it('estimates grid import when gridImportKwh is null', () => {
    const readings = [{ productionKwh: 80, consumptionKwh: 100, gridImportKwh: null }]
    const r = calculateSavings({ readings, tariffName: 'BUSINESSRATE', nmdKva: 200, hasBess: false })
    expect(r.gridImportKwh).toBe(20)
  })

  it('falls back gracefully when tariffName is undefined', () => {
    const r = calculateSavings({ readings: TWO_READINGS, tariffName: undefined, nmdKva: 200, hasBess: false })
    expect(r.savedRands).toBeGreaterThan(0)
    expect(r.rate.label).toBe('Standard rate')
  })

  it('zero savings when no consumption data', () => {
    const readings = [{ productionKwh: 100, consumptionKwh: null, gridImportKwh: null }]
    const r = calculateSavings({ readings, tariffName: 'BUSINESSRATE', nmdKva: 0, hasBess: false })
    expect(r.totalConsumptionKwh).toBe(0)
  })
})
```

- [ ] **Step 2: Run tests — expect failures**

```bash
npm run test:unit -- lib/__tests__/savings-calculator.test.ts
```

Expected: `Cannot find module '../savings-calculator'`

- [ ] **Step 3: Create `lib/savings-calculator.ts`**

```ts
// lib/savings-calculator.ts

import { getTariffRate, type TariffRate } from './tariff-rates'

export type SavingsReading = {
  productionKwh: number
  consumptionKwh: number | null
  gridImportKwh: number | null
}

export type SavingsInput = {
  readings: SavingsReading[]
  tariffName: string | undefined
  nmdKva: number
  hasBess: boolean
}

export type SavingsResult = {
  preSolarEnergyRands: number
  postSolarEnergyRands: number
  preSolarDemandRands: number
  postSolarDemandRands: number
  preSolarTotalRands: number
  postSolarTotalRands: number
  savedRands: number
  savedPercent: number
  totalConsumptionKwh: number
  solarUsedKwh: number
  gridImportKwh: number
  rate: TariffRate
}

export type DailySaving = {
  date: string
  savedRands: number
}

// TOU split: typical C&I profile — 40% peak, 60% off-peak
const PEAK_FRACTION = 0.4
const OFF_PEAK_FRACTION = 0.6

// Demand reduction factors from solar + BESS peak shaving
const DEMAND_REDUCTION_BESS = 0.35
const DEMAND_REDUCTION_PV_ONLY = 0.15

function energyCost(kwh: number, rate: TariffRate): number {
  if (!rate.isTOU) return (kwh * rate.energyCentsKwh) / 100
  return ((kwh * PEAK_FRACTION * rate.peakCentsKwh) + (kwh * OFF_PEAK_FRACTION * rate.offPeakCentsKwh)) / 100
}

function estimateGridImport(r: SavingsReading): number {
  if (r.gridImportKwh != null) return r.gridImportKwh
  return Math.max(0, (r.consumptionKwh ?? 0) - r.productionKwh)
}

export function calculateSavings(input: SavingsInput): SavingsResult {
  const { readings, tariffName, nmdKva, hasBess } = input
  const rate = getTariffRate(tariffName)

  const totalConsumptionKwh = Math.round(readings.reduce((s, r) => s + (r.consumptionKwh ?? 0), 0))
  const gridImportKwh = Math.round(readings.reduce((s, r) => s + estimateGridImport(r), 0))
  const solarUsedKwh = Math.max(0, totalConsumptionKwh - gridImportKwh)

  const preSolarEnergyRands = Math.round(energyCost(totalConsumptionKwh, rate))
  const postSolarEnergyRands = Math.round(energyCost(gridImportKwh, rate))

  const preSolarDemandRands = Math.round((nmdKva * rate.demandCentsKva) / 100)
  const demandFactor = hasBess ? DEMAND_REDUCTION_BESS : DEMAND_REDUCTION_PV_ONLY
  const postSolarDemandRands = Math.round(preSolarDemandRands * (1 - demandFactor))

  const preSolarTotalRands = preSolarEnergyRands + preSolarDemandRands
  const postSolarTotalRands = postSolarEnergyRands + postSolarDemandRands
  const savedRands = preSolarTotalRands - postSolarTotalRands
  const savedPercent = preSolarTotalRands > 0
    ? Math.round((savedRands / preSolarTotalRands) * 100)
    : 0

  return {
    preSolarEnergyRands,
    postSolarEnergyRands,
    preSolarDemandRands,
    postSolarDemandRands,
    preSolarTotalRands,
    postSolarTotalRands,
    savedRands,
    savedPercent,
    totalConsumptionKwh,
    solarUsedKwh,
    gridImportKwh,
    rate,
  }
}

function fmtDate(date: string | Date): string {
  const d = new Date(date)
  return `${d.getDate()}/${d.getMonth() + 1}`
}

export function calculateDailySavings(
  readings: (SavingsReading & { recordedAt: string | Date })[],
  tariffName: string | undefined
): DailySaving[] {
  const rate = getTariffRate(tariffName)
  return readings.map(r => {
    const consumed = r.consumptionKwh ?? 0
    const imported = estimateGridImport(r)
    const solarUsed = Math.max(0, consumed - imported)
    const savedRands = Math.round(energyCost(solarUsed, rate))
    return { date: fmtDate(r.recordedAt), savedRands }
  })
}
```

- [ ] **Step 4: Run tests — expect all pass**

```bash
npm run test:unit -- lib/__tests__/savings-calculator.test.ts
```

Expected:
```
✓ post-solar energy charge is less than pre-solar
✓ solarUsedKwh + gridImportKwh equals totalConsumptionKwh
✓ BESS reduces demand more than PV-only on same inputs
✓ estimates grid import when gridImportKwh is null
✓ falls back gracefully when tariffName is undefined
✓ zero savings when no consumption data
6 passed
```

- [ ] **Step 5: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add lib/savings-calculator.ts lib/__tests__/savings-calculator.test.ts
git commit -m "feat(savings): savings calculator with unit tests"
```

---

## Task 3: SavingsView component

**Files:**
- Create: `components/client/savings-view.tsx`

- [ ] **Step 1: Create `components/client/savings-view.tsx`**

```tsx
'use client'
// components/client/savings-view.tsx
// Savings breakdown tab — bill comparison, energy flows, daily chart, disclosure.

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import type { SavingsResult, DailySaving } from '@/lib/savings-calculator'

type Props = {
  savings: SavingsResult
  dailySavings: DailySaving[]
  nmdKva: number
}

function rands(n: number) {
  return `R ${Math.abs(n).toLocaleString('en-ZA', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

export function SavingsView({ savings, dailySavings, nmdKva }: Props) {
  const { rate } = savings

  return (
    <div className="space-y-6">

      {/* Hero — total saving */}
      <div className="rounded-lg border border-ink-200 bg-white p-6 text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-ink-400 mb-2">
          Estimated savings this month
        </p>
        <p className="text-4xl font-semibold text-ink-900 tabular-nums">{rands(savings.savedRands)}</p>
        <p className="text-sm text-ink-500 mt-1">
          {savings.savedPercent}% reduction in estimated electricity bill
        </p>
      </div>

      {/* Bill comparison table */}
      <div className="rounded-lg border border-ink-200 bg-white overflow-hidden">
        <div className="px-5 py-3 border-b border-ink-100">
          <p className="text-xs font-semibold text-ink-700">Estimated bill breakdown — this month</p>
        </div>
        <div className="divide-y divide-ink-100">
          {/* Column headers */}
          <div className="grid grid-cols-3 px-5 py-2 bg-ink-25">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-ink-400">Charge</p>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-ink-400 text-right">Without solar</p>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-ink-400 text-right">With solar</p>
          </div>
          {/* Energy row */}
          <div className="grid grid-cols-3 px-5 py-3">
            <p className="text-sm text-ink-700">Energy charges</p>
            <p className="text-sm text-ink-900 text-right tabular-nums">{rands(savings.preSolarEnergyRands)}</p>
            <p className="text-sm text-ink-900 text-right tabular-nums">{rands(savings.postSolarEnergyRands)}</p>
          </div>
          {/* Demand row — only shown when there's a demand charge */}
          {savings.preSolarDemandRands > 0 && (
            <div className="grid grid-cols-3 px-5 py-3">
              <p className="text-sm text-ink-700">Demand charges</p>
              <p className="text-sm text-ink-900 text-right tabular-nums">{rands(savings.preSolarDemandRands)}</p>
              <p className="text-sm text-ink-900 text-right tabular-nums">{rands(savings.postSolarDemandRands)}</p>
            </div>
          )}
          {/* Total row */}
          <div className="grid grid-cols-3 px-5 py-3 bg-ink-25">
            <p className="text-sm font-semibold text-ink-900">Total (excl. VAT)</p>
            <p className="text-sm font-semibold text-ink-400 text-right tabular-nums line-through">
              {rands(savings.preSolarTotalRands)}
            </p>
            <p className="text-sm font-semibold text-ink-900 text-right tabular-nums">
              {rands(savings.postSolarTotalRands)}
            </p>
          </div>
          {/* Saving row */}
          <div className="grid grid-cols-3 px-5 py-3">
            <p className="text-sm font-semibold text-success-700">Monthly saving</p>
            <p className="text-sm text-ink-300 text-right">—</p>
            <p className="text-sm font-semibold text-success-700 text-right tabular-nums">
              {rands(savings.savedRands)}
            </p>
          </div>
        </div>
      </div>

      {/* Energy flow stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total site consumption', value: `${savings.totalConsumptionKwh.toLocaleString()} kWh` },
          { label: 'Solar + BESS used on-site', value: `${savings.solarUsedKwh.toLocaleString()} kWh` },
          { label: 'Grid import',              value: `${savings.gridImportKwh.toLocaleString()} kWh` },
        ].map(s => (
          <div key={s.label} className="rounded-lg border border-ink-200 bg-white px-4 py-3">
            <p className="text-xs text-ink-500">{s.label}</p>
            <p className="text-base font-semibold text-ink-900 tabular-nums mt-0.5">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Daily savings chart */}
      <div className="rounded-lg border border-ink-200 bg-white p-4">
        <p className="text-xs font-semibold text-ink-700 mb-4">Estimated daily saving (R) — last 30 days</p>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={dailySavings} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9ca3af' }} interval={4} />
            <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} />
            <Tooltip
              contentStyle={{ fontSize: 12, borderRadius: 6, border: '1px solid #e5e7eb' }}
              formatter={(v: unknown) => [`R ${(v as number).toLocaleString()}`, 'Saving']}
            />
            <Bar dataKey="savedRands" fill="#3E5BEA" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Disclosure */}
      <p className="text-xs text-ink-400 leading-relaxed">
        Estimates based on <span className="text-ink-600">{rate.label}</span> at approximately {rate.energyCentsKwh}c/kWh
        {savings.preSolarDemandRands > 0 && (
          ` · Demand at R${(rate.demandCentsKva / 100).toFixed(0)}/kVA/month on ${nmdKva} kVA NMD`
        )}
        {rate.isTOU && ' · TOU split assumed 40% peak / 60% off-peak'}.
        {' '}Figures are indicative estimates excluding VAT, network charges, and fixed utility fees. Actual savings may differ based on consumption profile and utility adjustments.
      </p>
    </div>
  )
}
```

- [ ] **Step 2: Type-check and lint**

```bash
npx tsc --noEmit
npx eslint "components/client/savings-view.tsx"
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/client/savings-view.tsx
git commit -m "feat(savings): SavingsView component with bill comparison table and daily chart"
```

---

## Task 4: Wire savings tab into contractor monitoring page

**Files:**
- Modify: `app/(app)/contractor/projects/[id]/monitoring/page.tsx`

The monitoring page is a server component at `app/(app)/contractor/projects/[id]/monitoring/page.tsx`. It currently accepts only `params`. Add `searchParams` to enable `?tab=savings` switching. The project already has `siteInfo` and `techScope` available via `getProject`.

The full existing file content before changes:

```tsx
import { auth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { getProject } from '@/server/queries/projects'
import { getOmReadings } from '@/server/queries/client'
import { getEpcLicense } from '@/server/queries/payments'
import { PlantCharts } from '@/components/client/plant-charts'
import { EpcMonitoringPaywall } from '@/components/contractor/epc-monitoring-paywall'
import { Activity } from 'lucide-react'

type Props = { params: Promise<{ id: string }> }

export default async function MonitoringPage({ params }: Props) {
  const { id } = await params
  // ... (reads project, epcLicense, readings)
  // ... renders either paywall, not-operational message, or <PlantCharts>
}
```

- [ ] **Step 1: Rewrite `app/(app)/contractor/projects/[id]/monitoring/page.tsx`**

Replace the entire file with:

```tsx
import { auth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { getProject } from '@/server/queries/projects'
import { getOmReadings } from '@/server/queries/client'
import { getEpcLicense } from '@/server/queries/payments'
import { PlantCharts } from '@/components/client/plant-charts'
import { SavingsView } from '@/components/client/savings-view'
import { EpcMonitoringPaywall } from '@/components/contractor/epc-monitoring-paywall'
import { calculateSavings, calculateDailySavings } from '@/lib/savings-calculator'
import type { SiteInfo } from '@/lib/site-info'
import type { TechScope } from '@/lib/tech-scope'
import { Activity } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

type Props = {
  params: Promise<{ id: string }>
  searchParams: Promise<{ tab?: string }>
}

export default async function MonitoringPage({ params, searchParams }: Props) {
  const { id } = await params
  const { tab } = await searchParams
  const activeTab = tab === 'savings' ? 'savings' : 'overview'

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
          O&amp;M dashboards, plant performance, and prescriptive maintenance alerts will be available once this project reaches the Operational stage.
        </p>
      </div>
    )
  }

  const [epcLicense, readings] = await Promise.all([
    getEpcLicense(id, session.user.companyId),
    getOmReadings(id),
  ])

  if (!epcLicense) {
    return (
      <EpcMonitoringPaywall
        projectId={id}
        hasClient={!!project.clientCompanyId}
      />
    )
  }

  const siteInfo = project.siteInfo as SiteInfo | null
  const scope = project.techScope as TechScope | null

  const savingsInput = {
    readings: readings.map(r => ({
      productionKwh: r.productionKwh,
      consumptionKwh: r.consumptionKwh,
      gridImportKwh: r.gridImportKwh,
    })),
    tariffName: siteInfo?.tariffName,
    nmdKva: siteInfo?.nmdKva ?? 0,
    hasBess: scope?.hasBess ?? false,
  }

  const savings = calculateSavings(savingsInput)
  const dailySavings = calculateDailySavings(
    readings.map(r => ({
      productionKwh: r.productionKwh,
      consumptionKwh: r.consumptionKwh,
      gridImportKwh: r.gridImportKwh,
      recordedAt: r.recordedAt,
    })),
    siteInfo?.tariffName
  )

  const tabs = [
    { label: 'Overview', value: 'overview' },
    { label: 'Savings', value: 'savings' },
  ]

  return (
    <div className="p-6 overflow-y-auto h-full max-w-6xl mx-auto">
      {/* Header + tabs */}
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-ink-900">O&amp;M Monitoring</h2>
          <p className="text-xs text-ink-500 mt-0.5">{project.name} · {project.systemSizeKw} kW · Last 30 days</p>
        </div>
        <div className="flex gap-1 border border-ink-200 rounded-lg p-1 bg-white">
          {tabs.map(t => (
            <Link
              key={t.value}
              href={`/contractor/projects/${id}/monitoring?tab=${t.value}`}
              className={cn(
                'px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
                activeTab === t.value
                  ? 'bg-ink-900 text-white'
                  : 'text-ink-500 hover:text-ink-900'
              )}
            >
              {t.label}
            </Link>
          ))}
        </div>
      </div>

      {readings.length === 0 && (
        <p className="text-sm text-ink-500">No monitoring data available yet.</p>
      )}

      {readings.length > 0 && activeTab === 'overview' && (
        <PlantCharts
          readings={readings.map(r => ({
            recordedAt: r.recordedAt.toISOString(),
            productionKwh: r.productionKwh,
            batterySoCPercent: r.batterySoCPercent,
            consumptionKwh: r.consumptionKwh,
            irradianceWM2: r.irradianceWM2,
          }))}
          tier={epcLicense.tier}
        />
      )}

      {readings.length > 0 && activeTab === 'savings' && (
        <SavingsView
          savings={savings}
          dailySavings={dailySavings}
          nmdKva={siteInfo?.nmdKva ?? 0}
        />
      )}
    </div>
  )
}
```

- [ ] **Step 2: Type-check and lint**

```bash
npx tsc --noEmit
npx eslint "app/(app)/contractor/projects/[id]/monitoring/page.tsx"
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add "app/(app)/contractor/projects/[id]/monitoring/page.tsx"
git commit -m "feat(savings): add Savings tab to contractor O&M monitoring page"
```

---

## Task 5: Wire savings tab into client plant page

End-clients see their plant dashboard at `app/(app)/client/plant/[siteId]/page.tsx`. Add the same tab pattern there.

**Files:**
- Modify: `app/(app)/client/plant/[siteId]/page.tsx`

The client plant page currently:
1. Looks up the project by `siteId` + `clientCompanyId`
2. Checks for an active `OmLicense`
3. Renders `<PlantCharts>` when operational and licensed

It does NOT currently have `searchParams`. Add them.

- [ ] **Step 1: Read the current file**

Read `app/(app)/client/plant/[siteId]/page.tsx` to find the current `Props` type, the `PlantCharts` render, and the end of the return block. The file is ~90 lines.

- [ ] **Step 2: Add searchParams to Props type**

Find:
```tsx
type Props = { params: Promise<{ siteId: string }> }
```

Replace with:
```tsx
type Props = {
  params: Promise<{ siteId: string }>
  searchParams: Promise<{ tab?: string }>
}
```

- [ ] **Step 3: Add imports**

Add to the existing imports at the top of the file:
```tsx
import { SavingsView } from '@/components/client/savings-view'
import { calculateSavings, calculateDailySavings } from '@/lib/savings-calculator'
import type { SiteInfo } from '@/lib/site-info'
import type { TechScope } from '@/lib/tech-scope'
import { cn } from '@/lib/utils'
```

- [ ] **Step 4: Extract tab from searchParams in the function body**

In the function signature:
```tsx
export default async function PlantDashboardPage({ params, searchParams }: Props) {
```

Add after `const { siteId } = await params`:
```tsx
const { tab } = await searchParams
const activeTab = tab === 'savings' ? 'savings' : 'overview'
```

- [ ] **Step 5: Compute savings server-side**

Add this block immediately after the `const [license, pendingOffer, readings] = await Promise.all(...)` call, before the `const isActive = ...` line:

```tsx
const siteInfo = project.siteInfo as SiteInfo | null
const scope = project.techScope as TechScope | null

const savings = calculateSavings({
  readings: readings.map(r => ({
    productionKwh: r.productionKwh,
    consumptionKwh: r.consumptionKwh,
    gridImportKwh: r.gridImportKwh,
  })),
  tariffName: siteInfo?.tariffName,
  nmdKva: siteInfo?.nmdKva ?? 0,
  hasBess: scope?.hasBess ?? false,
})

const dailySavings = calculateDailySavings(
  readings.map(r => ({
    productionKwh: r.productionKwh,
    consumptionKwh: r.consumptionKwh,
    gridImportKwh: r.gridImportKwh,
    recordedAt: r.recordedAt,
  })),
  siteInfo?.tariffName
)
```

- [ ] **Step 6: Add tab nav and conditional render**

Find the existing `<PlantCharts ... />` render. It is inside an `isActive &&` check. Replace it with:

```tsx
{isActive && (
  <>
    {/* Tab nav */}
    <div className="flex gap-1 border border-ink-200 rounded-lg p-1 bg-white w-fit">
      {[{ label: 'Overview', value: 'overview' }, { label: 'Savings', value: 'savings' }].map(t => (
        <Link
          key={t.value}
          href={`/client/plant/${siteId}?tab=${t.value}`}
          className={cn(
            'px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
            activeTab === t.value
              ? 'bg-ink-900 text-white'
              : 'text-ink-500 hover:text-ink-900'
          )}
        >
          {t.label}
        </Link>
      ))}
    </div>

    {activeTab === 'overview' && readings.length > 0 && (
      <PlantCharts
        readings={readings.map(r => ({
          recordedAt: r.recordedAt.toISOString(),
          productionKwh: r.productionKwh,
          batterySoCPercent: r.batterySoCPercent,
          consumptionKwh: r.consumptionKwh,
          irradianceWM2: r.irradianceWM2,
        }))}
        tier={license.tier}
      />
    )}

    {activeTab === 'savings' && readings.length > 0 && (
      <SavingsView
        savings={savings}
        dailySavings={dailySavings}
        nmdKva={siteInfo?.nmdKva ?? 0}
      />
    )}
  </>
)}
```

Note: The `Link` import is likely already present. The `siteId` variable is already in scope. If `Link` is not imported, add `import Link from 'next/link'`.

- [ ] **Step 7: Type-check and lint**

```bash
npx tsc --noEmit
npx eslint "app/(app)/client/plant/[siteId]/page.tsx"
```

Expected: no errors.

- [ ] **Step 8: Commit**

```bash
git add "app/(app)/client/plant/[siteId]/page.tsx"
git commit -m "feat(savings): add Savings tab to client plant dashboard"
```

---

## Self-review

**Spec coverage:**
- ✅ Task 1 — tariff rates for all 14 SA tariff keys, with TOU split and demand charge data
- ✅ Task 2 — `calculateSavings()` covering energy + demand; `calculateDailySavings()` for chart; 6 unit tests covering key invariants
- ✅ Task 3 — `SavingsView` with hero stat, bill comparison table (energy + demand rows, totals, saving row), energy flow stats, daily bar chart, and disclosure footer
- ✅ Task 4 — Contractor monitoring page: tab nav, server-side savings computation, conditional render
- ✅ Task 5 — Client plant page: same pattern applied

**Placeholder scan:** No TBD, no "add appropriate handling". All code is shown in full.

**Type consistency:**
- `SavingsResult` exported from `savings-calculator.ts` and imported in `savings-view.tsx` — matches
- `DailySaving` exported from `savings-calculator.ts` and used as `dailySavings: DailySaving[]` in the page and component — matches
- `calculateDailySavings` input shape `{ productionKwh, consumptionKwh, gridImportKwh, recordedAt }` — matches `OmReading` fields available in both pages
- `SavingsInput.hasBess` is `boolean` derived from `scope?.hasBess ?? false` — consistent across both pages

**Coverage note:** The savings calculation is an estimate with documented assumptions. The disclaimer in `SavingsView` makes the limitations explicit to end-users. This is appropriate for a prototype demo.
