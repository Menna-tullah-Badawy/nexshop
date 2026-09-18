import React, { useState } from 'react'
import { FlatList, Pressable, Text, TextInput, View } from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { Screen } from '../../src/components/ui/Screen'
import { Button } from '../../src/components/ui/Button'
import { ImgX } from '../../src/components/ui/ImgX'
import { Price } from '../../src/components/ui/Price'
import { QtyStepper } from '../../src/components/ui/QtyStepper'
import { EmptyState } from '../../src/components/ui/EmptyState'
import { useTheme } from '../../src/theme/ThemeContext'
import { useUiStore } from '../../src/store/ui'
import { useAuthStore } from '../../src/store/auth'
import { useCartStore, cartSubtotal } from '../../src/store/cart'
import { t } from '../../src/i18n'

export default function Cart() {
  const { colors, radius } = useTheme()
  const lang = useUiStore((s) => s.lang)
  const user = useAuthStore((s) => s.user)
  const lines = useCartStore((s) => s.lines)
  const setQty = useCartStore((s) => s.setQty)
  const remove = useCartStore((s) => s.remove)
  const promoCode = useCartStore((s) => s.promoCode)
  const setPromo = useCartStore((s) => s.setPromo)
  const [code, setCode] = useState(promoCode ?? '')
  const [promoMsg, setPromoMsg] = useState<string | null>(null)

  const subtotal = cartSubtotal(useCartStore.getState())

  const goCheckout = () => {
    if (!user) {
      router.push('/login')
      return
    }
    router.push('/checkout')
  }

  if (lines.length === 0) {
    return (
      <Screen>
        <EmptyState icon="cart-outline" title={t('app.emptyCart')} />
        <Button label={t('app.startShopping')} onPress={() => router.navigate('/')} />
      </Screen>
    )
  }

  return (
    <Screen pad={0}>
      <FlatList
        data={lines}
        keyExtractor={(l) => `${l.productId}|${l.variant ?? ''}`}
        contentContainerStyle={{ padding: 16, gap: 10, flexGrow: 1 }}
        ListHeaderComponent={
          <Text style={{ color: colors.text, fontSize: 22, fontWeight: '800', marginBottom: 4 }}>{t('app.cart')}</Text>
        }
        renderItem={({ item }) => {
          const name = lang === 'ar' ? item.name_ar : item.name_en
          return (
            <View
              style={{
                flexDirection: 'row',
                gap: 10,
                backgroundColor: colors.surface,
                borderRadius: radius,
                borderWidth: 1,
                borderColor: colors.border,
                padding: 10,
              }}
            >
              <ImgX uri={item.image} style={{ width: 64, height: 64, borderRadius: radius - 4 }} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.text, fontSize: 13, fontWeight: '700' }} numberOfLines={1}>
                  {name}
                </Text>
                {item.variant ? (
                  <Text style={{ color: colors.textMuted, fontSize: 11, marginTop: 2 }}>{item.variant}</Text>
                ) : null}
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
                  <Price amount={item.price * item.qty} size={14} />
                  <QtyStepper small qty={item.qty} onChange={(q) => setQty(item.productId, item.variant, q)} max={item.stock} />
                </View>
              </View>
              <Pressable onPress={() => remove(item.productId, item.variant)} hitSlop={8} style={{ alignSelf: 'flex-start' }}>
                <Ionicons name="trash-outline" size={17} color={colors.danger} />
              </Pressable>
            </View>
          )
        }}
        ListFooterComponent={
          <View style={{ backgroundColor: colors.surface, borderRadius: radius, borderWidth: 1, borderColor: colors.border, padding: 14, marginTop: 6, gap: 10 }}>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TextInput
                value={code}
                onChangeText={(v) => {
                  setCode(v)
                  setPromoMsg(null)
                }}
                placeholder={t('app.promo')}
                placeholderTextColor={colors.textMuted}
                autoCapitalize="characters"
                style={{
                  flex: 1,
                  color: colors.text,
                  backgroundColor: colors.background,
                  borderRadius: radius - 4,
                  borderWidth: 1,
                  borderColor: colors.border,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  fontSize: 13,
                }}
              />
              <Button
                small
                variant="outline"
                label={t('app.apply')}
                onPress={() => {
                  setPromo(code.trim() || null)
                  setPromoMsg(code.trim() ? code.trim().toUpperCase() : null)
                }}
              />
            </View>
            {promoMsg ? (
              <Text style={{ color: colors.textMuted, fontSize: 11 }}>{t('app.promo')}: {promoMsg} ({t('app.apply')})</Text>
            ) : null}

            <View style={{ height: 1, backgroundColor: colors.border }} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ color: colors.textMuted, fontSize: 14 }}>{t('app.subtotal')}</Text>
              <Price amount={subtotal} size={16} color={colors.text} />
            </View>
            <Text style={{ color: colors.textMuted, fontSize: 11 }}>{t('app.deliveryAtCheckout')}</Text>
            <Button label={t('app.checkout')} onPress={goCheckout} />
          </View>
        }
      />
    </Screen>
  )
}
