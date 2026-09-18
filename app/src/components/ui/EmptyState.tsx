import React from 'react'
import { Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '../../theme/ThemeContext'

export function EmptyState({ icon = 'cube-outline', title, subtitle }: { icon?: string; title: string; subtitle?: string }) {
  const { colors } = useTheme()
  return (
    <View style={{ alignItems: 'center', paddingVertical: 48, gap: 8 }}>
      <Ionicons name={icon as never} size={44} color={colors.textMuted} />
      <Text style={{ color: colors.text, fontSize: 16, fontWeight: '700' }}>{title}</Text>
      {subtitle ? <Text style={{ color: colors.textMuted, fontSize: 13 }}>{subtitle}</Text> : null}
    </View>
  )
}

export function Spinner({ label }: { label?: string }) {
  const { colors } = useTheme()
  return (
    <View style={{ paddingVertical: 32, alignItems: 'center', gap: 10 }}>
      <View style={{ width: 28, height: 28, borderWidth: 3, borderColor: colors.border, borderTopColor: colors.primary, borderRadius: 999 }} />
      {label ? <Text style={{ color: colors.textMuted, fontSize: 13 }}>{label}</Text> : null}
    </View>
  )
}
