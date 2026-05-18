import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getOpenRfqsForSp, getSpProfile } from '@/server/queries/marketplace'
import Link from 'next/link'

const CATEGORY_LABELS: Record<string, string> = {
  STRUCTURAL_CIVILS: 'Structural & Civils', ENGINEERING: 'Engineering',
  LEGAL: 'Legal', LOGISTICS_PLANT_HIRE: 'Logistics & Plant Hire', FINANCE_INSURANCE: 'Finance & Insurance',
}

export default async function OpportunitiesPage() {
  const session = await auth()
  if (!session) redirect('/login')

  const profile = await getSpProfile(session.user.companyId)
  const rfqs = profile ? await getOpenRfqsForSp(profile.categories as string[]) : []

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-base font-semibold text-ink-900">Opportunity Board</h2>
        <p className="text-sm text-ink-500">Open RFQs matching your service categories.</p>
      </div>

      {rfqs.length === 0 && (
        <div className="flex flex-col items-center py-16 text-center">
          <p className="text-sm font-medium text-ink-900">No opportunities right now</p>
          <p className="text-xs text-ink-500 mt-1">New RFQs matching your categories will appear here.</p>
        </div>
      )}

      <div className="space-y-3">
        {rfqs.map((rfq) => (
          <Link
            key={rfq.id}
            href={`/service-provider/opportunities/${rfq.id}`}
            className="flex items-start gap-4 rounded-lg border border-ink-200 bg-white px-5 py-4 hover:border-ink-300 transition-colors"
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-ink-900">{rfq.title}</p>
              <p className="text-xs text-ink-500 mt-0.5">
                {rfq.project.name} · {rfq.project.systemSizeKw} kW · {CATEGORY_LABELS[rfq.category] ?? rfq.category}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1 flex-shrink-0">
              {rfq.budgetCentsMax && (
                <p className="text-xs font-medium text-ink-700">
                  Up to R {(rfq.budgetCentsMax / 100).toLocaleString('en-ZA')}
                </p>
              )}
              <p className="text-xs text-ink-400">{rfq.bids.length} bid{rfq.bids.length !== 1 ? 's' : ''}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
