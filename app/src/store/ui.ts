import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { persistStorage } from '../lib/storage'
import { api } from '../lib/api'
import type { Brand } from '../lib/types'
import { PRESETS, THEME_NAMES, type ThemeName } from '../theme/presets'
import { useAuthStore } from './auth'

type Mode = 'system' | 'light' | 'dark'

interface UiState {
  lang: 'ar' | 'en'
  themePreset: ThemeName
  themeMode: Mode
  primaryOverride: string | null
  brand: Brand | null
  hydrated: boolean
  setLang: (l: 'ar' | 'en') => void
  setPreset: (p: ThemeName) => void
  setMode: (m: Mode) => void
  setPrimary: (c: string | null) => void
  loadBrand: (force?: boolean) => Promise<void>
}

const initialPreset = ((): ThemeName => {
  const env = process.env.EXPO_PUBLIC_THEME_PRESET as ThemeName | undefined
  return env && THEME_NAMES.includes(env) ? env : 'aurora'
})()

export const useUiStore = create<UiState>()(
  persist(
    (set, get) => ({
      lang: 'ar',
      themePreset: initialPreset,
      themeMode: 'system',
      primaryOverride: (process.env.EXPO_PUBLIC_PRIMARY_COLOR as string | undefined) ?? null,
      brand: null,
      hydrated: false,
      setLang: (lang) => set({ lang }),
      setPreset: (themePreset) => set({ themePreset }),
      setMode: (themeMode) => set({ themeMode }),
      setPrimary: (primaryOverride) => set({ primaryOverride }),
      loadBrand: async (force = false) => {
        if (get().brand && !force) return
        try {
          const brand = await api<Brand>('/meta/brand')
          set({
            brand,
            // server branding wins, but keep user's manual theme choice if they made one
            primaryOverride: brand.primary_color || get().primaryOverride,
          })
        } catch {
          // offline: fall back to build-time brand env values
          set({ brand: envBrand() })
        }
      },
    }),
    {
      name: 'nexshop-ui',
      storage: createJSONStorage(() => persistStorage),
      partialize: (s) => ({ lang: s.lang, themePreset: s.themePreset, themeMode: s.themeMode, primaryOverride: s.primaryOverride }),
      onRehydrateStorage: () => () => {
        useUiStore.setState({ hydrated: true })
      },
    },
  ),
)

function envBrand(): Brand {
  const cur = (process.env.EXPO_PUBLIC_BASE_CURRENCY as string | undefined) || 'EGP'
  return {
    store_name: process.env.EXPO_PUBLIC_STORE_NAME || 'NexShop',
    store_name_ar: process.env.EXPO_PUBLIC_STORE_NAME_AR || '',
    tagline: {
      ar: process.env.EXPO_PUBLIC_TAGLINE_AR || '',
      en: process.env.EXPO_PUBLIC_TAGLINE_EN || '',
    },
    logo_url: (process.env.EXPO_PUBLIC_LOGO_URL as string | undefined) || null,
    primary_color: process.env.EXPO_PUBLIC_PRIMARY_COLOR || '#6C4DF6',
    theme_preset: (process.env.EXPO_PUBLIC_THEME_PRESET as string | undefined) || 'aurora',
    dark_default: false,
    announcement: {
      ar: process.env.EXPO_PUBLIC_ANNOUNCEMENT_AR || '',
      en: process.env.EXPO_PUBLIC_ANNOUNCEMENT_EN || '',
    },
    base_currency: cur,
    currencies: [{ code: cur, rate: 1, name_ar: cur, name_en: cur, symbol: cur }],
    delivery: { enabled: true, free_delivery_above: 0, zones: [] },
    payments: { cod: true, stripe: true, demo: true },
    contact: { phone: null, email: null, address: null },
    social: {},
  }
}

/** The currency used to display prices. */
export function useDisplayCurrency(): string {
  const brand = useUiStore((s) => s.brand)
  const user = useAuthStore((s) => s.user)
  return user?.currency || brand?.base_currency || process.env.EXPO_PUBLIC_BASE_CURRENCY || 'EGP'
}

export { PRESETS, THEME_NAMES }
