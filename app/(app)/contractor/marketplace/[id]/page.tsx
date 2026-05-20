import { notFound, redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { getHardwareListing } from '@/server/queries/marketplace'
import { getTierInfo } from '@/server/queries/dashboard'
import { TIER_DISCOUNT_RATES } from '@/lib/tier/rules'
import { ProductAddToCart } from '@/components/marketplace/product-add-to-cart'
import Link from 'next/link'

type Props = { params: Promise<{ id: string }> }

function fmt(cents: number) {
  return (cents / 100).toLocaleString('en-ZA', { minimumFractionDigits: 2 })
}

export default async function ProductDetailPage({ params }: Props) {
  const session = await auth()
  if (!session) redirect('/login')

  const { id } = await params
  const [listing, tierInfo] = await Promise.all([
    getHardwareListing(id),
    getTierInfo(session.user.companyId),
  ])
  if (!listing) notFound()

  const discountPercent = TIER_DISCOUNT_RATES[tierInfo.tier]
  const discountedCents = Math.round(listing.priceCents * (1 - discountPercent / 100))
  const savingCents = listing.priceCents - discountedCents
  const specs = listing.specs as Record<string, string | number>

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-2 text-xs text-ink-400">
        <Link href="/contractor/marketplace" className="hover:text-ink-700 transition-colors">Marketplace</Link>
        <span>/</span>
        <span className="text-ink-600">{listing.model}</span>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Image */}
        <div className="rounded-lg border border-ink-200 bg-ink-50 h-64 flex items-center justify-center relative overflow-hidden">
          {listing.imageUrl
            ? <img src={listing.imageUrl} alt={listing.model} className="h-full w-full object-contain p-6" />
            : <span className="text-sm text-ink-400">{listing.category.replace('_', ' ')}</span>
          }
          {discountPercent > 0 && (
            <span className="absolute top-3 right-3 rounded-sm bg-success-500 text-white text-xs font-semibold px-2 py-0.5">
              {discountPercent}% off
            </span>
          )}
        </div>

        {/* Details */}
        <div className="space-y-4">
          <div>
            <p className="text-xs font-semibold text-ink-400 uppercase tracking-widest mb-1">{listing.manufacturer}</p>
            <h1 className="text-xl font-semibold text-ink-900">{listing.model}</h1>
            <p className="text-sm text-ink-500 mt-1">{listing.description}</p>
          </div>

          {/* Pricing */}
          <div>
            <p className="text-2xl font-semibold text-ink-900">R {fmt(discountedCents)}</p>
            {discountPercent > 0 && (
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-sm text-ink-400 line-through">R {fmt(listing.priceCents)}</p>
                <p className="text-sm font-medium text-success-600">Save R {fmt(savingCents)}</p>
              </div>
            )}
            <p className="text-xs text-ink-400 mt-1">
              {listing.stockQty > 0 ? `${listing.stockQty} units in stock` : 'Out of stock'}
            </p>
          </div>

          <ProductAddToCart
            id={listing.id}
            name={`${listing.manufacturer} ${listing.model}`}
            manufacturer={listing.manufacturer}
            priceCents={discountedCents}
            imageUrl={listing.imageUrl}
            stockQty={listing.stockQty}
          />
        </div>
      </div>

      {/* Specs */}
      <div className="rounded-lg border border-ink-200 bg-white overflow-hidden">
        <div className="px-4 py-3 border-b border-ink-100">
          <h2 className="text-sm font-semibold text-ink-900">Specifications</h2>
        </div>
        <table className="w-full text-sm">
          <tbody className="divide-y divide-ink-50">
            {Object.entries(specs).map(([key, value]) => (
              <tr key={key}>
                <td className="px-4 py-2.5 text-ink-500 font-medium capitalize w-1/3">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </td>
                <td className="px-4 py-2.5 text-ink-900">{String(value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
