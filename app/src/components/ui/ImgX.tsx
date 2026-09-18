import React from 'react'
import { View, type StyleProp, type ImageStyle } from 'react-native'
import { Image } from 'expo-image'
import { useTheme } from '../../theme/ThemeContext'

export function ImgX({ uri, style }: { uri: string | null | undefined; style?: StyleProp<ImageStyle> }) {
  const { colors } = useTheme()
  if (!uri) {
    return <View style={[{ backgroundColor: colors.surfaceAlt }, style]} />
  }
  return (
    <Image
      source={{ uri }}
      style={[{ backgroundColor: colors.surfaceAlt }, style]}
      contentFit="cover"
      transition={120}
    />
  )
}
