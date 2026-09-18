import React, { useCallback, useEffect, useState } from 'react'
import { Alert, FlatList, Pressable, ScrollView, Switch, Text, TextInput, View } from 'react-native'
import { Linking } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { AdminShell } from '../../src/components/admin/AdminShell'
import { Button } from '../../src/components/ui/Button'
import { Chip, StatusBadge } from '../../src/components/ui/Badge'
import { Price } from '../../src/components/ui/Price'
import { Spinner } from '../../src/components/ui/EmptyState'
import { useTheme } from '../../src/theme/ThemeContext'
import { useUiStore } from '../../src/store/ui'
import { api } from '../../src/lib/api'
import { fmtDate } from '../../src/lib/format'
import type { Order } from '../../src/lib/types'
import { t } from '../../src/i18n'

interface Zone {
  id: number
  name_ar: string
  name_en: string
  fee: number
  active: boolean
}

export default function AdminDelivery() {
  const { colors, radius } = useTheme()
  const lang = useUiStore((s) => s.lang)
  const [queue, setQueue] = useState<Order[] | null>(null)
  const [zones, setZones] = useState<Zone[] | null>(null)
  const [fees, setFees] = useState<Record<number, string>>({})
  const [tab, setTab] = useState<'queue' | 'zones'>('queue')

  const load = useCallback(() => {
    Promise.all([
      api<{ items: Order[] }>(`/admin/orders?status=packing&limit=50`),
      api<{ items: Order[] }>(`/admin/orders?status=out_for_delivery&limit=50`),
      api<Zone[]>('/admin/governorates'),
    ])
      .then(([a, b, z]) => {
        setQueue([...b.items, ...a.items])
        setZones(z)
        const init: Record<number, string> = {}
        z.forEach((zone) => (init[zone.id] = String(zone.fee)))
        setFees(init)
      })
      .catch(() => {
        setQueue([])
        setZones([])
      })
  }, [])

  useEffect(load, [load])

  const advance = async (o: Order, status: string) => {
    try {
      const d = await api<Order>(`/admin/orders/${o.id}/next`, { method: 'POST' })
      setQueue((q) => q?.filter((x) => x.id !== d.id) ?? null)
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : '')
    }
  }

  const saveFee = async (z: Zone) => {
    const fee = Number(fees[z.id] ?? 0)
    try {
      await api(`/admin/governorates/${z.id}`, { method: 'PUT', body: { fee } })
      setZones((zs) => zs?.map((x) => (x.id === z.id ? { ...x, fee } : x)) ?? null)
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : '')
    }
  }

  return (
    <AdminShell
      title={t('app.deliveryTitle')}
      actions={
        <View style={{ flexDirection: 'row', gap: 6 }}>
          <Chip label={t('app.revenue')} active={false} />
          <Chip label="Queue" active={tab === 'queue'} onPress={() => setTab('queue')} />
          <Chip label={t('app.governorates')} active={tab === 'zones'} onPress={() => setTab('zones')} />
        </View>
      }
    >
      {tab === 'queue' ? (
        queue === null ? (
          <Spinner />
        ) : queue.length === 0 ? (
          <Text style={{ color: colors.textMuted, fontSize: 13, textAlign: 'center', padding: 24 }}>—</Text>
        ) : (
          <FlatList
            data={queue}
            keyExtractor={(o) => String(o.id)}
            contentContainerStyle={{ gap: 8 }}
            renderItem={({ item }) => (
              <View style={{ backgroundColor: colors.surface, borderRadius: radius, borderWidth: 1, borderColor: colors.border, padding: 12, gap: 8 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ color: colors.primary, fontWeight: '800', fontSize: 13 }}>{item.order_no}</Text>
                  <StatusBadge status={item.status} />
                </View>
                <Text style={{ color: colors.text, fontSize: 12 }}>{item.customer_name} — {item.customer_phone}</Text>
                <Text style={{ color: colors.textMuted, fontSize: 11 }} numberOfLines={1}>
                  {[item.governorate, item.address?.city, item.address?.street].filter(Boolean).join(' — ')}
                </Text>
                <Text style={{ color: colors.textMuted, fontSize: 10 }}>{fmtDate(item.created_at, lang)}</Text>
                <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                  {item.status === 'packing' ? (
                    <Button small label={`→ ${t('app.st_out_for_delivery')}`} onPress={() => advance(item, 'out_for_delivery')} />
                  ) : null}
                  {item.status === 'out_for_delivery' ? (
                    <Button small label={`→ ${t('app.st_delivered')}`} onPress={() => advance(item, 'delivered')} />
                  ) : null}
                  <Pressable
                    onPress={() => Linking.openURL(`tel:${item.customer_phone}`)}
                    style={{
                      flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8,
                      borderRadius: radius, borderWidth: 1, borderColor: colors.border,
                    }}
                  >
                    <Ionicons name="call" size={14} color={colors.primary} />
                    <Text style={{ color: colors.text, fontSize: 12 }}>{item.customer_phone}</Text>
                  </Pressable>
                  <Pressable onPress={() => router.push(`/admin/orders-detail?id=${item.id}`)}>
                    <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '700' }}>{t('app.edit')} ←</Text>
                  </Pressable>
                </View>
              </View>
            )}
          />
        )
      ) : zones === null ? (
        <Spinner />
      ) : (
        <ScrollView contentContainerStyle={{ gap: 8, paddingBottom: 30 }}>
          {zones.map((z) => (
            <View key={z.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.surface, borderRadius: radius, borderWidth: 1, borderColor: colors.border, padding: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.text, fontSize: 13, fontWeight: '600' }}>{lang === 'ar' ? z.name_ar : z.name_en}</Text>
                <Text style={{ color: colors.textMuted, fontSize: 10 }}>{lang === 'ar' ? z.name_en : z.name_ar}</Text>
              </View>
              <TextInput
                value={fees[z.id] ?? '0'}
                onChangeText={(v) => setFees({ ...fees, [z.id]: v })}
                keyboardType="decimal-pad"
                style={{
                  width: 74,
                  color: colors.text,
                  backgroundColor: colors.background,
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 8,
                  paddingHorizontal: 10,
                  paddingVertical: 8,
                  fontSize: 13,
                  textAlign: 'center',
                }}
              />
              <Button small variant="outline" label={t('app.save')} onPress={() => saveFee(z)} />
              <Switch
                value={z.active}
                onValueChange={async (v) => {
                  await api(`/admin/governorates/${z.id}`, { method: 'PUT', body: { active: v } })
                  setZones((zs) => zs?.map((x) => (x.id === z.id ? { ...x, active: v } : x)) ?? null)
                }}
                trackColor={{ true: colors.primary, false: colors.border }}
                thumbColor="#fff"
              />
            </View>
          ))}
        </ScrollView>
      )}
    </AdminShell>
  )
}
