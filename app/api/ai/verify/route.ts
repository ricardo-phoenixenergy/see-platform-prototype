// app/api/ai/verify/route.ts
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { generateVerificationResult, AI_VERIFICATION_COST_TOKENS } from '@/lib/ai/verification-stubs'
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

  // Verify ownership: submission → milestone → project → contractor company
  const submission = await db.milestoneSubmission.findFirst({
    where: {
      id: body.submissionId,
      milestone: { project: { contractorCompanyId: companyId } },
    },
    include: {
      milestone: { select: { name: true } },
    },
  })
  if (!submission) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Check tokens
  const wallet = await db.walletBalance.findUnique({ where: { companyId } })
  if ((wallet?.tokens ?? 0) < AI_VERIFICATION_COST_TOKENS) {
    return NextResponse.json({ error: 'Insufficient tokens' }, { status: 402 })
  }

  // Generate deterministic result
  const result = generateVerificationResult(submission.milestone.name, submission.version)

  // Persist verification + deduct tokens in a transaction
  const [verification] = await db.$transaction([
    db.milestoneVerification.create({
      data: {
        submissionId: body.submissionId,
        type: 'AI_AGENT',
        status: result.status === 'PASS' ? 'PASS' : 'FAIL',
        costTokens: AI_VERIFICATION_COST_TOKENS,
        qualityRating: result.status === 'PASS' ? 'GREEN' : 'AMBER',
        findings: JSON.parse(JSON.stringify(result.findings)),
        notes: result.recommendation ?? null,
        completedAt: new Date(),
      },
    }),
    db.walletBalance.update({
      where: { companyId },
      data: { tokens: { decrement: AI_VERIFICATION_COST_TOKENS } },
    }),
    db.tokenTransaction.create({
      data: {
        companyId,
        type: 'SPEND_AI_VERIFICATION',
        amount: -AI_VERIFICATION_COST_TOKENS,
        description: `AI verification — ${submission.milestone.name}`,
      },
    }),
  ])

  return NextResponse.json({
    verification: {
      id: verification.id,
      status: verification.status,
      costTokens: verification.costTokens,
      findings: result.findings,
      confidence: result.confidence,
      recommendation: result.recommendation ?? null,
    },
  })
}
