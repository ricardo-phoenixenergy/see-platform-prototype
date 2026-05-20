import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getTierProgress } from '@/server/queries/dashboard'
import { TIER_ORDER, TIER_THRESHOLDS, TIER_DISCOUNT_RATES, TIER_COMMISSION_RATES, TIER_TOKEN_MULTIPLIERS, TOKEN_AI_REVIEW, TOKEN_EXPERT_REVIEW, TOKEN_PROJECT_DONE, TOKENS_PER_RAND, getNextTier } from '@/lib/tier/rules'
import type { Tier } from '@/lib/tier/rules'
import { cn } from '@/lib/utils'
import { Check, Lock } from 'lucide-react'

const TIER_COLOURS: Record<Tier, string> = {
  BRONZE:   '#A56A3E',
  SILVER:   '#8B95A0',
  GOLD:     '#C9A03E',
  PLATINUM: '#6E7A8A',
}

const TIER_LABELS: Record<Tier, string> = {
  BRONZE: 'Bronze', SILVER: 'Silver', GOLD: 'Gold', PLATINUM: 'Platinum',
}

type Benefit = { text: string; highlight?: boolean }

const TIER_BENEFITS: Record<Tier, Benefit[]> = {
  BRONZE: [
    { text: '2% discount on all marketplace purchases' },
    { text: '10% commission on O&M license sales' },
    { text: 'Project Funding Access — visibility to lenders and funding partners in the SEE network' },
    { text: 'Service Centre Access — post RFQs and hire from verified service providers' },
    { text: 'SEE Token rewards — earn on every verified milestone, redeemable against hardware and service purchases' },
    { text: 'Hardware Marketplace — source panels, inverters, batteries, and accessories' },
  ],
  SILVER: [
    { text: '5% discount on all marketplace purchases', highlight: true },
    { text: '20% commission on O&M license sales', highlight: true },
    { text: '1.5× token earn multiplier on all milestone rewards', highlight: true },
    { text: 'All Bronze benefits' },
    { text: 'SEE Certified badge — credential for external proposals and client marketing', highlight: true },
    { text: 'Leads marketplace — bid for incoming projects under 200 kW', highlight: true },
    { text: 'Priority email support' },
  ],
  GOLD: [
    { text: '8% discount on all marketplace purchases', highlight: true },
    { text: '30% commission on O&M license sales', highlight: true },
    { text: '2× token earn multiplier on all milestone rewards', highlight: true },
    { text: 'All Silver benefits' },
    { text: 'Leads marketplace — all project sizes, no capacity restriction', highlight: true },
    { text: 'Invitations to SEE networking events and industry conferences', highlight: true },
    { text: 'Gold badge and featured placement in the SEE partner directory', highlight: true },
  ],
  PLATINUM: [
    { text: '10% discount — highest available rate on marketplace purchases', highlight: true },
    { text: '40% commission on O&M license sales — maximum rate', highlight: true },
    { text: '3× token earn multiplier — fastest way to accumulate rewards', highlight: true },
    { text: 'All Gold benefits' },
    { text: 'Dedicated account manager', highlight: true },
    { text: 'Invite-only Platinum roundtables with project developers and funders', highlight: true },
    { text: 'Co-marketing and case study features on the SEE platform', highlight: true },
    { text: 'Custom enterprise pricing and SLA agreement', highlight: true },
  ],
}

function formatKw(kw: number) {
  return kw >= 1000 ? `${(kw / 1000).toFixed(0)} MW` : `${kw} kW`
}

