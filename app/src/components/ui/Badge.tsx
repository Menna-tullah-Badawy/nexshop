import React from 'react'
import { Pressable, Text, View } from 'react-native'
import { useTheme } from '../../theme/ThemeContext'
import { t } from '../../i18n'

export function Chip({ label, active = false, onPress }: { label: string; active?: boolean; onPress?: () => void }) {
  const { colors, radius } = useTheme()
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 999,
        backgroundColor: active ? colors.primary : colors.surfaceAlt,
        marginRight: 8,
        opacity: pressed ? 0.8 : 1,
      })}
    >
      <Text style={{ color: active ? colors.onPrimary : colors.text, fontSize: 13, fontWeight: '600' }}>{label}</Text>
    </Pressable>
  )
}

export function StatusBadge({ status }: { status: string }) {
  const { colors } = useTheme()
  const map: Record<string, [string, string]> = {
    pending: [colors.warning, '#fff'],
    confirmed: [colors.primary, colors.onPrimary],
    packing: [colors.secondary, '#fff'],
    out_for_delivery: [colors.primary, colors.onPrimary],
    delivered: [colors.success, '#fff'],
    cancelled: [colors.danger, '#fff'],
  }
  const [bg, fg] = map[status] ?? [colors.surfaceAlt, colors.text]
  return (
    <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: bg, alignSelf: 'flex-start' }}>
      <Text style={{ color: fg, fontSize: 11, fontWeight: '700' }}>{t(`app.st_${status}`) ?? status}</Text>
    </View>
  )
}

export function PayBadge({ method, status }: { method: string; status: string }) {
  const { colors } = useTheme()
  const paid = status === 'paid'
  return (
    <View style={{ flexDirection: 'row', gap: 6 }}>
      <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, backgroundColor: colors.surfaceAlt }}>
        <Text style={{ color: colors.textMuted, fontSize: 10, fontWeight: '700' }}>
          {method === 'cod'
            ? 'COD'
            : method === 'vodafone_cash'
              ? 'VODAFONE CASH'
              : method === 'instapay'
                ? 'INSTAPAY'
                : method === 'fawry'
                  ? 'FAWRY'
                  : 'STRIPE'}
        </Text>
      </View>
      <View
        style={{
          paddingHorizontal: 8,
          paddingVertical: 3,
          borderRadius: 999,
          backgroundColor: paid ? 'rgba(22,163,74,0.15)' : 'rgba(217,119,6,0.15)',
        }}
      >
        <Text style={{ color: paid ? colors.success : colors.warning, fontSize: 10, fontWeight: '700' }}>
          {paid ? t('app.paid') : t('app.unpaid')}
        </Text>
      </View>
    </View>
  )
}
