import React from 'react'
import { Pressable, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '../../theme/ThemeContext'

export function QtyStepper({
  qty,
  onChange,
  max = 99,
  small = false,
}: {
  qty: number
  onChange: (q: number) => void
  max?: number
  small?: boolean
}) {
  const { colors, radius } = useTheme()
  const size = small ? 28 : 36
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radius,
        backgroundColor: colors.surface,
      }}
    >
      <Pressable
        style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}
        onPress={() => onChange(Math.max(0, qty - 1))}
      >
        <Ionicons name="remove" size={16} color={colors.primary} />
      </Pressable>
      <Text style={{ minWidth: size, textAlign: 'center', color: colors.text, fontWeight: '700', fontSize: small ? 13 : 15 }}>
        {qty}
      </Text>
      <Pressable
        style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}
        onPress={() => onChange(Math.min(max, qty + 1))}
      >
        <Ionicons name="add" size={16} color={colors.primary} />
      </Pressable>
    </View>
  )
}
