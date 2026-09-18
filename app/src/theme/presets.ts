// Design presets — one codebase, many looks.
// The store owner picks a preset + accent color from Admin → Settings.

export type ThemeName = 'aurora' | 'minimal' | 'lux' | 'vibrant' | 'marketplace'

export interface Colors {
  background: string
  surface: string
  surfaceAlt: string
  text: string
  textMuted: string
  primary: string
  onPrimary: string
  primarySoft: string
  secondary: string
  border: string
  success: string
  warning: string
  danger: string
  gradient: [string, string]
}

export interface PresetDef {
  light: Colors
  dark: Colors
  radius: number
  label: { ar: string; en: string }
}

export const PRESETS: Record<ThemeName, PresetDef> = {
  aurora: {
    radius: 16,
    label: { ar: 'أورورا', en: 'Aurora' },
    light: {
      background: '#F6F5FB', surface: '#FFFFFF', surfaceAlt: '#EFEDF7',
      text: '#17151F', textMuted: '#6E6A7E', primary: '#6C4DF6', onPrimary: '#FFFFFF',
      primarySoft: '#EDE8FE', secondary: '#FF7A59', border: '#E4E1EF',
      success: '#16A34A', warning: '#D97706', danger: '#DC2626',
      gradient: ['#6C4DF6', '#9F7BFF'],
    },
    dark: {
      background: '#0F0D17', surface: '#191624', surfaceAlt: '#221E31',
      text: '#F4F2FA', textMuted: '#9B95AF', primary: '#8B6CFF', onPrimary: '#FFFFFF',
      primarySoft: '#2A2342', secondary: '#FF8A68', border: '#2B2640',
      success: '#34D399', warning: '#FBBF24', danger: '#F87171',
      gradient: ['#8B6CFF', '#5A3ECF'],
    },
  },
  minimal: {
    radius: 10,
    label: { ar: 'مينيمال', en: 'Minimal' },
    light: {
      background: '#FFFFFF', surface: '#FFFFFF', surfaceAlt: '#F4F4F5',
      text: '#111113', textMuted: '#71717A', primary: '#111113', onPrimary: '#FFFFFF',
      primarySoft: '#ECECEC', secondary: '#52525B', border: '#E4E4E7',
      success: '#16A34A', warning: '#D97706', danger: '#DC2626',
      gradient: ['#111113', '#3F3F46'],
    },
    dark: {
      background: '#0A0A0B', surface: '#131315', surfaceAlt: '#1C1C1F',
      text: '#FAFAFA', textMuted: '#A1A1AA', primary: '#FAFAFA', onPrimary: '#111113',
      primarySoft: '#26262A', secondary: '#D4D4D8', border: '#26262A',
      success: '#34D399', warning: '#FBBF24', danger: '#F87171',
      gradient: ['#FAFAFA', '#A1A1AA'],
    },
  },
  lux: {
    radius: 8,
    label: { ar: 'فاخر', en: 'Lux' },
    light: {
      background: '#FAF7F0', surface: '#FFFFFF', surfaceAlt: '#F1EBDD',
      text: '#1A1712', textMuted: '#8A8272', primary: '#B8860B', onPrimary: '#FFFFFF',
      primarySoft: '#F3E9CF', secondary: '#3E362A', border: '#E7DFCC',
      success: '#16A34A', warning: '#D97706', danger: '#DC2626',
      gradient: ['#B8860B', '#D4AF37'],
    },
    dark: {
      background: '#0B0B0F', surface: '#14141B', surfaceAlt: '#1D1D27',
      text: '#F5F1E8', textMuted: '#9C9484', primary: '#D4AF37', onPrimary: '#14141B',
      primarySoft: '#2A2618', secondary: '#E8DCC0', border: '#26242F',
      success: '#34D399', warning: '#FBBF24', danger: '#F87171',
      gradient: ['#D4AF37', '#8C6B1F'],
    },
  },
  vibrant: {
    radius: 20,
    label: { ar: 'حيوي', en: 'Vibrant' },
    light: {
      background: '#FFF7F2', surface: '#FFFFFF', surfaceAlt: '#FFEDE3',
      text: '#23120D', textMuted: '#8C6F64', primary: '#FF4D2E', onPrimary: '#FFFFFF',
      primarySoft: '#FFE0D6', secondary: '#00C2A8', border: '#FFD9C9',
      success: '#16A34A', warning: '#D97706', danger: '#DC2626',
      gradient: ['#FF4D2E', '#FF9A3D'],
    },
    dark: {
      background: '#14090B', surface: '#1F1013', surfaceAlt: '#2B1518',
      text: '#FFF1EC', textMuted: '#B08D83', primary: '#FF6B4A', onPrimary: '#FFFFFF',
      primarySoft: '#3A1B16', secondary: '#2EE6C9', border: '#33201F',
      success: '#34D399', warning: '#FBBF24', danger: '#F87171',
      gradient: ['#FF6B4A', '#FFB25C'],
    },
  },
  marketplace: {
    radius: 8,
    label: { ar: 'ماركت', en: 'Marketplace' },
    light: {
      background: '#F5F6F8', surface: '#FFFFFF', surfaceAlt: '#E8EBF0',
      text: '#0F1C2E', textMuted: '#5B6B7F', primary: '#FF9900', onPrimary: '#0F1C2E',
      primarySoft: '#FFF1D6', secondary: '#232F3E', border: '#D9DEE6',
      success: '#16A34A', warning: '#D97706', danger: '#DC2626',
      gradient: ['#FF9900', '#FFB84D'],
    },
    dark: {
      background: '#0E1116', surface: '#171C24', surfaceAlt: '#202734',
      text: '#EDF1F7', textMuted: '#8B99AC', primary: '#FFB020', onPrimary: '#0E1116',
      primarySoft: '#33290F', secondary: '#C7D2E0', border: '#28303D',
      success: '#34D399', warning: '#FBBF24', danger: '#F87171',
      gradient: ['#FFB020', '#FF8A00'],
    },
  },
}

