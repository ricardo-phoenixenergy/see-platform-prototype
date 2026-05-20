'use client'
// components/marketplace/hardware-product-card.tsx

import { useCartStore } from '@/lib/cart-store'
import { ShoppingCart, CheckCircle } from 'lucide-react'
import { useState } from 'react'

type Props = {
  id: string
  manufacturer: string
  model: string
  description: string
  priceCents: number
  stockQty: number
  imageUrl: string | null
  category: string
  discountPercent?: number
}

function fmt(cents: number) {
  return (cents / 100).toLocaleString('en-ZA', { minimumFractionDigits: 2 })
}

export function HardwareProductCard({
  id, manufacturer, model, description, priceCents, stockQty, imageUrl, category,
  discountPercent = 0,
}: Props) {
  const addItem = useCartStore((s) => s.addItem)
  const items = useCartStore((s) => s.items)
  const [added, setAdded] = useState(false)
  const inCart = items.find((i) => i.id === id)

  const discountedCents = discountPercent > 0
    ? Math.round(priceCents * (1 - discountPercent / 100))
    : priceCents
  const savingCents = priceCents - discountedCents

  function handleAdd() {
    addItem({ id, name: `${manufacturer} ${model}`, manufacturer, priceCents: discountedCents, imageUrl })
    setAdded(true)
    setTimeout(() => setAdded(false), 1800)
  }

  return (
    <div className="rounded-lg border border-ink-200 bg-white overflow-hidden flex flex-col hover:border-ink-300 transition-colors">
      <div className="h-40 bg-ink-50 flex items-center justify-center relative">
        {imageUrl
          ? <img src={imageUrl} alt={model} className="h-full w-full object-contain p-4" />
          : <span className="text-xs text-ink-400">{category.replace('_', ' ')}</span>
        }
        {discountPercent > 0 && (
          <span className="absolute top-2 right-2 rounded-sm bg-success-500 text-white text-[10px] font-semibold px-1.5 py-0.5">
            {discountPercent}% off
          </span>
        )}
      </div>

      <div className="p-4 flex flex-col flex-1 gap-2">
        <div>
          <p className="text-xs text-ink-400 font-medium">{manufacturer}</p>
          <p className="text-sm font-semibold text-ink-900 leading-tight">{model}</p>
        </div>
        <p className="text-xs text-ink-500 line-clamp-2 flex-1">{description}</p>

        <div className="flex items-center justify-between mt-2">
          <div>
            {discountPercent > 0 ? (
              <>
                <p className="text-base font-semibold text-ink-900">
                  R {fmt(discountedCents)}
                </p>
                <p className="text-xs text-ink-400 line-through">
                  R {fmt(priceCents)}
                </p>
                <p className="text-[10px] font-medium text-success-600">
                  Save R {fmt(savingCents)}
                </p>
              </>
            ) : (
              <>
                <p className="text-base font-semibold text-ink-900">
                  R {fmt(priceCents)}
                </p>
                <p className="text-[10px] text-ink-400">{stockQty > 0 ? `${stockQty} in stock` : 'Out of stock'}</p>
              </>
            )}
            {discountPercent > 0 && (
              <p className="text-[10px] text-ink-400">{stockQty > 0 ? `${stockQty} in stock` : 'Out of stock'}</p>
            )}
          </div>
          <button
            onClick={handleAdd}
            disabled={stockQty === 0}
            className="flex items-center gap-1.5 h-8 px-3 rounded-md bg-ink-900 text-white text-xs font-medium hover:bg-ink-800 transition-colors disabled:opacity-40"
          >
            {added ? (
              <><CheckCircle className="h-3.5 w-3.5" strokeWidth={1.5} />Added</>
            ) : (
              <><ShoppingCart className="h-3.5 w-3.5" strokeWidth={1.5} />{inCart ? `In cart (${inCart.qty})` : 'Add to cart'}</>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
