import React from 'react'
import { Pressable, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '../theme/ThemeContext'

export function RatingStars({
  value,
  size = 16,
  onSelect,
  count,
}: {
  value: number
  size?: number
  onSelect?: (v: number) => void
  count?: number
}) {
  const { colors } = useTheme()
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      <View style={{ flexDirection: 'row', gap: 2 }}>
        {[1, 2, 3, 4, 5].map((i) =>
          onSelect ? (
            <Pressable key={i} onPress={() => onSelect(i)} hitSlop={4}>
              <Ionicons
                name={i <= Math.round(value) ? 'star' : 'star-outline'}
                size={size + 4}
                color={i <= Math.round(value) ? colors.warning : colors.textMuted}
              />
            </Pressable>
          ) : (
            <Ionicons
              key={i}
              name={i <= Math.round(value) ? 'star' : 'star-outline'}
              size={size}
              color={i <= Math.round(value) ? colors.warning : colors.textMuted}
            />
          ),
        )}
      </View>
      {count !== undefined ? (
        <Text style={{ color: colors.textMuted, fontSize: 12 }}>({count})</Text>
      ) : null}
    </View>
  )
}
