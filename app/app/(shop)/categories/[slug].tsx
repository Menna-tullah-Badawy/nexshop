import React, { useEffect, useState } from 'react'
import { FlatList, Pressable, Text, View } from 'react-native'
import { useLocalSearchParams, router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { Screen } from '../../../src/components/ui/Screen'
import { Chip } from '../../../src/components/ui/Badge'
import { EmptyState, Spinner } from '../../../src/components/ui/EmptyState'
import { ProductCard } from '../../../src/components/ProductCard'
import { useTheme } from '../../../src/theme/ThemeContext'
import { useUiStore } from '../../../src/store/ui'
import { api } from '../../../src/lib/api'
import type { Category } from '../../../src/lib/types'
import { useProducts } from '../../../src/hooks/useProducts'
import { t } from '../../../src/i18n'

function BackButton() {
  const { colors } = useTheme()
  const lang = useUiStore((s) => s.lang)
  return (
    <Pressable
      onPress={() => router.back()}
      hitSlop={6}
      style={{
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: colors.surfaceAlt,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Ionicons
        name="arrow-back"
        size={18}
        color={colors.text}
        style={{ transform: [{ rotate: lang === 'ar' ? '180deg' : '0deg' }] }}
      />
    </Pressable>
  )
}

export default function CategoryDetail() {
  const { slug } = useLocalSearchParams<{ slug: string }>()
  const { colors } = useTheme()
  const lang = useUiStore((s) => s.lang)
  const [cat, setCat] = useState<Category | null>(null)
  const [sort, setSort] = useState('newest')
  const { data, loading, loadMore } = useProducts({ category: slug, sort })

  useEffect(() => {
    api<Category[]>(`/categories?lang=${lang}`)
      .then((cs) => setCat(cs.find((c) => c.slug === slug) ?? null))
      .catch(() => undefined)
  }, [slug, lang])

  const name = cat ? (lang === 'ar' ? cat.name_ar : cat.name_en) : t('app.categories')

  return (
    <Screen pad={0}>
      <FlatList
        data={data?.items ?? []}
        numColumns={2}
        keyExtractor={(p) => String(p.id)}
        contentContainerStyle={{ padding: 16, paddingBottom: 28 }}
        renderItem={({ item }) => <ProductCard p={item} />}
        onEndReached={loadMore}
        onEndReachedThreshold={0.4}
        ListHeaderComponent={
          <>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <BackButton />
              <Text style={{ color: colors.text, fontSize: 22, fontWeight: '800', flex: 1 }}>{name}</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 4, marginBottom: 8, flexWrap: 'wrap' }}>
              <Chip label={t('app.newest')} active={sort === 'newest'} onPress={() => setSort('newest')} />
              <Chip label={t('app.priceAsc')} active={sort === 'price_asc'} onPress={() => setSort('price_asc')} />
              <Chip label={t('app.priceDesc')} active={sort === 'price_desc'} onPress={() => setSort('price_desc')} />
            </View>
          </>
        }
        ListEmptyComponent={loading ? <Spinner /> : <EmptyState icon="albums-outline" title={t('app.noProducts')} />}
      />
    </Screen>
  )
}
