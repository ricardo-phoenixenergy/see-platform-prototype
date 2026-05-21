import { db } from '@/lib/db'
import type { DealStructure, Technology } from '@/lib/generated/prisma/client'

export async function selectMilestoneTemplate(
  technology: Technology,
  systemSizeKw: number,
  dealStructure: DealStructure
) {
  const candidates = await db.milestoneTemplate.findMany({
    where: { technology, isActive: true, dealStructure: { has: dealStructure } },
    include: { items: { orderBy: { order: 'asc' } } },
    orderBy: { version: 'desc' },
  })

  // Prefer templates whose size range covers this project
  const sizeMatched = candidates.filter(t =>
    (t.minSizeKw === null || t.minSizeKw <= systemSizeKw) &&
    (t.maxSizeKw === null || t.maxSizeKw >= systemSizeKw)
  )

  const pool = sizeMatched.length > 0 ? sizeMatched : candidates

  if (pool.length === 0) {
    throw new Error(
      `No milestone template found for technology=${technology} dealStructure=${dealStructure} — add a seed record in prisma/seed.ts`
    )
  }

  // Among candidates, prefer the one with the most milestone items (most specific)
  return pool.reduce((best, t) => t.items.length > best.items.length ? t : best)
}
