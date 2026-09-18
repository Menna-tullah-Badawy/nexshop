import React, { useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '../theme/ThemeContext'
import { useUiStore } from '../store/ui'
import { useCartStore } from '../store/cart'
import type { Product } from '../lib/types'
import { Price } from './ui/Price'
import { ImgX } from './ui/ImgX'
import { t } from '../i18n'

export function ProductCard({ p, compact = false }: { p: Product; compact?: boolean }) {
  const { colors, radius } = useTheme()
  const lang = useUiStore((s) => s.lang)
  const add = useCartStore((s) => s.add)
  const [added, setAdded] = useState(false)
  const name = lang === 'ar' ? p.name_ar || p.name_en : p.name_en || p.name_ar

  const doAdd = () => {
    if (p.stock <= 0) return
    add(p, 1, null)
    setAdded(true)
    setTimeout(() => setAdded(false), 1200)
  }

  return (
    <View
      style={{
        flex: 1,
        margin: 6,
        backgroundColor: colors.surface,
        borderRadius: radius,
        borderWidth: 1,
        borderColor: colors.border,
        overflow: 'hidden',
      }}
    >
      <Pressable onPress={() => router.push(`/product/${p.slug}`)} style={{ padding: 8, paddingBottom: 0 }}>
        <View style={{ position: 'relative' }}>
          <ImgX uri={p.images?.[0]} style={{ width: '100%', aspectRatio: 1, borderRadius: radius - 6 }} />
          {p.is_featured ? (
            <View
              style={{
                position: 'absolute',
                top: 8,
                right: 8,
                backgroundColor: colors.primary,
                borderRadius: 999,
                paddingHorizontal: 8,
                paddingVertical: 3,
              }}
            >
              <Text style={{ color: colors.onPrimary, fontSize: 10, fontWeight: '700' }}>{t('app.featured')}</Text>
            </View>
          ) : null}
          {p.stock <= 0 ? (
            <View
              style={{
                position: 'absolute',
                bottom: 8,
                left: 8,
                backgroundColor: colors.danger,
                borderRadius: 999,
                paddingHorizontal: 8,
                paddingVertical: 3,
              }}
            >
              <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>{t('app.outOfStock')}</Text>
            </View>
          ) : null}
        </View>
        <Text style={{ color: colors.text, fontSize: compact ? 13 : 14, fontWeight: '600', marginTop: 8, minHeight: compact ? 32 : 38 }} numberOfLines={2}>
          {name}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
          <Price amount={p.price} size={compact ? 14 : 16} />
          <Pressable
            onPress={doAdd}
            disabled={p.stock <= 0}
            hitSlop={8}
            style={{
              width: 30,
              height: 30,
              borderRadius: 15,
              backgroundColor: added ? colors.success : colors.primarySoft,
              justifyContent: 'center',
              alignItems: 'center',
              opacity: p.stock <= 0 ? 0.4 : 1,
            }}
          >
            <Ionicons name={added ? 'checkmark' : 'cart-outline'} size={16} color={added ? '#fff' : colors.primary} />
          </Pressable>
        </View>
      </Pressable>
    </View>
  )
}
