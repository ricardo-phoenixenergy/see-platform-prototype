'use client'
// components/client/plant-charts.tsx
// Recharts charts for O&M plant data. Used in client plant dashboard + contractor monitoring.

import {
  LineChart, Line, AreaChart, Area, ScatterChart, Scatter,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts'
import { Sun, Cloud, CloudRain, CloudSun, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

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

// ── Static 5-day weather forecast (demo — seeded for site location) ────────────
const FORECAST = [
  { day: 'Today', icon: 'sun',    hi: 28, lo: 18, desc: 'Sunny',          irrWM2: 920 },
  { day: 'Thu',   icon: 'partly', hi: 24, lo: 16, desc: 'Partly cloudy',  irrWM2: 610 },
  { day: 'Fri',   icon: 'rain',   hi: 17, lo: 13, desc: 'Rain expected',  irrWM2: 140 },
  { day: 'Sat',   icon: 'partly', hi: 21, lo: 15, desc: 'Clearing',       irrWM2: 680 },
  { day: 'Sun',   icon: 'sun',    hi: 27, lo: 17, desc: 'Sunny',          irrWM2: 900 },
] as const

function WeatherIcon({ type, className }: { type: string; className?: string }) {
  if (type === 'rain')   return <CloudRain className={className} strokeWidth={1.5} />
  if (type === 'partly') return <CloudSun  className={className} strokeWidth={1.5} />
  if (type === 'cloudy') return <Cloud     className={className} strokeWidth={1.5} />
  return <Sun className={className} strokeWidth={1.5} />
}

// Find the first low-irradiance day (< 300 W/m²) after today for the insight card
const lowDay = FORECAST.slice(1).find(f => f.irrWM2 < 300) ?? null

export function PlantCharts({ readings, tier }: Props) {
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

      {/* ── Weather forecast ── */}
      <div className="rounded-lg border border-ink-200 bg-white p-4 space-y-3">
        <p className="text-xs font-semibold text-ink-700">5-day solar forecast</p>
        <div className="grid grid-cols-5 divide-x divide-ink-100">
          {FORECAST.map((day) => (
            <div key={day.day} className="flex flex-col items-center gap-1.5 px-3 py-2 first:pl-0 last:pr-0">
              <p className="text-[11px] font-medium text-ink-500">{day.day}</p>
              <WeatherIcon
                type={day.icon}
                className={cn(
                  'h-6 w-6',
                  day.icon === 'rain'   ? 'text-blue-400' :
                  day.icon === 'partly' ? 'text-amber-400' :
                  'text-amber-500'
                )}
              />
              <p className="text-xs text-ink-700">{day.desc}</p>
              <p className="text-[11px] text-ink-500 tabular-nums">{day.hi}° / {day.lo}°</p>
              <div className={cn(
                'text-[10px] font-medium px-1.5 py-0.5 rounded-sm tabular-nums',
                day.irrWM2 >= 700 ? 'bg-amber-50 text-amber-700' :
                day.irrWM2 >= 400 ? 'bg-ink-100 text-ink-600' :
                'bg-blue-50 text-blue-600'
              )}>
                {day.irrWM2} W/m²
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── SEE Insights ── */}
      {lowDay && (
        <div className="rounded-lg border border-accent-200 bg-accent-500/5 p-4 space-y-2">
          <div className="flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-accent-500" strokeWidth={2} />
            <p className="text-xs font-semibold uppercase tracking-widest text-accent-600">SEE Insights</p>
          </div>
          <p className="text-sm text-ink-800 leading-relaxed">
            <span className="font-medium">Low solar generation forecast for {lowDay.day}</span> — expected cloud cover and rainfall will reduce irradiance to approximately {lowDay.irrWM2} W/m².
            Consider charging the BESS to maximum capacity today and tomorrow to maintain backup reserve through the low-generation period and protect against grid dependency during the event.
          </p>
          <p className="text-xs text-ink-500">Based on 5-day irradiance forecast · Updated daily</p>
        </div>
      )}

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
