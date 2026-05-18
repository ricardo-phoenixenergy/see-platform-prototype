import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getSpStats, getOpenRfqsForSp, getSpProfile } from '@/server/queries/marketplace'
import Link from 'next/link'
import { Briefcase, DollarSign, TrendingUp, Star } from 'lucide-react'

export default async function ServiceProviderDashboardPage() {
  const session = await auth()
  if (!session) redirect('/login')
  const companyId = session.user.companyId

  const [stats, profile] = await Promise.all([
    getSpStats(companyId),
    getSpProfile(companyId),
  ])

  const opportunities = profile
    ? await getOpenRfqsForSp(profile.categories as string[])
    : []

  const statCards = [
    { label: 'Active jobs', value: stats.activeJobs, icon: Briefcase },
    { label: 'Revenue earned', value: `R ${(stats.revenueEarnedCents / 100).toLocaleString('en-ZA')}`, icon: DollarSign },
    { label: 'Completed jobs', value: stats.completedJobs, icon: TrendingUp },
    { label: 'Total bids', value: stats.totalBids, icon: Star },
  ]

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink-900">Dashboard</h1>
        {profile && <p className="text-sm text-ink-500 mt-1">{profile.headline}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon
          return (
            <div key={card.label} className="rounded-lg border border-ink-200 bg-white px-4 py-5">
              <div className="flex items-center gap-2 mb-2">
                <Icon className="h-4 w-4 text-ink-400" strokeWidth={1.5} />
                <span className="text-xs text-ink-500">{card.label}</span>
              </div>
              <p className="text-2xl font-semibold text-ink-900 tabular-nums">{card.value}</p>
            </div>
          )
        })}
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-ink-900">New opportunities matching your profile</h2>
          <Link href="/service-provider/opportunities" className="text-xs text-accent-600 hover:underline">View all</Link>
        </div>

        {opportunities.length === 0 && (
          <p className="text-sm text-ink-500 py-6 text-center">No open opportunities matching your categories right now.</p>
        )}

        <div className="space-y-3">
          {opportunities.slice(0, 3).map((rfq) => (
            <Link
              key={rfq.id}
              href={`/service-provider/opportunities/${rfq.id}`}
              className="flex items-start gap-4 rounded-lg border border-ink-200 bg-white px-5 py-4 hover:border-ink-300 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-ink-900 truncate">{rfq.title}</p>
                <p className="text-xs text-ink-500 truncate">{rfq.project.name} · {rfq.project.systemSizeKw} kW</p>
              </div>
              {rfq.budgetCentsMax && (
                <p className="text-xs font-medium text-ink-700 flex-shrink-0">
                  Up to R {(rfq.budgetCentsMax / 100).toLocaleString('en-ZA')}
                </p>
              )}
              <span className="text-xs text-ink-400 flex-shrink-0">
                {rfq.bids.length} bid{rfq.bids.length !== 1 ? 's' : ''}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
