import React, { useCallback, useEffect, useState } from 'react'
import { Alert, FlatList, Switch, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Pressable } from 'react-native'
import { AdminShell } from '../../src/components/admin/AdminShell'
import { Button } from '../../src/components/ui/Button'
import { Input } from '../../src/components/ui/Input'
import { Select } from '../../src/components/ui/Select'
import { Spinner } from '../../src/components/ui/EmptyState'
import { useTheme } from '../../src/theme/ThemeContext'
import { api } from '../../src/lib/api'
import { t } from '../../src/i18n'

interface Promo {
  id: number
  code: string
  type: string
  value: number
  min_order: number
  active: boolean
}

export default function AdminPromos() {
  const { colors, radius } = useTheme()
  const [rows, setRows] = useState<Promo[] | null>(null)
  const [code, setCode] = useState('')
  const [type, setType] = useState('percent')
  const [value, setValue] = useState('')
  const [minOrder, setMinOrder] = useState('')
  const [busy, setBusy] = useState(false)

  const load = useCallback(() => {
    api<Promo[]>('/admin/promos').then(setRows).catch(() => setRows([]))
  }, [])
  useEffect(load, [load])

  const add = async () => {
    if (!code || !value) return
    setBusy(true)
    try {
      await api('/admin/promos', {
        method: 'POST',
        body: { code, type, value: Number(value), min_order: Number(minOrder) || 0 },
      })
      setCode('')
      setValue('')
      setMinOrder('')
      load()
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : '')
    } finally {
      setBusy(false)
    }
  }

  const del = (p: Promo) => {
    Alert.alert(t('app.delete'), p.code, [
      { text: t('app.cancel'), style: 'cancel' },
      {
        text: t('app.delete'),
        style: 'destructive',
        onPress: async () => {
          await api(`/admin/promos/${p.id}`, { method: 'DELETE' })
          load()
        },
      },
    ])
  }

  return (
    <AdminShell title={t('app.promos')}>
      <View style={{ backgroundColor: colors.surface, borderRadius: radius, borderWidth: 1, borderColor: colors.border, padding: 14, gap: 4 }}>
        <Text style={{ color: colors.text, fontWeight: '800', fontSize: 14, marginBottom: 4 }}>{t('app.addPromo')}</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Input label={t('app.code')} style={{ flex: 1 }} value={code} onChangeText={setCode} autoCapitalize="characters" placeholder="SUMMER20" />
          <View style={{ flex: 1 }}>
            <Select
              label={t('app.type')}
              value={type}
              onSelect={setType}
              options={[
                { value: 'percent', label: t('app.percent') },
                { value: 'fixed', label: t('app.fixed') },
              ]}
            />
          </View>
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Input label={t('app.value')} style={{ flex: 1 }} value={value} onChangeText={setValue} keyboardType="decimal-pad" />
          <Input label={t('app.minOrder')} style={{ flex: 1 }} value={minOrder} onChangeText={setMinOrder} keyboardType="decimal-pad" />
        </View>
        <Button small label={t('app.save')} onPress={add} loading={busy} />
      </View>

      {rows === null ? (
        <Spinner />
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(p) => String(p.id)}
          contentContainerStyle={{ gap: 8, marginTop: 10 }}
          renderItem={({ item }) => (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.surface, borderRadius: radius, borderWidth: 1, borderColor: colors.border, padding: 12 }}>
              <View style={{ width: 34, height: 34, borderRadius: 9, backgroundColor: colors.primarySoft, justifyContent: 'center', alignItems: 'center' }}>
                <Ionicons name="pricetag" size={16} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.text, fontSize: 14, fontWeight: '800' }}>{item.code}</Text>
                <Text style={{ color: colors.textMuted, fontSize: 11 }}>
                  {item.type === 'percent' ? `${item.value}%` : item.value} · {t('app.minOrder')}: {item.min_order}
                </Text>
              </View>
              <Switch
                value={item.active}
                onValueChange={async (v) => {
                  await api(`/admin/promos/${item.id}`, {
                    method: 'PUT',
                    body: { code: item.code, type: item.type, value: item.value, min_order: item.min_order, active: v },
                  })
                  load()
                }}
                trackColor={{ true: colors.primary, false: colors.border }}
                thumbColor="#fff"
              />
              <Pressable hitSlop={8} onPress={() => del(item)}>
                <Ionicons name="trash-outline" size={17} color={colors.danger} />
              </Pressable>
            </View>
          )}
        />
      )}
    </AdminShell>
  )
}
