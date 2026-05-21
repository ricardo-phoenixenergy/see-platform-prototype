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
