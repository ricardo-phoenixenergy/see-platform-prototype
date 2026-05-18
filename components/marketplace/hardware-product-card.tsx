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
}

export function HardwareProductCard({
  id, manufacturer, model, description, priceCents, stockQty, imageUrl, category,
}: Props) {
  const addItem = useCartStore((s) => s.addItem)
  const items = useCartStore((s) => s.items)
  const [added, setAdded] = useState(false)
  const inCart = items.find((i) => i.id === id)

  function handleAdd() {
    addItem({ id, name: `${manufacturer} ${model}`, manufacturer, priceCents, imageUrl })
    setAdded(true)
    setTimeout(() => setAdded(false), 1800)
  }

  return (
    <div className="rounded-lg border border-ink-200 bg-white overflow-hidden flex flex-col hover:border-ink-300 transition-colors">
      <div className="h-40 bg-ink-50 flex items-center justify-center">
        {imageUrl
          ? <img src={imageUrl} alt={model} className="h-full w-full object-contain p-4" />
          : <span className="text-xs text-ink-400">{category.replace('_', ' ')}</span>
        }
      </div>
      <div className="p-4 flex flex-col flex-1 gap-2">
        <div>
          <p className="text-xs text-ink-400 font-medium">{manufacturer}</p>
          <p className="text-sm font-semibold text-ink-900 leading-tight">{model}</p>
        </div>
        <p className="text-xs text-ink-500 line-clamp-2 flex-1">{description}</p>
        <div className="flex items-center justify-between mt-2">
          <div>
            <p className="text-base font-semibold text-ink-900">
              R {(priceCents / 100).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-[10px] text-ink-400">{stockQty > 0 ? `${stockQty} in stock` : 'Out of stock'}</p>
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
