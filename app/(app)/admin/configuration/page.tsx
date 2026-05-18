import { TIER_THRESHOLDS, TIER_CASHBACK_RATES, TIER_ORDER } from '@/lib/tier/rules'

export default function ConfigurationPage() {
  return (
    <div className="p-6 max-w-3xl mx-auto space-y-8">
      <div>
        <h2 className="text-base font-semibold text-ink-900">Configuration</h2>
        <p className="text-sm text-ink-500">Platform-wide rules and settings. Editing is coming in a future release.</p>
      </div>

      {/* Tier thresholds */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-ink-400">Tier progression thresholds</h3>
        <div className="rounded-lg border border-ink-200 bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-ink-25 border-b border-ink-100">
                <th className="px-4 py-3 text-left text-xs font-semibold text-ink-500">Tier</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-ink-500">Min. compliant projects</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-ink-500">Cashback rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-50">
              {TIER_ORDER.map((tier) => (
                <tr key={tier} className="hover:bg-ink-25">
                  <td className="px-4 py-3 font-medium text-ink-900">{tier.charAt(0) + tier.slice(1).toLowerCase()}</td>
                  <td className="px-4 py-3 text-right text-ink-600 tabular-nums">{TIER_THRESHOLDS[tier]}</td>
                  <td className="px-4 py-3 text-right text-ink-600 tabular-nums">{TIER_CASHBACK_RATES[tier]}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-ink-400">Threshold editing will be available in a future configuration release.</p>
      </div>

      {/* Token earning amounts */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-ink-400">Token earning events</h3>
        <div className="rounded-lg border border-ink-200 bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-ink-25 border-b border-ink-100">
                <th className="px-4 py-3 text-left text-xs font-semibold text-ink-500">Event</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-ink-500">Tokens awarded</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-50">
              {[
                { event: 'Complete onboarding tutorial', tokens: 100 },
                { event: 'Create first project', tokens: 100 },
                { event: 'Submit first service request', tokens: 100 },
                { event: 'Upload existing project', tokens: 1000 },
                { event: 'AI verification (cost)', tokens: -1000 },
                { event: 'Expert verification (cost)', tokens: -10000 },
              ].map((row) => (
                <tr key={row.event} className="hover:bg-ink-25">
                  <td className="px-4 py-3 text-ink-700">{row.event}</td>
                  <td className={`px-4 py-3 text-right font-semibold tabular-nums ${row.tokens > 0 ? 'text-success-600' : 'text-danger-600'}`}>
                    {row.tokens > 0 ? `+${row.tokens.toLocaleString()}` : row.tokens.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
