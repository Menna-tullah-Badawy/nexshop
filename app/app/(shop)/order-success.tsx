import React, { useEffect, useState } from 'react'
import { Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useLocalSearchParams, router } from 'expo-router'
import { Screen } from '../../src/components/ui/Screen'
import { Button } from '../../src/components/ui/Button'
import { Price } from '../../src/components/ui/Price'
import { Spinner } from '../../src/components/ui/EmptyState'
import { StatusTimeline } from '../../src/components/StatusTimeline'
import { useTheme } from '../../src/theme/ThemeContext'
import { useUiStore } from '../../src/store/ui'
import { api } from '../../src/lib/api'
import type { Order } from '../../src/lib/types'
import { t } from '../../src/i18n'

export default function OrderSuccess() {
  const { order, cancelled } = useLocalSearchParams<{ order: string; cancelled?: string }>()
  const { colors, radius } = useTheme()
  const lang = useUiStore((s) => s.lang)
  const [o, setO] = useState<Order | null>(null)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!order) return
    let tries = 0
    const load = async () => {
      try {
        const d = await api<Order>(`/orders/${order}`)
        setO(d)
        if (d.payment_method === 'stripe' && d.payment_status !== 'paid' && tries < 10) {
          tries += 1
          setTimeout(load, 3000)
        }
      } catch {
        setNotFound(true)
      }
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order])

  const isCancelled = cancelled === '1' || o?.status === 'cancelled'
  const waiting = o?.payment_method === 'stripe' && o.payment_status !== 'paid'

  return (
    <Screen scroll>
      <View style={{ alignItems: 'center', gap: 10, paddingVertical: 16 }}>
        <View
          style={{
            width: 84,
            height: 84,
            borderRadius: 42,
            backgroundColor: isCancelled ? 'rgba(220,38,38,0.12)' : 'rgba(22,163,74,0.12)',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Ionicons
            name={isCancelled ? 'close-circle' : waiting ? 'hourglass' : 'checkmark-circle'}
            size={44}
            color={isCancelled ? colors.danger : waiting ? colors.warning : colors.success}
          />
        </View>
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', gap: 4 }}>
            <Ionicons name="receipt-outline" size={15} color={colors.textMuted} />
            <Text style={{ color: colors.textMuted, fontSize: 13 }}>{t('app.orderNo')}</Text>
          </View>
          <Text style={{ color: colors.primary, fontWeight: '800', fontSize: 14 }}>{order}</Text>
        </View>
        <Text style={{ color: colors.text, fontSize: 20, fontWeight: '800' }}>
          {isCancelled ? t('app.orderCancelledTitle') : waiting ? t('app.waitingPayment') : t('app.orderSuccess')}
        </Text>

        {o ? (
          <View style={{ width: '100%', backgroundColor: colors.surface, borderRadius: radius, borderWidth: 1, borderColor: colors.border, padding: 16, gap: 14 }}>
            <StatusTimeline status={o.status} />
            <View style={{ gap: 6 }}>
              {o.items.map((it) => (
                <View key={it.id} style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
                  <Text style={{ color: colors.text, fontSize: 13, flex: 1 }} numberOfLines={1}>
                    {(lang === 'ar' ? it.name_ar : it.name_en) || it.name_en} × {it.qty}
                  </Text>
                  <Price amount={it.line_total * o.rate} size={13} color={colors.text} />
                </View>
              ))}
            </View>
            <View style={{ height: 1, backgroundColor: colors.border }} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ color: colors.text, fontSize: 15, fontWeight: '800' }}>{t('app.total')}</Text>
              <Price amount={o.total} size={18} />
            </View>
          </View>
        ) : notFound ? (
          <Spinner />
        ) : (
          <Spinner />
        )}

        <View style={{ flexDirection: 'row', gap: 10, width: '100%' }}>
          <Button variant="outline" label={t('app.continueShopping')} style={{ flex: 1 }} onPress={() => router.navigate('/')} />
          {!waiting && !isCancelled ? (
            <Button label={t('app.viewOrder')} style={{ flex: 1 }} onPress={() => router.push(`/orders/${o?.id ?? ''}`)} />
          ) : null}
        </View>
      </View>
    </Screen>
  )
}
