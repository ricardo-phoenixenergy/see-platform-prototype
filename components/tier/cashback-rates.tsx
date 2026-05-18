// components/tier/cashback-rates.tsx
// Tier → cashback rate table. Used in wallet and dashboard.

import { cn } from '@/lib/utils'
import { TIER_CASHBACK_RATES, TIER_ORDER } from '@/lib/tier/rules'
import type { Tier } from '@/lib/tier/rules'

const TIER_COLOURS: Record<Tier, string> = {
  BRONZE: '#CD7F32',
  SILVER: '#9EA3AD',
  GOLD: '#F59E0B',
  PLATINUM: '#7C3AED',
}

type Props = {
  currentTier: Tier
}

export function CashbackRates({ currentTier }: Props) {
  return (
    <div className="rounded-md border border-ink-200 overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-ink-25 border-b border-ink-100">
            <th className="px-3 py-2 text-left text-xs font-semibold text-ink-500">Tier</th>
            <th className="px-3 py-2 text-right text-xs font-semibold text-ink-500">Cashback on purchases</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-ink-50">
          {TIER_ORDER.map((tier) => {
            const isActive = tier === currentTier
            return (
              <tr
                key={tier}
                className={cn(isActive ? 'bg-white' : 'bg-ink-25/50 text-ink-400')}
              >
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2 w-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: TIER_COLOURS[tier] }}
                    />
                    <span className={cn('text-xs font-medium', isActive ? 'text-ink-900' : 'text-ink-400')}>
                      {tier.charAt(0) + tier.slice(1).toLowerCase()}
                      {isActive && <span className="ml-1.5 text-[10px] text-accent-500">current</span>}
                    </span>
                  </div>
                </td>
                <td className="px-3 py-2 text-right">
                  <span className={cn('text-xs font-semibold tabular-nums', isActive ? 'text-ink-900' : 'text-ink-300')}>
                    {TIER_CASHBACK_RATES[tier]}%
                  </span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
