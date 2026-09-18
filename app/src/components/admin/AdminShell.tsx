import React from 'react'
import { Pressable, Text, View, useWindowDimensions } from 'react-native'
import { usePathname, useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '../../theme/ThemeContext'
import { useUiStore } from '../../store/ui'
import { t } from '../../i18n'

export const ADMIN_MENU: { key: string; icon: string; tkey: string }[] = [
  { key: '/admin', icon: 'grid', tkey: 'app.dashboard' },
  { key: '/admin/products', icon: 'cube', tkey: 'app.products' },
  { key: '/admin/categories', icon: 'pricetags', tkey: 'app.categories' },
  { key: '/admin/orders', icon: 'receipt', tkey: 'app.ordersTitle' },
  { key: '/admin/delivery', icon: 'car', tkey: 'app.deliveryTitle' },
  { key: '/admin/customers', icon: 'people', tkey: 'app.customers' },
  { key: '/admin/promos', icon: 'ticket', tkey: 'app.promos' },
  { key: '/admin/reports', icon: 'bar-chart', tkey: 'app.reports' },
  { key: '/admin/settings', icon: 'settings', tkey: 'app.settings' },
]

function isActive(path: string, key: string) {
  if (key === '/admin') return path === '/admin' || path === '/admin/'
  return path === key || path.startsWith(key + '/')
}

export function AdminShell({ title, children, actions }: { title?: string; children: React.ReactNode; actions?: React.ReactNode }) {
  const { colors, radius } = useTheme()
  const lang = useUiStore((s) => s.lang)
  const path = usePathname()
  const router = useRouter()
  const { width } = useWindowDimensions()
  const isWebWide = width > 900

  const NavButton = ({ item, horizontal = false }: { item: (typeof ADMIN_MENU)[number]; horizontal?: boolean }) => {
    const active = isActive(path, item.key)
    return (
      <Pressable
        onPress={() => router.push(item.key as never)}
        style={({ pressed }) => ({
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          paddingVertical: 11,
          paddingHorizontal: horizontal ? 14 : 14,
          borderRadius: horizontal ? 999 : radius,
          backgroundColor: active ? colors.primary : 'transparent',
          marginRight: 8,
          opacity: pressed ? 0.85 : 1,
        })}
      >
        <Ionicons name={item.icon as never} size={17} color={active ? colors.onPrimary : colors.textMuted} />
        <Text style={{ color: active ? colors.onPrimary : colors.text, fontSize: 14, fontWeight: '600' }}>{t(item.tkey)}</Text>
      </Pressable>
    )
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, flexDirection: 'row' }}>
      {isWebWide ? (
        <View style={{ width: 230, backgroundColor: colors.surface, borderEndWidth: 1, borderEndColor: colors.border, padding: 14, gap: 4 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14, padding: 6 }}>
            <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' }}>
              <Ionicons name="shield" size={17} color={colors.onPrimary} />
            </View>
            <Text style={{ color: colors.text, fontWeight: '800', fontSize: 15 }} numberOfLines={1}>
              {t('app.admin')}
            </Text>
          </View>
          {ADMIN_MENU.map((m) => (
            <NavButton key={m.key} item={m} />
          ))}
        </View>
      ) : null}

      <View style={{ flex: 1 }}>
        {!isWebWide ? (
          <View style={{ flexDirection: 'row', gap: 6, padding: 12, paddingBottom: 8, backgroundColor: colors.background }}>
            {ADMIN_MENU.map((m) => (
              <NavButton key={m.key} item={m} horizontal />
            ))}
          </View>
        ) : null}
        <View style={{ flex: 1, padding: isWebWide ? 20 : 14, gap: 14 }}>
          {(title || actions) ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
              {title ? <Text style={{ color: colors.text, fontSize: 20, fontWeight: '800' }}>{title}</Text> : <View />}
              {actions}
            </View>
          ) : null}
          {children}
        </View>
      </View>
    </View>
  )
}
