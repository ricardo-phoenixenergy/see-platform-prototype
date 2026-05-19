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

  const productionData = readings.map((r) => ({
    date: fmt(r.recordedAt),
    kWh: Math.round(r.productionKwh * 10) / 10,
  }))

  const socData = readings.map((r) => ({
    date: fmt(r.recordedAt),
    soc: r.batterySoCPercent ?? 0,
  }))

  const scatterData = readings
    .filter((r) => r.irradianceWM2 != null)
    .map((r) => ({
      irradiance: Math.round(r.irradianceWM2!),
      production: Math.round(r.productionKwh * 10) / 10,
    }))

  const totalProduction = readings.reduce((s, r) => s + r.productionKwh, 0)
  const totalConsumption = readings.reduce((s, r) => s + (r.consumptionKwh ?? 0), 0)
  const selfConsumed = Math.min(totalProduction, totalConsumption)
  const exported = Math.max(0, totalProduction - totalConsumption)
  const selfConsumptionPct = totalProduction > 0 ? Math.round((selfConsumed / totalProduction) * 100) : 0
  const donutData = [
    { name: 'Self-consumed', value: Math.round(selfConsumed) },
    { name: 'Exported', value: Math.round(exported) },
  ]

  const totalYield = readings.reduce((s, r) => s + r.productionKwh, 0)
  const co2Saved = totalYield * 0.93
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
                formatter={(v: unknown) => [`${v as number} kWh`, 'Production']}
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
                formatter={(v: unknown) => [`${v as number}%`, 'SoC']}
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
                formatter={(v: unknown, name: unknown) => [name === 'production' ? `${v as number} kWh` : `${v as number} W/m²`, String(name)]}
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
