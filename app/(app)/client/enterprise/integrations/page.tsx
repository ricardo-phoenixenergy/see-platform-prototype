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
        <div className="flex items-center gap-2">
          <Webhook className="h-4 w-4 text-ink-400" strokeWidth={1.5} />
          <h3 className="text-sm font-semibold text-ink-900">Webhooks</h3>
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
