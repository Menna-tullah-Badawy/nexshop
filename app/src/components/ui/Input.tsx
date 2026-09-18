import React from 'react'
import { Text, TextInput, View, type StyleProp, type TextInputProps, type ViewStyle } from 'react-native'
import { useTheme } from '../../theme/ThemeContext'

export function Input({
  label,
  error,
  style,
  ...rest
}: TextInputProps & { label?: string; error?: string; style?: StyleProp<ViewStyle> }) {
  const { colors, radius } = useTheme()
  return (
    <View style={{ marginBottom: 12, ...style }}>
      {label ? (
        <Text style={{ color: colors.textMuted, fontSize: 13, marginBottom: 6, fontWeight: '600' }}>{label}</Text>
      ) : null}
      <TextInput
        placeholderTextColor={colors.textMuted}
        style={{
          backgroundColor: colors.surface,
          color: colors.text,
          borderWidth: 1,
          borderColor: error ? colors.danger : colors.border,
          borderRadius: radius,
          paddingHorizontal: 14,
          paddingVertical: 12,
          fontSize: 15,
        }}
        {...rest}
      />
      {error ? <Text style={{ color: colors.danger, fontSize: 12, marginTop: 4 }}>{error}</Text> : null}
    </View>
  )
}

export function TextArea(props: TextInputProps & { label?: string }) {
  return <Input {...props} multiline numberOfLines={4} textAlignVertical="top" />
}
