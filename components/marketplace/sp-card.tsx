// components/marketplace/sp-card.tsx

import { Star, MapPin } from 'lucide-react'
import Link from 'next/link'

const CATEGORY_LABELS: Record<string, string> = {
  STRUCTURAL_CIVILS: 'Structural & Civils',
  ENGINEERING: 'Engineering',
  LEGAL: 'Legal',
  LOGISTICS_PLANT_HIRE: 'Logistics & Plant Hire',
  FINANCE_INSURANCE: 'Finance & Insurance',
}

type Props = {
  companyId: string
  name: string
  headline: string
  categories: string[]
  serviceAreas: string[]
  rating: number | null
  ratingCount: number
  postRfqHref?: string
}

export function SpCard({
  companyId, name, headline, categories, serviceAreas, rating, ratingCount, postRfqHref,
}: Props) {
  return (
    <div className="rounded-lg border border-ink-200 bg-white p-5 space-y-3 hover:border-ink-300 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-ink-900">{name}</p>
          <p className="text-xs text-ink-500 mt-0.5 line-clamp-2">{headline}</p>
        </div>
        {rating != null && (
          <div className="flex items-center gap-1 flex-shrink-0">
            <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" strokeWidth={1.5} />
            <span className="text-sm font-semibold text-ink-900">{rating.toFixed(1)}</span>
            <span className="text-xs text-ink-400">({ratingCount})</span>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-1">
        {categories.map((cat) => (
          <span key={cat} className="text-[10px] font-medium px-1.5 py-0.5 rounded-sm bg-ink-100 text-ink-600">
            {CATEGORY_LABELS[cat] ?? cat}
          </span>
        ))}
      </div>

      {serviceAreas.length > 0 && (
        <div className="flex items-center gap-1 text-xs text-ink-400">
          <MapPin className="h-3 w-3 flex-shrink-0" strokeWidth={1.5} />
          {serviceAreas.slice(0, 2).join(', ')}{serviceAreas.length > 2 ? ` +${serviceAreas.length - 2}` : ''}
        </div>
      )}

      <div className="flex items-center gap-2 pt-1">
        <Link
          href={`/contractor/service-center/providers/${companyId}`}
          className="inline-flex items-center h-7 px-3 rounded-md border border-ink-200 text-xs font-medium text-ink-600 hover:bg-ink-50 transition-colors"
        >
          View Company
        </Link>
        {postRfqHref && (
          <Link
            href={postRfqHref}
            className="inline-flex items-center h-7 px-3 rounded-md bg-ink-900 text-white text-xs font-medium hover:bg-ink-800 transition-colors"
          >
            Post RFQ
          </Link>
        )}
      </div>
    </div>
  )
}
