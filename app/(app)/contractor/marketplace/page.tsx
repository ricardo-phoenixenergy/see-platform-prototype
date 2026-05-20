import { getHardwareListings } from '@/server/queries/marketplace'
import { HardwareProductCard } from '@/components/marketplace/hardware-product-card'
import Link from 'next/link'
import { cn } from '@/lib/utils'

const CATEGORIES = [
  { value: '', label: 'All' },
  { value: 'SOLAR_PANEL', label: 'Solar Panels' },
  { value: 'BATTERY', label: 'Batteries' },
  { value: 'INVERTER', label: 'Inverters' },
  { value: 'GENERATOR', label: 'Generators' },
  { value: 'ACCESSORY', label: 'Accessories' },
]

type Props = { searchParams: Promise<{ category?: string }> }

export default async function HardwareMarketplacePage({ searchParams }: Props) {
  const { category } = await searchParams
  const listings = await getHardwareListings(category || undefined)

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-base font-semibold text-ink-900">Hardware Marketplace</h1>
        <p className="text-sm text-ink-500">Solar panels, batteries, inverters, and accessories from verified suppliers.</p>
      </div>

      {/* Category nav */}
      <div className="flex gap-2 flex-wrap">
        {CATEGORIES.map((cat) => (
          <Link
            key={cat.value}
            href={cat.value ? `/contractor/marketplace?category=${cat.value}` : '/contractor/marketplace'}
            className={cn(
              'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
              (category ?? '') === cat.value
                ? 'bg-ink-900 text-white'
                : 'border border-ink-200 text-ink-600 hover:bg-ink-50'
            )}
          >
            {cat.label}
          </Link>
        ))}
      </div>

      {listings.length === 0 && (
        <div className="flex flex-col items-center py-16 text-center">
          <p className="text-sm font-medium text-ink-900">No products in this category</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {listings.map((listing) => (
          <HardwareProductCard
            key={listing.id}
            id={listing.id}
            manufacturer={listing.manufacturer}
            model={listing.model}
            description={listing.description}
            priceCents={listing.priceCents}
            stockQty={listing.stockQty}
            imageUrl={listing.imageUrl}
            category={listing.category}
          />
        ))}
      </div>
    </div>
  )
}
