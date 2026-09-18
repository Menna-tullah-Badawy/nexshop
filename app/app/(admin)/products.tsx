import React, { useCallback, useEffect, useState } from 'react'
import { Alert, FlatList, Pressable, Switch, Text, TextInput, View } from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { AdminShell } from '../../src/components/admin/AdminShell'
import { Button } from '../../src/components/ui/Button'
import { ImgX } from '../../src/components/ui/ImgX'
import { Price } from '../../src/components/ui/Price'
import { Spinner } from '../../src/components/ui/EmptyState'
import { useTheme } from '../../src/theme/ThemeContext'
import { useUiStore } from '../../src/store/ui'
import { api } from '../../src/lib/api'
import type { Product } from '../../src/lib/types'
import { t } from '../../src/i18n'

interface Row extends Product { cost?: number }

export default function AdminProducts() {
  const { colors, radius } = useTheme()
  const lang = useUiStore((s) => s.lang)
  const [rows, setRows] = useState<Row[] | null>(null)
  const [q, setQ] = useState('')
  const [busyId, setBusyId] = useState<number | null>(null)

  const load = useCallback(() => {
    api<{ items: Row[] }>('/admin/products?limit=100')
      .then((d) => setRows(d.items))
      .catch(() => setRows([]))
  }, [])

  useEffect(() => {
    const id = setTimeout(load, q ? 350 : 0)
    return () => clearTimeout(id)
  }, [q, load])

  const toggle = async (p: Row) => {
    setBusyId(p.id)
    try {
      const d = await api<Row>(`/admin/products/${p.id}/toggle`, { method: 'POST' })
      setRows((rs) => rs?.map((r) => (r.id === d.id ? d : r)) ?? null)
    } finally {
      setBusyId(null)
    }
  }

  const del = (p: Row) => {
    Alert.alert(t('app.delete'), p.name_en || p.name_ar, [
      { text: t('app.cancel'), style: 'cancel' },
      {
        text: t('app.delete'),
        style: 'destructive',
        onPress: async () => {
          try {
            await api(`/admin/products/${p.id}`, { method: 'DELETE' })
            load()
          } catch (e) {
            Alert.alert('Error', e instanceof Error ? e.message : '')
          }
        },
      },
    ])
  }

  return (
    <AdminShell
      title={t('app.products')}
      actions={
        <Button small label={`+ ${t('app.addProduct')}`} onPress={() => router.push('/admin/product-form')} />
      }
    >
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
          keyExtractor={(r) => String(r.id)}
          renderItem={({ item }) => {
            const name = lang === 'ar' ? item.name_ar || item.name_en : item.name_en
            return (
              <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius, borderWidth: 1, borderColor: colors.border, padding: 10, opacity: item.is_active ? 1 : 0.55 }}>
                <ImgX uri={item.images?.[0]} style={{ width: 46, height: 46, borderRadius: 10 }} />
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.text, fontSize: 13, fontWeight: '700' }} numberOfLines={1}>{name}</Text>
                  <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', marginTop: 3 }}>
                    <Price amount={item.price} size={12} color={colors.text} />
                    <Text style={{ color: item.stock <= 5 ? colors.warning : colors.textMuted, fontSize: 10, fontWeight: '700' }}>
                      {t('app.stock')}: {item.stock}
                    </Text>
                  </View>
                </View>
                <Switch
                  value={item.is_active}
                  onValueChange={() => toggle(item)}
                  trackColor={{ true: colors.primary, false: colors.border }}
                  thumbColor="#fff"
                />
                <Pressable onPress={() => router.push(`/admin/product-form?id=${item.id}`)} hitSlop={8} style={{ padding: 4 }}>
                  <Ionicons name="create-outline" size={17} color={colors.primary} />
                </Pressable>
                <Pressable onPress={() => del(item)} hitSlop={8} style={{ padding: 4 }}>
                  <Ionicons name="trash-outline" size={17} color={colors.danger} />
                </Pressable>
              </View>
            )
          }}
          contentContainerStyle={{ gap: 8 }}
        />
      )}
    </AdminShell>
  )
}
