import React, { useEffect, useState } from 'react'
import { FlatList, Pressable, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { Screen } from '../../../src/components/ui/Screen'
import { ImgX } from '../../../src/components/ui/ImgX'
import { EmptyState, Spinner } from '../../../src/components/ui/EmptyState'
import { useTheme } from '../../../src/theme/ThemeContext'
import { useUiStore } from '../../../src/store/ui'
import { api } from '../../../src/lib/api'
import type { Category } from '../../../src/lib/types'
import { t } from '../../../src/i18n'

export default function Categories() {
  const { colors, radius } = useTheme()
  const lang = useUiStore((s) => s.lang)
  const [cats, setCats] = useState<Category[] | null>(null)

  useEffect(() => {
    api<Category[]>(`/categories?lang=${lang}`)
      .then(setCats)
      .catch(() => setCats([]))
  }, [lang])

  return (
    <Screen pad={0}>
      <View style={{ padding: 16, paddingBottom: 8 }}>
        <Text style={{ color: colors.text, fontSize: 22, fontWeight: '800' }}>{t('app.categories')}</Text>
      </View>
      {cats === null ? (
        <Spinner />
      ) : (
        <FlatList
          data={cats}
          keyExtractor={(c) => String(c.id)}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          renderItem={({ item }) => {
            const name = lang === 'ar' ? item.name_ar : item.name_en
            return (
              <Pressable
                onPress={() => router.push(`/categories/${item.slug}`)}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  backgroundColor: colors.surface,
                  borderRadius: radius,
                  borderWidth: 1,
                  borderColor: colors.border,
                  padding: 12,
                  opacity: pressed ? 0.85 : 1,
                })}
              >
                <ImgX uri={item.image_url} style={{ width: 56, height: 56, borderRadius: radius - 4 }} />
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.text, fontSize: 15, fontWeight: '700' }}>{name}</Text>
                  <Text style={{ color: colors.textMuted, fontSize: 12 }} numberOfLines={1}>
                    {item.name_en}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} style={{ transform: [{ scaleX: lang === 'ar' ? -1 : 1 }] }} />
              </Pressable>
            )
          }}
        />
      )}
    </Screen>
  )
}
