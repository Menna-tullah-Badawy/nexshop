import React, { useCallback, useEffect, useState } from 'react'
import { Alert, FlatList, Pressable, Text, TextInput, View } from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { AdminShell } from '../../src/components/admin/AdminShell'
import { Chip, PayBadge, StatusBadge } from '../../src/components/ui/Badge'
import { Price } from '../../src/components/ui/Price'
import { Spinner } from '../../src/components/ui/EmptyState'
import { useTheme } from '../../src/theme/ThemeContext'
import { useUiStore } from '../../src/store/ui'
import { api } from '../../src/lib/api'
import { fmtDate } from '../../src/lib/format'
import type { Order } from '../../src/lib/types'
import { t } from '../../src/i18n'

const STATUSES = ['pending', 'confirmed', 'packing', 'out_for_delivery', 'delivered', 'cancelled']

export default function AdminOrders() {
  const { colors, radius } = useTheme()
  const lang = useUiStore((s) => s.lang)
  const [rows, setRows] = useState<Order[] | null>(null)
  const [status, setStatus] = useState<string | null>(null)
  const [q, setQ] = useState('')

  const load = useCallback(() => {
    const p = new URLSearchParams({ limit: '50' })
    if (status) p.set('status', status)
    if (q) p.set('q', q)
    api<{ items: Order[] }>(`/admin/orders?${p.toString()}`)
      .then((d) => setRows(d.items))
      .catch(() => setRows([]))
  }, [status, q])

  useEffect(() => {
    const id = setTimeout(load, q ? 350 : 0)
    return () => clearTimeout(id)
  }, [q, load])

  return (
    <AdminShell title={t('app.ordersTitle')}>
      <View style={{ flexDirection: 'row', gap: 4, flexWrap: 'wrap', marginBottom: 8 }}>
        <Chip label={t('app.all')} active={!status} onPress={() => setStatus(null)} />
        {STATUSES.map((s) => (
          <Chip key={s} label={t(`app.st_${s}`)} active={status === s} onPress={() => setStatus(s)} />
        ))}
      </View>

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
          marginBottom: 10,
        }}
      >
        <Ionicons name="search" size={16} color={colors.textMuted} />
        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder={t('app.searchOrders')}
          placeholderTextColor={colors.textMuted}
          style={{ flex: 1, color: colors.text, paddingVertical: 12, fontSize: 14 }}
        />
      </View>

      {rows === null ? (
        <Spinner />
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(o) => String(o.id)}
          contentContainerStyle={{ gap: 8 }}
          ListEmptyComponent={<Text style={{ color: colors.textMuted, fontSize: 13, textAlign: 'center', padding: 20 }}>{t('app.noOrders')}</Text>}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => router.push(`/admin/orders-detail?id=${item.id}`)}
              style={({ pressed }) => ({
                backgroundColor: colors.surface,
                borderRadius: radius,
                borderWidth: 1,
                borderColor: colors.border,
                padding: 12,
                gap: 8,
                opacity: pressed ? 0.85 : 1,
              })}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                <Text style={{ color: colors.primary, fontWeight: '800', fontSize: 13 }}>{item.order_no}</Text>
                <StatusBadge status={item.status} />
              </View>
              <Text style={{ color: colors.text, fontSize: 12 }}>{item.customer_name} · {item.customer_phone}</Text>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ color: colors.textMuted, fontSize: 11 }}>{fmtDate(item.created_at, lang)}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <PayBadge method={item.payment_method} status={item.payment_status} />
                  <Price amount={item.total} size={13} color={colors.text} />
                </View>
              </View>
            </Pressable>
          )}
        />
      )}
    </AdminShell>
  )
}
