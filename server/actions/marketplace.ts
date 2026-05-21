// server/actions/marketplace.ts
'use server'

import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { z } from 'zod'
import type { ServiceCategory } from '@/lib/generated/prisma/client'
import { createServiceEscrowInvoice } from '@/lib/payments/invoice'
import { calculateServiceCommission } from '@/lib/service-commission'
import { getTierForMetrics } from '@/lib/tier/rules'

// ─── RFQ ─────────────────────────────────────────────────────────────────────

const createRfqSchema = z.object({
  projectId: z.string(),
  milestoneId: z.string().optional(),
  category: z.string(),
  title: z.string().min(5),
  description: z.string().min(10),
  scopeOfWork: z.string().min(10),
  budgetCentsMax: z.coerce.number().optional(),
  deadlineDays: z.coerce.number().optional(),
})

export async function createRfq(data: z.infer<typeof createRfqSchema>) {
  const result = createRfqSchema.safeParse(data)
  if (!result.success) throw new Error(result.error.issues[0]?.message ?? 'Invalid RFQ data.')
  const parsed = result.data
  const rfq = await db.rfq.create({
    data: {
      projectId: parsed.projectId,
      milestoneId: parsed.milestoneId ?? null,
      category: parsed.category as ServiceCategory,
      title: parsed.title,
      description: parsed.description,
      scopeOfWork: parsed.scopeOfWork,
      budgetCentsMax: parsed.budgetCentsMax ? Math.round(parsed.budgetCentsMax * 100) : null,
      deadlineDays: parsed.deadlineDays ?? null,
      status: 'OPEN',
    },
  })
  revalidatePath('/contractor/service-center')
  return rfq.id
}

// ─── BID ─────────────────────────────────────────────────────────────────────

const submitBidSchema = z.object({
  rfqId: z.string().min(1),
  companyId: z.string().min(1),
  amountCents: z.coerce.number().positive(),
  proposalText: z.string().min(1),
  estimatedDays: z.coerce.number().positive(),
})

export async function submitBid(data: z.infer<typeof submitBidSchema>) {
  const result = submitBidSchema.safeParse(data)
  if (!result.success) {
    throw new Error(result.error.issues[0]?.message ?? 'Invalid bid data.')
  }
  const parsed = result.data
  const existing = await db.bid.findFirst({
    where: { rfqId: parsed.rfqId, providerCompanyId: parsed.companyId },
  })
  if (existing) throw new Error('You have already submitted a bid for this RFQ.')

  const bid = await db.bid.create({
    data: {
      rfqId: parsed.rfqId,
      providerCompanyId: parsed.companyId,
      amountCents: Math.round(parsed.amountCents * 100),
      proposalText: parsed.proposalText,
      estimatedDays: parsed.estimatedDays,
      status: 'SUBMITTED',
    },
  })
  revalidatePath(`/service-provider/opportunities/${parsed.rfqId}`)
  return bid.id
}

// ─── ACCEPT BID → CREATE JOB CARD ────────────────────────────────────────────

export async function acceptBid(formData: FormData) {
  const bidId = z.string().parse(formData.get('bidId'))
  const bid = await db.bid.findUnique({
    where: { id: bidId },
    include: {
      rfq: {
        select: {
          id: true, title: true, scopeOfWork: true, status: true,
          project: { select: { contractorCompanyId: true } },
        },
      },
    },
  })
  if (!bid) throw new Error('Bid not found')
  if (bid.rfq.status === 'AWARDED') throw new Error('RFQ already awarded')

  const contractorCompanyId = bid.rfq.project.contractorCompanyId

  // ── Resolve contractor tier + SP rating in parallel ─────────────────────
  const [tierRecord, kwAggregate, spProfile] = await Promise.all([
    db.tierStatus.findUnique({ where: { companyId: contractorCompanyId } }),
    db.project.aggregate({
      where: { contractorCompanyId, deletedAt: null },
      _sum: { systemSizeKw: true },
    }),
    db.serviceProviderProfile.findUnique({
      where: { companyId: bid.providerCompanyId },
      select: { rating: true },
    }),
  ])
  const projectCount = tierRecord?.compliantProjectCount ?? 0
  const totalKw = kwAggregate._sum.systemSizeKw ?? 0
  const contractorTier = getTierForMetrics(projectCount, totalKw)
  const spRating = spProfile?.rating ?? null

  // ── Compute commission breakdown ─────────────────────────────────────────
  const commission = calculateServiceCommission(bid.amountCents, contractorTier, spRating)

  // ── Write DB ─────────────────────────────────────────────────────────────
  await db.bid.update({ where: { id: bidId }, data: { status: 'ACCEPTED' } })
  await db.bid.updateMany({ where: { rfqId: bid.rfqId, id: { not: bidId } }, data: { status: 'REJECTED' } })
  await db.rfq.update({ where: { id: bid.rfqId }, data: { status: 'AWARDED' } })
  const jobCard = await db.jobCard.create({
    data: {
      rfqId: bid.rfqId,
      providerCompanyId: bid.providerCompanyId,
      scopeOfWork: bid.rfq.scopeOfWork,
      // amountCents = what contractor actually pays (marked-up, tier-discounted)
      amountCents: commission.contractorAmountCents,
      spAmountCents: commission.spAmountCents,
      markedUpAmountCents: commission.markedUpAmountCents,
      spPayoutCents: commission.spPayoutCents,
      seePlatformFeeCents: commission.seePlatformFeeCents,
      tierDiscountPercent: commission.tierDiscountPercent,
      spCommissionPercent: commission.spCommissionPercent,
      escrowStatus: 'AWAITING_PAYMENT',
      status: 'ACTIVE',
    },
  })

  // Create escrow invoice using the discounted contractor amount
  const { payment } = await createServiceEscrowInvoice({
    jobCardId: jobCard.id,
    contractorCompanyId,
    serviceDescription: bid.rfq.title,
    amountCents: commission.contractorAmountCents,
  })

  // Link payment back to job card
  await db.jobCard.update({
    where: { id: jobCard.id },
    data: { escrowPaymentId: payment.id },
  })

  revalidatePath('/contractor/service-center')
  revalidatePath(`/contractor/service-center/rfq/${bid.rfqId}`)
}

