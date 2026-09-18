import React from 'react'
import { Text } from 'react-native'
import { useTheme } from '../../theme/ThemeContext'
import { useDisplayCurrency, useUiStore } from '../../store/ui'
import { fmtMoney, symbolMap } from '../../lib/format'

export function Price({
  amount,
  size = 16,
  color,
  muted = false,
  strike = false,
}: {
  amount: number
  size?: number
  color?: string
  muted?: boolean
  strike?: boolean
}) {
  const theme = useTheme()
  const lang = useUiStore((s) => s.lang)
  const brand = useUiStore((s) => s.brand)
  const currency = useDisplayCurrency()
  const rate = brand?.currencies.find((c) => c.code === currency)?.rate ?? 1
  return (
    <Text
      style={{
        fontSize: size,
        fontWeight: '800',
        color: color ?? (muted ? theme.colors.textMuted : theme.colors.primary),
        textDecorationLine: strike ? 'line-through' : undefined,
      }}
    >
      {fmtMoney(amount * rate, currency, lang, symbolMap(brand))}
    </Text>
  )
}
