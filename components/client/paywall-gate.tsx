// components/client/paywall-gate.tsx

import { Lock, Zap } from 'lucide-react'

const TIERS = [
  {
    name: 'Basic', price: 'R 450/mo',
    features: ['30-day production history', 'Battery SoC tracking', 'Monthly performance report'],
    highlight: false,
  },
  {
    name: 'Premium', price: 'R 850/mo',
    features: ['Everything in Basic', '12-month analytics', 'Performance benchmarking', 'Maintenance scheduling'],
    highlight: true,
  },
  {
    name: 'AI', price: 'R 1,200/mo',
    features: ['Everything in Premium', 'Prescriptive maintenance alerts', 'Fault prediction', 'Carbon reporting'],
    highlight: false,
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
