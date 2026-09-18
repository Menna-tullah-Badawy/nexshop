import React from 'react'
import { ScrollView, View, type StyleProp, type ViewStyle } from 'react-native'
import { useTheme } from '../../theme/ThemeContext'

export function Screen({ children, style, scroll = false, pad = 16 }: {
  children: React.ReactNode
  style?: StyleProp<ViewStyle>
  scroll?: boolean
  pad?: number
}) {
  const { colors } = useTheme()
  if (scroll) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, ...style }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, padding: pad }}>{children}</ScrollView>
      </View>
    )
  }
  return (
    <View style={{ flex: 1, backgroundColor: colors.background, padding: pad ? pad : 0, ...style }}>
      {children}
    </View>
  )
}
