import { db } from '@/lib/db'

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
  const tier = await db.tierStatus.findUnique({ where: { companyId } })

  const nextThreshold: Record<string, number | null> = {
    BRONZE: 3, SILVER: 8, GOLD: 15, PLATINUM: null,
  }
  const currentTier = (tier?.tier ?? 'BRONZE') as 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM'
  const count = tier?.compliantProjectCount ?? 0
  const next = nextThreshold[currentTier] ?? null

  return {
    tier: currentTier,
    compliantProjectCount: count,
    nextTierAt: next,
    progressPercent: next !== null ? Math.min(100, Math.round((count / next) * 100)) : 100,
  }
}
