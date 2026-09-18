import React from 'react'
import { ActivityIndicator, Pressable, Text, type StyleProp, type ViewStyle } from 'react-native'
import { useTheme } from '../../theme/ThemeContext'

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'

export function Button({
  label,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  small = false,
  style,
  icon,
}: {
  label: string
  onPress: () => void
  variant?: Variant
  loading?: boolean
  disabled?: boolean
  small?: boolean
  style?: StyleProp<ViewStyle>
  icon?: React.ReactNode
}) {
  const { colors, radius } = useTheme()
  const bg =
    variant === 'primary' ? colors.primary :
    variant === 'secondary' ? colors.secondary :
    variant === 'danger' ? colors.danger :
    'transparent'
  const fg =
    variant === 'primary' ? colors.onPrimary :
    variant === 'secondary' ? '#FFFFFF' :
    variant === 'danger' ? '#FFFFFF' :
    colors.primary
  const border = variant === 'outline' ? { borderWidth: 1.5, borderColor: colors.primary } : {}
  const isDisabled = disabled || loading

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          backgroundColor: bg,
          borderRadius: radius,
          paddingVertical: small ? 8 : 14,
          paddingHorizontal: small ? 14 : 20,
          opacity: isDisabled ? 0.5 : pressed ? 0.85 : 1,
        },
        border,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <>
          {icon}
          <Text
            style={{
              color: fg,
              fontWeight: '700',
              fontSize: small ? 13 : 15,
              textAlign: 'center',
            }}
            numberOfLines={1}
          >
            {label}
          </Text>
        </>
      )}
    </Pressable>
  )
}
