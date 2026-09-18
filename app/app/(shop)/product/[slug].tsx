import React, { useEffect, useMemo, useState } from 'react'
import { Alert, FlatList, Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { useLocalSearchParams, router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { Screen } from '../../../src/components/ui/Screen'
import { Button } from '../../../src/components/ui/Button'
import { Chip } from '../../../src/components/ui/Badge'
import { ImgX } from '../../../src/components/ui/ImgX'
import { Price } from '../../../src/components/ui/Price'
import { QtyStepper } from '../../../src/components/ui/QtyStepper'
import { RatingStars } from '../../../src/components/RatingStars'
import { Spinner } from '../../../src/components/ui/EmptyState'
import { useTheme } from '../../../src/theme/ThemeContext'
import { useUiStore } from '../../../src/store/ui'
import { useAuthStore } from '../../../src/store/auth'
import { useCartStore } from '../../../src/store/cart'
import { api } from '../../../src/lib/api'
import { fmtDate } from '../../../src/lib/format'
import type { Product, Review, Variant } from '../../../src/lib/types'
import { t } from '../../../src/i18n'

export default function ProductDetail() {
  const { slug } = useLocalSearchParams<{ slug: string }>()
  const { colors, radius } = useTheme()
  const lang = useUiStore((s) => s.lang)
  const user = useAuthStore((s) => s.user)
  const addToCart = useCartStore((s) => s.add)

  const [p, setP] = useState<Product | null>(null)
  const [reviews, setReviews] = useState<{ reviews: Review[]; rating_avg: number; count: number } | null>(null)
  const [qty, setQty] = useState(1)
  const [selec, setSelec] = useState<Record<string, string>>({})
  const [added, setAdded] = useState(false)
  const [reviewText, setReviewText] = useState('')
  const [reviewRating, setReviewRating] = useState(5)

  useEffect(() => {
    setP(null)
    setQty(1)
    api<Product>(`/products/${slug}`)
      .then((d) => {
        setP(d)
        if (d.variants?.length) {
          const init: Record<string, string> = {}
          d.variants.forEach((v: Variant) => (init[v.label] = v.values[0] ?? ''))
          setSelec(init)
        }
      })
      .catch(() => setP(null))
    api<{ reviews: Review[]; rating_avg: number; count: number }>(`/products/${slug}/reviews`)
      .then(setReviews)
      .catch(() => undefined)
  }, [slug])

  const variantLabel = useMemo(() => {
    if (!p?.variants?.length) return null
    return p.variants
      .filter((v) => selec[v.label])
      .map((v) => `${v.label}: ${selec[v.label]}`)
      .join(' · ')
  }, [p, selec])

  if (!p) return <Screen><Spinner /></Screen>

  const name = lang === 'ar' ? p.name_ar || p.name_en : p.name_en || p.name_ar
  const desc = lang === 'ar' ? p.desc_ar || p.desc_en : p.desc_en || p.desc_ar

  const doAdd = (buyNow: boolean) => {
    if (p.stock <= 0) return
    addToCart(p, qty, variantLabel)
    setAdded(true)
    setTimeout(() => setAdded(false), 1200)
    if (buyNow) router.push('/checkout')
  }

  const submitReview = async () => {
    if (!user) {
      router.push('/login')
      return
    }
    try {
      await api(`/products/${slug}/reviews`, {
        method: 'POST',
        body: { rating: reviewRating, text: reviewText || null },
      })
      setReviewText('')
      const d = await api<{ reviews: Review[]; rating_avg: number; count: number }>(`/products/${slug}/reviews`)
      setReviews(d)
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : '')
    }
  }

  return (
    <Screen pad={0}>
      <FlatList
        data={[0]}
        keyExtractor={() => 'x'}
        renderItem={() => (
          <View style={{ padding: 16, gap: 14 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
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
            </View>

            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={p.images}
              keyExtractor={(u, i) => `${u}-${i}`}
              renderItem={({ item }) => (
                <ImgX uri={item} style={{ width: 280, height: 280, borderRadius: radius }} />
              )}
              contentContainerStyle={{ gap: 10 }}
            />

            <View>
              {p.brand ? (
                <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 }}>
                  {p.brand}
                </Text>
              ) : null}
              <Text style={{ color: colors.text, fontSize: 20, fontWeight: '800', marginTop: 2 }}>{name}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 }}>
                <RatingStars value={p.rating_avg} count={p.review_count} />
                <View
                  style={{
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                    borderRadius: 999,
                    backgroundColor: p.stock > 0 ? 'rgba(22,163,74,0.12)' : 'rgba(220,38,38,0.12)',
                  }}
                >
                  <Text style={{ color: p.stock > 0 ? colors.success : colors.danger, fontSize: 11, fontWeight: '700' }}>
                    {p.stock > 0 ? `${t('app.inStock')} (${p.stock})` : t('app.outOfStock')}
                  </Text>
                </View>
              </View>
            </View>

            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: colors.surface,
                borderRadius: radius,
                borderWidth: 1,
                borderColor: colors.border,
                padding: 14,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View>
                  <Text style={{ color: colors.textMuted, fontSize: 11, marginBottom: 2 }}>{t('app.total')}</Text>
                  <Price amount={(p.sale_price ?? p.price) * qty} size={24} />
                </View>
                {p.sale_price != null ? <Price amount={p.price * qty} size={14} muted strike /> : null}
              </View>
              <QtyStepper qty={qty} onChange={setQty} max={Math.max(1, p.stock)} />
            </View>

            {p.variants?.map((v) => (
              <View key={v.label}>
                <Text style={{ color: colors.textMuted, fontSize: 13, fontWeight: '700', marginBottom: 8 }}>{v.label}</Text>
                <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                  {v.values.map((val) => (
                    <Chip key={val} label={val} active={selec[v.label] === val} onPress={() => setSelec({ ...selec, [v.label]: val })} />
                  ))}
                </View>
              </View>
            ))}

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Button
                label={added ? t('app.added') : t('app.add')}
                variant="outline"
                style={{ flex: 1 }}
                onPress={() => doAdd(false)}
                disabled={p.stock <= 0}
              />
              <Button label={t('app.buyNow')} style={{ flex: 1 }} onPress={() => doAdd(true)} disabled={p.stock <= 0} />
            </View>

            {desc ? (
              <View>
                <Text style={{ color: colors.text, fontSize: 16, fontWeight: '800', marginBottom: 6 }}>{t('app.description')}</Text>
                <Text style={{ color: colors.textMuted, fontSize: 14, lineHeight: 22 }}>{desc}</Text>
              </View>
            ) : null}

            <View>
              <Text style={{ color: colors.text, fontSize: 16, fontWeight: '800', marginBottom: 10 }}>{t('app.reviews')}</Text>
              <View style={{ gap: 10 }}>
                {(reviews?.reviews ?? []).map((r) => (
                  <View key={r.id} style={{ backgroundColor: colors.surface, borderRadius: radius, borderWidth: 1, borderColor: colors.border, padding: 12 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={{ color: colors.text, fontWeight: '700', fontSize: 13 }}>{r.user_name}</Text>
                      <Text style={{ color: colors.textMuted, fontSize: 11 }}>{fmtDate(r.created_at, lang)}</Text>
                    </View>
                    <RatingStars value={r.rating} size={12} />
                    {r.text ? <Text style={{ color: colors.textMuted, fontSize: 13, marginTop: 6, lineHeight: 19 }}>{r.text}</Text> : null}
                  </View>
                ))}
                {(reviews?.reviews ?? []).length === 0 ? (
                  <Text style={{ color: colors.textMuted, fontSize: 13 }}>{t('app.noReviews')}</Text>
                ) : null}
              </View>

              <View style={{ marginTop: 14, backgroundColor: colors.surface, borderRadius: radius, borderWidth: 1, borderColor: colors.border, padding: 12 }}>
                <Text style={{ color: colors.text, fontWeight: '700', fontSize: 14, marginBottom: 8 }}>{t('app.writeReview')}</Text>
                <Text style={{ color: colors.textMuted, fontSize: 12, marginBottom: 6 }}>{t('app.yourRating')}</Text>
                <RatingStars value={reviewRating} onSelect={setReviewRating} />
                {user ? (
                  <>
                    <TextInput
                      value={reviewText}
                      onChangeText={setReviewText}
                      placeholder="..."
                      placeholderTextColor={colors.textMuted}
                      multiline
                      numberOfLines={3}
                      style={{
                        color: colors.text,
                        backgroundColor: colors.background,
                        borderRadius: radius - 4,
                        borderWidth: 1,
                        borderColor: colors.border,
                        padding: 10,
                        fontSize: 13,
                        marginTop: 10,
                      }}
                    />
                    <Button small label={t('app.submitReview')} onPress={submitReview} style={{ marginTop: 10, alignSelf: 'flex-start' }} />
                  </>
                ) : (
                  <Pressable onPress={() => router.push('/login')} style={{ marginTop: 8 }}>
                    <Text style={{ color: colors.primary, fontSize: 13, fontWeight: '600' }}>{t('app.loginToReview')} ←</Text>
                  </Pressable>
                )}
              </View>
            </View>
          </View>
        )}
      />
    </Screen>
  )
}
