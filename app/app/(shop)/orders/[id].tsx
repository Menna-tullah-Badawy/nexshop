import React, { useCallback, useEffect, useState } from 'react'
import { Alert, FlatList, Pressable, Text, View } from 'react-native'
import { useLocalSearchParams, router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { Screen } from '../../../src/components/ui/Screen'
import { Button } from '../../../src/components/ui/Button'
import { PayBadge, StatusBadge } from '../../../src/components/ui/Badge'
import { Price } from '../../../src/components/ui/Price'
import { ImgX } from '../../../src/components/ui/ImgX'
import { Spinner } from '../../../src/components/ui/EmptyState'
import { StatusTimeline } from '../../../src/components/StatusTimeline'
import { useTheme } from '../../../src/theme/ThemeContext'
import { useUiStore } from '../../../src/store/ui'
import { api } from '../../../src/lib/api'
import { fmtDate } from '../../../src/lib/format'
import type { Order } from '../../../src/lib/types'
import { t } from '../../../src/i18n'

export default function OrderDetail() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { colors, radius } = useTheme()
  const lang = useUiStore((s) => s.lang)
  const [o, setO] = useState<Order | null>(null)
  const [busy, setBusy] = useState(false)

  const load = useCallback(() => {
    if (!id) return
    api<Order>(`/orders/${id}`)
      .then(setO)
      .catch(() => undefined)
  }, [id])

  useEffect(load, [load])

  const cancel = async () => {
    if (!o) return
    Alert.alert(t('app.cancelOrder'), o.order_no, [
      { text: t('app.cancel'), style: 'cancel' },
      {
        text: t('app.confirmDelete'),
        style: 'destructive',
        onPress: async () => {
          setBusy(true)
          try {
            const d = await api<Order>(`/orders/${o.order_no}/cancel`, { method: 'POST' })
            setO(d)
          } catch (e) {
            Alert.alert('Error', e instanceof Error ? e.message : '')
          } finally {
            setBusy(false)
          }
        },
      },
    ])
  }

  if (!o) return <Screen><Spinner /></Screen>

  const a = o.address
  return (
    <Screen pad={0}>
      <FlatList
        data={[0]}
        keyExtractor={() => 'x'}
        renderItem={() => (
          <View style={{ padding: 16, gap: 14 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Pressable
                onPress={() => router.back()}
                hitSlop={6}
                style={{
                  width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surfaceAlt,
                  justifyContent: 'center', alignItems: 'center',
                }}
              >
                <Ionicons name="arrow-back" size={18} color={colors.text} style={{ transform: [{ rotate: lang === 'ar' ? '180deg' : '0deg' }] }} />
              </Pressable>
              <Text style={{ color: colors.text, fontSize: 20, fontWeight: '800', flex: 1 }}>{o.order_no}</Text>
              <StatusBadge status={o.status} />
            </View>

            <View style={{ backgroundColor: colors.surface, borderRadius: radius, borderWidth: 1, borderColor: colors.border, padding: 14 }}>
              <StatusTimeline status={o.status} />
            </View>

            <View style={{ backgroundColor: colors.surface, borderRadius: radius, borderWidth: 1, borderColor: colors.border, padding: 12, gap: 10 }}>
              {o.items.map((it) => (
                <View key={it.id} style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
                  <ImgX uri={it.image} style={{ width: 48, height: 48, borderRadius: 10 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.text, fontSize: 13, fontWeight: '600' }} numberOfLines={1}>
                      {(lang === 'ar' ? it.name_ar : it.name_en) || it.name_en}
                    </Text>
                    <Text style={{ color: colors.textMuted, fontSize: 11 }}>
                      {it.variant ? `${it.variant} · ` : ''}× {it.qty}
                    </Text>
                  </View>
                  <Price amount={it.line_total * o.rate} size={13} color={colors.text} />
                </View>
              ))}
              <View style={{ height: 1, backgroundColor: colors.border }} />
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ color: colors.textMuted, fontSize: 13 }}>{t('app.subtotal')}</Text>
                <Price amount={o.subtotal} size={13} color={colors.text} />
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ color: colors.textMuted, fontSize: 13 }}>{t('app.delivery')}</Text>
                <Price amount={o.delivery_fee} size={13} color={colors.text} />
              </View>
              {o.discount > 0 ? (
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ color: colors.success, fontSize: 13 }}>{t('app.discount')}</Text>
                  <Price amount={o.discount} size={13} color={colors.success} />
                </View>
              ) : null}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ color: colors.text, fontWeight: '800', fontSize: 15 }}>{t('app.total')}</Text>
                <Price amount={o.total} size={17} />
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <PayBadge method={o.payment_method} status={o.payment_status} />
                <Text style={{ color: colors.textMuted, fontSize: 11 }}>{fmtDate(o.created_at, lang)}</Text>
              </View>
            </View>

            <View style={{ backgroundColor: colors.surface, borderRadius: radius, borderWidth: 1, borderColor: colors.border, padding: 12, gap: 6 }}>
              <Text style={{ color: colors.text, fontWeight: '800', fontSize: 13, marginBottom: 2 }}>{t('app.address')}</Text>
              <Text style={{ color: colors.text, fontSize: 13 }}>{o.customer_name}</Text>
              <Text style={{ color: colors.textMuted, fontSize: 12 }}>{o.customer_phone}</Text>
              <Text style={{ color: colors.textMuted, fontSize: 12 }}>
                {[o.governorate, a?.city, a?.street].filter(Boolean).join(' — ')}
              </Text>
              {a?.notes ? <Text style={{ color: colors.textMuted, fontSize: 11 }}>{a.notes}</Text> : null}
              {o.notes ? <Text style={{ color: colors.textMuted, fontSize: 11, marginTop: 4 }}>{t('app.notes')}: {o.notes}</Text> : null}
            </View>

            {o.courier_name ? (
              <View style={{ backgroundColor: colors.surface, borderRadius: radius, borderWidth: 1, borderColor: colors.border, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Ionicons name="accessibility" size={20} color={colors.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.text, fontWeight: '700', fontSize: 13 }}>{o.courier_name}</Text>
                  <Text style={{ color: colors.textMuted, fontSize: 11 }}>{o.courier_phone}</Text>
                </View>
              </View>
            ) : null}

            {o.status === 'pending' && o.payment_status !== 'paid' ? (
              <Button variant="danger" label={t('app.cancelOrder')} onPress={cancel} loading={busy} />
            ) : null}
          </View>
        )}
      />
    </Screen>
  )
}
