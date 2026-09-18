import React from 'react'
import { Redirect, Stack } from 'expo-router'
import { Text, View } from 'react-native'
import { useAuthStore } from '../../src/store/auth'
import { useTheme } from '../../src/theme/ThemeContext'
import { t } from '../../src/i18n'

export default function AdminLayout() {
  const user = useAuthStore((s) => s.user)
  const { colors } = useTheme()

  if (!user) return <Redirect href="/login" />
  if (user.role !== 'admin') {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
        <Text style={{ color: colors.danger, fontSize: 16, fontWeight: '700', textAlign: 'center' }}>{t('app.noAccess')}</Text>
      </View>
    )
  }

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: 'transparent' } }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="products" />
      <Stack.Screen name="product-form" />
      <Stack.Screen name="categories" />
      <Stack.Screen name="orders" />
      <Stack.Screen name="orders-detail" />
      <Stack.Screen name="delivery" />
      <Stack.Screen name="customers" />
      <Stack.Screen name="promos" />
      <Stack.Screen name="reports" />
      <Stack.Screen name="settings" />
    </Stack>
  )
}
