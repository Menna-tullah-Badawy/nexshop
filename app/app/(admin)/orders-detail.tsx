import React, { useCallback, useEffect, useState } from 'react'
import { Alert, ScrollView, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { AdminShell } from '../../src/components/admin/AdminShell'
import { Button } from '../../src/components/ui/Button'
import { Input } from '../../src/components/ui/Input'
import { PayBadge, StatusBadge } from '../../src/components/ui/Badge'
import { Price } from '../../src/components/ui/Price'
import { ImgX } from '../../src/components/ui/ImgX'
import { Spinner } from '../../src/components/ui/EmptyState'
import { StatusTimeline } from '../../src/components/StatusTimeline'
import { useTheme } from '../../src/theme/ThemeContext'
import { useUiStore } from '../../src/store/ui'
import { api } from '../../src/lib/api'
import { fmtDate } from '../../src/lib/format'
import { openInvoice, openShippingLabel, whatsappOrderLink } from '../../src/lib/print'
import type { Order } from '../../src/lib/types'
import { t } from '../../src/i18n'

const FLOW: { s: string; next: string }[] = [
  { s: 'pending', next: 'confirmed' },
  { s: 'confirmed', next: 'packing' },
  { s: 'packing', next: 'out_for_delivery' },
  { s: 'out_for_delivery', next: 'delivered' },
]

export default function AdminOrderDetail() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const { colors, radius } = useTheme()
  const lang = useUiStore((s) => s.lang)
  const brand = useUiStore((s) => s.brand)
  const [o, setO] = useState<Order | null>(null)
  const [busy, setBusy] = useState(false)
  const [courier, setCourier] = useState({ name: '', phone: '', notes: '' })

  const load = useCallback(() => {
    if (!id) return
    api<Order>(`/admin/orders/${id}`)
      .then((d) => {
        setO(d)
        setCourier({ name: d.courier_name ?? '', phone: d.courier_phone ?? '', notes: d.notes ?? '' })
      })
      .catch(() => undefined)
  }, [id])

  useEffect(load, [load])

  const patch = async (body: Record<string, unknown>) => {
    if (!o) return
    setBusy(true)
    try {
      const d = await api<Order>(`/admin/orders/${o.id}`, { method: 'PATCH', body })
      setO(d)
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : '')
    } finally {
      setBusy(false)
    }
  }

  if (!o) {
    return (
      <AdminShell title={t('app.ordersTitle')}>
        <Spinner />
      </AdminShell>
    )
  }

  const step = FLOW.find((x) => x.s === o.status)
  const a = o.address

  return (
    <AdminShell title={o.order_no} actions={<StatusBadge status={o.status} />}>
      <ScrollView contentContainerStyle={{ gap: 12, paddingBottom: 30 }} keyboardShouldPersistTaps="handled">
        <View style={{ backgroundColor: colors.surface, borderRadius: radius, borderWidth: 1, borderColor: colors.border, padding: 14 }}>
          <StatusTimeline status={o.status} />
        </View>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {step ? (
            <Button small label={`${t('app.advance')}: ${t(`app.st_${step.next}`)}`} onPress={() => patch({ status: step.next })} loading={busy} />
          ) : null}
          {o.payment_status !== 'paid' ? (
            <Button
              small
              variant="outline"
              label={t('app.markPaid')}
              loading={busy}
              onPress={async () => {
                setBusy(true)
                try {
                  const d = await api<Order>(`/admin/orders/${o.id}/mark-paid`, { method: 'POST' })
                  setO(d)
                } catch (e) {
                  Alert.alert('Error', e instanceof Error ? e.message : '')
                } finally {
                  setBusy(false)
                }
              }}
            />
          ) : null}
          <Button
            small
            variant="outline"
            label={`🟢 ${t('app.sendWhatsapp')}`}
            onPress={() => {
              const url = whatsappOrderLink(o, t(`app.st_${o.status}`), brand?.store_name ?? 'Store')
              if (typeof window !== 'undefined') window.open(url, '_blank')
            }}
          />
          <Button small variant="outline" label={`🖨 ${t('app.printLabel')}`} onPress={() => openShippingLabel(o, brand?.store_name ?? 'Store')} />
          <Button
            small
            variant="outline"
            label={`🧾 ${t('app.printInvoice')}`}
            onPress={() => openInvoice(o, brand?.store_name ?? 'Store', { phone: brand?.contact?.phone, email: brand?.contact?.email })}
          />
          {o.status !== 'cancelled' && o.status !== 'delivered' ? (
            <Button
              small
              variant="danger"
              label={t('app.cancel')}
              onPress={() =>
                Alert.alert(t('app.confirmDelete'), '', [
                  { text: t('app.cancel'), style: 'cancel' },
                  { text: t('app.confirmDelete'), style: 'destructive', onPress: () => patch({ status: 'cancelled' }) },
                ])
              }
            />
          ) : null}
        </View>

        <View style={{ backgroundColor: colors.surface, borderRadius: radius, borderWidth: 1, borderColor: colors.border, padding: 12, gap: 8 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ color: colors.text, fontWeight: '800', fontSize: 14 }}>{o.customer_name}</Text>
            <PayBadge method={o.payment_method} status={o.payment_status} />
          </View>
          <Text style={{ color: colors.textMuted, fontSize: 12 }}>{o.customer_phone}</Text>
          <Text style={{ color: colors.textMuted, fontSize: 12 }}>
            {[o.governorate, a?.city, a?.street].filter(Boolean).join(' — ')}
          </Text>
          {o.notes ? <Text style={{ color: colors.textMuted, fontSize: 11 }}>{t('app.notes')}: {o.notes}</Text> : null}
          <Text style={{ color: colors.textMuted, fontSize: 11 }}>{fmtDate(o.created_at, lang)}</Text>
        </View>

        <View style={{ backgroundColor: colors.surface, borderRadius: radius, borderWidth: 1, borderColor: colors.border, padding: 12, gap: 10 }}>
          {o.items.map((it) => (
            <View key={it.id} style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
              <ImgX uri={it.image} style={{ width: 44, height: 44, borderRadius: 10 }} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.text, fontSize: 13, fontWeight: '600' }} numberOfLines={1}>
                  {(lang === 'ar' ? it.name_ar : it.name_en) || it.name_en}
                </Text>
                <Text style={{ color: colors.textMuted, fontSize: 11 }}>{it.variant ? `${it.variant} · ` : ''}× {it.qty}</Text>
              </View>
              <Price amount={it.line_total * o.rate} size={13} color={colors.text} />
            </View>
          ))}
          <View style={{ height: 1, backgroundColor: colors.border }} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ color: colors.textMuted, fontSize: 12 }}>{t('app.subtotal')}</Text>
            <Price amount={o.subtotal} size={12} color={colors.text} />
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ color: colors.textMuted, fontSize: 12 }}>{t('app.delivery')}</Text>
            <Price amount={o.delivery_fee} size={12} color={colors.text} />
          </View>
          {o.discount > 0 ? (
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ color: colors.success, fontSize: 12 }}>{t('app.discount')} ({o.promo_code})</Text>
              <Price amount={o.discount} size={12} color={colors.success} />
            </View>
          ) : null}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ color: colors.text, fontWeight: '800' }}>{t('app.total')}</Text>
            <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
              <Price amount={o.total} size={16} />
              <Text style={{ color: colors.textMuted, fontSize: 10 }}>
                ({t('app.baseCurrency')}: {o.base_total} {o.currency === 'EGP' ? '' : '/base'})
              </Text>
            </View>
          </View>
        </View>

        <View style={{ backgroundColor: colors.surface, borderRadius: radius, borderWidth: 1, borderColor: colors.border, padding: 12, gap: 4 }}>
          <Text style={{ color: colors.text, fontWeight: '800', fontSize: 13, marginBottom: 6 }}>{t('app.courier')}</Text>
          <Input label={t('app.courierName')} value={courier.name} onChangeText={(v) => setCourier({ ...courier, name: v })} />
          <Input label={t('app.courierPhone')} value={courier.phone} onChangeText={(v) => setCourier({ ...courier, phone: v })} keyboardType="phone-pad" />
          <Button small label={t('app.save')} onPress={() => patch({ courier_name: courier.name, courier_phone: courier.phone, notes: courier.notes })} loading={busy} />
        </View>
      </ScrollView>
    </AdminShell>
  )
}
