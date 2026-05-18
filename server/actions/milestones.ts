'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const SubmitMilestoneSchema = z.object({
  milestoneId: z.string().cuid(),
  projectId: z.string().cuid(),
  notes: z.string().optional(),
  artefacts: z.array(z.object({
    name: z.string(),
    url: z.string().url(),
    fileSize: z.number(),
    sha256: z.string(),
    mimeType: z.string(),
  })).min(1, 'At least one artefact is required'),
})

type SubmitInput = z.infer<typeof SubmitMilestoneSchema>
type ActionResult = { ok: true } | { ok: false; error: string }

export async function submitMilestone(input: SubmitInput): Promise<ActionResult> {
  const session = await auth()
  if (!session) return { ok: false, error: 'Not authenticated' }
  const userId = session.user.id
  if (!userId) return { ok: false, error: 'Not authenticated' }

  const parsed = SubmitMilestoneSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' }

  const { milestoneId, projectId, notes, artefacts } = parsed.data

  // Verify the milestone belongs to this contractor
  const milestone = await db.milestone.findFirst({
    where: {
      id: milestoneId,
      projectId,
      project: { contractorCompanyId: session.user.companyId },
      status: { in: ['AVAILABLE', 'IN_PROGRESS', 'ACTION_REQUIRED'] },
    },
  })

  if (!milestone) return { ok: false, error: 'Milestone not found or not submittable' }

  // Get current version count
  const existingCount = await db.milestoneSubmission.count({ where: { milestoneId } })

  await db.$transaction(async (tx) => {
    await tx.milestoneSubmission.create({
      data: {
        milestoneId,
        submittedBy: userId,
        artefacts,
        notes: notes ?? null,
        version: existingCount + 1,
        status: 'PENDING',
      },
    })

    await tx.milestone.update({
      where: { id: milestoneId },
      data: { status: 'SUBMITTED', startedAt: milestone.startedAt ?? new Date() },
    })
  })

  revalidatePath(`/contractor/projects/${projectId}/milestones`)
  revalidatePath(`/contractor/projects/${projectId}/milestones/${milestoneId}`)
  return { ok: true }
}
