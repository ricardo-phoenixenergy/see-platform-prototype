// server/actions/admin.ts
'use server'

import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { recalculateTier } from './tier'
import { z } from 'zod'
import type { Technology, ProjectStage } from '@/lib/generated/prisma/client'

// ─── KYC ─────────────────────────────────────────────────────────────────────

const kycDecisionSchema = z.object({
  submissionId: z.string(),
  reason: z.string().optional(),
})

export async function approveKyc(formData: FormData) {
  const { submissionId } = kycDecisionSchema.parse({
    submissionId: formData.get('submissionId'),
  })
  await db.kycSubmission.update({
    where: { id: submissionId },
    data: { status: 'APPROVED', reviewedAt: new Date() },
  })
  revalidatePath('/admin/kyc')
}

export async function rejectKyc(formData: FormData) {
  const { submissionId, reason } = kycDecisionSchema.parse({
    submissionId: formData.get('submissionId'),
    reason: formData.get('reason') ?? undefined,
  })
  await db.kycSubmission.update({
    where: { id: submissionId },
    data: { status: 'REJECTED', rejectionReason: reason ?? null, reviewedAt: new Date() },
  })
  revalidatePath('/admin/kyc')
}

export async function requestKycInfo(formData: FormData) {
  const { submissionId, reason } = kycDecisionSchema.parse({
    submissionId: formData.get('submissionId'),
    reason: formData.get('reason') ?? undefined,
  })
  await db.kycSubmission.update({
    where: { id: submissionId },
    data: { status: 'REQUEST_INFO', rejectionReason: reason ?? null, reviewedAt: new Date() },
  })
  revalidatePath('/admin/kyc')
}

// ─── SUBMISSIONS ─────────────────────────────────────────────────────────────

const submissionDecisionSchema = z.object({
  submissionId: z.string(),
  feedback: z.string().optional(),
})

export async function approveSubmission(formData: FormData) {
  const { submissionId } = submissionDecisionSchema.parse({
    submissionId: formData.get('submissionId'),
  })

  const submission = await db.milestoneSubmission.findUnique({
    where: { id: submissionId },
    include: {
      milestone: {
        select: {
          id: true,
          project: { select: { contractorCompanyId: true } },
        },
      },
    },
  })
  if (!submission) throw new Error('Submission not found')

  await db.$transaction([
    db.milestoneSubmission.update({
      where: { id: submissionId },
      data: { status: 'APPROVED', reviewedAt: new Date() },
    }),
    db.milestone.update({
      where: { id: submission.milestone.id },
      data: { status: 'APPROVED' },
    }),
  ])

  await recalculateTier(submission.milestone.project.contractorCompanyId)

  revalidatePath('/admin/submissions')
  revalidatePath(`/admin/submissions/${submissionId}`)
}

export async function rejectSubmission(formData: FormData) {
  const { submissionId, feedback } = submissionDecisionSchema.parse({
    submissionId: formData.get('submissionId'),
    feedback: formData.get('feedback') ?? undefined,
  })

  const submission = await db.milestoneSubmission.findUnique({
    where: { id: submissionId },
    include: { milestone: { select: { id: true } } },
  })
  if (!submission) throw new Error('Submission not found')

  await db.$transaction([
    db.milestoneSubmission.update({
      where: { id: submissionId },
      data: { status: 'REJECTED', feedback: feedback ?? null, reviewedAt: new Date() },
    }),
    db.milestone.update({
      where: { id: submission.milestone.id },
      data: { status: 'ACTION_REQUIRED' },
    }),
  ])

  revalidatePath('/admin/submissions')
  revalidatePath(`/admin/submissions/${submissionId}`)
}

export async function requestSubmissionInfo(formData: FormData) {
  const { submissionId, feedback } = submissionDecisionSchema.parse({
    submissionId: formData.get('submissionId'),
    feedback: formData.get('feedback') ?? undefined,
  })

  const submission = await db.milestoneSubmission.findUnique({
    where: { id: submissionId },
    include: { milestone: { select: { id: true } } },
  })
  if (!submission) throw new Error('Submission not found')

  await db.$transaction([
    db.milestoneSubmission.update({
      where: { id: submissionId },
      data: { status: 'REQUEST_INFO', feedback: feedback ?? null, reviewedAt: new Date() },
    }),
    db.milestone.update({
      where: { id: submission.milestone.id },
      data: { status: 'ACTION_REQUIRED' },
    }),
  ])

  revalidatePath('/admin/submissions')
  revalidatePath(`/admin/submissions/${submissionId}`)
}

// ─── TIER OVERRIDE ───────────────────────────────────────────────────────────

const tierOverrideSchema = z.object({
  companyId: z.string(),
  tier: z.enum(['BRONZE', 'SILVER', 'GOLD', 'PLATINUM']),
})

export async function overrideTier(formData: FormData) {
  const { companyId, tier } = tierOverrideSchema.parse({
    companyId: formData.get('companyId'),
    tier: formData.get('tier'),
  })
  await db.tierStatus.upsert({
    where: { companyId },
    update: { tier },
    create: { companyId, tier },
  })
  revalidatePath('/admin/users')
}

// ─── TEMPLATES ───────────────────────────────────────────────────────────────

const templateItemSchema = z.object({
  order: z.coerce.number(),
  name: z.string().min(1),
  description: z.string().min(1),
  phase: z.string(),
  isHardGate: z.boolean().default(true),
  estimatedDays: z.coerce.number().optional(),
})

const createTemplateSchema = z.object({
  name: z.string().min(1),
  technology: z.string(),
  minSizeKw: z.coerce.number().optional(),
  maxSizeKw: z.coerce.number().optional(),
  items: z.array(templateItemSchema).min(1),
})

export async function createTemplate(data: z.infer<typeof createTemplateSchema>) {
  const parsed = createTemplateSchema.parse(data)
  const template = await db.milestoneTemplate.create({
    data: {
      name: parsed.name,
      technology: parsed.technology as Technology,
      minSizeKw: parsed.minSizeKw ?? null,
      maxSizeKw: parsed.maxSizeKw ?? null,
      items: {
        create: parsed.items.map((item) => ({
          order: item.order,
          name: item.name,
          description: item.description,
          phase: item.phase as ProjectStage,
          isHardGate: item.isHardGate,
          requiredArtefacts: JSON.parse(JSON.stringify([{ name: 'Document', allowedTypes: ['pdf'] }])),
          estimatedDays: item.estimatedDays ?? null,
        })),
      },
    },
  })
  revalidatePath('/admin/templates')
  return template.id
}

export async function toggleTemplateActive(formData: FormData) {
  const id = z.string().parse(formData.get('id'))
  const template = await db.milestoneTemplate.findUnique({ where: { id }, select: { isActive: true } })
  if (!template) throw new Error('Template not found')
  await db.milestoneTemplate.update({
    where: { id },
    data: { isActive: !template.isActive },
  })
  revalidatePath('/admin/templates')
}
