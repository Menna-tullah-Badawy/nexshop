import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { persistStorage } from '../lib/storage'
import type { Product } from '../lib/types'

export interface CartLine {
  productId: number
  slug: string
  name_ar: string
  name_en: string
  image: string | null
  price: number // base currency
  stock: number
  qty: number
  variant: string | null
}

interface CartState {
  lines: CartLine[]
  promoCode: string | null
  add: (p: Product, qty: number, variant: string | null) => void
  setQty: (productId: number, variant: string | null, qty: number) => void
  remove: (productId: number, variant: string | null) => void
  clear: () => void
  setPromo: (code: string | null) => void
}

const keyOf = (productId: number, variant: string | null) => `${productId}|${variant ?? ''}`

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      lines: [],
      promoCode: null,
      add: (p, qty, variant) =>
        set((s) => {
          const k = keyOf(p.id, variant)
          const existing = s.lines.find((l) => keyOf(l.productId, l.variant) === k)
          if (existing) {
            return {
              lines: s.lines.map((l) =>
                keyOf(l.productId, l.variant) === k ? { ...l, qty: Math.min(l.qty + qty, p.stock || 999) } : l,
              ),
            }
          }
          return {
            lines: [
              ...s.lines,
              {
                productId: p.id,
                slug: p.slug,
                name_ar: p.name_ar,
                name_en: p.name_en,
                image: p.images?.[0] ?? null,
                price: p.price,
                stock: p.stock,
                qty: Math.min(qty, Math.max(1, p.stock || 1)),
                variant,
              },
            ],
          }
        }),
      setQty: (productId, variant, qty) =>
        set((s) => {
          const k = keyOf(productId, variant)
          if (qty <= 0) {
            return { lines: s.lines.filter((l) => keyOf(l.productId, l.variant) !== k) }
          }
          return {
            lines: s.lines.map((l) =>
              keyOf(l.productId, l.variant) === k ? { ...l, qty: Math.min(qty, l.stock || 999) } : l,
            ),
          }
        }),
      remove: (productId, variant) =>
        set((s) => ({ lines: s.lines.filter((l) => keyOf(l.productId, l.variant) !== keyOf(productId, variant)) })),
      clear: () => set({ lines: [], promoCode: null }),
      setPromo: (promoCode) => set({ promoCode }),
    }),
    {
      name: 'nexshop-cart',
      storage: createJSONStorage(() => persistStorage),
    },
  ),
)

export const cartCount = (s: CartState) => s.lines.reduce((n, l) => n + l.qty, 0)
export const cartSubtotal = (s: CartState) => s.lines.reduce((n, l) => n + l.price * l.qty, 0)
