'use client'
// components/contractor/epc-monitoring-paywall.tsx

import { useState, useTransition } from 'react'
import { Lock, Zap, User, Loader2 } from 'lucide-react'
import { sellLicenseToClient, selfActivateLicense } from '@/server/actions/payments'
import { EftInstructionsModal } from '@/components/payments/eft-instructions-modal'
import { cn } from '@/lib/utils'
import type { OmLicenseTier } from '@/lib/generated/prisma/client'

const TIERS: { tier: OmLicenseTier; price: string; cents: number; features: string[] }[] = [
  { tier: 'BASIC', price: 'R 350/mo', cents: 35_000, features: ['Live monitoring', 'Battery SoC', 'Monthly report'] },
  { tier: 'PREMIUM', price: 'R 850/mo', cents: 85_000, features: ['Basic + analytics', 'Multi-brand normalisation', 'Maintenance calendar'] },
  { tier: 'AI', price: 'R 1,200/mo', cents: 120_000, features: ['Premium + prescriptive alerts', 'Fault prediction', 'Weather-aware BESS'] },
]

type Props = { projectId: string; hasClient: boolean }
type EftState = { paymentId: string; reference: string; amountCents: number }

export function EpcMonitoringPaywall({ projectId, hasClient }: Props) {
  const [selectedTier, setSelectedTier] = useState<OmLicenseTier>('AI')
  const [message, setMessage] = useState('')
  const [isPending, startTransition] = useTransition()
  const [mode, setMode] = useState<'pick' | 'sell-form' | 'self-form' | 'sent'>('pick')
  const [eftState, setEftState] = useState<EftState | null>(null)

  function handleSell() {
    const selected = TIERS.find((t) => t.tier === selectedTier)
    if (!selected) return
    startTransition(async () => {
      await sellLicenseToClient(projectId, selectedTier, selected.cents, message || undefined)
      setMode('sent')
    })
  }

  function handleSelf() {
    startTransition(async () => {
      const result = await selfActivateLicense(projectId, selectedTier)
      setEftState(result)
    })
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col items-center text-center py-4 space-y-3">
        <div className="h-12 w-12 rounded-full bg-ink-100 flex items-center justify-center">
          <Lock className="h-5 w-5 text-ink-400" strokeWidth={1.5} />
        </div>
        <div>
          <p className="text-sm font-semibold text-ink-900">O&amp;M Monitoring is licensed</p>
          <p className="text-xs text-ink-500 mt-1 max-w-xs">
            Activate an O&amp;M license to access plant monitoring, maintenance tracking, and prescriptive insights for this site.
          </p>
        </div>
        {mode === 'pick' && (
          <div className="flex gap-3">
            {hasClient && (
              <button
                onClick={() => setMode('sell-form')}
                className="flex items-center gap-1.5 h-9 px-4 rounded-md bg-ink-900 text-white text-sm font-medium hover:bg-ink-800 transition-colors"
              >
                <Zap className="h-4 w-4" strokeWidth={1.5} />
                Sell to client
              </button>
            )}
            <button
              onClick={() => setMode('self-form')}
              className="flex items-center gap-1.5 h-9 px-4 rounded-md border border-ink-200 text-ink-700 text-sm hover:bg-ink-50 transition-colors"
            >
              <User className="h-4 w-4" strokeWidth={1.5} />
              Activate for own use
            </button>
          </div>
        )}
      </div>

      {/* Tier selector + form */}
      {(mode === 'sell-form' || mode === 'self-form') && (
        <div className="space-y-4">
          <p className="text-xs font-semibold text-ink-700">Select tier</p>
          <div className="grid grid-cols-3 gap-3">
            {TIERS.map((t) => (
              <button
                key={t.tier}
                onClick={() => setSelectedTier(t.tier)}
                className={cn(
                  'rounded-lg border p-3 text-left transition-colors',
                  selectedTier === t.tier
                    ? 'border-accent-400 bg-accent-500/5'
                    : 'border-ink-200 bg-white hover:border-ink-300'
                )}
              >
                <p className="text-sm font-semibold text-ink-900">{t.tier}</p>
                <p className="text-xs font-medium text-ink-500 mt-0.5">{t.price}</p>
                <ul className="mt-2 space-y-1">
                  {t.features.map((f) => (
                    <li key={f} className="text-[10px] text-ink-500 flex items-start gap-1">
                      <span className="text-accent-500 font-bold mt-px">✓</span>{f}
                    </li>
                  ))}
                </ul>
              </button>
            ))}
          </div>

          {mode === 'sell-form' && (
            <div className="space-y-1">
              <label className="text-xs font-medium text-ink-700">Message to client (optional)</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={2}
                placeholder="e.g., I recommend the AI tier given the BESS on this site — the prescriptive alerts will pay for themselves."
                className="w-full rounded-md border border-ink-200 px-3 py-2 text-sm placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-accent-500/20 resize-none"
              />
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <button
              onClick={mode === 'sell-form' ? handleSell : handleSelf}
              disabled={isPending}
              className="flex items-center gap-1.5 h-8 px-4 rounded-md bg-ink-900 text-white text-xs font-medium hover:bg-ink-800 transition-colors disabled:opacity-50"
            >
              {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {mode === 'sell-form' ? 'Send proposal' : 'Proceed to payment'}
            </button>
            <button
              onClick={() => setMode('pick')}
              className="h-8 px-3 rounded-md border border-ink-200 text-ink-600 text-xs hover:bg-ink-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {mode === 'sent' && (
        <div className="rounded-lg border border-success-500/20 bg-success-50/30 px-4 py-4 text-center space-y-1">
          <p className="text-sm font-semibold text-ink-900">Proposal sent</p>
          <p className="text-xs text-ink-500">
            Your client will receive an email and in-app notification. Once they accept and pay, both dashboards will activate automatically.
          </p>
        </div>
      )}

      {eftState && (
        <EftInstructionsModal
          paymentId={eftState.paymentId}
          reference={eftState.reference}
          amountCents={eftState.amountCents}
          onClose={() => setEftState(null)}
          onReconciled={() => { setEftState(null); window.location.reload() }}
        />
      )}
    </div>
  )
}
