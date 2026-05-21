'use client'

import { useState } from 'react'
import Image from 'next/image'
import { X, ShoppingCart, Trash2, Plus, Minus, CheckCircle } from 'lucide-react'
import { useCartStore } from '@/lib/cart-store'
import { cn } from '@/lib/utils'

function fmt(cents: number) {
  return (cents / 100).toLocaleString('en-ZA', { minimumFractionDigits: 2 })
}

function CartPanel({
  onClose, discountPercent = 0,
}: {
  onClose: () => void; discountPercent?: number
}) {
  const { items, removeItem, updateQty, clear, totalCents } = useCartStore()
  const [ordered, setOrdered] = useState(false)

  const total = totalCents()
  const originalTotalCents = discountPercent > 0
    ? Math.round(total / (1 - discountPercent / 100))
    : total
  const tierSavingsCents = originalTotalCents - total

  function handleOrder() {
    setOrdered(true)
    setTimeout(() => {
      clear()
      setOrdered(false)
      onClose()
    }, 2200)
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-ink-900/20 z-40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 h-full w-full max-w-sm bg-white border-l border-ink-200 shadow-xl z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-ink-100">
          <h2 className="text-sm font-semibold text-ink-900">
            Cart {items.length > 0 && <span className="text-ink-400 font-normal">({items.length} item{items.length !== 1 ? 's' : ''})</span>}
          </h2>
          <button onClick={onClose} className="text-ink-400 hover:text-ink-700 transition-colors" aria-label="Close cart">
            <X className="h-4 w-4" strokeWidth={1.5} />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-16 text-center px-6">
              <ShoppingCart className="h-8 w-8 text-ink-300 mb-3" strokeWidth={1.5} />
              <p className="text-sm font-medium text-ink-900">Your cart is empty</p>
              <p className="text-xs text-ink-500 mt-1">Add products from the marketplace to get started.</p>
            </div>
          ) : (
            <ul className="divide-y divide-ink-100">
              {items.map((item) => (
                <li key={item.id} className="px-5 py-4 flex items-start gap-3">
                  <div className="h-12 w-12 rounded-md border border-ink-200 bg-ink-50 flex items-center justify-center flex-shrink-0 overflow-hidden relative">
                    {item.imageUrl
                      ? <Image src={item.imageUrl} alt={item.name} fill className="object-contain p-1" unoptimized />
                      : <ShoppingCart className="h-4 w-4 text-ink-300" strokeWidth={1.5} />
                    }
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-ink-400">{item.manufacturer}</p>
                    <p className="text-sm font-medium text-ink-900 leading-tight truncate">
                      {item.name.replace(item.manufacturer + ' ', '')}
                    </p>
                    <p className="text-xs font-semibold text-ink-900 mt-0.5">R {fmt(item.priceCents)}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() => updateQty(item.id, item.qty - 1)}
                        className="h-6 w-6 rounded border border-ink-200 flex items-center justify-center hover:bg-ink-50 transition-colors"
                      >
                        {item.qty === 1
                          ? <Trash2 className="h-3 w-3 text-danger-500" strokeWidth={1.5} />
                          : <Minus className="h-3 w-3 text-ink-600" strokeWidth={2} />
                        }
                      </button>
                      <span className="text-sm font-semibold text-ink-900 tabular-nums w-5 text-center">{item.qty}</span>
                      <button
                        onClick={() => updateQty(item.id, item.qty + 1)}
                        className="h-6 w-6 rounded border border-ink-200 flex items-center justify-center hover:bg-ink-50 transition-colors"
                      >
                        <Plus className="h-3 w-3 text-ink-600" strokeWidth={2} />
                      </button>
                      <span className="text-xs text-ink-500 ml-1">= R {fmt(item.priceCents * item.qty)}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => removeItem(item.id)}
                    className="text-ink-300 hover:text-danger-500 transition-colors flex-shrink-0 mt-0.5"
                    aria-label={`Remove ${item.name}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-ink-100 px-5 py-4 space-y-4">
            {/* Itemised totals */}
            <div className="space-y-1.5 rounded-md bg-ink-25 border border-ink-100 px-3 py-3">
              <div className="flex items-center justify-between text-xs text-ink-500">
                <span>Subtotal</span>
                <span className="tabular-nums">R {fmt(originalTotalCents)}</span>
              </div>
              {discountPercent > 0 && (
                <div className="flex items-center justify-between text-xs text-success-600">
                  <span>Tier discount ({discountPercent}%)</span>
                  <span className="tabular-nums">−R {fmt(tierSavingsCents)}</span>
                </div>
              )}
              <div className="flex items-center justify-between pt-1.5 border-t border-ink-200">
                <span className="text-sm font-semibold text-ink-900">Total due</span>
                <span className="text-base font-semibold text-ink-900 tabular-nums">R {fmt(total)}</span>
              </div>
            </div>

            {ordered ? (
              <div className="flex items-center justify-center gap-2 h-9 rounded-md bg-success-500/10 border border-success-500/20">
                <CheckCircle className="h-4 w-4 text-success-600" strokeWidth={1.5} />
                <span className="text-sm font-medium text-success-700">Order placed</span>
              </div>
            ) : (
              <div className="space-y-2">
                <button
                  onClick={handleOrder}
                  className="w-full h-9 rounded-md bg-ink-900 text-white text-sm font-medium hover:bg-ink-800 transition-colors"
                >
                  Place order — R {fmt(total)}
                </button>
                <button onClick={clear} className="w-full text-xs text-ink-400 hover:text-ink-600 transition-colors">
                  Clear cart
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  )
}

type CartButtonProps = { discountPercent?: number }

export function CartButton({ discountPercent = 0 }: CartButtonProps) {
  const [open, setOpen] = useState(false)
  const itemCount = useCartStore((s) => s.itemCount())

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'relative flex items-center gap-1.5 h-8 px-3 rounded-md text-xs font-medium transition-colors border',
          open
            ? 'bg-ink-900 text-white border-ink-900'
            : 'border-ink-200 text-ink-700 hover:bg-ink-50'
        )}
        aria-label="Open cart"
      >
        <ShoppingCart className="h-3.5 w-3.5" strokeWidth={1.5} />
        Cart
        {itemCount > 0 && (
          <span className={cn(
            'flex items-center justify-center h-4 min-w-4 px-1 rounded-full text-[10px] font-semibold',
            open ? 'bg-white text-ink-900' : 'bg-ink-900 text-white'
          )}>
            {itemCount}
          </span>
        )}
      </button>

      {open && <CartPanel onClose={() => setOpen(false)} discountPercent={discountPercent} />}
    </div>
  )
}
