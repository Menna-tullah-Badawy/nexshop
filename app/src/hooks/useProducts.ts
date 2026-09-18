import { useCallback, useEffect, useState } from 'react'
import { api } from '../lib/api'
import type { Product, ProductPage } from '../lib/types'

export interface ProductsQuery {
  q?: string
  category?: string
  sort?: string
  minPrice?: number
  maxPrice?: number
}

export function useProducts(query: ProductsQuery) {
  const [data, setData] = useState<ProductPage | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)

  const load = useCallback(
    (reset: boolean) => {
      const p = new URLSearchParams({ page: '1', limit: '24', sort: query.sort ?? 'newest' })
      if (query.q) p.set('q', query.q)
      if (query.category) p.set('category', query.category)
      if (query.minPrice !== undefined) p.set('min_price', String(query.minPrice))
      if (query.maxPrice !== undefined) p.set('max_price', String(query.maxPrice))
      setLoading(true)
      api<ProductPage>(`/products?${p.toString()}`)
        .then((d) => setData(d))
        .catch(() => setData(null))
        .finally(() => setLoading(false))
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [query.q, query.category, query.sort, query.minPrice, query.maxPrice],
  )

  useEffect(() => {
    setPage(1)
    load(true)
  }, [load])

  const loadMore = () => {
    if (!data || page >= data.pages) return
    const next = page + 1
    const p = new URLSearchParams({ page: String(next), limit: '24', sort: query.sort ?? 'newest' })
    if (query.q) p.set('q', query.q)
    if (query.category) p.set('category', query.category)
    api<ProductPage>(`/products?${p.toString()}`)
      .then((d) => {
        setData((prev) => (prev ? { ...prev, items: [...prev.items, ...d.items] } : d))
        setPage(next)
      })
      .catch(() => undefined)
  }

  return { data, loading, loadMore, reload: () => load(true) }
}

export function useDebounced<T>(value: T, ms = 400): T {
  const [v, setV] = useState(value)
  useEffect(() => {
    const id = setTimeout(() => setV(value), ms)
    return () => clearTimeout(id)
  }, [value, ms])
  return v
}

export function useFeatured(): Product[] {
  const [items, setItems] = useState<Product[]>([])
  useEffect(() => {
    api<ProductPage>('/products?sort=featured&limit=10')
      .then((d) => setItems(d.items.filter((p) => p.is_featured)))
      .catch(() => undefined)
  }, [])
  return items
}
