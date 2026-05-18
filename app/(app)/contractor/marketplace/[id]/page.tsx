import { notFound } from 'next/navigation'
import { getHardwareListing } from '@/server/queries/marketplace'
import { HardwareProductCard } from '@/components/marketplace/hardware-product-card'
import Link from 'next/link'

type Props = { params: Promise<{ id: string }> }

export default async function ProductDetailPage({ params }: Props) {
  const { id } = await params
  const listing = await getHardwareListing(id)
  if (!listing) notFound()

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
        <div className="rounded-lg border border-ink-200 bg-ink-50 h-64 flex items-center justify-center">
          {listing.imageUrl
            ? <img src={listing.imageUrl} alt={listing.model} className="h-full w-full object-contain p-6" />
            : <span className="text-sm text-ink-400">{listing.category.replace('_', ' ')}</span>
          }
        </div>

        {/* Details */}
        <div className="space-y-4">
          <div>
            <p className="text-xs font-semibold text-ink-400 uppercase tracking-widest mb-1">{listing.manufacturer}</p>
            <h1 className="text-xl font-semibold text-ink-900">{listing.model}</h1>
            <p className="text-sm text-ink-500 mt-1">{listing.description}</p>
          </div>
          <p className="text-2xl font-semibold text-ink-900">
            R {(listing.priceCents / 100).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-ink-400">{listing.stockQty > 0 ? `${listing.stockQty} units in stock` : 'Out of stock'}</p>
          <HardwareProductCard
            id={listing.id}
            manufacturer={listing.manufacturer}
            model={listing.model}
            description={listing.description}
            priceCents={listing.priceCents}
            stockQty={listing.stockQty}
            imageUrl={listing.imageUrl}
            category={listing.category}
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
