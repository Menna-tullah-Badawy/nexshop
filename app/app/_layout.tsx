import '../src/i18n'
import React from 'react'
import { View } from 'react-native'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { ThemeProvider, useTheme } from '../src/theme/ThemeContext'
import AppProviders from '../src/providers/AppProviders'
import { ErrorBoundary } from '../src/components/ErrorBoundary'
import { OfflineBanner } from '../src/components/OfflineBanner'

function RootNavigator() {
  const { colors, isDark } = useTheme()
  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(shop)" />
        <Stack.Screen name="(admin)" />
      </Stack>
    </>
  )
}

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <AppProviders>
        <View style={{ flex: 1 }}>
          <OfflineBanner />
          <RootNavigator />
        </View>
      </AppProviders>
    </ErrorBoundary>
  )
}
