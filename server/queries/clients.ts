import { db } from '@/lib/db'

export async function getClients(contractorCompanyId: string) {
  return db.clientRecord.findMany({
    where: { contractorCompanyId },
    include: {
      _count: { select: { projects: true } },
    },
    orderBy: { name: 'asc' },
  })
}

export type ClientWithCount = Awaited<ReturnType<typeof getClients>>[number]

export async function getClientById(id: string, contractorCompanyId: string) {
  return db.clientRecord.findFirst({
    where: { id, contractorCompanyId },
    include: {
      projects: {
        where: { deletedAt: null },
        include: {
          site: { select: { city: true, province: true } },
          milestones: { select: { status: true } },
        },
        orderBy: { updatedAt: 'desc' },
      },
    },
  })
}
