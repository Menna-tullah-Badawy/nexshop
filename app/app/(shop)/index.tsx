import React, { useEffect, useState } from 'react'
import { FlatList, Pressable, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Link, router } from 'expo-router'
import { Screen } from '../../src/components/ui/Screen'
import { Chip } from '../../src/components/ui/Badge'
import { EmptyState, Spinner } from '../../src/components/ui/EmptyState'
import { ProductCard } from '../../src/components/ProductCard'
import { StoreHeader } from '../../src/components/StoreHeader'
import { ImgX } from '../../src/components/ui/ImgX'
import { useTheme } from '../../src/theme/ThemeContext'
import { useUiStore } from '../../src/store/ui'
import { api } from '../../src/lib/api'
import type { Category } from '../../src/lib/types'
import { useDebounced, useFeatured, useProducts } from '../../src/hooks/useProducts'
import { t } from '../../src/i18n'

function SearchBar({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const { colors, radius } = useTheme()
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radius,
        paddingHorizontal: 14,
        marginVertical: 10,
      }}
    >
      <Ionicons name="search" size={17} color={colors.textMuted} />
      <View style={{ flex: 1 }}>
        <View>
          {/* plain input */}
          <TextInputLike value={value} onChange={onChange} placeholder={t('app.search')} colors={colors} />
        </View>
      </View>
    </View>
  )
}

import { TextInput } from 'react-native'
function TextInputLike({
  value,
  onChange,
  placeholder,
  colors,
}: {
  value: string
  onChange: (v: string) => void
  placeholder: string
  colors: { text: string; textMuted: string }
}) {
  return (
    <TextInput
      value={value}
      onChangeText={onChange}
      placeholder={placeholder}
      placeholderTextColor={colors.textMuted}
      style={{ color: colors.text, fontSize: 14, padding: 0 }}
    />
  )
}

function CategoryRow({ cats, active, onSelect }: { cats: Category[]; active: string | null; onSelect: (slug: string) => void }) {
  const { colors, radius } = useTheme()
  const lang = useUiStore((s) => s.lang)
  return (
    <FlatList
      horizontal
      showsHorizontalScrollIndicator={false}
      data={cats}
      keyExtractor={(c) => String(c.id)}
      contentContainerStyle={{ gap: 10, paddingVertical: 6 }}
      renderItem={({ item }) => {
        const name = lang === 'ar' ? item.name_ar : item.name_en
        const isActive = active === item.slug
        return (
          <Pressable
            onPress={() => onSelect(item.slug)}
            style={{
              alignItems: 'center',
              gap: 6,
              padding: isActive ? 10 : 4,
              borderRadius: radius,
              backgroundColor: isActive ? colors.primarySoft : 'transparent',
            }}
          >
            <ImgX
              uri={item.image_url}
              style={{ width: 64, height: 64, borderRadius: 32, borderWidth: isActive ? 2 : 0, borderColor: colors.primary }}
            />
            <Text style={{ color: isActive ? colors.primary : colors.text, fontSize: 11, fontWeight: '600', maxWidth: 70 }} numberOfLines={1}>
              {name}
            </Text>
          </Pressable>
        )
      }}
    />
  )
}

export default function Home() {
  const { colors, radius } = useTheme()
  const lang = useUiStore((s) => s.lang)
  const brand = useUiStore((s) => s.brand)
  const [q, setQ] = useState('')
  const dq = useDebounced(q, 400)
  const [sort, setSort] = useState('newest')
  const [cat, setCat] = useState<string | null>(null)
  const [cats, setCats] = useState<Category[]>([])
  const featured = useFeatured()
  const { data, loading, loadMore } = useProducts({ q: dq || undefined, category: cat ?? undefined, sort })

  useEffect(() => {
    api<Category[]>(`/categories?lang=${lang}`)
      .then(setCats)
      .catch(() => undefined)
  }, [lang])

  const announcement = brand?.announcement?.[lang] || ''

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
            <StoreHeader />
            <SearchBar value={q} onChange={setQ} />
            {announcement ? (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                  backgroundColor: colors.primarySoft,
                  borderRadius: radius,
                  padding: 12,
                }}
              >
                <Ionicons name="megaphone" size={16} color={colors.primary} />
                <Text style={{ color: colors.text, fontSize: 12, fontWeight: '600', flex: 1 }} numberOfLines={2}>
                  {announcement}
                </Text>
              </View>
            ) : null}

            {!dq ? (
              <>
                <CategoryRow
                  cats={cats}
                  active={cat}
                  onSelect={(slug) => {
                    setCat(slug === cat ? null : slug)
                  }}
                />
                {featured.length > 0 ? (
                  <>
                    <Text style={{ color: colors.text, fontSize: 17, fontWeight: '800', marginVertical: 10 }}>
                      {t('app.featured')}
                    </Text>
                    <FlatList
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      data={featured}
                      keyExtractor={(p) => String(p.id)}
                      contentContainerStyle={{ gap: 12, paddingVertical: 4 }}
                      renderItem={({ item }) => (
                        <View style={{ width: 150 }}>
                          <ProductCard p={item} compact />
                        </View>
                      )}
                    />
                  </>
                ) : null}
              </>
            ) : null}

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginVertical: 10, flexWrap: 'wrap' }}>
              <Text style={{ color: colors.textMuted, fontSize: 12, marginRight: 6, fontWeight: '600' }}>{t('app.sortBy')}</Text>
              <Chip label={t('app.newest')} active={sort === 'newest'} onPress={() => setSort('newest')} />
              <Chip label={t('app.priceAsc')} active={sort === 'price_asc'} onPress={() => setSort('price_asc')} />
              <Chip label={t('app.priceDesc')} active={sort === 'price_desc'} onPress={() => setSort('price_desc')} />
              {dq ? (
                <Chip label={t('app.searchResults')} active onPress={() => setQ('')} />
              ) : null}
            </View>
          </>
        }
        ListEmptyComponent={
          loading ? <Spinner /> : <EmptyState icon="search-outline" title={t('app.noProducts')} />
        }
        ListFooterComponent={
          <View style={{ paddingVertical: 24, alignItems: 'center', gap: 8 }}>
            <View style={{ flexDirection: 'row', gap: 18 }}>
              <Link href="/privacy">
                <Text style={{ color: colors.textMuted, fontSize: 12 }}>{t('app.privacy')}</Text>
              </Link>
              <Link href="/terms">
                <Text style={{ color: colors.textMuted, fontSize: 12 }}>{t('app.terms')}</Text>
              </Link>
            </View>
            <Text style={{ color: colors.textMuted, fontSize: 11 }}>
              © {new Date().getFullYear()} {brand?.store_name ?? 'Store'}
            </Text>
          </View>
        }
      />
    </Screen>
  )
}
