import React from 'react'
import { Pressable, Text, View } from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '../theme/ThemeContext'
import { useUiStore } from '../store/ui'
import { useAuthStore } from '../store/auth'
import { ImgX } from './ui/ImgX'
import { apiBase } from '../lib/api'

export function StoreHeader() {
  const { colors, radius } = useTheme()
  const lang = useUiStore((s) => s.lang)
  const setLang = useUiStore((s) => s.setLang)
  const brand = useUiStore((s) => s.brand)
  const user = useAuthStore((s) => s.user)

  const logoUri = brand?.logo_url
    ? brand.logo_url.startsWith('http') || brand.logo_url.startsWith('data:')
      ? brand.logo_url
      : `${apiBase().replace(/\/api$/, '')}${brand.logo_url}`
    : null

  const name = lang === 'ar' && brand?.store_name_ar ? brand.store_name_ar : brand?.store_name || 'NexShop'
  const tagline = brand?.tagline?.[lang] || ''

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 }}>
      {logoUri ? <ImgX uri={logoUri} style={{ width: 40, height: 40, borderRadius: radius - 4 }} /> : null}
      <View style={{ flex: 1 }}>
        <Text style={{ color: colors.text, fontSize: 20, fontWeight: '800' }}>{name}</Text>
        {tagline ? <Text style={{ color: colors.textMuted, fontSize: 12 }} numberOfLines={1}>{tagline}</Text> : null}
      </View>
      {user?.role === 'admin' ? (
        <Pressable
          onPress={() => router.push('/admin')}
          style={{
            width: 38,
            height: 38,
            borderRadius: 19,
            backgroundColor: colors.primarySoft,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Ionicons name="shield" size={18} color={colors.primary} />
        </Pressable>
      ) : null}
      <Pressable
        onPress={() => setLang(lang === 'ar' ? 'en' : 'ar')}
        style={{
          width: 38,
          height: 38,
          borderRadius: 19,
          backgroundColor: colors.surfaceAlt,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Text style={{ color: colors.text, fontSize: 13, fontWeight: '800' }}>{lang === 'ar' ? 'EN' : 'ع'}</Text>
      </Pressable>
    </View>
  )
}
