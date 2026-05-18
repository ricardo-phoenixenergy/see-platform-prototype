'use server'

import { MilestoneStatus } from '@/lib/generated/prisma/enums'

import { db } from '@/lib/db'
import { getTierForCount } from '@/lib/tier/rules'
import type { Tier } from '@/lib/tier/rules'

export async function recalculateTier(companyId: string): Promise<{
  previousTier: Tier
  newTier: Tier
  upgraded: boolean
}> {
  // Count distinct projects where ALL hard-gate milestones are APPROVED or AUTO_GOLD
  const projects = await db.project.findMany({
    where: { contractorCompanyId: companyId, deletedAt: null },
    select: {
      id: true,
      milestones: {
        where: { isHardGate: true },
        select: { status: true },
      },
    },
  })

  const compliantCount = projects.filter((p) => {
    const hardGates = p.milestones
    return (
      hardGates.length > 0 &&
      hardGates.every(
        (m) =>
          m.status === MilestoneStatus.APPROVED ||
          m.status === MilestoneStatus.AUTO_GOLD,
      )
    )
  }).length

  const current = await db.tierStatus.findUnique({
    where: { companyId },
    select: { tier: true },
  })
  const previousTier = (current?.tier ?? 'BRONZE') as Tier
  const newTier = getTierForCount(compliantCount)

  const upgraded = newTier !== previousTier

  await db.tierStatus.upsert({
    where: { companyId },
    update: {
      tier: newTier,
      compliantProjectCount: compliantCount,
      ...(upgraded ? { pendingTierUp: newTier } : {}),
    },
    create: {
      companyId,
      tier: newTier,
      compliantProjectCount: compliantCount,
      pendingTierUp: upgraded ? newTier : null,
    },
  })

  return { previousTier, newTier, upgraded }
}
