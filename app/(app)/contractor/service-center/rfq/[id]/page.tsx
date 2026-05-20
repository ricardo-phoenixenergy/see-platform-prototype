import { notFound } from 'next/navigation'
import { getRfqDetail } from '@/server/queries/marketplace'
import { acceptBid } from '@/server/actions/marketplace'
import { cn } from '@/lib/utils'
import { Star } from 'lucide-react'
import Link from 'next/link'

const CATEGORY_LABELS: Record<string, string> = {
  STRUCTURAL_CIVILS: 'Structural & Civils', ENGINEERING: 'Engineering',
  LEGAL: 'Legal', LOGISTICS_PLANT_HIRE: 'Logistics & Plant Hire', FINANCE_INSURANCE: 'Finance & Insurance',
}

type Props = { params: Promise<{ id: string }> }

export default async function RfqDetailPage({ params }: Props) {
  const { id } = await params
  const rfq = await getRfqDetail(id)
  if (!rfq) notFound()

  const isAwarded = rfq.status === 'AWARDED'

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-2 text-xs text-ink-400">
        <Link href="/contractor/service-center?tab=rfqs" className="hover:text-ink-700 transition-colors">Service Centre</Link>
        <span>/</span>
        <span className="text-ink-600 truncate">{rfq.title}</span>
      </div>

      {/* RFQ summary */}
      <div className="rounded-md bg-ink-25 border border-ink-200 px-5 py-4 space-y-2">
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-base font-semibold text-ink-900">{rfq.title}</h2>
          <span className={cn(
            'text-[10px] font-semibold px-1.5 py-0.5 rounded-sm flex-shrink-0',
            isAwarded ? 'bg-success-500/10 text-success-600' : 'bg-ink-100 text-ink-600'
          )}>
            {rfq.status.replace('_', ' ')}
          </span>
        </div>
        <p className="text-xs text-ink-500">
          {rfq.project.name}{rfq.milestone ? ` · ${rfq.milestone.name}` : ''} · {CATEGORY_LABELS[rfq.category] ?? rfq.category}
        </p>
        <p className="text-sm text-ink-700 pt-1">{rfq.description}</p>
        <div className="pt-2 space-y-1">
          <p className="text-xs font-semibold text-ink-700">Scope of work</p>
          <p className="text-xs text-ink-600 whitespace-pre-line">{rfq.scopeOfWork}</p>
        </div>
        {rfq.budgetCentsMax && (
          <p className="text-xs text-ink-500 pt-1">
            Budget max: <span className="font-medium text-ink-700">R {(rfq.budgetCentsMax / 100).toLocaleString('en-ZA')}</span>
          </p>
        )}
      </div>

      {/* Bids */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-ink-400">Bids ({rfq.bids.length})</h3>

        {rfq.bids.length === 0 && (
          <p className="text-sm text-ink-500 py-4">No bids yet. Service providers will be notified of your RFQ.</p>
        )}

        {rfq.bids.map((bid) => (
          <div
            key={bid.id}
            className={cn(
              'rounded-lg border p-4 space-y-3',
              bid.status === 'ACCEPTED' ? 'border-success-500/30 bg-success-50/20' : 'border-ink-200 bg-white'
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-ink-900">{bid.providerCompany.name}</p>
                  {bid.status === 'ACCEPTED' && (
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-sm bg-success-500/10 text-success-600">Accepted</span>
                  )}
                  {bid.status === 'REJECTED' && (
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-sm bg-ink-100 text-ink-400">Rejected</span>
                  )}
                </div>
                {bid.providerCompany.serviceProviderProfile && (
                  <div className="flex items-center gap-1 mt-0.5">
                    <Star className="h-3 w-3 text-amber-400 fill-amber-400" strokeWidth={1.5} />
                    <span className="text-xs text-ink-600">
                      {bid.providerCompany.serviceProviderProfile.rating?.toFixed(1)}
                    </span>
                    <span className="text-xs text-ink-400">
                      ({bid.providerCompany.serviceProviderProfile.ratingCount} reviews)
                    </span>
                  </div>
                )}
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-sm font-semibold text-ink-900">
                  R {(bid.amountCents / 100).toLocaleString('en-ZA')}
                </p>
                <p className="text-xs text-ink-400">{bid.estimatedDays} days</p>
              </div>
            </div>

            <p className="text-sm text-ink-600">{bid.proposalText}</p>

            {!isAwarded && bid.status === 'SUBMITTED' && (
              <form action={acceptBid}>
                <input type="hidden" name="bidId" value={bid.id} />
                <button
                  type="submit"
                  className="h-7 px-3 rounded-md bg-ink-900 text-white text-xs font-medium hover:bg-ink-800 transition-colors"
                >
                  Accept bid — create job card
                </button>
              </form>
            )}
          </div>
        ))}

        {isAwarded && rfq.jobCard && (
          <div className="rounded-md border border-success-500/20 bg-success-50/20 px-4 py-3 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-ink-900">Job card created</p>
              <p className="text-xs text-ink-500 mt-0.5">The service provider has been notified and work has begun.</p>
            </div>
            <Link
              href={`/contractor/service-center/job-cards/${rfq.jobCard.id}`}
              className="flex-shrink-0 h-7 px-3 rounded-md bg-ink-900 text-white text-xs font-medium hover:bg-ink-800 transition-colors inline-flex items-center"
            >
              View Job Card →
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
