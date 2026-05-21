// app/api/ai/verify/route.ts
// POST — triggers AI verification for a milestone submission.

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { generateVerificationResult } from '@/lib/ai/verification-stubs'

export async function POST(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json() as {
    submissionId: string
    milestoneId: string
    companyId: string
  }

  const submission = await db.milestoneSubmission.findFirst({
    where: { id: body.submissionId },
    include: { milestone: { select: { name: true } } },
  })
  if (!submission) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const result = generateVerificationResult(submission.milestone.name, submission.version)

  const verification = await db.milestoneVerification.create({
    data: {
      submissionId: body.submissionId,
      type: 'AI_AGENT',
      status: result.status,
      performedBy: null,
      qualityRating: result.status === 'PASS' ? 'GREEN' : 'AMBER',
      findings: result.findings as object,
      notes: result.recommendation ?? null,
    },
  })

  return NextResponse.json({ verificationId: verification.id, status: result.status })
}