export const THEME_NAMES = Object.keys(PRESETS) as ThemeName[]

export function resolveColors(
  preset: ThemeName,
  mode: 'light' | 'dark',
  primaryOverride?: string | null,
): { colors: Colors; radius: number } {
  const def = PRESETS[preset] ?? PRESETS.aurora
  const base = mode === 'dark' ? def.dark : def.light
  if (primaryOverride && /^#[0-9a-fA-F]{6}$/.test(primaryOverride)) {
    const isDark = mode === 'dark'
    return {
      colors: {
        ...base,
        primary: primaryOverride,
        onPrimary: isDark ? '#FFFFFF' : luminance(primaryOverride) > 0.6 ? '#111113' : '#FFFFFF',
        primarySoft: mix(primaryOverride, isDark ? '#000000' : '#FFFFFF', 0.82),
        gradient: [primaryOverride, mix(primaryOverride, '#000000', 0.15)],
      },
      radius: def.radius,
    }
  }
  return { colors: base, radius: def.radius }
}

function luminance(hex: string): number {
  const h = hex.replace('#', '')
  const r = parseInt(h.slice(0, 2), 16) / 255
  const g = parseInt(h.slice(2, 4), 16) / 255
  const b = parseInt(h.slice(4, 6), 16) / 255
  return 0.299 * r + 0.587 * g + 0.114 * b
}

function mix(hex: string, other: string, t: number): string {
  const p = (s: string) => [0, 2, 4].map((i) => parseInt(s.replace('#', '').slice(i, i + 2), 16))
  const a = p(hex)
  const b = p(other)
  const c = a.map((v, i) => Math.round(v + (b[i] - v) * t))
  return `#${c.map((v) => v.toString(16).padStart(2, '0')).join('')}`
}
