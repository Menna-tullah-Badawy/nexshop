import React, { useEffect, useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { AdminShell } from '../../src/components/admin/AdminShell'
import { StatusBadge } from '../../src/components/ui/Badge'
import { Price } from '../../src/components/ui/Price'
import { Spinner } from '../../src/components/ui/EmptyState'
import { useTheme } from '../../src/theme/ThemeContext'
import { useUiStore } from '../../src/store/ui'
import { api } from '../../src/lib/api'
import { shortDate } from '../../src/lib/format'
import { t } from '../../src/i18n'

interface Dash {
  today_revenue: number
  today_orders: number
  month_revenue: number
  month_orders: number
  total_customers: number
  total_products: number
  status_counts: Record<string, number>
  pending_delivery: number
  low_stock: { id: number; name: string; stock: number }[]
  top_products: { name: string; qty: number; revenue: number }[]
  recent_orders: { id: number; order_no: string; status: string; payment_status: string; total: number; currency: string; customer_name: string; created_at: string }[]
  last_14_days: { date: string; revenue: number; orders: number }[]
}

export default function AdminDashboard() {
  const { colors, radius } = useTheme()
  const lang = useUiStore((s) => s.lang)
  const router = useRouter()
  const [d, setD] = useState<Dash | null>(null)

  useEffect(() => {
    api<Dash>('/admin/dashboard').then(setD).catch(() => undefined)
  }, [])

  if (!d) {
    return (
      <AdminShell title={t('app.dashboard')}>
        <Spinner />
      </AdminShell>
    )
  }

  const maxRev = Math.max(...d.last_14_days.map((x) => x.revenue), 1)

  const stats = [
    { label: t('app.todayRevenue'), value: d.today_revenue, icon: 'cash', money: true },
    { label: t('app.todayOrders'), value: d.today_orders, icon: 'receipt', money: false },
    { label: t('app.monthRevenue'), value: d.month_revenue, icon: 'trending-up', money: true },
    { label: t('app.pendingDelivery'), value: d.pending_delivery, icon: 'car', money: false },
  ]

  return (
    <AdminShell
      title={t('app.dashboard')}
      actions={
        <Pressable onPress={() => router.push('/(shop)')} style={{ padding: 8 }}>
          <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 13 }}>{t('app.home')} ←</Text>
        </Pressable>
      }
    >
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        {stats.map((s) => (
          <View key={s.label} style={{ flex: 1, minWidth: 150, backgroundColor: colors.surface, borderRadius: radius, borderWidth: 1, borderColor: colors.border, padding: 14 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={{ width: 30, height: 30, borderRadius: 9, backgroundColor: colors.primarySoft, justifyContent: 'center', alignItems: 'center' }}>
                <Ionicons name={s.icon as never} size={15} color={colors.primary} />
              </View>
              <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: '600', flex: 1 }} numberOfLines={1}>{s.label}</Text>
            </View>
            <View style={{ marginTop: 10 }}>
              {s.money ? (
                <Price amount={s.value} size={19} color={colors.text} />
              ) : (
                <Text style={{ color: colors.text, fontSize: 20, fontWeight: '800' }}>{s.value}</Text>
              )}
            </View>
          </View>
        ))}
      </View>

      <View style={{ backgroundColor: colors.surface, borderRadius: radius, borderWidth: 1, borderColor: colors.border, padding: 14 }}>
        <Text style={{ color: colors.text, fontWeight: '800', fontSize: 14, marginBottom: 12 }}>{t('app.last14')}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 4, height: 110 }}>
          {d.last_14_days.map((x) => (
            <View key={x.date} style={{ flex: 1, alignItems: 'center', gap: 4 }}>
              <View
                style={{
                  width: '70%',
                  height: Math.max(4, (x.revenue / maxRev) * 90),
                  borderRadius: 4,
                  backgroundColor: x.revenue > 0 ? colors.primary : colors.border,
                }}
              />
              <Text style={{ color: colors.textMuted, fontSize: 8 }} numberOfLines={1}>{shortDate(x.date, lang).split(' ')[0]}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
        <View style={{ flex: 1, minWidth: 280, backgroundColor: colors.surface, borderRadius: radius, borderWidth: 1, borderColor: colors.border, padding: 14, gap: 8 }}>
          <Text style={{ color: colors.text, fontWeight: '800', fontSize: 14 }}>{t('app.recentOrders')}</Text>
          {d.recent_orders.map((o) => (
            <Pressable key={o.id} onPress={() => router.push(`/admin/orders-detail?id=${o.id}`)} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: colors.border }}>
              <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '700', width: 92 }} numberOfLines={1}>{o.order_no}</Text>
              <Text style={{ color: colors.textMuted, fontSize: 11, flex: 1 }} numberOfLines={1}>{o.customer_name}</Text>
              <StatusBadge status={o.status} />
              <Price amount={o.total} size={12} color={colors.text} />
            </Pressable>
          ))}
        </View>

        <View style={{ flex: 1, minWidth: 240, gap: 10 }}>
          <View style={{ backgroundColor: colors.surface, borderRadius: radius, borderWidth: 1, borderColor: colors.border, padding: 14, gap: 6 }}>
            <Text style={{ color: colors.text, fontWeight: '800', fontSize: 14 }}>{t('app.lowStock')}</Text>
            {d.low_stock.map((p) => (
              <View key={p.id} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ color: colors.text, fontSize: 12, flex: 1 }} numberOfLines={1}>{p.name}</Text>
                <Text style={{ color: colors.warning, fontSize: 12, fontWeight: '800' }}>{p.stock}</Text>
              </View>
            ))}
            {d.low_stock.length === 0 ? <Text style={{ color: colors.textMuted, fontSize: 12 }}>—</Text> : null}
          </View>
          <View style={{ backgroundColor: colors.surface, borderRadius: radius, borderWidth: 1, borderColor: colors.border, padding: 14, gap: 6 }}>
            <Text style={{ color: colors.text, fontWeight: '800', fontSize: 14 }}>{t('app.topProducts')}</Text>
            {d.top_products.map((p, i) => (
              <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ color: colors.text, fontSize: 12, flex: 1 }} numberOfLines={1}>{p.name}</Text>
                <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: '700' }}>{p.qty}×</Text>
              </View>
            ))}
            {d.top_products.length === 0 ? <Text style={{ color: colors.textMuted, fontSize: 12 }}>—</Text> : null}
          </View>
        </View>
      </View>
    </AdminShell>
  )
}
