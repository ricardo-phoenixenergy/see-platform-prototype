// server/queries/payments.ts

import { db } from '@/lib/db'

export async function getPaymentsForReconciliation() {
  return db.payment.findMany({
    where: { status: 'AWAITING_RECONCILIATION' },
    include: {
      invoice: {
        include: {
          lineItems: true,
          recipientCompany: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: { updatedAt: 'desc' },
  })
}

export async function getClientPendingOffers(companyId: string) {
  return db.licenseOffer.findMany({
    where: { proposedToCompanyId: companyId, status: 'PENDING' },
    include: {
      license: {
        select: {
          id: true,
          tier: true,
          monthlyFeeCents: true,
          projectId: true,
          project: { select: { name: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })
}

export async function getProjectPendingOffer(projectId: string, companyId: string) {
  return db.licenseOffer.findFirst({
    where: {
      proposedToCompanyId: companyId,
      status: 'PENDING',
      license: { projectId, viewerType: 'CLIENT' },
    },
    include: {
      license: { select: { id: true, tier: true, monthlyFeeCents: true } },
    },
  })
}

export async function getEpcLicense(projectId: string, companyId: string) {
  return db.omLicense.findFirst({
    where: { projectId, licenseeCompanyId: companyId, viewerType: 'EPC', status: 'ACTIVE' },
    select: { id: true, tier: true },
  })
}

export async function getEpcCommissions(companyId: string) {
  const commissions = await db.licenseCommission.findMany({
    where: { resellerCompanyId: companyId },
    include: {
      license: {
        select: {
          tier: true,
          monthlyFeeCents: true,
          project: { select: { name: true } },
        },
      },
    },
    orderBy: { period: 'desc' },
    take: 24,
  })

  const totalEarned = commissions.reduce((s, c) => s + c.amountCents, 0)
  const accrued = commissions
    .filter((c) => c.status === 'ACCRUED')
    .reduce((s, c) => s + c.amountCents, 0)

  return { commissions, totalEarned, accrued }
}

export async function getEpcLicensesSold(companyId: string) {
  return db.omLicense.findMany({
    where: { resellerCompanyId: companyId, viewerType: 'CLIENT', status: 'ACTIVE' },
    include: {
      project: { select: { name: true, stage: true } },
      licenseeCompany: { select: { name: true } },
    },
    orderBy: { activatedAt: 'desc' },
  })
}

export async function getEnterpriseLicenses() {
  return db.enterpriseLicense.findMany({
    include: {
      clientCompany: { select: { id: true, name: true } },
      projectScopes: { include: { project: { select: { id: true, name: true, stage: true, site: { select: { city: true } } } } } },
      integrations: { select: { id: true, type: true, status: true } },
      seats: { select: { id: true, isActive: true } },
    },
    orderBy: { activatedAt: 'desc' },
  })
}

export async function getProjectsNotInEnterpriseScope(licenseId: string, clientCompanyId: string) {
  const inScope = await db.enterpriseProjectScope.findMany({
    where: { licenseId },
    select: { projectId: true },
  })
  const inScopeIds = inScope.map((s) => s.projectId)

  return db.project.findMany({
    where: {
      clientCompanyId,
      id: { notIn: inScopeIds },
      deletedAt: null,
    },
    select: { id: true, name: true, stage: true },
    orderBy: { createdAt: 'desc' },
  })
}
