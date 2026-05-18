// lib/cart-store.ts
// Client-only cart state. Persisted in localStorage. No DB writes until M9 checkout.

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type CartItem = {
  id: string
  name: string
  manufacturer: string
  priceCents: number
  qty: number
  imageUrl: string | null
}

type CartStore = {
  items: CartItem[]
  addItem: (item: Omit<CartItem, 'qty'>) => void
  removeItem: (id: string) => void
  updateQty: (id: string, qty: number) => void
  clear: () => void
  totalCents: () => number
  itemCount: () => number
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) => {
        const existing = get().items.find((i) => i.id === item.id)
        if (existing) {
          set({ items: get().items.map((i) => i.id === item.id ? { ...i, qty: i.qty + 1 } : i) })
        } else {
          set({ items: [...get().items, { ...item, qty: 1 }] })
        }
      },
      removeItem: (id) => set({ items: get().items.filter((i) => i.id !== id) }),
      updateQty: (id, qty) => {
        if (qty <= 0) {
          set({ items: get().items.filter((i) => i.id !== id) })
        } else {
          set({ items: get().items.map((i) => i.id === id ? { ...i, qty } : i) })
        }
      },
      clear: () => set({ items: [] }),
      totalCents: () => get().items.reduce((sum, i) => sum + i.priceCents * i.qty, 0),
      itemCount: () => get().items.reduce((sum, i) => sum + i.qty, 0),
    }),
    { name: 'see-cart' }
  )
)
