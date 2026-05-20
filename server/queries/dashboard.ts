import { db } from '@/lib/db'
import { getCountToNextTier, getTierForMetrics, TIER_THRESHOLDS, TIER_ORDER, type Tier } from '@/lib/tier/rules'

export async function getTierInfo(companyId: string) {
  const [tier, wallet] = await Promise.all([
    db.tierStatus.findUnique({ where: { companyId } }),
    db.walletBalance.findUnique({ where: { companyId } }),
  ])
  return {
    tier: (tier?.tier ?? 'BRONZE') as 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM',
    tokens: wallet?.tokens ?? 0,
  }
}

export async function getDashboardStats(companyId: string) {
  const [projects, wallet] = await Promise.all([
    db.project.findMany({
      where: { contractorCompanyId: companyId, deletedAt: null },
      select: { stage: true, contractValueCents: true, ppaTariffCents: true, systemSizeKw: true },
    }),
    db.walletBalance.findUnique({ where: { companyId } }),
  ])

  const active = projects.filter(p => !['OPERATIONAL', 'DECOMMISSIONED'].includes(p.stage)).length
  const operational = projects.filter(p => p.stage === 'OPERATIONAL').length
  const totalKw = projects.reduce((sum, p) => sum + p.systemSizeKw, 0)

  return {
    activeProjects: active,
    operationalSites: operational,
    totalPortfolioKw: Math.round(totalKw),
    tokenBalance: wallet?.tokens ?? 0,
  }
}

export async function getMilestoneWatch(companyId: string) {
  return db.milestone.findMany({
    where: {
      project: { contractorCompanyId: companyId, deletedAt: null },
      status: { in: ['AVAILABLE', 'IN_PROGRESS', 'SUBMITTED', 'UNDER_REVIEW', 'ACTION_REQUIRED'] },
    },
    include: { project: { select: { name: true } } },
    orderBy: { dueDate: 'asc' },
    take: 6,
  })
}

export async function getNewsItems() {
  return db.newsItem.findMany({
    orderBy: { publishedAt: 'desc' },
    take: 5,
  })
}

export async function getTierProgress(companyId: string) {
  const [tierRecord, kwAggregate] = await Promise.all([
    db.tierStatus.findUnique({ where: { companyId } }),
    db.project.aggregate({
      where: { contractorCompanyId: companyId, deletedAt: null },
      _sum: { systemSizeKw: true },
    }),
  ])

  const projectCount = tierRecord?.compliantProjectCount ?? 0
  const totalKw = kwAggregate._sum.systemSizeKw ?? 0

  // Derive tier from dual thresholds (overrides the stored value for display)
  const currentTier = getTierForMetrics(projectCount, totalKw)
  const nextTierIdx = TIER_ORDER.indexOf(currentTier) + 1
  const nextTier = nextTierIdx < TIER_ORDER.length ? TIER_ORDER[nextTierIdx] as Tier : null

  const nextThresholds = nextTier ? TIER_THRESHOLDS[nextTier] : null
  const countToNext = nextThresholds ? Math.max(0, nextThresholds.projects - projectCount) : null
  const kwToNext = nextThresholds ? Math.max(0, nextThresholds.kw - totalKw) : null

  // Progress is the lesser of the two ratios (bottleneck metric)
  const projectProgress = nextThresholds
    ? Math.min(100, Math.round((projectCount / nextThresholds.projects) * 100))
    : 100
  const kwProgress = nextThresholds && nextThresholds.kw > 0
    ? Math.min(100, Math.round((totalKw / nextThresholds.kw) * 100))
    : 100
  const progressPercent = Math.min(projectProgress, kwProgress)

  return {
    tier: currentTier,
    compliantProjectCount: projectCount,
    totalInstalledKw: totalKw,
    nextTierAt: nextThresholds?.projects ?? null,
    nextTierKw: nextThresholds?.kw ?? null,
    countToNextTier: countToNext,
    kwToNextTier: kwToNext,
    progressPercent,
    projectProgress,
    kwProgress,
  }
}
