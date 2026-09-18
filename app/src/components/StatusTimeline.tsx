import React from 'react'
import { Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '../theme/ThemeContext'
import { useUiStore } from '../store/ui'
import { t } from '../i18n'

const STEPS = ['pending', 'confirmed', 'packing', 'out_for_delivery', 'delivered']

export function StatusTimeline({ status }: { status: string }) {
  const { colors } = useTheme()
  const lang = useUiStore((s) => s.lang)

  if (status === 'cancelled') {
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(220,38,38,0.1)', borderRadius: 12, padding: 14 }}>
        <Ionicons name="close-circle" size={26} color={colors.danger} />
        <Text style={{ color: colors.danger, fontWeight: '700' }}>{t('app.st_cancelled')}</Text>
      </View>
    )
  }

  const currentIdx = STEPS.indexOf(status)

  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
      {STEPS.map((s, i) => {
        const done = i <= currentIdx
        const isLast = i === STEPS.length - 1
        return (
          <View key={s} style={{ flex: 1, alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignSelf: 'stretch', alignItems: 'center' }}>
              <View style={{ flex: 1, height: 2, backgroundColor: i === 0 ? 'transparent' : done ? colors.primary : colors.border }} />
              <View
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 13,
                  backgroundColor: done ? colors.primary : colors.surfaceAlt,
                  borderWidth: 1.5,
                  borderColor: done ? colors.primary : colors.border,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                {done ? <Ionicons name="checkmark" size={14} color={colors.onPrimary} /> : null}
              </View>
              <View style={{ flex: 1, height: 2, backgroundColor: isLast ? 'transparent' : i < currentIdx ? colors.primary : colors.border }} />
            </View>
            <Text
              style={{
                color: done ? colors.primary : colors.textMuted,
                fontSize: lang === 'ar' ? 9 : 8.5,
                fontWeight: '700',
                marginTop: 6,
                textAlign: 'center',
              }}
              numberOfLines={2}
            >
              {t(`app.st_${s}`)}
            </Text>
          </View>
        )
      })}
    </View>
  )
}
