import { notFound } from 'next/navigation'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getJobCardDetail } from '@/server/queries/marketplace'
import { submitDeliverable } from '@/server/actions/marketplace'
import { JobCardChat } from '@/components/marketplace/job-card-chat'
import { JobCardDeliverables } from '@/components/marketplace/job-card-deliverables'
import Link from 'next/link'
import { cn } from '@/lib/utils'

type Props = { params: Promise<{ id: string }> }

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: 'Active', PENDING_REVIEW: 'Pending Review', COMPLETED: 'Completed', DISPUTED: 'Disputed',
}

const STATUS_CLASS: Record<string, string> = {
  ACTIVE: 'bg-accent-500/10 text-accent-600',
  PENDING_REVIEW: 'bg-warning-50 text-warning-700',
  COMPLETED: 'bg-success-500/10 text-success-600',
}

export default async function JobCardDetailPage({ params }: Props) {
  const session = await auth()
  if (!session) redirect('/login')

  const { id } = await params
  const jobCard = await getJobCardDetail(id)
  if (!jobCard) notFound()

  const isActive = jobCard.status === 'ACTIVE'
  const userId = session.user.id ?? ''

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-2 text-xs text-ink-400">
        <Link href="/service-provider/job-cards" className="hover:text-ink-700 transition-colors">Job Cards</Link>
        <span>/</span>
        <span className="text-ink-600 truncate">{jobCard.rfq.title}</span>
      </div>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-ink-900">{jobCard.rfq.title}</h2>
          <p className="text-xs text-ink-500 mt-0.5">
            {jobCard.rfq.project.name} · {jobCard.rfq.project.contractorCompany.name}
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

      <div className="rounded-md bg-ink-25 border border-ink-200 px-4 py-3 space-y-1">
        <p className="text-xs font-semibold text-ink-700">Scope of work</p>
        <p className="text-xs text-ink-600 whitespace-pre-line">{jobCard.scopeOfWork}</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Deliverables */}
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
            canUpload={isActive}
          />
          {isActive && jobCard.deliverables.length > 0 && (
            <form action={submitDeliverable}>
              <input type="hidden" name="jobCardId" value={id} />
              <button
                type="submit"
                className="h-8 px-3 rounded-md bg-ink-900 text-white text-xs font-medium hover:bg-ink-800 transition-colors"
              >
                Submit for review
              </button>
            </form>
          )}
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
