import React, { useEffect } from 'react'
import { View } from 'react-native'
import { ThemeProvider, useTheme } from '../theme/ThemeContext'
import { useAuthStore } from '../store/auth'
import { useUiStore } from '../store/ui'
import { applyDirection } from '../i18n'

function Shell({ children }: { children: React.ReactNode }) {
  const { colors, isDark } = useTheme()
  const lang = useUiStore((s) => s.lang)
  const uiHydrated = useUiStore((s) => s.hydrated)
  const authHydrated = useAuthStore((s) => s.hydrated)
  const loadBrand = useUiStore((s) => s.loadBrand)

  useEffect(() => {
    applyDirection(lang)
  }, [lang])

  useEffect(() => {
    void useAuthStore.getState().hydrate()
    void loadBrand()
  }, [loadBrand])

  if (!uiHydrated || !authHydrated) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <View style={{ width: 34, height: 34, borderWidth: 3, borderColor: colors.border, borderTopColor: colors.primary, borderRadius: 999 }} />
      </View>
    )
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }} >
      {children}
    </View>
  )
}

export default function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <Shell>{children}</Shell>
    </ThemeProvider>
  )
}
