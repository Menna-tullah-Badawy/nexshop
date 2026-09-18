import React from 'react'
import { Text, View } from 'react-native'
import { Link } from 'expo-router'
import { Screen } from '../src/components/ui/Screen'
import { useTheme } from '../src/theme/ThemeContext'

export default function NotFound() {
  const { colors } = useTheme()
  return (
    <Screen>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10 }}>
        <Text style={{ color: colors.text, fontSize: 44, fontWeight: '800' }}>404</Text>
        <Text style={{ color: colors.textMuted, fontSize: 14 }}>Page not found</Text>
        <Link href="/" style={{ color: colors.primary, fontWeight: '700' }}>
          <Text>Go home</Text>
        </Link>
      </View>
    </Screen>
  )
}
