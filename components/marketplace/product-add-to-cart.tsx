'use client'

import { useCartStore } from '@/lib/cart-store'
import { ShoppingCart, CheckCircle, Plus, Minus, Trash2 } from 'lucide-react'
import { useState } from 'react'

type Props = {
  id: string
  name: string
  manufacturer: string
  priceCents: number
  imageUrl: string | null
  stockQty: number
}

export function ProductAddToCart({ id, name, manufacturer, priceCents, imageUrl, stockQty }: Props) {
  const addItem = useCartStore((s) => s.addItem)
  const updateQty = useCartStore((s) => s.updateQty)
  const items = useCartStore((s) => s.items)
  const [added, setAdded] = useState(false)
  const inCart = items.find((i) => i.id === id)

  function handleAdd() {
    addItem({ id, name, manufacturer, priceCents, imageUrl })
    setAdded(true)
    setTimeout(() => setAdded(false), 1800)
  }

  if (inCart) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => updateQty(id, inCart.qty - 1)}
            className="h-9 w-9 rounded-md border border-ink-200 flex items-center justify-center hover:bg-ink-50 transition-colors"
          >
            {inCart.qty === 1
              ? <Trash2 className="h-4 w-4 text-danger-500" strokeWidth={1.5} />
              : <Minus className="h-4 w-4 text-ink-600" strokeWidth={2} />
            }
          </button>
          <span className="text-base font-semibold text-ink-900 tabular-nums w-6 text-center">{inCart.qty}</span>
          <button
            onClick={() => updateQty(id, inCart.qty + 1)}
            disabled={stockQty === 0}
            className="h-9 w-9 rounded-md border border-ink-200 flex items-center justify-center hover:bg-ink-50 transition-colors disabled:opacity-40"
          >
            <Plus className="h-4 w-4 text-ink-600" strokeWidth={2} />
          </button>
        </div>
        <span className="text-sm text-ink-500">{inCart.qty} in cart</span>
      </div>
    )
  }

  return (
    <button
      onClick={handleAdd}
      disabled={stockQty === 0}
      className="flex items-center justify-center gap-2 h-10 px-6 rounded-md bg-ink-900 text-white text-sm font-medium hover:bg-ink-800 transition-colors disabled:opacity-40 w-full sm:w-auto"
    >
      {added ? (
        <><CheckCircle className="h-4 w-4" strokeWidth={1.5} />Added to cart</>
      ) : (
        <><ShoppingCart className="h-4 w-4" strokeWidth={1.5} />Add to cart</>
      )}
    </button>
  )
}
