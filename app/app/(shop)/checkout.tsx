import React, { useMemo, useState } from 'react'
import { Alert, Platform, ScrollView, Text, View } from 'react-native'
import { router } from 'expo-router'
import * as WebBrowser from 'expo-web-browser'
import { Screen } from '../../src/components/ui/Screen'
import { Button } from '../../src/components/ui/Button'
import { Input } from '../../src/components/ui/Input'
import { Select } from '../../src/components/ui/Select'
import { Price } from '../../src/components/ui/Price'
import { useTheme } from '../../src/theme/ThemeContext'
import { useUiStore } from '../../src/store/ui'
import { useAuthStore } from '../../src/store/auth'
import { useCartStore, cartSubtotal } from '../../src/store/cart'
import { api, apiBase } from '../../src/lib/api'
import type { Address, Order, Zone } from '../../src/lib/types'
import { t } from '../../src/i18n'

export default function Checkout() {
  const { colors, radius } = useTheme()
  const lang = useUiStore((s) => s.lang)
  const brand = useUiStore((s) => s.brand)
  const user = useAuthStore((s) => s.user)
  const lines = useCartStore((s) => s.lines)
  const promoCode = useCartStore((s) => s.promoCode)
  const clear = useCartStore((s) => s.clear)

  const zones: Zone[] = brand?.delivery?.enabled ? brand.delivery.zones : []
  const [savedId, setSavedId] = useState<string | null>(user?.addresses?.find((a) => a.is_default)?.id != null ? String(user.addresses.find((a) => a.is_default)!.id) : user?.addresses?.[0] ? String(user.addresses[0].id) : 'new')
  const [addr, setAddr] = useState({ full_name: user?.full_name ?? '', phone: user?.phone ?? '', city: '', street: '', notes: '' })
  const [governorateId, setGovernorateId] = useState<string | null>(null)
  const [method, setMethod] = useState<'cod' | 'stripe' | 'vodafone_cash' | 'instapay' | 'fawry'>(
    brand?.payments?.cod ? 'cod' : 'stripe',
  )
  const [notes, setNotes] = useState('')
  const [busy, setBusy] = useState(false)

  const subtotal = cartSubtotal(useCartStore.getState())
  const freeAbove = brand?.delivery?.free_delivery_above ?? 0
  const isFreeDelivery = freeAbove > 0 && subtotal >= freeAbove
  const govFee = useMemo(() => {
    if (isFreeDelivery) return 0
    const z = zones.find((z) => String(z.id) === governorateId)
    return z ? z.fee : 0
  }, [governorateId, zones, isFreeDelivery])

  if (lines.length === 0) {
    return (
      <Screen>
        <Text style={{ color: colors.text, fontSize: 18, fontWeight: '700' }}>{t('app.emptyCart')}</Text>
        <Button label={t('app.startShopping')} onPress={() => router.navigate('/')} style={{ marginTop: 14 }} />
      </Screen>
    )
  }

  const payMethods: { id: 'cod' | 'stripe' | 'vodafone_cash' | 'instapay' | 'fawry'; label: string; hint?: string }[] = []
  if (brand?.payments?.cod) payMethods.push({ id: 'cod', label: t('app.cod') })
  if (brand?.payments?.stripe)
    payMethods.push({ id: 'stripe', label: brand.payments.demo ? `${t('app.stripe')} (Demo)` : t('app.stripe') })
  if (brand?.payments?.wallet) {
    if (brand.payments.wallet_phone)
      payMethods.push({ id: 'vodafone_cash', label: t('app.vodafoneCash'), hint: brand.payments.wallet_phone })
    if (brand.payments.instapay_address)
      payMethods.push({ id: 'instapay', label: t('app.instapay'), hint: brand.payments.instapay_address })
  }
  if (brand?.payments?.fawry) payMethods.push({ id: 'fawry', label: t('app.fawry') })

  const submit = async () => {
    if (!user) return
    if (!governorateId && zones.length > 0) {
      Alert.alert(t('app.required'), t('app.chooseDelivery'))
      return
    }
    if (savedId === 'new' && (!addr.full_name || !addr.phone)) {
      Alert.alert(t('app.required'), `${t('app.fullName')} · ${t('app.phone')}`)
      return
    }
    setBusy(true)
    try {
      const body = {
        items: lines.map((l) => ({ product_id: l.productId, qty: l.qty, variant: l.variant })),
        address_id: savedId && savedId !== 'new' ? Number(savedId) : null,
        address:
          savedId === 'new'
            ? { label: 'home', full_name: addr.full_name, phone: addr.phone, city: addr.city, street: addr.street, notes: addr.notes }
            : null,
        governorate_id: governorateId ? Number(governorateId) : null,
        payment_method: method,
        promo_code: promoCode,
        notes: notes || null,
      }
      const res = await api<{ order: Order; payment: { provider: string; url: string | null; needs_redirect: boolean; demo: boolean } }>(
        '/orders',
        { method: 'POST', body },
      )
      clear()
      if (res.payment?.needs_redirect && res.payment.url) {
        if (Platform.OS === 'web' && typeof window !== 'undefined') {
          window.open(res.payment.url, '_blank')
        } else {
          await WebBrowser.openAuthSessionAsync(res.payment.url, apiBase().replace(/\/api$/, ''))
        }
      }
      router.replace(`/order-success?order=${res.order.order_no}`)
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Checkout failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Screen pad={0}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 14 }} keyboardShouldPersistTaps="handled">
        <Text style={{ color: colors.text, fontSize: 22, fontWeight: '800' }}>{t('app.checkout')}</Text>

        <View style={{ backgroundColor: colors.surface, borderRadius: radius, borderWidth: 1, borderColor: colors.border, padding: 12 }}>
          <Text style={{ color: colors.text, fontWeight: '800', fontSize: 14, marginBottom: 10 }}>{t('app.chooseAddress')}</Text>
          {user && user.addresses.length > 0 ? (
            <Select
              value={savedId}
              onSelect={setSavedId}
              options={[
                ...user.addresses.map((a: Address) => ({
                  value: String(a.id!),
                  label: `${a.full_name} — ${a.city} ${a.street}`,
                })),
                { value: 'new', label: `+ ${t('app.addAddress')}` },
              ]}
            />
          ) : null}
          {savedId === 'new' ? (
            <>
              <Input label={t('app.fullName')} value={addr.full_name} onChangeText={(v) => setAddr({ ...addr, full_name: v })} />
              <Input label={t('app.phone')} value={addr.phone} onChangeText={(v) => setAddr({ ...addr, phone: v })} keyboardType="phone-pad" />
              <Input label={t('app.city')} value={addr.city} onChangeText={(v) => setAddr({ ...addr, city: v })} />
              <Input label={t('app.street')} value={addr.street} onChangeText={(v) => setAddr({ ...addr, street: v })} />
            </>
          ) : null}
        </View>

        {zones.length > 0 ? (
          <Select
            label={t('app.chooseDelivery')}
            value={governorateId}
            onSelect={setGovernorateId}
            placeholder={t('app.chooseDelivery')}
            options={zones.map((z) => ({
              value: String(z.id),
              label: lang === 'ar' ? z.name_ar : z.name_en,
              hint: <Price amount={z.fee} size={12} />,
            }))}
          />
        ) : null}

        <View style={{ backgroundColor: colors.surface, borderRadius: radius, borderWidth: 1, borderColor: colors.border, padding: 12, gap: 10 }}>
          <Text style={{ color: colors.text, fontWeight: '800', fontSize: 14 }}>{t('app.paymentMethod')}</Text>
          {payMethods.map((m) => (
            <View
              key={m.id}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
                padding: 12,
                borderRadius: radius - 4,
                borderWidth: 1.5,
                borderColor: method === m.id ? colors.primary : colors.border,
                backgroundColor: method === m.id ? colors.primarySoft : 'transparent',
              }}
            >
              <View
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 10,
                  borderWidth: 2,
                  borderColor: method === m.id ? colors.primary : colors.border,
                  backgroundColor: method === m.id ? colors.primary : 'transparent',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                {method === m.id ? <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.onPrimary }} /> : null}
              </View>
              <Text style={{ color: colors.text, fontSize: 14, fontWeight: '600', flex: 1 }}>{m.label}</Text>
              {m.hint ? <Text style={{ color: colors.textMuted, fontSize: 12 }}>{m.hint}</Text> : null}
            </View>
          ))}
          {method === 'vodafone_cash' || method === 'instapay' || method === 'fawry' ? (
            <Text style={{ color: colors.textMuted, fontSize: 12, lineHeight: 18 }}>{t('app.walletHint')}</Text>
          ) : null}
        </View>

        <Input label={t('app.notes')} value={notes} onChangeText={setNotes} placeholder={t('app.notesPlaceholder')} multiline />

        <View style={{ backgroundColor: colors.surface, borderRadius: radius, borderWidth: 1, borderColor: colors.border, padding: 14, gap: 8 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ color: colors.textMuted, fontSize: 13 }}>{t('app.subtotal')}</Text>
            <Price amount={subtotal} size={14} color={colors.text} />
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ color: colors.textMuted, fontSize: 13 }}>{t('app.delivery')}</Text>
            {isFreeDelivery ? (
              <Text style={{ color: colors.success, fontSize: 13, fontWeight: '800' }}>FREE 🎉</Text>
            ) : (
              <Price amount={govFee} size={14} color={colors.text} />
            )}
          </View>
          {promoCode ? (
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ color: colors.textMuted, fontSize: 13 }}>
                {t('app.discount')} ({promoCode})
              </Text>
              <Text style={{ color: colors.textMuted, fontSize: 12 }}>*{t('app.apply')}</Text>
            </View>
          ) : null}
          <View style={{ height: 1, backgroundColor: colors.border }} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ color: colors.text, fontSize: 15, fontWeight: '800' }}>{t('app.total')}</Text>
            <Price amount={subtotal + govFee} size={18} />
          </View>
        </View>

        <Button label={busy ? t('app.placing') : t('app.placeOrder')} onPress={submit} loading={busy} />
      </ScrollView>
    </Screen>
  )
}
