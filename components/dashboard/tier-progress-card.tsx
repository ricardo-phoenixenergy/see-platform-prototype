import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CashbackRates } from '@/components/tier/cashback-rates'

type Props = {
  tier: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM'
  compliantProjectCount: number
  totalInstalledKw: number
  nextTierAt: number | null
  nextTierKw: number | null
  progressPercent: number
  projectProgress: number
  kwProgress: number
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

function formatKw(kw: number) {
  return kw >= 1000 ? `${(kw / 1000).toFixed(1)} MW` : `${kw} kW`
}

export function TierProgressCard({
  tier, compliantProjectCount, totalInstalledKw,
  nextTierAt, nextTierKw, projectProgress, kwProgress,
}: Props) {
  const colour = TIER_COLOURS[tier] ?? '#8B95A0'
  const isPlatinum = tier === 'PLATINUM'
  const nextTierLabel = NEXT_TIER[tier] ?? ''

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Contractor tier</CardTitle>
          <div className="flex items-center gap-2">
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
            <Link
              href="/contractor/tiers"
              className="text-[10px] text-accent-600 hover:text-accent-700 font-medium transition-colors"
            >
              View benefits →
            </Link>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {!isPlatinum && nextTierAt !== null && nextTierKw !== null && (
          <div className="space-y-3">
            {/* Project progress */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-ink-500">
                <span>Projects</span>
                <span className={projectProgress >= 100 ? 'text-success-600 font-medium' : ''}>
                  {compliantProjectCount} / {nextTierAt}
                  {projectProgress >= 100 ? ' ✓' : ''}
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-ink-100 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${projectProgress}%`,
                    backgroundColor: projectProgress >= 100 ? '#1E9D6B' : '#3E5BEA',
                  }}
                />
              </div>
            </div>

            {/* kW progress */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-ink-500">
                <span>Installed capacity</span>
                <span className={kwProgress >= 100 ? 'text-success-600 font-medium' : ''}>
                  {formatKw(totalInstalledKw)} / {formatKw(nextTierKw)}
                  {kwProgress >= 100 ? ' ✓' : ''}
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-ink-100 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${kwProgress}%`,
                    backgroundColor: kwProgress >= 100 ? '#1E9D6B' : '#3E5BEA',
                  }}
                />
              </div>
            </div>

            <p className="text-xs text-ink-400">
              Both thresholds must be met to advance to {nextTierLabel}.
            </p>
          </div>
        )}
        {isPlatinum && (
          <p className="text-sm text-ink-600 mb-4">
            Maximum tier achieved. You earn the highest discount and commission rates on all transactions.
          </p>
        )}
        <div className="mt-4">
          <CashbackRates currentTier={tier} />
        </div>
      </CardContent>
    </Card>
  )
}
