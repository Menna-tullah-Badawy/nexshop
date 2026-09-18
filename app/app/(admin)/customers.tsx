import React, { useCallback, useEffect, useState } from 'react'
import { Alert, FlatList, Switch, Text, TextInput, View } from 'react-native'
import { AdminShell } from '../../src/components/admin/AdminShell'
import { Price } from '../../src/components/ui/Price'
import { Spinner } from '../../src/components/ui/EmptyState'
import { useTheme } from '../../src/theme/ThemeContext'
import { api } from '../../src/lib/api'
import { t } from '../../src/i18n'

interface Customer {
  id: number
  email: string
  full_name: string
  phone: string | null
  currency: string | null
  is_active: boolean
  created_at: string
  orders_count: number
  total_spent: number
}

export default function AdminCustomers() {
  const { colors, radius } = useTheme()
  const [rows, setRows] = useState<Customer[] | null>(null)
  const [q, setQ] = useState('')

  const load = useCallback(() => {
    const p = new URLSearchParams({ limit: '50' })
    if (q) p.set('search', q)
    api<{ items: Customer[] }>(`/admin/customers?${p.toString()}`)
      .then((d) => setRows(d.items))
      .catch(() => setRows([]))
  }, [q])

  useEffect(() => {
    const id = setTimeout(load, q ? 350 : 0)
    return () => clearTimeout(id)
  }, [q, load])

  const toggleActive = async (c: Customer, v: boolean) => {
    try {
      await api(`/admin/customers/${c.id}`, { method: 'PATCH', body: { is_active: v } })
      setRows((rs) => rs?.map((r) => (r.id === c.id ? { ...r, is_active: v } : r)) ?? null)
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : '')
    }
  }

  return (
    <AdminShell title={t('app.customers')}>
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
        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder={`${t('app.search')}...`}
          placeholderTextColor={colors.textMuted}
          style={{ flex: 1, color: colors.text, paddingVertical: 12, fontSize: 14 }}
        />
      </View>

      {rows === null ? (
        <Spinner />
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(c) => String(c.id)}
          contentContainerStyle={{ gap: 8 }}
          ListEmptyComponent={<Text style={{ color: colors.textMuted, fontSize: 13, textAlign: 'center', padding: 20 }}>—</Text>}
          renderItem={({ item }) => (
            <View style={{ backgroundColor: colors.surface, borderRadius: radius, borderWidth: 1, borderColor: colors.border, padding: 12, gap: 6 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.text, fontSize: 13, fontWeight: '700' }} numberOfLines={1}>{item.full_name || item.email}</Text>
                  <Text style={{ color: colors.textMuted, fontSize: 11 }} numberOfLines={1}>{item.email}</Text>
                </View>
                <Switch
                  value={item.is_active}
                  onValueChange={(v) => toggleActive(item, v)}
                  trackColor={{ true: colors.primary, false: colors.border }}
                  thumbColor="#fff"
                />
              </View>
              <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
                <Text style={{ color: colors.textMuted, fontSize: 11 }}>{item.phone}</Text>
                <View style={{ flex: 1 }} />
                <Text style={{ color: colors.textMuted, fontSize: 11 }}>
                  {item.orders_count} {t('app.orders').toLowerCase()}
                </Text>
                <Price amount={item.total_spent} size={12} color={colors.text} />
                <Text style={{ color: colors.textMuted, fontSize: 10, fontWeight: '700' }}>{item.currency ?? '—'}</Text>
              </View>
            </View>
          )}
        />
      )}
    </AdminShell>
  )
}
