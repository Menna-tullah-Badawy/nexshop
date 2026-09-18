import React, { useEffect, useState } from 'react'
import { Alert, Pressable, ScrollView, Switch, Text, View } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import * as ImagePicker from 'expo-image-picker'
import { AdminShell } from '../../src/components/admin/AdminShell'
import { Button } from '../../src/components/ui/Button'
import { Input, TextArea } from '../../src/components/ui/Input'
import { Select } from '../../src/components/ui/Select'
import { Spinner } from '../../src/components/ui/EmptyState'
import { useTheme } from '../../src/theme/ThemeContext'
import { api, uploadFile } from '../../src/lib/api'
import type { Category, Product } from '../../src/lib/types'
import { t } from '../../src/i18n'

export default function ProductForm() {
  const { id } = useLocalSearchParams<{ id?: string }>()
  const router = useRouter()
  const { colors, radius } = useTheme()
  const isNew = !id

  const [cats, setCats] = useState<Category[]>([])
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(!isNew)
  const [f, setF] = useState({
    name_ar: '',
    name_en: '',
    slug: '',
    category_id: '',
    desc_ar: '',
    desc_en: '',
    brand: '',
    price: '',
    cost: '',
    stock: '',
    images: '',
    variants: '',
    is_featured: false,
    is_active: true,
    sale_price: '',
    sale_ends_at: '',
  })
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    api<{ items: Category[] } | Category[]>('/admin/categories')
      .then((d) => setCats(Array.isArray(d) ? d : (d as { items: Category[] }).items))
      .catch(() => undefined)
    if (isNew) return
    api<Product & { cost?: number; sale_price_raw?: number | null; sale_ends_at_raw?: string | null }>(`/admin/products/${id}`)
      .then((p) =>
        setF({
          name_ar: p.name_ar,
          name_en: p.name_en,
          slug: p.slug,
          category_id: p.category_id ? String(p.category_id) : '',
          desc_ar: p.desc_ar ?? '',
          desc_en: p.desc_en ?? '',
          brand: p.brand ?? '',
          price: String(p.price),
          cost: String(p.cost ?? 0),
          stock: String(p.stock),
          images: (p.images ?? []).join('\n'),
          variants: (p.variants ?? []).map((v) => `${v.label}: ${v.values.join(', ')}`).join('\n'),
          is_featured: p.is_featured,
          is_active: p.is_active,
          sale_price: p.sale_price_raw != null ? String(p.sale_price_raw) : '',
          sale_ends_at: p.sale_ends_at_raw ? p.sale_ends_at_raw.slice(0, 10) : '',
        }),
      )
      .finally(() => setLoading(false))
  }, [id, isNew])

  const parseVariants = (text: string) => {
    const out: { label: string; values: string[] }[] = []
    text.split('\n').forEach((line) => {
      const idx = line.indexOf(':')
      if (idx <= 0) return
      const label = line.slice(0, idx).trim()
      const values = line
        .slice(idx + 1)
        .split(',')
        .map((v) => v.trim())
        .filter(Boolean)
      if (label && values.length) out.push({ label, values })
    })
    return out.length ? out : null
  }

  const pickAndUploadImage = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync()
      if (!perm.granted) {
        Alert.alert(t('app.required'), t('app.uploadPerm'))
        return
      }
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.85,
      })
      if (res.canceled || !res.assets?.[0]) return
      const asset = res.assets[0]
      setUploading(true)
      const out = await uploadFile<{ url: string }>('/admin/upload', asset.uri, asset.fileName || 'photo.jpg')
      setF((prev) => ({ ...prev, images: prev.images ? `${prev.images}\n${out.url}` : out.url }))
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const submit = async () => {
    if (!f.name_ar && !f.name_en) {
      Alert.alert(t('app.required'), t('app.name'))
      return
    }
    setBusy(true)
    try {
      const salePrice = f.sale_price.trim() ? Number(f.sale_price) : null
      const body = {
        name_ar: f.name_ar,
        name_en: f.name_en,
        slug: f.slug || null,
        category_id: f.category_id ? Number(f.category_id) : null,
        desc_ar: f.desc_ar || null,
        desc_en: f.desc_en || null,
        brand: f.brand || null,
        price: Number(f.price) || 0,
        cost: Number(f.cost) || 0,
        sale_price: salePrice,
        sale_starts_at: salePrice != null ? new Date().toISOString() : null,
        sale_ends_at: salePrice != null && f.sale_ends_at ? `${f.sale_ends_at}T23:59:59Z` : null,
        stock: Number(f.stock) || 0,
        images: f.images.split('\n').map((s) => s.trim()).filter(Boolean),
        variants: parseVariants(f.variants),
        is_featured: f.is_featured,
        is_active: f.is_active,
      }
      if (isNew) {
        await api('/admin/products', { method: 'POST', body })
      } else {
        await api(`/admin/products/${id}`, { method: 'PUT', body })
      }
      router.back()
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Save failed')
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return (
      <AdminShell title={t('app.editProduct')}>
        <Spinner />
      </AdminShell>
    )
  }

  return (
    <AdminShell title={isNew ? t('app.addProduct') : t('app.editProduct')}>
      <ScrollView contentContainerStyle={{ gap: 4, paddingBottom: 30 }} keyboardShouldPersistTaps="handled">
        <Input label={t('app.nameAr')} value={f.name_ar} onChangeText={(v) => setF({ ...f, name_ar: v })} />
        <Input label={t('app.nameEn')} value={f.name_en} onChangeText={(v) => setF({ ...f, name_en: v })} />
        <Input label={t('app.slug')} value={f.slug} onChangeText={(v) => setF({ ...f, slug: v })} autoCapitalize="none" />
        <Select
          label={t('app.category')}
          value={f.category_id}
          onSelect={(v) => setF({ ...f, category_id: v })}
          placeholder={t('app.category')}
          options={cats.map((c) => ({ value: String(c.id), label: `${c.name_ar} / ${c.name_en}` }))}
        />
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Input label={t('app.price')} style={{ flex: 1 }} value={f.price} onChangeText={(v) => setF({ ...f, price: v })} keyboardType="decimal-pad" />
          <Input label={t('app.cost')} style={{ flex: 1 }} value={f.cost} onChangeText={(v) => setF({ ...f, cost: v })} keyboardType="decimal-pad" />
          <Input label={t('app.stock')} style={{ flex: 1 }} value={f.stock} onChangeText={(v) => setF({ ...f, stock: v })} keyboardType="number-pad" />
        </View>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Input label={`⚡ ${t('app.salePrice')}`} style={{ flex: 1 }} value={f.sale_price} onChangeText={(v) => setF({ ...f, sale_price: v })} keyboardType="decimal-pad" placeholder={t('app.salePricePh')} />
          <Input label={t('app.saleEnds')} style={{ flex: 1 }} value={f.sale_ends_at} onChangeText={(v) => setF({ ...f, sale_ends_at: v })} placeholder="YYYY-MM-DD" autoCapitalize="none" />
        </View>
        <Input label={t('app.brand')} value={f.brand} onChangeText={(v) => setF({ ...f, brand: v })} />
        <TextArea label={`${t('app.images')}`} value={f.images} onChangeText={(v) => setF({ ...f, images: v })} autoCapitalize="none" />
        <Button variant="outline" label={uploading ? t('app.uploading') : `📷 ${t('app.uploadImage')}`} onPress={pickAndUploadImage} loading={uploading} />
        <TextArea label={t('app.variants')} value={f.variants} onChangeText={(v) => setF({ ...f, variants: v })} />
        <Text style={{ color: colors.textMuted, fontSize: 11, marginTop: -8, marginBottom: 10 }}>{t('app.variantsHint')}</Text>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius, borderWidth: 1, borderColor: colors.border, padding: 14, marginBottom: 8 }}>
          <Text style={{ color: colors.text, fontSize: 14, fontWeight: '600' }}>{t('app.featured')}</Text>
          <Switch value={f.is_featured} onValueChange={(v) => setF({ ...f, is_featured: v })} trackColor={{ true: colors.primary, false: colors.border }} thumbColor="#fff" />
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius, borderWidth: 1, borderColor: colors.border, padding: 14 }}>
          <Text style={{ color: colors.text, fontSize: 14, fontWeight: '600' }}>{t('app.active')}</Text>
          <Switch value={f.is_active} onValueChange={(v) => setF({ ...f, is_active: v })} trackColor={{ true: colors.primary, false: colors.border }} thumbColor="#fff" />
        </View>

        <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
          <Button label={t('app.save')} onPress={submit} loading={busy} style={{ flex: 1 }} />
          <Button variant="outline" label={t('app.cancel')} onPress={() => router.back()} style={{ flex: 1 }} />
        </View>
      </ScrollView>
    </AdminShell>
  )
}
