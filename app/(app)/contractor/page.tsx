import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getDashboardStats, getMilestoneWatch, getNewsItems, getTierProgress } from '@/server/queries/dashboard'
import { StatsRow } from '@/components/dashboard/stats-row'
import { TierProgressCard } from '@/components/dashboard/tier-progress-card'
import { MilestoneWatch } from '@/components/dashboard/milestone-watch'
import { NewsfeedSidebar } from '@/components/dashboard/newsfeed-sidebar'
import { AiSuggestionsCard } from '@/components/dashboard/ai-suggestions-card'

export default async function ContractorDashboardPage() {
  const session = await auth()
  if (!session) redirect('/login')

  const companyId = session.user.companyId

  const [stats, milestones, newsItems, tierProgress] = await Promise.all([
    getDashboardStats(companyId),
    getMilestoneWatch(companyId),
    getNewsItems(),
    getTierProgress(companyId),
  ])

  const statItems = [
    { label: 'Active projects', value: String(stats.activeProjects), sub: 'across all stages' },
    { label: 'Operational sites', value: String(stats.operationalSites), sub: 'generating today' },
    { label: 'Portfolio capacity', value: `${stats.totalPortfolioKw.toLocaleString()} kW`, sub: 'total installed' },
    { label: 'Token balance', value: stats.tokenBalance.toLocaleString(), sub: 'SEE tokens' },
  ]

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink-900">Dashboard</h1>
        <p className="text-sm text-ink-500 mt-1">Adebayo Renewables — Silver tier</p>
      </div>

      {/* Stats row */}
      <StatsRow stats={statItems} />

      {/* Main grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left column — 2/3 width */}
        <div className="lg:col-span-2 space-y-6">
          <MilestoneWatch milestones={milestones} />
          <AiSuggestionsCard />
          <TierProgressCard
            tier={tierProgress.tier}
            compliantProjectCount={tierProgress.compliantProjectCount}
            nextTierAt={tierProgress.nextTierAt}
            progressPercent={tierProgress.progressPercent}
          />
        </div>

        {/* Right column — 1/3 width */}
        <div className="lg:col-span-1">
          <NewsfeedSidebar items={newsItems} />
        </div>
      </div>
    </div>
  )
}
