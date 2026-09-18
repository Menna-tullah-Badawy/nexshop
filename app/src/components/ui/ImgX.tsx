import React from 'react'
import { View, type StyleProp, type ImageStyle } from 'react-native'
import { Image } from 'expo-image'
import { useTheme } from '../../theme/ThemeContext'
import { mediaUrl } from '../../lib/api'

export function ImgX({ uri, style }: { uri: string | null | undefined; style?: StyleProp<ImageStyle> }) {
  const { colors } = useTheme()
  const resolved = mediaUrl(uri)
  if (!resolved) {
    return <View style={[{ backgroundColor: colors.surfaceAlt }, style]} />
  }
  return (
    <Image
      source={{ uri: resolved }}
      style={[{ backgroundColor: colors.surfaceAlt }, style]}
      contentFit="cover"
      transition={120}
    />
  )
}
