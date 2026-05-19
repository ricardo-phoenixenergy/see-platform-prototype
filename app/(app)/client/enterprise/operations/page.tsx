import { BarChart3, Leaf, Zap, AlertTriangle, CheckCircle } from 'lucide-react'

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
  const carbonTargetPct = 38

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
        <p className="text-xs text-ink-500">
          Spaza Holdings target: 50% of total energy from renewables by end of 2027. Currently at 38%.
        </p>
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
