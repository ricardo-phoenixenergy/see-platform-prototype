// app/api/milestones/[id]/verifications/route.ts
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const companyId = session.user.companyId
  if (!companyId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: milestoneId } = await params

  const milestone = await db.milestone.findFirst({
    where: {
      id: milestoneId,
      project: { contractorCompanyId: companyId },
    },
    select: {
      submissions: {
        orderBy: { version: 'desc' },
        take: 1,
        select: {
          id: true,
          version: true,
          verifications: {
            orderBy: { createdAt: 'asc' },
            select: {
              id: true,
              type: true,
              status: true,
              qualityRating: true,
              findings: true,
              notes: true,
              completedAt: true,
              createdAt: true,
            },
          },
        },
      },
    },
  })

  if (!milestone) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const latestSubmission = milestone.submissions[0]
  return NextResponse.json({
    submissionId: latestSubmission?.id ?? null,
    submissionVersion: latestSubmission?.version ?? null,
    verifications: latestSubmission?.verifications ?? [],
  })
}
