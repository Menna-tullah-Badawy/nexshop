import React, { createContext, useContext, useMemo } from 'react'
import { useColorScheme, type StyleProp, type ViewStyle } from 'react-native'
import { useUiStore } from '../store/ui'
import { resolveColors, type Colors } from './presets'

interface ThemeValue {
  colors: Colors
  radius: number
  isDark: boolean
  preset: string
  gradient: [string, string]
  // handy style helpers
  card: StyleProp<ViewStyle>
  divider: StyleProp<ViewStyle>
}

const Ctx = createContext<ThemeValue | null>(null)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const system = useColorScheme()
  const preset = useUiStore((s) => s.themePreset)
  const mode = useUiStore((s) => s.themeMode)
  const primaryOverride = useUiStore((s) => s.primaryOverride)
  const brand = useUiStore((s) => s.brand)

  const value = useMemo<ThemeValue>(() => {
    const effectiveMode: 'light' | 'dark' =
      mode === 'system' ? (system === 'dark' ? 'dark' : 'light') : mode
    const { colors, radius } = resolveColors(preset, effectiveMode, primaryOverride || brand?.primary_color || null)
    return {
      colors,
      radius,
      isDark: effectiveMode === 'dark',
      preset,
      gradient: colors.gradient,
      card: {
        backgroundColor: colors.surface,
        borderRadius: radius,
        borderWidth: 1,
        borderColor: colors.border,
        padding: 14,
      },
      divider: { height: 1, backgroundColor: colors.border },
    }
  }, [preset, mode, system, primaryOverride, brand?.primary_color])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useTheme(): ThemeValue {
  const v = useContext(Ctx)
  if (!v) throw new Error('useTheme must be used within ThemeProvider')
  return v
}
