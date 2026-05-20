import { notFound, redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { getJobCardDetail } from '@/server/queries/marketplace'
import { markJobCardComplete } from '@/server/actions/marketplace'
import { JobCardChat } from '@/components/marketplace/job-card-chat'
import { JobCardDeliverables } from '@/components/marketplace/job-card-deliverables'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { CheckCircle } from 'lucide-react'

type Props = { params: Promise<{ id: string }> }

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: 'Active',
  PENDING_REVIEW: 'Pending Review',
  COMPLETED: 'Completed',
  DISPUTED: 'Disputed',
}

const STATUS_CLASS: Record<string, string> = {
  ACTIVE: 'bg-accent-500/10 text-accent-600',
  PENDING_REVIEW: 'bg-warning-50 text-warning-700',
  COMPLETED: 'bg-success-500/10 text-success-600',
  DISPUTED: 'bg-danger-500/10 text-danger-600',
}

export default async function ContractorJobCardDetailPage({ params }: Props) {
  const session = await auth()
  if (!session) redirect('/login')

  const { id } = await params
  const jobCard = await getJobCardDetail(id)
  if (!jobCard) notFound()

  const userId = session.user.id ?? ''
  const isPendingReview = jobCard.status === 'PENDING_REVIEW'
  const isCompleted = jobCard.status === 'COMPLETED'

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-ink-400">
        <Link href="/contractor/service-center?tab=jobs" className="hover:text-ink-700 transition-colors">
          Service Centre
        </Link>
        <span>/</span>
        <span className="text-ink-600 truncate">{jobCard.rfq.title}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-ink-900">{jobCard.rfq.title}</h2>
          <p className="text-xs text-ink-500 mt-0.5">
            {jobCard.rfq.project.name} · {jobCard.providerCompany.name}
          </p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-sm font-semibold text-ink-900">
            R {(jobCard.amountCents / 100).toLocaleString('en-ZA')}
          </p>
          <span className={cn(
            'text-[10px] font-semibold px-1.5 py-0.5 rounded-sm',
            STATUS_CLASS[jobCard.status] ?? 'bg-ink-100 text-ink-600'
          )}>
            {STATUS_LABEL[jobCard.status] ?? jobCard.status}
          </span>
        </div>
      </div>

      {/* Scope */}
      <div className="rounded-md bg-ink-25 border border-ink-200 px-4 py-3 space-y-1">
        <p className="text-xs font-semibold text-ink-700">Scope of work</p>
        <p className="text-xs text-ink-600 whitespace-pre-line">{jobCard.scopeOfWork}</p>
      </div>

      {/* Approve banner */}
      {isPendingReview && (
        <div className="rounded-md border border-warning-200 bg-warning-50/40 px-4 py-3 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-ink-900">Deliverables submitted for review</p>
            <p className="text-xs text-ink-500 mt-0.5">
              {jobCard.providerCompany.name} has submitted deliverables. Review and approve to mark this job complete.
            </p>
          </div>
          <form action={markJobCardComplete}>
            <input type="hidden" name="jobCardId" value={id} />
            <button
              type="submit"
              className="flex-shrink-0 flex items-center gap-1.5 h-8 px-3 rounded-md bg-ink-900 text-white text-xs font-medium hover:bg-ink-800 transition-colors"
            >
              <CheckCircle className="h-3.5 w-3.5" strokeWidth={1.5} />
              Approve &amp; complete
            </button>
          </form>
        </div>
      )}

      {/* Completed banner */}
      {isCompleted && (
        <div className="rounded-md border border-success-500/20 bg-success-50/20 px-4 py-3">
          <p className="text-sm font-medium text-success-700">Job complete — payment released</p>
          <p className="text-xs text-ink-500 mt-0.5">All deliverables approved and escrow released to {jobCard.providerCompany.name}.</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Deliverables — read-only for contractor */}
        <div className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-ink-400">Deliverables</h3>
          <JobCardDeliverables
            jobCardId={id}
            deliverables={jobCard.deliverables.map((d) => ({
              id: d.id,
              name: d.name,
              url: d.url,
              version: d.version,
              createdAt: d.createdAt.toISOString(),
            }))}
            canUpload={false}
          />
        </div>

        {/* Chat */}
        <div className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-ink-400">Messages</h3>
          <JobCardChat
            jobCardId={id}
            userId={userId}
            initialMessages={jobCard.messages.map((m) => ({
              id: m.id,
              senderUserId: m.senderUserId,
              body: m.body,
              createdAt: m.createdAt.toISOString(),
            }))}
          />
        </div>
      </div>
    </div>
  )
}
