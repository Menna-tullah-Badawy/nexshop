import React, { useEffect, useState } from 'react'
import { ScrollView, Text, View } from 'react-native'
import { AdminShell } from '../../src/components/admin/AdminShell'
import { Select } from '../../src/components/ui/Select'
import { Spinner } from '../../src/components/ui/EmptyState'
import { useTheme } from '../../src/theme/ThemeContext'
import { useUiStore } from '../../src/store/ui'
import { api } from '../../src/lib/api'
import { t } from '../../src/i18n'

interface ProductReport {
  product_id: number | null
  name: string
  units_sold: number
  revenue: number
  orders: number
}
interface LowStock {
  id: number
  name: string
  stock: number
  threshold: number
}

export default function AdminReports() {
  const { colors, radius } = useTheme()
  const brand = useUiStore((s) => s.brand)
  const [days, setDays] = useState('30')
  const [rows, setRows] = useState<ProductReport[] | null>(null)
  const [low, setLow] = useState<LowStock[]>([])

  useEffect(() => {
    setRows(null)
    api<ProductReport[]>(`/admin/reports/products?days=${days}`)
      .then(setRows)
      .catch(() => setRows([]))
    api<LowStock[]>('/admin/reports/low-stock')
      .then(setLow)
      .catch(() => setLow([]))
  }, [days])

  const base = brand?.base_currency ?? ''
  const totalRevenue = (rows ?? []).reduce((n, r) => n + r.revenue, 0)
  const totalUnits = (rows ?? []).reduce((n, r) => n + r.units_sold, 0)

  return (
    <AdminShell title={t('app.reports')}>
      <ScrollView contentContainerStyle={{ gap: 14, paddingBottom: 30 }}>
        <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
          <View style={{ width: 180 }}>
            <Select
              value={days}
              onSelect={setDays}
              options={[
                { value: '7', label: t('app.last7') },
                { value: '30', label: t('app.last30') },
                { value: '90', label: t('app.last90') },
              ]}
            />
          </View>
          <View style={{ flex: 1, backgroundColor: colors.surface, borderRadius: radius, borderWidth: 1, borderColor: colors.border, padding: 12, flexDirection: 'row', justifyContent: 'space-around' }}>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ color: colors.textMuted, fontSize: 11 }}>{t('app.totalRevenue')}</Text>
              <Text style={{ color: colors.primary, fontWeight: '800', fontSize: 16 }}>
                {totalRevenue.toFixed(0)} {base}
              </Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ color: colors.textMuted, fontSize: 11 }}>{t('app.unitsSold')}</Text>
              <Text style={{ color: colors.text, fontWeight: '800', fontSize: 16 }}>{totalUnits}</Text>
            </View>
          </View>
        </View>

        {rows === null ? (
          <Spinner />
        ) : (
          <View style={{ backgroundColor: colors.surface, borderRadius: radius, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' }}>
            <View style={{ flexDirection: 'row', padding: 12, backgroundColor: colors.surfaceAlt }}>
              <Text style={{ flex: 3, color: colors.textMuted, fontSize: 12, fontWeight: '700' }}>{t('app.product')}</Text>
              <Text style={{ flex: 1, color: colors.textMuted, fontSize: 12, fontWeight: '700', textAlign: 'center' }}>{t('app.unitsSold')}</Text>
              <Text style={{ flex: 1, color: colors.textMuted, fontSize: 12, fontWeight: '700', textAlign: 'center' }}>{t('app.ordersTitle')}</Text>
              <Text style={{ flex: 1.4, color: colors.textMuted, fontSize: 12, fontWeight: '700', textAlign: 'right' }}>{t('app.totalRevenue')}</Text>
            </View>
            {rows.length === 0 ? (
              <Text style={{ color: colors.textMuted, fontSize: 13, padding: 16, textAlign: 'center' }}>{t('app.noData')}</Text>
            ) : (
              rows.map((r, i) => (
                <View key={`${r.product_id ?? i}-${i}`} style={{ flexDirection: 'row', padding: 12, borderTopWidth: 1, borderTopColor: colors.border, alignItems: 'center' }}>
                  <Text style={{ flex: 3, color: colors.text, fontSize: 13 }} numberOfLines={1}>
                    {r.name}
                  </Text>
                  <Text style={{ flex: 1, color: colors.text, fontSize: 13, textAlign: 'center' }}>{r.units_sold}</Text>
                  <Text style={{ flex: 1, color: colors.textMuted, fontSize: 12, textAlign: 'center' }}>{r.orders}</Text>
                  <Text style={{ flex: 1.4, color: colors.primary, fontSize: 13, fontWeight: '700', textAlign: 'right' }}>
                    {r.revenue.toFixed(0)} {base}
                  </Text>
                </View>
              ))
            )}
          </View>
        )}

        <Text style={{ color: colors.text, fontWeight: '800', fontSize: 15 }}>⚠️ {t('app.lowStockTitle')}</Text>
        {low.length === 0 ? (
          <Text style={{ color: colors.textMuted, fontSize: 13 }}>{t('app.noData')}</Text>
        ) : (
          low.map((p) => (
            <View key={p.id} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius, borderWidth: 1, borderColor: colors.border, padding: 12 }}>
              <Text style={{ color: colors.text, fontSize: 13, flex: 1 }} numberOfLines={1}>
                {p.name}
              </Text>
              <View style={{ paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999, backgroundColor: p.stock === 0 ? colors.danger : 'rgba(217,119,6,0.15)' }}>
                <Text style={{ color: p.stock === 0 ? '#fff' : colors.warning, fontSize: 12, fontWeight: '800' }}>
                  {p.stock === 0 ? t('app.outOfStock') : `${t('app.stockLeft')}: ${p.stock}`}
                </Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </AdminShell>
  )
}