// ─── JOB CARD ────────────────────────────────────────────────────────────────

const deliverableSchema = z.object({
  jobCardId: z.string(),
  name: z.string().min(1),
  url: z.string().url(),
})

export async function deleteDeliverable(deliverableId: string) {
  const result = z.string().min(1).safeParse(deliverableId)
  if (!result.success) throw new Error('Invalid deliverable ID')
  await db.jobDeliverable.delete({ where: { id: result.data } })
}

export async function addDeliverable(data: z.infer<typeof deliverableSchema>) {
  const parsed = deliverableSchema.parse(data)
  const existing = await db.jobDeliverable.count({ where: { jobCardId: parsed.jobCardId } })
  await db.jobDeliverable.create({
    data: {
      jobCardId: parsed.jobCardId,
      name: parsed.name,
      url: parsed.url,
      version: existing + 1,
    },
  })
  revalidatePath(`/service-provider/job-cards/${parsed.jobCardId}`)
}

export async function submitDeliverable(formData: FormData) {
  const jobCardId = z.string().parse(formData.get('jobCardId'))
  await db.jobCard.update({
    where: { id: jobCardId },
    data: { status: 'PENDING_REVIEW' },
  })
  revalidatePath(`/service-provider/job-cards/${jobCardId}`)
  revalidatePath('/service-provider/job-cards')
}

export async function markJobCardComplete(formData: FormData) {
  const jobCardId = z.string().parse(formData.get('jobCardId'))
  const jobCard = await db.jobCard.findUnique({
    where: { id: jobCardId },
    select: { escrowPaymentId: true },
  })

  await db.jobCard.update({
    where: { id: jobCardId },
    data: { status: 'COMPLETED', completedAt: new Date(), escrowStatus: 'RELEASED' },
  })

  // Mark the escrow payment as released
  if (jobCard?.escrowPaymentId) {
    await db.payment.update({
      where: { id: jobCard.escrowPaymentId },
      data: { status: 'PAID' },
    })
  }

  revalidatePath(`/contractor/service-center/job-cards/${jobCardId}`)
  revalidatePath(`/service-provider/job-cards/${jobCardId}`)
  revalidatePath('/contractor/service-center')
}

export async function uploadEscrowProof(formData: FormData) {
  const jobCardId = z.string().safeParse(formData.get('jobCardId'))
  const proofUrl = z.string().url().safeParse(formData.get('proofUrl'))
  if (!jobCardId.success) throw new Error('Invalid job card ID')
  if (!proofUrl.success) throw new Error('Invalid proof URL')

  const jobCard = await db.jobCard.findUnique({
    where: { id: jobCardId.data },
    select: { escrowPaymentId: true },
  })
  if (!jobCard?.escrowPaymentId) throw new Error('No escrow payment found for this job card')

  await db.payment.update({
    where: { id: jobCard.escrowPaymentId },
    data: { proofOfPaymentUrl: proofUrl.data, status: 'AWAITING_RECONCILIATION' },
  })

  revalidatePath(`/contractor/service-center/job-cards/${jobCardId.data}`)
  revalidatePath('/admin/financial')
}

const messageSchema = z.object({
  jobCardId: z.string(),
  senderUserId: z.string(),
  body: z.string().min(1),
})

export async function addJobMessage(data: z.infer<typeof messageSchema>) {
  const parsed = messageSchema.parse(data)
  await db.jobMessage.create({
    data: {
      jobCardId: parsed.jobCardId,
      senderUserId: parsed.senderUserId,
      body: parsed.body,
    },
  })
  revalidatePath(`/service-provider/job-cards/${parsed.jobCardId}`)
}

// ─── SP PROFILE ──────────────────────────────────────────────────────────────

const updateProfileSchema = z.object({
  companyId: z.string(),
  headline: z.string().min(5),
  description: z.string().min(20),
  categories: z.array(z.string()).min(1),
  hourlyRateCents: z.coerce.number().optional(),
  serviceAreas: z.array(z.string()),
})

export async function updateSpProfile(data: z.infer<typeof updateProfileSchema>) {
  const parsed = updateProfileSchema.parse(data)
  await db.serviceProviderProfile.upsert({
    where: { companyId: parsed.companyId },
    update: {
      headline: parsed.headline,
      description: parsed.description,
      categories: parsed.categories as ServiceCategory[],
      hourlyRateCents: parsed.hourlyRateCents ? Math.round(parsed.hourlyRateCents * 100) : null,
      serviceAreas: parsed.serviceAreas,
    },
    create: {
      companyId: parsed.companyId,
      headline: parsed.headline,
      description: parsed.description,
      categories: parsed.categories as ServiceCategory[],
      hourlyRateCents: parsed.hourlyRateCents ? Math.round(parsed.hourlyRateCents * 100) : null,
      serviceAreas: parsed.serviceAreas,
    },
  })
  revalidatePath('/service-provider/profile')
}
