// server/queries/marketplace.ts

import { db } from '@/lib/db'
import type { ServiceCategory, HardwareCategory } from '@/lib/generated/prisma/client'

export async function getServiceProviders(category?: string) {
  return db.serviceProviderProfile.findMany({
    ...(category ? { where: { categories: { has: category as ServiceCategory } } } : {}),
    include: {
      company: { select: { id: true, name: true, logoUrl: true } },
    },
    orderBy: { rating: 'desc' },
  })
}

export async function getServiceProvider(companyId: string) {
  return db.serviceProviderProfile.findUnique({
    where: { companyId },
    include: {
      company: { select: { id: true, name: true, logoUrl: true, registrationNo: true } },
    },
  })
}

export async function getHardwareListings(category?: string) {
  return db.hardwareListing.findMany({
    ...(category ? { where: { category: category as HardwareCategory } } : {}),
    orderBy: { priceCents: 'asc' },
  })
}

export async function getHardwareListing(id: string) {
  return db.hardwareListing.findUnique({ where: { id } })
}

export async function getContractorRfqs(companyId: string) {
  return db.rfq.findMany({
    where: { project: { contractorCompanyId: companyId } },
    include: {
      milestone: { select: { name: true } },
      project: { select: { name: true } },
      bids: {
        select: {
          id: true,
          status: true,
          amountCents: true,
          estimatedDays: true,
          providerCompany: { select: { name: true } },
          proposalText: true,
        },
      },
      jobCard: { select: { id: true, status: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
}

export async function getRfqDetail(id: string) {
  return db.rfq.findUnique({
    where: { id },
    include: {
      milestone: { select: { name: true } },
      project: { select: { name: true, contractorCompanyId: true } },
      bids: {
        include: {
          providerCompany: {
            include: {
              serviceProviderProfile: { select: { rating: true, ratingCount: true, categories: true } },
            },
          },
        },
        orderBy: { createdAt: 'asc' },
      },
      jobCard: { select: { id: true, status: true } },
    },
  })
}

export async function getSpJobCards(companyId: string) {
  return db.jobCard.findMany({
    where: { providerCompanyId: companyId },
    include: {
      rfq: {
        select: {
          title: true,
          category: true,
          project: { select: { name: true } },
        },
      },
      deliverables: { orderBy: { createdAt: 'desc' }, take: 1 },
    },
    orderBy: { createdAt: 'desc' },
  })
}

export async function getJobCardDetail(id: string) {
  return db.jobCard.findUnique({
    where: { id },
    include: {
      rfq: {
        select: {
          title: true,
          description: true,
          scopeOfWork: true,
          category: true,
          project: {
            select: {
              name: true,
              stage: true,
              systemSizeKw: true,
              contractorCompanyId: true,
              contractorCompany: { select: { name: true } },
            },
          },
        },
      },
      providerCompany: { select: { name: true } },
      deliverables: { orderBy: { version: 'asc' } },
      messages: { orderBy: { createdAt: 'asc' } },
    },
  })
}

export async function getOpenRfqsForSp(categories: string[]) {
  return db.rfq.findMany({
    where: {
      status: 'OPEN',
      category: { in: categories as ServiceCategory[] },
    },
    include: {
      project: { select: { name: true, systemSizeKw: true, stage: true } },
      milestone: { select: { name: true } },
      bids: { select: { id: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
}

export async function getSpProfile(companyId: string) {
  return db.serviceProviderProfile.findUnique({ where: { companyId } })
}

export async function getSpStats(companyId: string) {
  const [activeJobs, completedJobs, totalBids] = await Promise.all([
    db.jobCard.count({ where: { providerCompanyId: companyId, status: 'ACTIVE' } }),
    db.jobCard.findMany({
      where: { providerCompanyId: companyId, status: 'COMPLETED' },
      select: { amountCents: true },
    }),
    db.bid.count({ where: { providerCompanyId: companyId } }),
  ])
  const revenueEarnedCents = completedJobs.reduce((sum, j) => sum + j.amountCents, 0)
  return { activeJobs, revenueEarnedCents, totalBids, completedJobs: completedJobs.length }
}
