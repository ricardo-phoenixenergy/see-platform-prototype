import { db } from '@/lib/db'
import type { DealStructure, Technology } from '@/lib/generated/prisma/client'

export async function selectMilestoneTemplate(
  technology: Technology,
  systemSizeKw: number,
  dealStructure: DealStructure
) {
  const templates = await db.milestoneTemplate.findMany({
    where: {
      technology,
      isActive: true,
      dealStructure: { has: dealStructure },
    },
    include: { items: { orderBy: { order: 'asc' } } },
    orderBy: { version: 'desc' },
  })

  // Filter by size range
  const matching = templates.filter(t =>
    (t.minSizeKw === null || t.minSizeKw <= systemSizeKw) &&
    (t.maxSizeKw === null || t.maxSizeKw >= systemSizeKw)
  )

  if (matching.length === 0) {
    throw new Error(`No milestone template found for ${technology} ${systemSizeKw}kW ${dealStructure}`)
  }

  // Prefer the template with the most items (most specific)
  return matching.reduce((best, t) => t.items.length > best.items.length ? t : best)
}
