// server/queries/client.ts

import { db } from '@/lib/db'

export async function getClientProjects(companyId: string) {
  return db.project.findMany({
    where: { clientCompanyId: companyId, deletedAt: null },
    include: {
      site: true,
      contractorCompany: { select: { name: true } },
      omLicenses: {
        where: { viewerType: 'CLIENT', status: 'ACTIVE' },
        select: { id: true, tier: true, status: true },
        take: 1,
      },
    },
    orderBy: { createdAt: 'desc' },
  })
}

export async function getPlantData(projectId: string) {
  const [project, readings, events] = await Promise.all([
    db.project.findUnique({
      where: { id: projectId },
      include: {
        site: true,
        contractorCompany: { select: { name: true } },
        omLicenses: {
          where: { viewerType: 'CLIENT' },
          select: { id: true, tier: true, status: true },
          take: 1,
        },
      },
    }),
    db.omReading.findMany({
      where: { projectId },
      orderBy: { recordedAt: 'asc' },
      take: 30,
    }),
    db.omEvent.findMany({
      where: { projectId },
      orderBy: { scheduledAt: 'asc' },
      take: 10,
    }),
  ])
  return { project, readings, events }
}

export async function getOmReadings(projectId: string, days = 30) {
  const since = new Date()
  since.setDate(since.getDate() - days)
  return db.omReading.findMany({
    where: { projectId, recordedAt: { gte: since } },
    orderBy: { recordedAt: 'asc' },
  })
}

export async function getOmEvents(projectId: string) {
  return db.omEvent.findMany({
    where: { projectId },
    orderBy: { scheduledAt: 'asc' },
  })
}

export async function getProjectDocuments(projectId: string) {
  return db.projectDocument.findMany({
    where: { projectId },
    orderBy: { createdAt: 'desc' },
  })
}

export async function getActiveLicense(projectId: string, companyId: string) {
  return db.omLicense.findFirst({
    where: {
      projectId,
      licenseeCompanyId: companyId,
      viewerType: 'CLIENT',
      status: 'ACTIVE',
    },
    select: { id: true, tier: true },
  })
}

export const SPAZA_COMPANY_ID = 'company-spaza'

export function isEnterpriseCompany(companyId: string) {
  return companyId === SPAZA_COMPANY_ID
}
