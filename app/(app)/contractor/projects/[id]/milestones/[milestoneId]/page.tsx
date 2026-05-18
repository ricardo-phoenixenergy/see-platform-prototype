import { auth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SubmissionForm } from '@/components/milestone/submission-form'
import { SubmissionHistory } from '@/components/milestone/submission-history'
import { VerificationsPanel } from '@/components/verification/verifications-panel'
import { buttonVariants } from '@/components/ui/button'
import Link from 'next/link'
import { Lock, Wrench } from 'lucide-react'
import { cn } from '@/lib/utils'

type Props = { params: Promise<{ id: string; milestoneId: string }> }

const SUBMITTABLE_STATUSES = ['AVAILABLE', 'IN_PROGRESS', 'ACTION_REQUIRED']

export default async function MilestoneDetailPage({ params }: Props) {
  const { id: projectId, milestoneId } = await params
  const session = await auth()
  if (!session) redirect('/login')

  const [milestone, wallet] = await Promise.all([
    db.milestone.findFirst({
      where: {
        id: milestoneId,
        projectId,
        project: { contractorCompanyId: session.user.companyId },
      },
      include: {
        submissions: { orderBy: { version: 'desc' } },
      },
    }),
    db.walletBalance.findUnique({
      where: { companyId: session.user.companyId },
      select: { tokens: true },
    }),
  ])

  if (!milestone) notFound()

  const tokenBalance = wallet?.tokens ?? 0
  const canSubmit = SUBMITTABLE_STATUSES.includes(milestone.status)
  const isLocked = milestone.status === 'LOCKED'
  const isApproved = milestone.status === 'APPROVED' || milestone.status === 'AUTO_GOLD'
  const isUnderReview = milestone.status === 'SUBMITTED' || milestone.status === 'UNDER_REVIEW'

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs text-ink-400 mb-2">
          <Link href={`/contractor/projects/${projectId}/milestones`} className="hover:text-ink-700 transition-colors">
            Milestones
          </Link>
          <span>/</span>
          <span className="text-ink-600">{milestone.name}</span>
        </div>
        <h2 className="text-xl font-semibold tracking-tight text-ink-900">{milestone.name}</h2>
        {milestone.description && (
          <p className="text-sm text-ink-500 mt-1">{milestone.description}</p>
        )}
      </div>

      {/* Locked state */}
      {isLocked && (
        <div className="flex flex-col items-center py-12 text-center">
          <Lock className="h-8 w-8 text-ink-300 mb-3" strokeWidth={1.5} />
          <p className="text-sm font-medium text-ink-900">Milestone locked</p>
          <p className="text-xs text-ink-500 mt-1">
            Complete the previous milestone to unlock this one.
          </p>
        </div>
      )}

      {/* Approved state */}
      {isApproved && (
        <Card className="border-success-500/30 bg-emerald-50/30">
          <CardContent className="pt-6">
            <p className="text-sm font-medium text-ink-900">
              {milestone.status === 'AUTO_GOLD' ? 'Auto-verified — Gold standard' : 'Approved'}
            </p>
            <p className="text-xs text-ink-500 mt-1">
              This milestone has been verified and approved. No further action required.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Submission form */}
      {canSubmit && (
        <Card>
          <CardHeader>
            <CardTitle>Submit artefacts</CardTitle>
          </CardHeader>
          <CardContent>
            <SubmissionForm milestoneId={milestoneId} projectId={projectId} />
          </CardContent>
        </Card>
      )}

      {/* Under review */}
      {isUnderReview && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm font-medium text-ink-900">Submission under review</p>
            <p className="text-xs text-ink-500 mt-1">
              Your submission is with the platform admin for review. You will be notified of the outcome.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Verification panel — show when under review and there are submissions */}
      {isUnderReview && milestone.submissions.length > 0 && (
        <VerificationsPanel
          milestoneId={milestoneId}
          milestoneName={milestone.name}
          tokenBalance={tokenBalance}
          showVerifyButtons={true}
        />
      )}

      {/* Get Service bridge */}
      {canSubmit && (
        <div className="rounded-md border border-ink-200 bg-ink-25 px-4 py-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-ink-900">Need professional support?</p>
            <p className="text-xs text-ink-500 mt-0.5">
              Find a verified service provider for this milestone. Deliverables submitted by an SP are auto-verified Gold.
            </p>
          </div>
          <Link
            href={`/contractor/marketplace?milestone=${milestoneId}`}
            className={cn(buttonVariants({ variant: 'secondary', size: 'sm' }), 'flex-shrink-0 gap-2')}
          >
            <Wrench className="h-4 w-4" />
            Get service
          </Link>
        </div>
      )}

      {/* Submission history */}
      {milestone.submissions.length > 0 && (
        <SubmissionHistory submissions={milestone.submissions} />
      )}
    </div>
  )
}
