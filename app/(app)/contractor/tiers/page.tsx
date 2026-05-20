import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getTierProgress } from '@/server/queries/dashboard'
import { TIER_ORDER, TIER_THRESHOLDS, TIER_CASHBACK_RATES, getNextTier } from '@/lib/tier/rules'
import type { Tier } from '@/lib/tier/rules'
import { cn } from '@/lib/utils'
import { Check, Lock } from 'lucide-react'

const TIER_COLOURS: Record<Tier, string> = {
  BRONZE: '#A56A3E',
  SILVER: '#8B95A0',
  GOLD: '#C9A03E',
  PLATINUM: '#6E7A8A',
}

const TIER_LABELS: Record<Tier, string> = {
  BRONZE: 'Bronze', SILVER: 'Silver', GOLD: 'Gold', PLATINUM: 'Platinum',
}

type Benefit = { text: string; highlight?: boolean }

const TIER_BENEFITS: Record<Tier, Benefit[]> = {
  BRONZE: [
    { text: '2% cashback on all marketplace purchases' },
    { text: 'Full project management suite' },
    { text: 'Unlimited milestones and document uploads' },
    { text: 'RFQ posting and service provider marketplace' },
    { text: 'SEE.AI Assistant access' },
    { text: 'O&M licensing — Basic and Premium tiers' },
  ],
  SILVER: [
    { text: '5% cashback on all marketplace purchases', highlight: true },
    { text: 'Everything in Bronze' },
    { text: 'Leads marketplace access', highlight: true },
    { text: 'Priority email support' },
    { text: 'Silver badge displayed on your company profile' },
    { text: 'Early access to new platform features' },
  ],
  GOLD: [
    { text: '8% cashback on all marketplace purchases', highlight: true },
    { text: 'Everything in Silver' },
    { text: 'Gold badge + featured placement in partner directory', highlight: true },
    { text: 'Discounted hardware marketplace pricing', highlight: true },
    { text: 'Quarterly business review with platform team' },
    { text: 'O&M AI tier licensing unlocked', highlight: true },
  ],
  PLATINUM: [
    { text: '12% cashback — highest available rate', highlight: true },
    { text: 'Everything in Gold' },
    { text: 'Dedicated account manager', highlight: true },
    { text: 'Custom enterprise pricing and SLA', highlight: true },
    { text: 'Co-marketing and case study opportunities', highlight: true },
    { text: 'API integration access for enterprise clients', highlight: true },
    { text: 'Priority listing across all marketplaces', highlight: true },
  ],
}

export default async function TiersPage() {
  const session = await auth()
  if (!session) redirect('/login')

  const { tier, compliantProjectCount, nextTierAt, progressPercent, countToNextTier } =
    await getTierProgress(session.user.companyId)
  const nextTier = getNextTier(tier)
  const toNext = countToNextTier

  const tierColour = TIER_COLOURS[tier]

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink-900">Contractor Tiers</h1>
        <p className="text-sm text-ink-500 mt-1">
          Earn higher rewards and unlock more features as you complete verified projects on SEE.
        </p>
      </div>

      {/* Current status card */}
      <div className="rounded-lg border border-ink-200 bg-white p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-ink-400">Current tier</p>
            <p
              className="text-xl font-semibold mt-0.5"
              style={{ color: tierColour }}
            >
              {TIER_LABELS[tier]}
            </p>
          </div>
          <span
            className="text-sm font-semibold px-3 py-1 rounded-md"
            style={{
              color: tierColour,
              backgroundColor: `${tierColour}18`,
              border: `1px solid ${tierColour}40`,
            }}
          >
            {compliantProjectCount} verified project{compliantProjectCount !== 1 ? 's' : ''}
          </span>
        </div>

        {tier !== 'PLATINUM' && nextTier && toNext !== null && (
          <div className="space-y-2">
            <div className="h-2 w-full rounded-full bg-ink-100 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${progressPercent}%`, backgroundColor: TIER_COLOURS[nextTier] }}
              />
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-ink-500">{compliantProjectCount} / {nextTierAt} compliant projects</span>
              <span className="font-medium" style={{ color: TIER_COLOURS[nextTier] }}>
                {toNext} more to reach {TIER_LABELS[nextTier]}
              </span>
            </div>
            <p className="text-xs text-ink-400 pt-1">
              A compliant project is one where all hard-gate milestones have been submitted and approved through the SEE verification engine.
            </p>
          </div>
        )}

        {tier === 'PLATINUM' && (
          <p className="text-sm text-ink-600">
            You have reached the maximum tier. All rewards and benefits are fully unlocked.
          </p>
        )}
      </div>

      {/* Tier ladder */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-ink-900">All tiers</h2>

        {TIER_ORDER.map((t, i) => {
          const colour = TIER_COLOURS[t]
          const isCurrentTier = t === tier
          const isUnlocked = TIER_ORDER.indexOf(t) <= TIER_ORDER.indexOf(tier)
          const threshold = TIER_THRESHOLDS[t]

          return (
            <div
              key={t}
              className={cn(
                'rounded-lg border p-5 space-y-3 transition-colors',
                isCurrentTier
                  ? 'border-ink-300 bg-white shadow-sm'
                  : isUnlocked
                    ? 'border-ink-200 bg-white'
                    : 'border-ink-100 bg-ink-25/50'
              )}
            >
              {/* Tier header */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div
                    className="h-3 w-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: colour }}
                  />
                  <span
                    className={cn('text-sm font-semibold', isUnlocked ? '' : 'text-ink-400')}
                    style={isUnlocked ? { color: colour } : {}}
                  >
                    {TIER_LABELS[t]}
                  </span>
                  {isCurrentTier && (
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-sm bg-ink-900 text-white">
                      Current
                    </span>
                  )}
                  {!isUnlocked && (
                    <Lock className="h-3 w-3 text-ink-300" strokeWidth={1.5} />
                  )}
                </div>
                <div className="text-right">
                  <span className={cn('text-xs', isUnlocked ? 'text-ink-700 font-semibold' : 'text-ink-400')}>
                    {TIER_CASHBACK_RATES[t]}% cashback
                  </span>
                  <p className="text-[10px] text-ink-400 mt-0.5">
                    {threshold === 0 ? 'Entry tier' : `${threshold}+ verified projects`}
                  </p>
                </div>
              </div>

              {/* Divider */}
              {(i < TIER_ORDER.length - 1 || isCurrentTier) && (
                <div className="border-t border-ink-100" />
              )}

              {/* Benefits list */}
              <ul className="space-y-1.5">
                {TIER_BENEFITS[t].map((benefit, j) => (
                  <li key={j} className="flex items-start gap-2">
                    <Check
                      className={cn(
                        'h-3.5 w-3.5 mt-0.5 flex-shrink-0',
                        isUnlocked ? 'text-success-500' : 'text-ink-300'
                      )}
                      strokeWidth={2}
                    />
                    <span className={cn(
                      'text-xs leading-relaxed',
                      isUnlocked
                        ? benefit.highlight ? 'text-ink-900 font-medium' : 'text-ink-600'
                        : 'text-ink-400'
                    )}>
                      {benefit.text}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )
        })}
      </div>
    </div>
  )
}
