import { notFound } from 'next/navigation'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getJobCardDetail } from '@/server/queries/marketplace'
import { submitDeliverable } from '@/server/actions/marketplace'
import { JobCardChat } from '@/components/marketplace/job-card-chat'
import { JobCardDeliverables } from '@/components/marketplace/job-card-deliverables'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Clock, Lock, AlertCircle, CheckCircle, Loader2 } from 'lucide-react'

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
  const data = await getJobCardDetail(id)
  if (!data) notFound()
  const { escrowPayment, ...jobCard } = data

  const isActive = jobCard.status === 'ACTIVE' && jobCard.escrowStatus === 'LOCKED'
  const userId = session.user.id ?? ''
  // Always derive platform fee — old job cards may have seePlatformFeeCents = 0
  const platformFeeCents = jobCard.seePlatformFeeCents > 0
    ? jobCard.seePlatformFeeCents
    : Math.round(jobCard.amountCents * 0.05)
  const netPayout = jobCard.amountCents - platformFeeCents
  const feePercent = Math.round((platformFeeCents / jobCard.amountCents) * 100)
  const paymentStatus = escrowPayment?.status ?? null

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
            <span className="text-[10px] font-normal text-ink-400 ml-1">excl. VAT</span>
          </p>
          <p className="text-[10px] text-ink-400 mt-0.5">
            You receive{' '}
            <span className="font-semibold text-ink-700">
              R {(netPayout / 100).toLocaleString('en-ZA')}
            </span>{' '}
            after {feePercent}% platform fee
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

      {/* ── ESCROW PAYMENT STATUS ── */}

      {/* 1. Awaiting contractor to pay */}
      {jobCard.escrowStatus === 'AWAITING_PAYMENT' && (paymentStatus === 'AWAITING_PROOF' || !paymentStatus) && (
        <div className="rounded-md border border-ink-200 bg-ink-25 px-4 py-3 flex items-center gap-3">
          <Clock className="h-4 w-4 text-ink-400 flex-shrink-0" strokeWidth={1.5} />
          <div>
            <p className="text-sm font-medium text-ink-900">Awaiting escrow payment from contractor</p>
            <p className="text-xs text-ink-500 mt-0.5">
              {jobCard.rfq.project.contractorCompany.name} needs to transfer {' '}
              <span className="font-medium">R {(jobCard.amountCents / 100).toLocaleString('en-ZA')}</span> into escrow
              before work can begin. You will be notified once confirmed.
            </p>
          </div>
        </div>
      )}

      {/* 2. POP uploaded, waiting for admin confirmation */}
      {jobCard.escrowStatus === 'AWAITING_PAYMENT' && (paymentStatus === 'AWAITING_RECONCILIATION' || paymentStatus === 'PROOF_UPLOADED') && (
        <div className="rounded-md border border-ink-200 bg-ink-25 px-4 py-3 flex items-center gap-3">
          <Loader2 className="h-4 w-4 text-ink-400 animate-spin flex-shrink-0" strokeWidth={1.5} />
          <div>
            <p className="text-sm font-medium text-ink-900">Proof of payment received — awaiting bank confirmation</p>
            <p className="text-xs text-ink-500 mt-0.5">
              The contractor has uploaded proof of payment. Our team is confirming receipt — typically within 1 business day.
              You can begin preparing once confirmed.
            </p>
          </div>
        </div>
      )}

      {/* 3. Funds locked — work in progress */}
      {jobCard.escrowStatus === 'LOCKED' && jobCard.status === 'ACTIVE' && (
        <div className="rounded-md border border-success-500/20 bg-success-50/20 px-4 py-3 flex items-center gap-3">
          <Lock className="h-4 w-4 text-success-600 flex-shrink-0" strokeWidth={1.5} />
          <div>
            <p className="text-sm font-medium text-ink-900">Payment confirmed — funds held in escrow</p>
            <p className="text-xs text-ink-500 mt-0.5">
              <span className="font-medium text-ink-700">R {(netPayout / 100).toLocaleString('en-ZA')}</span> will be
              released to you once the contractor approves your deliverables.
            </p>
          </div>
        </div>
      )}

      {/* 4. Deliverables submitted, awaiting approval */}
      {jobCard.status === 'PENDING_REVIEW' && (
        <div className="rounded-md border border-warning-200 bg-warning-50/40 px-4 py-3 flex items-center gap-3">
          <AlertCircle className="h-4 w-4 text-warning-600 flex-shrink-0" strokeWidth={1.5} />
          <div>
            <p className="text-sm font-medium text-ink-900">Deliverables submitted — awaiting contractor approval</p>
            <p className="text-xs text-ink-500 mt-0.5">
              Once {jobCard.rfq.project.contractorCompany.name} approves your deliverables, {' '}
              <span className="font-medium text-ink-700">R {(netPayout / 100).toLocaleString('en-ZA')}</span> will be
              released from escrow.
            </p>
          </div>
        </div>
      )}

      {/* 5. Payment released */}
      {jobCard.escrowStatus === 'RELEASED' && (
        <div className="rounded-md border border-success-500/20 bg-success-50/20 px-4 py-3 flex items-center gap-3">
          <CheckCircle className="h-4 w-4 text-success-600 flex-shrink-0" strokeWidth={1.5} />
          <div>
            <p className="text-sm font-medium text-success-700">Payment released</p>
            <p className="text-xs text-ink-500 mt-0.5">
              <span className="font-medium text-ink-700">R {(netPayout / 100).toLocaleString('en-ZA')}</span> has been
              released to your account after the SEE platform fee.
            </p>
          </div>
        </div>
      )}

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
