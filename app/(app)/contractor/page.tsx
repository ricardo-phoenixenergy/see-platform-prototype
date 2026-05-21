import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getDashboardStats, getMilestoneWatch, getNewsItems, getTierProgress } from '@/server/queries/dashboard'
import { StatsRow } from '@/components/dashboard/stats-row'
import { TierProgressCard } from '@/components/dashboard/tier-progress-card'
import { MilestoneWatch } from '@/components/dashboard/milestone-watch'
import { NewsfeedSidebar } from '@/components/dashboard/newsfeed-sidebar'
import { AiSuggestionsCard } from '@/components/dashboard/ai-suggestions-card'
import { db } from '@/lib/db'

type Props = { searchParams: Promise<{ tierUp?: string }> }

export default async function ContractorDashboardPage({ searchParams }: Props) {
  const session = await auth()
  if (!session) redirect('/login')

  const companyId = session.user.companyId
  const { tierUp } = await searchParams

  // Check for pending tier upgrade notification (set by admin approval via recalculateTier)
  if (!tierUp) {
    const tierStatus = await db.tierStatus.findUnique({
      where: { companyId },
      select: { pendingTierUp: true },
    })
    if (tierStatus?.pendingTierUp) {
      await db.tierStatus.update({
        where: { companyId },
        data: { pendingTierUp: null },
      })
      redirect(`/contractor?tierUp=${tierStatus.pendingTierUp}`)
    }
  }

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
  ]

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink-900">Dashboard</h1>
        <p className="text-sm text-ink-500 mt-1">
          Adebayo Renewables — {tierProgress.tier.charAt(0) + tierProgress.tier.slice(1).toLowerCase()} tier
        </p>
      </div>

      <StatsRow stats={statItems} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <MilestoneWatch milestones={milestones} />
          <AiSuggestionsCard />
          <TierProgressCard
            tier={tierProgress.tier}
            compliantProjectCount={tierProgress.compliantProjectCount}
            totalInstalledKw={tierProgress.totalInstalledKw}
            nextTierAt={tierProgress.nextTierAt}
            nextTierKw={tierProgress.nextTierKw}
            progressPercent={tierProgress.progressPercent}
            projectProgress={tierProgress.projectProgress}
            kwProgress={tierProgress.kwProgress}
          />
        </div>

        <div className="lg:col-span-1">
          <NewsfeedSidebar items={newsItems} />
        </div>
      </div>
    </div>
  )
}
