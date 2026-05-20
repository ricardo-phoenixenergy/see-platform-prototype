// server/actions/marketplace.ts
'use server'

import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { z } from 'zod'
import type { ServiceCategory } from '@/lib/generated/prisma/client'

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
  const parsed = createRfqSchema.parse(data)
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
  rfqId: z.string(),
  companyId: z.string(),
  amountCents: z.coerce.number().positive(),
  proposalText: z.string().min(20),
  estimatedDays: z.coerce.number().positive(),
})

export async function submitBid(data: z.infer<typeof submitBidSchema>) {
  const parsed = submitBidSchema.parse(data)
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
    include: { rfq: { select: { id: true, scopeOfWork: true, status: true } } },
  })
  if (!bid) throw new Error('Bid not found')
  if (bid.rfq.status === 'AWARDED') throw new Error('RFQ already awarded')

  await db.$transaction([
    db.bid.update({ where: { id: bidId }, data: { status: 'ACCEPTED' } }),
    db.bid.updateMany({
      where: { rfqId: bid.rfqId, id: { not: bidId } },
      data: { status: 'REJECTED' },
    }),
    db.rfq.update({ where: { id: bid.rfqId }, data: { status: 'AWARDED' } }),
    db.jobCard.create({
      data: {
        rfqId: bid.rfqId,
        providerCompanyId: bid.providerCompanyId,
        scopeOfWork: bid.rfq.scopeOfWork,
        amountCents: bid.amountCents,
        escrowStatus: 'LOCKED',
        status: 'ACTIVE',
      },
    }),
  ])

  revalidatePath('/contractor/service-center')
  revalidatePath(`/contractor/service-center/rfq/${bid.rfqId}`)
}

// ─── JOB CARD ────────────────────────────────────────────────────────────────

const deliverableSchema = z.object({
  jobCardId: z.string(),
  name: z.string().min(1),
  url: z.string().url(),
})

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
  await db.jobCard.update({
    where: { id: jobCardId },
    data: { status: 'COMPLETED', completedAt: new Date(), escrowStatus: 'RELEASED' },
  })
  revalidatePath(`/contractor/service-center/job-cards/${jobCardId}`)
  revalidatePath('/contractor/service-center')
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