export default async function TiersPage() {
  const session = await auth()
  if (!session) redirect('/login')

  const {
    tier,
    compliantProjectCount,
    totalInstalledKw,
    nextTierAt,
    nextTierKw,
    projectProgress,
    kwProgress,
  } = await getTierProgress(session.user.companyId)

  const nextTier = getNextTier(tier)
  const tierColour = TIER_COLOURS[tier]

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink-900">Contractor Tiers</h1>
        <p className="text-sm text-ink-500 mt-1">
          Unlock higher discounts, greater commissions, and exclusive benefits as you grow on SEE.
        </p>
      </div>

      {/* Current status card */}
      <div className="rounded-lg border border-ink-200 bg-white p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-ink-400">Current tier</p>
            <p className="text-xl font-semibold mt-0.5" style={{ color: tierColour }}>
              {TIER_LABELS[tier]}
            </p>
          </div>
          <div className="text-right space-y-0.5">
            <p className="text-xs text-ink-500">
              <span className="font-semibold text-ink-900">{compliantProjectCount}</span> verified projects
            </p>
            <p className="text-xs text-ink-500">
              <span className="font-semibold text-ink-900">{formatKw(totalInstalledKw)}</span> installed
            </p>
          </div>
        </div>

        {tier !== 'PLATINUM' && nextTier && nextTierAt !== null && nextTierKw !== null && (
          <div className="space-y-3">
            <p className="text-xs font-medium text-ink-700">
              Progress to {TIER_LABELS[nextTier]} — both thresholds must be met
            </p>

            {/* Project progress */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-ink-500">
                <span>Verified projects</span>
                <span className={projectProgress >= 100 ? 'text-success-600 font-medium' : ''}>
                  {compliantProjectCount} / {nextTierAt}{projectProgress >= 100 ? ' ✓' : ''}
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-ink-100 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${projectProgress}%`,
                    backgroundColor: projectProgress >= 100 ? '#1E9D6B' : TIER_COLOURS[nextTier],
                  }}
                />
              </div>
            </div>

            {/* kW progress */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-ink-500">
                <span>Installed capacity</span>
                <span className={kwProgress >= 100 ? 'text-success-600 font-medium' : ''}>
                  {formatKw(totalInstalledKw)} / {formatKw(nextTierKw)}{kwProgress >= 100 ? ' ✓' : ''}
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-ink-100 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${kwProgress}%`,
                    backgroundColor: kwProgress >= 100 ? '#1E9D6B' : TIER_COLOURS[nextTier],
                  }}
                />
              </div>
            </div>

            <p className="text-xs text-ink-400">
              Installed capacity is the sum of inverter AC sizing across all your active projects on SEE.
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

        {TIER_ORDER.map((t) => {
          const colour = TIER_COLOURS[t]
          const isCurrentTier = t === tier
          const isUnlocked = TIER_ORDER.indexOf(t) <= TIER_ORDER.indexOf(tier)
          const threshold = TIER_THRESHOLDS[t]

          return (
            <div
              key={t}
              className={cn(
                'rounded-lg border p-5 space-y-3',
                isCurrentTier
                  ? 'border-ink-300 bg-white shadow-sm'
                  : isUnlocked
                    ? 'border-ink-200 bg-white'
                    : 'border-ink-100 bg-ink-25/50'
              )}
            >
              {/* Header row */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="h-3 w-3 rounded-full flex-shrink-0" style={{ backgroundColor: colour }} />
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
                  {!isUnlocked && <Lock className="h-3 w-3 text-ink-300" strokeWidth={1.5} />}
                </div>

                <div className="text-right space-y-0.5">
                  <p className={cn('text-xs font-semibold', isUnlocked ? 'text-ink-700' : 'text-ink-400')}>
                    {TIER_DISCOUNT_RATES[t]}% discount · {TIER_COMMISSION_RATES[t]}% commission
                  </p>
                  <p className="text-[10px] text-ink-400">
                    {threshold.projects === 0
                      ? 'Entry tier'
                      : `${threshold.projects} projects + ${formatKw(threshold.kw)}`}
                  </p>
                </div>
              </div>

              <div className="border-t border-ink-100" />

              {/* Benefits */}
              <ul className="space-y-1.5">
                {TIER_BENEFITS[t].map((benefit, j) => (
                  <li key={j} className="flex items-start gap-2">
                    <Check
                      className={cn('h-3.5 w-3.5 mt-0.5 flex-shrink-0', isUnlocked ? 'text-success-500' : 'text-ink-300')}
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

      {/* Token economy */}
      <div className="space-y-3">
        <div>
          <h2 className="text-sm font-semibold text-ink-900">SEE Token economy</h2>
          <p className="text-xs text-ink-500 mt-0.5">
            Tokens are earned when milestones are verified. Expert-reviewed milestones earn 3× more than
            AI-reviewed ones. Redeem tokens as additional discounts on hardware and service purchases —
            stacked on top of your tier discount.
          </p>
        </div>

        {/* Exchange rate callout */}
        <div className="rounded-md bg-ink-900 px-4 py-3 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-white">Token exchange rate</p>
            <p className="text-[10px] text-ink-400 mt-0.5">Applied at checkout on hardware and service purchases</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-semibold text-white tabular-nums">
              {TOKENS_PER_RAND} tokens = R1
            </p>
            <p className="text-[10px] text-ink-400">no minimum · stacks with tier discount</p>
          </div>
        </div>

        {/* Earn rate table */}
        <div className="rounded-md border border-ink-200 overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-ink-25 border-b border-ink-100">
                <th className="px-3 py-2 text-left font-semibold text-ink-500">Tier</th>
                <th className="px-3 py-2 text-center font-semibold text-ink-500">Multiplier</th>
                <th className="px-3 py-2 text-right font-semibold text-ink-500">AI review accepted</th>
                <th className="px-3 py-2 text-right font-semibold text-ink-500">Expert review accepted</th>
                <th className="px-3 py-2 text-right font-semibold text-ink-500">Project complete</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-50">
              {TIER_ORDER.map((t) => {
                const isActive = t === tier
                const mult = TIER_TOKEN_MULTIPLIERS[t]
                const colour = TIER_COLOURS[t]
                return (
                  <tr key={t} className={cn(isActive ? 'bg-white' : 'bg-ink-25/50')}>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: colour }} />
                        <span className={cn('font-medium', isActive ? 'text-ink-900' : 'text-ink-400')}>
                          {TIER_LABELS[t]}
                          {isActive && <span className="ml-1.5 text-[10px] text-accent-500">current</span>}
                        </span>
                      </div>
                    </td>
                    <td className={cn('px-3 py-2 text-center font-semibold tabular-nums', isActive ? 'text-ink-900' : 'text-ink-300')}>
                      {mult}×
                    </td>
                    <td className={cn('px-3 py-2 text-right tabular-nums', isActive ? 'text-ink-700' : 'text-ink-300')}>
                      {Math.round(TOKEN_AI_REVIEW * mult).toLocaleString()}
                      <span className={cn('ml-1 text-[10px]', isActive ? 'text-ink-400' : 'text-ink-200')}>
                        = R{(Math.round(TOKEN_AI_REVIEW * mult) / TOKENS_PER_RAND).toFixed(0)}
                      </span>
                    </td>
                    <td className={cn('px-3 py-2 text-right tabular-nums', isActive ? 'text-ink-700' : 'text-ink-300')}>
                      {Math.round(TOKEN_EXPERT_REVIEW * mult).toLocaleString()}
                      <span className={cn('ml-1 text-[10px]', isActive ? 'text-ink-400' : 'text-ink-200')}>
                        = R{(Math.round(TOKEN_EXPERT_REVIEW * mult) / TOKENS_PER_RAND).toFixed(0)}
                      </span>
                    </td>
                    <td className={cn('px-3 py-2 text-right tabular-nums font-semibold', isActive ? 'text-ink-900' : 'text-ink-300')}>
                      {Math.round(TOKEN_PROJECT_DONE * mult).toLocaleString()}
                      <span className={cn('ml-1 text-[10px] font-normal', isActive ? 'text-ink-400' : 'text-ink-200')}>
                        = R{(Math.round(TOKEN_PROJECT_DONE * mult) / TOKENS_PER_RAND).toFixed(0)}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Redemption note */}
        <div className="rounded-lg border border-ink-200 bg-white p-4 space-y-2">
          <p className="text-xs font-semibold text-ink-700">Where tokens can be redeemed</p>
          <ul className="space-y-1.5">
            {[
              { icon: '🔧', label: 'Service Centre', detail: 'Apply tokens toward any awarded RFQ payment' },
              { icon: '🛒', label: 'Hardware Marketplace', detail: 'Apply tokens toward any hardware order at checkout' },
            ].map((item) => (
              <li key={item.label} className="flex items-start gap-2.5 text-xs">
                <span>{item.icon}</span>
                <div>
                  <span className="font-medium text-ink-900">{item.label}</span>
                  <span className="text-ink-500"> — {item.detail}</span>
                </div>
              </li>
            ))}
          </ul>
          <p className="text-[10px] text-ink-400 pt-1 border-t border-ink-50 mt-2">
            Tokens expire 12 months after they are earned. Your balance and full transaction history are visible in your Wallet.
          </p>
        </div>
      </div>
    </div>
  )
}
