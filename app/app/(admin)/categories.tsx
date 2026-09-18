import React, { useCallback, useEffect, useState } from 'react'
import { Alert, FlatList, Pressable, Switch, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { AdminShell } from '../../src/components/admin/AdminShell'
import { Button } from '../../src/components/ui/Button'
import { Input } from '../../src/components/ui/Input'
import { ImgX } from '../../src/components/ui/ImgX'
import { Spinner } from '../../src/components/ui/EmptyState'
import { useTheme } from '../../src/theme/ThemeContext'
import { api } from '../../src/lib/api'
import { t } from '../../src/i18n'

interface Cat {
  id: number
  slug: string
  name_ar: string
  name_en: string
  desc_ar: string | null
  desc_en: string | null
  image_url: string | null
  is_active: boolean
  sort_order: number
}

const EMPTY = { name_ar: '', name_en: '', image_url: '' }

export default function AdminCategories() {
  const { colors, radius } = useTheme()
  const [rows, setRows] = useState<Cat[] | null>(null)
  const [editingId, setEditingId] = useState<number | 'new' | null>(null)
  const [f, setF] = useState(EMPTY)

  const load = useCallback(() => {
    api<Cat[]>('/admin/categories').then(setRows).catch(() => setRows([]))
  }, [])
  useEffect(load, [load])

  const save = async () => {
    if (!f.name_ar && !f.name_en) return
    try {
      if (editingId === 'new') {
        await api('/admin/categories', { method: 'POST', body: { ...f, desc_ar: null, desc_en: null, sort_order: 0 } })
      } else if (editingId) {
        const c = rows?.find((r) => r.id === editingId)
        await api(`/admin/categories/${editingId}`, {
          method: 'PUT',
          body: {
            name_ar: f.name_ar,
            name_en: f.name_en,
            desc_ar: c?.desc_ar ?? null,
            desc_en: c?.desc_en ?? null,
            image_url: f.image_url,
            is_active: c?.is_active ?? true,
            sort_order: c?.sort_order ?? 0,
          },
        })
      }
      setEditingId(null)
      setF(EMPTY)
      load()
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : '')
    }
  }

  const del = (c: Cat) => {
    Alert.alert(t('app.delete'), c.name_en || c.name_ar, [
      { text: t('app.cancel'), style: 'cancel' },
      {
        text: t('app.delete'),
        style: 'destructive',
        onPress: async () => {
          await api(`/admin/categories/${c.id}`, { method: 'DELETE' })
          load()
        },
      },
    ])
  }

  return (
    <AdminShell
      title={t('app.categories')}
      actions={<Button small label={`+ ${t('app.addCategory')}`} onPress={() => setEditingId('new')} />}
    >
      {editingId !== null ? (
        <View style={{ backgroundColor: colors.surface, borderRadius: radius, borderWidth: 1, borderColor: colors.border, padding: 14, gap: 4 }}>
          <Input label={t('app.nameAr')} value={f.name_ar} onChangeText={(v) => setF({ ...f, name_ar: v })} />
          <Input label={t('app.nameEn')} value={f.name_en} onChangeText={(v) => setF({ ...f, name_en: v })} />
          <Input label={t('app.logo')} value={f.image_url} onChangeText={(v) => setF({ ...f, image_url: v })} autoCapitalize="none" placeholder="https://..." />
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Button small label={t('app.save')} onPress={save} style={{ flex: 1 }} />
            <Button small variant="outline" label={t('app.cancel')} onPress={() => setEditingId(null)} style={{ flex: 1 }} />
          </View>
        </View>
      ) : null}

      {rows === null ? (
        <Spinner />
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(c) => String(c.id)}
          contentContainerStyle={{ gap: 8 }}
          renderItem={({ item }) => (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.surface, borderRadius: radius, borderWidth: 1, borderColor: colors.border, padding: 10 }}>
              <ImgX uri={item.image_url} style={{ width: 44, height: 44, borderRadius: 10 }} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.text, fontSize: 13, fontWeight: '700' }}>{item.name_ar}</Text>
                <Text style={{ color: colors.textMuted, fontSize: 11 }}>{item.name_en}</Text>
              </View>
              <Switch
                value={item.is_active}
                onValueChange={async (v) => {
                  await api(`/admin/categories/${item.id}`, {
                    method: 'PUT',
                    body: { name_ar: item.name_ar, name_en: item.name_en, image_url: item.image_url, is_active: v, sort_order: item.sort_order },
                  })
                  load()
                }}
                trackColor={{ true: colors.primary, false: colors.border }}
                thumbColor="#fff"
              />
              <Pressable
                hitSlop={8}
                onPress={() => {
                  setEditingId(item.id)
                  setF({ name_ar: item.name_ar, name_en: item.name_en, image_url: item.image_url ?? '' })
                }}
              >
                <Ionicons name="create-outline" size={17} color={colors.primary} />
              </Pressable>
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
