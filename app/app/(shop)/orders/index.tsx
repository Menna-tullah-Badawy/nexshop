import React, { useCallback, useEffect, useState } from 'react'
import { FlatList, Pressable, Text, View } from 'react-native'
import { router } from 'expo-router'
import { Screen } from '../../../src/components/ui/Screen'
import { PayBadge, StatusBadge } from '../../../src/components/ui/Badge'
import { Price } from '../../../src/components/ui/Price'
import { EmptyState, Spinner } from '../../../src/components/ui/EmptyState'
import { useTheme } from '../../../src/theme/ThemeContext'
import { useUiStore } from '../../../src/store/ui'
import { api } from '../../../src/lib/api'
import { fmtDate } from '../../../src/lib/format'
import type { Order } from '../../../src/lib/types'
import { t } from '../../../src/i18n'

export default function MyOrders() {
  const { colors, radius } = useTheme()
  const lang = useUiStore((s) => s.lang)
  const [orders, setOrders] = useState<Order[] | null>(null)

  const load = useCallback(() => {
    api<Order[]>('/orders')
      .then(setOrders)
      .catch(() => setOrders([]))
  }, [])

  useEffect(load, [load])

  return (
    <Screen pad={0}>
      <FlatList
        data={orders ?? []}
        keyExtractor={(o) => String(o.id)}
        contentContainerStyle={{ padding: 16, gap: 10 }}
        ListHeaderComponent={<Text style={{ color: colors.text, fontSize: 22, fontWeight: '800', marginBottom: 4 }}>{t('app.orders')}</Text>}
        ListEmptyComponent={orders === null ? <Spinner /> : <EmptyState icon="receipt-outline" title={t('app.noOrders')} />}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push(`/orders/${item.id}`)}
            style={({ pressed }) => ({
              backgroundColor: colors.surface,
              borderRadius: radius,
              borderWidth: 1,
              borderColor: colors.border,
              padding: 14,
              gap: 8,
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ color: colors.primary, fontWeight: '800', fontSize: 14 }}>{item.order_no}</Text>
              <StatusBadge status={item.status} />
            </View>
            <Text style={{ color: colors.textMuted, fontSize: 12 }}>{fmtDate(item.created_at, lang)}</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <PayBadge method={item.payment_method} status={item.payment_status} />
              <Price amount={item.total} size={15} color={colors.text} />
            </View>
          </Pressable>
        )}
      />
    </Screen>
  )
}
