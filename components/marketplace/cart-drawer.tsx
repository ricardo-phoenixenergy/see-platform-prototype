'use client'

import { useState, useMemo } from 'react'
import { ShoppingCart, X, Trash2, Plus, Minus, CheckCircle, Coins } from 'lucide-react'
import { useCartStore } from '@/lib/cart-store'
import { TOKENS_PER_RAND, maxTokenBurnForHardware } from '@/lib/tier/rules'
import { cn } from '@/lib/utils'

function fmt(cents: number) {
  return (cents / 100).toLocaleString('en-ZA', { minimumFractionDigits: 2 })
}

function CartPanel({
  onClose, tokenBalance, discountPercent = 0,
}: {
  onClose: () => void; tokenBalance: number; discountPercent?: number
}) {
  const { items, removeItem, updateQty, clear, totalCents } = useCartStore()
  const [tokensToburn, setTokensToBurn] = useState(0)
  const [ordered, setOrdered] = useState(false)

  const total = totalCents()

  // Cap: net discount (tier + tokens) must not exceed 10%
  const maxBurnable = useMemo(
    () => maxTokenBurnForHardware(total, discountPercent, tokenBalance),
    [total, discountPercent, tokenBalance]
  )

  const tokenDiscountCents = Math.round((tokensToburn / TOKENS_PER_RAND) * 100)
  const finalCents = Math.max(0, total - tokenDiscountCents)

  // Reset burn amount if it exceeds new max (e.g. after removing items)
  const safeBurn = Math.min(tokensToburn, maxBurnable)
  if (safeBurn !== tokensToburn) setTokensToBurn(safeBurn)

  function handleOrder() {
    setOrdered(true)
    setTimeout(() => {
      clear()
      setTokensToBurn(0)
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
                  <div className="h-12 w-12 rounded-md border border-ink-200 bg-ink-50 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {item.imageUrl
                      ? <img src={item.imageUrl} alt={item.name} className="h-full w-full object-contain p-1" />
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

            {/* Token burn section */}
            <div className="rounded-md bg-ink-50 border border-ink-200 p-3 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Coins className="h-3.5 w-3.5 text-amber-500" strokeWidth={1.5} />
                  <span className="text-xs font-semibold text-ink-900">Burn tokens</span>
                </div>
                <span className="text-[10px] text-ink-500 tabular-nums">
                  {tokenBalance.toLocaleString()} available · max {maxBurnable.toLocaleString()}
                </span>
              </div>

              {maxBurnable === 0 ? (
                <p className="text-xs text-ink-400">No tokens available to apply to this order.</p>
              ) : (
                <>
                  <input
                    type="range"
                    min={0}
                    max={maxBurnable}
                    step={Math.max(1, Math.floor(maxBurnable / 100))}
                    value={tokensToburn}
                    onChange={(e) => setTokensToBurn(Number(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1">
                      <span className="font-semibold text-ink-900 tabular-nums">
                        {tokensToburn.toLocaleString()} tokens
                      </span>
                      {tokensToburn > 0 && (
                        <span className="text-ink-400">
                          = <span className="font-medium text-success-600">−R {fmt(tokenDiscountCents)}</span>
                        </span>
                      )}
                    </div>
                    {tokensToburn > 0 && (
                      <button
                        onClick={() => setTokensToBurn(0)}
                        className="text-ink-400 hover:text-ink-700 transition-colors"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  {tokensToburn === 0 && (
                    <button
                      onClick={() => setTokensToBurn(maxBurnable)}
                      className="text-[10px] text-accent-600 hover:text-accent-700 transition-colors font-medium"
                    >
                      Apply maximum ({maxBurnable.toLocaleString()} tokens = R {fmt(Math.round(maxBurnable / TOKENS_PER_RAND * 100))})
                    </button>
                  )}
                </>
              )}
            </div>

            {/* Totals */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-ink-500">
                <span>Subtotal (tier discount applied)</span>
                <span className="tabular-nums">R {fmt(total)}</span>
              </div>
              {tokensToburn > 0 && (
                <div className="flex items-center justify-between text-xs text-success-600">
                  <span>Token discount ({tokensToburn.toLocaleString()} tokens)</span>
                  <span className="tabular-nums">−R {fmt(tokenDiscountCents)}</span>
                </div>
              )}
              <div className="flex items-center justify-between pt-1 border-t border-ink-100">
                <span className="text-sm font-semibold text-ink-900">Total due</span>
                <span className="text-base font-semibold text-ink-900 tabular-nums">R {fmt(finalCents)}</span>
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
                  Place order — R {fmt(finalCents)}
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

type CartButtonProps = { tokenBalance?: number; discountPercent?: number }

export function CartButton({ tokenBalance = 0, discountPercent = 0 }: CartButtonProps) {
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

      {open && <CartPanel onClose={() => setOpen(false)} tokenBalance={tokenBalance} discountPercent={discountPercent} />}
    </div>
  )
}
