import { db } from '@/lib/db'

export async function getProjects(companyId: string, filters?: {
  stage?: string
  technology?: string
  search?: string
}) {
  return db.project.findMany({
    where: {
      contractorCompanyId: companyId,
      deletedAt: null,
      ...(filters?.stage && filters.stage !== 'ALL' ? { stage: filters.stage as never } : {}),
      ...(filters?.technology && filters.technology !== 'ALL' ? { technology: filters.technology as never } : {}),
      ...(filters?.search ? {
        OR: [
          { name: { contains: filters.search, mode: 'insensitive' as const } },
          { externalClientName: { contains: filters.search, mode: 'insensitive' as const } },
        ],
      } : {}),
    },
    include: {
      clientCompany: { select: { name: true } },
      milestones: { select: { status: true } },
      site: { select: { city: true, province: true } },
    },
    orderBy: { updatedAt: 'desc' },
  })
}

export type ProjectWithRelations = Awaited<ReturnType<typeof getProjects>>[number]

export async function getProject(projectId: string, companyId: string) {
  return db.project.findFirst({
    where: { id: projectId, contractorCompanyId: companyId, deletedAt: null },
    include: {
      site: true,
      clientCompany: { select: { name: true } },
      clientRecord: { select: { id: true, name: true } },
      milestones: {
        include: {
          submissions: { orderBy: { createdAt: 'desc' }, take: 1 },
        },
        orderBy: { order: 'asc' },
      },
    },
  })
}

export type ProjectDetail = NonNullable<Awaited<ReturnType<typeof getProject>>>
export type MilestoneWithSubmission = ProjectDetail['milestones'][number]
