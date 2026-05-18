import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CashbackRates } from '@/components/tier/cashback-rates'

type Props = {
  tier: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM'
  compliantProjectCount: number
  nextTierAt: number | null
  progressPercent: number
}

const TIER_LABELS: Record<string, string> = {
  BRONZE: 'Bronze', SILVER: 'Silver', GOLD: 'Gold', PLATINUM: 'Platinum',
}
const TIER_COLOURS: Record<string, string> = {
  BRONZE: '#A56A3E', SILVER: '#8B95A0', GOLD: '#C9A03E', PLATINUM: '#6E7A8A',
}
const NEXT_TIER: Record<string, string> = {
  BRONZE: 'Silver', SILVER: 'Gold', GOLD: 'Platinum', PLATINUM: '',
}

export function TierProgressCard({ tier, compliantProjectCount, nextTierAt, progressPercent }: Props) {
  const colour = TIER_COLOURS[tier] ?? '#8B95A0'
  const isPlatinum = tier === 'PLATINUM'
  const nextTierLabel = NEXT_TIER[tier] ?? ''

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Contractor tier</CardTitle>
          <span
            className="text-[10px] font-semibold tracking-widest uppercase px-2 py-0.5 rounded-sm"
            style={{
              color: colour,
              backgroundColor: `${colour}18`,
              border: `1px solid ${colour}40`,
            }}
          >
            {TIER_LABELS[tier]}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        {!isPlatinum && nextTierAt !== null && (
          <div className="space-y-3">
            <div className="h-1.5 w-full rounded-full bg-ink-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-accent-500 transition-all duration-700"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-ink-500">
              <span>{compliantProjectCount} compliant projects</span>
              <span>{nextTierAt - compliantProjectCount} to {nextTierLabel}</span>
            </div>
            <p className="text-xs text-ink-400">
              Complete {nextTierAt - compliantProjectCount} more fully-verified project{nextTierAt - compliantProjectCount !== 1 ? 's' : ''} to reach {nextTierLabel} tier.
            </p>
          </div>
        )}
        {isPlatinum && (
          <p className="text-sm text-ink-600 mb-4">
            Maximum tier achieved. You earn the highest cashback rate on all transactions.
          </p>
        )}
        <div className="mt-4">
          <CashbackRates currentTier={tier} />
        </div>
      </CardContent>
    </Card>
  )
}
