// server/queries/admin.ts

import { db } from '@/lib/db'

export async function getAdminStats() {
  const [totalUsers, totalCompanies, totalProjects, kycPending, submissionsPending] = await Promise.all([
    db.user.count({ where: { deletedAt: null } }),
    db.company.count({ where: { deletedAt: null } }),
    db.project.count({ where: { deletedAt: null } }),
    db.kycSubmission.count({ where: { status: 'PENDING' } }),
    db.milestoneSubmission.count({ where: { status: { in: ['PENDING', 'UNDER_REVIEW'] } } }),
  ])
  return { totalUsers, totalCompanies, totalProjects, kycPending, submissionsPending }
}

export async function getKycQueue() {
  return db.kycSubmission.findMany({
    where: { status: { in: ['PENDING', 'REQUEST_INFO'] } },
    include: {
      company: { select: { id: true, name: true, type: true, registrationNo: true, vatNo: true } },
    },
    orderBy: { createdAt: 'asc' },
  })
}

export async function getKycSubmission(id: string) {
  return db.kycSubmission.findUnique({
    where: { id },
    include: {
      company: { select: { id: true, name: true, type: true, registrationNo: true, vatNo: true } },
    },
  })
}

export async function getSubmissionsQueue() {
  return db.milestoneSubmission.findMany({
    where: { status: { in: ['PENDING', 'UNDER_REVIEW'] } },
    include: {
      milestone: {
        select: {
          id: true,
          name: true,
          isHardGate: true,
          requiredArtefacts: true,
          project: {
            select: {
              id: true,
              name: true,
              contractorCompanyId: true,
              contractorCompany: { select: { name: true } },
            },
          },
        },
      },
      verifications: {
        select: { id: true, type: true, status: true, qualityRating: true },
      },
    },
    orderBy: { createdAt: 'asc' },
  })
}

export async function getSubmissionDetail(id: string) {
  return db.milestoneSubmission.findUnique({
    where: { id },
    include: {
      milestone: {
        select: {
          id: true,
          name: true,
          description: true,
          isHardGate: true,
          requiredArtefacts: true,
          project: {
            select: {
              id: true,
              name: true,
              contractorCompanyId: true,
              contractorCompany: { select: { id: true, name: true } },
            },
          },
        },
      },
      verifications: {
        select: {
          id: true,
          type: true,
          status: true,
          qualityRating: true,
          findings: true,
          notes: true,
          completedAt: true,
        },
        orderBy: { createdAt: 'asc' },
      },
    },
  })
}

export async function getAllUsersAndCompanies() {
  return db.company.findMany({
    where: { deletedAt: null },
    include: {
      memberships: {
        include: { user: { select: { id: true, name: true, email: true } } },
      },
      tierStatus: { select: { tier: true, compliantProjectCount: true } },
      kycSubmissions: { select: { status: true }, orderBy: { createdAt: 'desc' }, take: 1 },
    },
    orderBy: { createdAt: 'desc' },
  })
}

export async function getTemplates() {
  return db.milestoneTemplate.findMany({
    include: { items: { orderBy: { order: 'asc' } } },
    orderBy: { createdAt: 'desc' },
  })
}

export async function getTemplate(id: string) {
  return db.milestoneTemplate.findUnique({
    where: { id },
    include: { items: { orderBy: { order: 'asc' } } },
  })
}
