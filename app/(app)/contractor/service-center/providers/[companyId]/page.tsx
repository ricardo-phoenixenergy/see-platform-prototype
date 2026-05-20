import { notFound, redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { getSpProfileForContractor } from '@/server/queries/marketplace'
import Link from 'next/link'
import { Star, MapPin, Clock, Phone, Mail, Globe, ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getInitials } from '@/lib/utils'
import Image from 'next/image'

type Props = { params: Promise<{ companyId: string }> }

const CATEGORY_LABELS: Record<string, string> = {
  STRUCTURAL_CIVILS: 'Structural & Civils',
  ENGINEERING: 'Engineering',
  LEGAL: 'Legal',
  LOGISTICS_PLANT_HIRE: 'Logistics & Plant Hire',
  FINANCE_INSURANCE: 'Finance & Insurance',
}

function StarRow({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'lg' }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={cn(
            size === 'lg' ? 'h-4 w-4' : 'h-3 w-3',
            n <= Math.round(rating)
              ? 'text-amber-400 fill-amber-400'
              : 'text-ink-200 fill-ink-200'
          )}
          strokeWidth={1.5}
        />
      ))}
    </div>
  )
}

export default async function SpProfilePage({ params }: Props) {
  const session = await auth()
  if (!session) redirect('/login')

  const { companyId } = await params
  const data = await getSpProfileForContractor(companyId)
  if (!data) notFound()

  const { profile, reviews } = data
  const company = profile.company
  const initials = getInitials(company.name)

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <Link
        href="/contractor/service-center"
        className="inline-flex items-center gap-1.5 text-xs text-ink-400 hover:text-ink-700 transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.5} />
        Browse Providers
      </Link>

      {/* Header card */}
      <div className="rounded-lg border border-ink-200 bg-white p-6 space-y-4">
        <div className="flex items-start gap-4">
          {/* Logo / initials */}
          <div className="h-14 w-14 rounded-lg border border-ink-200 bg-ink-50 flex items-center justify-center flex-shrink-0 overflow-hidden">
            {company.logoUrl ? (
              <Image src={company.logoUrl} alt={company.name} width={56} height={56} className="h-full w-full object-contain" unoptimized />
            ) : (
              <span className="text-base font-semibold text-ink-400">{initials}</span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h1 className="text-base font-semibold text-ink-900">{company.name}</h1>
            <p className="text-sm text-ink-500 mt-0.5 line-clamp-2">{profile.headline}</p>

            {profile.rating != null && (
              <div className="flex items-center gap-2 mt-1.5">
                <StarRow rating={profile.rating} size="sm" />
                <span className="text-sm font-semibold text-ink-900">{profile.rating.toFixed(1)}</span>
                <span className="text-xs text-ink-400">{profile.ratingCount} review{profile.ratingCount !== 1 ? 's' : ''}</span>
              </div>
            )}
          </div>

          <Link
            href={`/contractor/service-center/rfq/new?provider=${companyId}`}
            className="flex-shrink-0 h-8 px-4 rounded-md bg-ink-900 text-white text-xs font-medium hover:bg-ink-800 transition-colors inline-flex items-center"
          >
            Post RFQ
          </Link>
        </div>

        {/* About */}
        {(company.about ?? profile.description) && (
          <p className="text-sm text-ink-700 leading-relaxed">{company.about ?? profile.description}</p>
        )}

        {/* Meta row */}
        <div className="flex flex-wrap gap-x-5 gap-y-2">
          {profile.responseTimeHrs != null && (
            <div className="flex items-center gap-1.5 text-xs text-ink-500">
              <Clock className="h-3.5 w-3.5 flex-shrink-0" strokeWidth={1.5} />
              Responds within {profile.responseTimeHrs}h
            </div>
          )}
          {profile.serviceAreas.length > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-ink-500">
              <MapPin className="h-3.5 w-3.5 flex-shrink-0" strokeWidth={1.5} />
              {profile.serviceAreas.join(', ')}
            </div>
          )}
          {company.phone && (
            <div className="flex items-center gap-1.5 text-xs text-ink-500">
              <Phone className="h-3.5 w-3.5 flex-shrink-0" strokeWidth={1.5} />
              {company.phone}
            </div>
          )}
          {company.email && (
            <div className="flex items-center gap-1.5 text-xs text-ink-500">
              <Mail className="h-3.5 w-3.5 flex-shrink-0" strokeWidth={1.5} />
              {company.email}
            </div>
          )}
          {company.websiteUrl && (
            <a
              href={company.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-accent-600 hover:text-accent-700"
            >
              <Globe className="h-3.5 w-3.5 flex-shrink-0" strokeWidth={1.5} />
              {company.websiteUrl.replace(/^https?:\/\//, '')}
            </a>
          )}
        </div>

        {/* Categories */}
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-ink-500 uppercase tracking-widest">Services offered</p>
          <div className="flex flex-wrap gap-1.5">
            {profile.categories.map((cat) => (
              <span key={cat} className="text-xs font-medium px-2 py-0.5 rounded-sm bg-ink-100 text-ink-700">
                {CATEGORY_LABELS[cat] ?? cat}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Reviews */}
      <div className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-ink-400">
          Reviews ({reviews.length})
        </h2>

        {reviews.length === 0 && (
          <div className="rounded-lg border border-ink-200 bg-white px-5 py-8 text-center">
            <p className="text-sm text-ink-500">No reviews yet.</p>
          </div>
        )}

        {reviews.map((review) => (
          <div key={review.id} className="rounded-lg border border-ink-200 bg-white px-5 py-4 space-y-2">
            <div className="flex items-start justify-between gap-3">
              <div>
                <StarRow rating={review.rating} size="sm" />
                <p className="text-xs text-ink-400 mt-1">
                  {review.jobCard.rfq.project.contractorCompany.name}
                </p>
              </div>
              <span className="text-[10px] text-ink-400">
                {new Date(review.createdAt).toLocaleDateString('en-ZA', { year: 'numeric', month: 'short' })}
              </span>
            </div>
            <p className="text-sm text-ink-700">{review.text}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
