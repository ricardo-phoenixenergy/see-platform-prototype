// app/api/ai/expert-verify/route.ts
// POST { submissionId } — requests expert verification, deducts 10,000 tokens

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { EXPERT_VERIFICATION_COST_TOKENS } from '@/lib/ai/verification-stubs'
import { z } from 'zod'

const bodySchema = z.object({ submissionId: z.string() })

export async function POST(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const companyId = session.user.companyId
  if (!companyId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: z.infer<typeof bodySchema>
  try {
    body = bodySchema.parse(await req.json())
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const submission = await db.milestoneSubmission.findFirst({
    where: {
      id: body.submissionId,
      milestone: { project: { contractorCompanyId: companyId } },
    },
    include: { milestone: { select: { name: true } } },
  })
  if (!submission) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const wallet = await db.walletBalance.findUnique({ where: { companyId } })
  if ((wallet?.tokens ?? 0) < EXPERT_VERIFICATION_COST_TOKENS) {
    return NextResponse.json({ error: 'Insufficient tokens' }, { status: 402 })
  }

  const [verification] = await db.$transaction([
    db.milestoneVerification.create({
      data: {
        submissionId: body.submissionId,
        type: 'EXPERT',
        status: 'IN_PROGRESS',
        costTokens: EXPERT_VERIFICATION_COST_TOKENS,
        findings: JSON.parse(JSON.stringify([])),
      },
    }),
    db.walletBalance.update({
      where: { companyId },
      data: { tokens: { decrement: EXPERT_VERIFICATION_COST_TOKENS } },
    }),
    db.tokenTransaction.create({
      data: {
        companyId,
        type: 'SPEND_EXPERT_VERIFICATION',
        amount: -EXPERT_VERIFICATION_COST_TOKENS,
        description: `Expert verification — ${submission.milestone.name}`,
      },
    }),
  ])

  return NextResponse.json({ verificationId: verification.id, status: 'IN_PROGRESS' }, { status: 201 })
}
