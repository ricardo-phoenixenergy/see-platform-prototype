import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getContractorRfqs, getServiceProviders } from '@/server/queries/marketplace'
import { SpCard } from '@/components/marketplace/sp-card'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Plus } from 'lucide-react'

type Props = { searchParams: Promise<{ tab?: string }> }

const STATUS_CLASS: Record<string, string> = {
  OPEN: 'bg-ink-100 text-ink-600',
  REVIEWING_BIDS: 'bg-accent-500/10 text-accent-600',
  AWARDED: 'bg-success-500/10 text-success-600',
  CANCELLED: 'bg-danger-500/10 text-danger-600',
}

const JC_STATUS_CLASS: Record<string, string> = {
  ACTIVE: 'bg-accent-500/10 text-accent-600',
  PENDING_REVIEW: 'bg-warning-50 text-warning-700',
  COMPLETED: 'bg-success-500/10 text-success-600',
  DISPUTED: 'bg-danger-500/10 text-danger-600',
}

export default async function ServiceCenterPage({ searchParams }: Props) {
  const session = await auth()
  if (!session) redirect('/login')

  const { tab = 'browse' } = await searchParams
  const companyId = session.user.companyId

  const [rfqs, providers] = await Promise.all([
    tab !== 'browse' ? getContractorRfqs(companyId) : Promise.resolve([]),
    tab === 'browse' ? getServiceProviders() : Promise.resolve([]),
  ])

  const openRfqs = rfqs.filter((r) => ['OPEN', 'REVIEWING_BIDS'].includes(r.status))
  const jobCards = rfqs.filter((r) => r.jobCard)

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-semibold text-ink-900">Service Centre</h1>
          <p className="text-sm text-ink-500">Find verified service providers and manage your project RFQs.</p>
        </div>
        {tab !== 'browse' && (
          <Link
            href="/contractor/service-center/rfq/new"
            className="flex items-center gap-1.5 h-8 px-3 rounded-md bg-ink-900 text-white text-xs font-medium hover:bg-ink-800 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={2} />
            Post RFQ
          </Link>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-ink-200">
        {[
          { key: 'browse', label: 'Browse Providers' },
          { key: 'rfqs', label: `My RFQs${openRfqs.length > 0 ? ` (${openRfqs.length})` : ''}` },
          { key: 'jobs', label: `Job Cards${jobCards.length > 0 ? ` (${jobCards.length})` : ''}` },
        ].map((t) => (
          <Link
            key={t.key}
            href={`/contractor/service-center?tab=${t.key}`}
            className={cn(
              'px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
              tab === t.key
                ? 'border-ink-900 text-ink-900'
                : 'border-transparent text-ink-500 hover:text-ink-700'
            )}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {/* Browse providers */}
      {tab === 'browse' && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {providers.map((sp) => (
            <SpCard
              key={sp.companyId}
              companyId={sp.companyId}
              name={sp.company.name}
              headline={sp.headline}
              categories={sp.categories}
              serviceAreas={sp.serviceAreas}
              rating={sp.rating}
              ratingCount={sp.ratingCount}
              postRfqHref={`/contractor/service-center/rfq/new?provider=${sp.companyId}`}
            />
          ))}
          {providers.length === 0 && (
            <p className="text-sm text-ink-500 col-span-2 py-8 text-center">No service providers registered yet.</p>
          )}
        </div>
      )}

      {/* My RFQs */}
      {tab === 'rfqs' && (
        <div className="space-y-3">
          {rfqs.length === 0 && (
            <div className="flex flex-col items-center py-12 text-center">
              <p className="text-sm font-medium text-ink-900">No RFQs yet</p>
              <p className="text-xs text-ink-500 mt-1">Post an RFQ to find a service provider for a milestone.</p>
            </div>
          )}
          {rfqs.map((rfq) => (
            <Link
              key={rfq.id}
              href={`/contractor/service-center/rfq/${rfq.id}`}
              className="flex items-start gap-4 rounded-lg border border-ink-200 bg-white px-5 py-4 hover:border-ink-300 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-ink-900 truncate">{rfq.title}</p>
                <p className="text-xs text-ink-500">
                  {rfq.project.name}{rfq.milestone ? ` · ${rfq.milestone.name}` : ''}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-xs text-ink-400">{rfq.bids.length} bid{rfq.bids.length !== 1 ? 's' : ''}</span>
                <span className={cn(
                  'text-[10px] font-semibold px-1.5 py-0.5 rounded-sm',
                  STATUS_CLASS[rfq.status] ?? 'bg-ink-100 text-ink-600'
                )}>
                  {rfq.status.replace('_', ' ')}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Job Cards */}
      {tab === 'jobs' && (
        <div className="space-y-3">
          {jobCards.length === 0 && (
            <div className="flex flex-col items-center py-12 text-center">
              <p className="text-sm font-medium text-ink-900">No active job cards</p>
              <p className="text-xs text-ink-500 mt-1">Job cards are created when you accept a bid on an RFQ.</p>
            </div>
          )}
          {jobCards.map((rfq) =>
            rfq.jobCard ? (
              <Link
                key={rfq.jobCard.id}
                href={`/service-provider/job-cards/${rfq.jobCard.id}`}
                className="flex items-start gap-4 rounded-lg border border-ink-200 bg-white px-5 py-4 hover:border-ink-300 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-ink-900 truncate">{rfq.title}</p>
                  <p className="text-xs text-ink-500">{rfq.project.name}</p>
                </div>
                <span className={cn(
                  'text-[10px] font-semibold px-1.5 py-0.5 rounded-sm flex-shrink-0',
                  JC_STATUS_CLASS[rfq.jobCard.status] ?? 'bg-ink-100 text-ink-600'
                )}>
                  {rfq.jobCard.status.replace('_', ' ')}
                </span>
              </Link>
            ) : null
          )}
        </div>
      )}
    </div>
  )
}
