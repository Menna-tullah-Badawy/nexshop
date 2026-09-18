import type { Brand } from './types'

export function symbolMap(brand: Brand | null): Record<string, string> {
  const m: Record<string, string> = {}
  brand?.currencies.forEach((c) => (m[c.code] = c.symbol || c.code))
  return m
}

export function fmtMoney(amount: number, code: string, lang: string, symbols: Record<string, string>): string {
  const sym = symbols[code] ?? code
  const n = new Intl.NumberFormat(lang === 'ar' ? 'ar-EG-u-nu-latn' : 'en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)
  return lang === 'ar' ? `${n} ${sym}` : `${sym} ${n}`
}

export function fmtDate(iso: string | null | undefined, lang: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  try {
    return new Intl.DateTimeFormat(lang === 'ar' ? 'ar-EG-u-nu-latn' : 'en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(d)
  } catch {
    return d.toLocaleString()
  }
}

export function shortDate(iso: string | null | undefined, lang: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  try {
    return new Intl.DateTimeFormat(lang === 'ar' ? 'ar-EG-u-nu-latn' : 'en-US', {
      day: 'numeric',
      month: 'short',
    }).format(d)
  } catch {
    return d.toISOString().slice(0, 10)
  }
}
