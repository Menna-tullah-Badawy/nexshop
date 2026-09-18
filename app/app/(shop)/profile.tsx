import React, { useState } from 'react'
import { Alert, Linking, Platform, Pressable, ScrollView, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { Screen } from '../../src/components/ui/Screen'
import { Button } from '../../src/components/ui/Button'
import { Chip } from '../../src/components/ui/Badge'
import { Input } from '../../src/components/ui/Input'
import { Select } from '../../src/components/ui/Select'
import { EmptyState } from '../../src/components/ui/EmptyState'
import { useTheme } from '../../src/theme/ThemeContext'
import { useUiStore, PRESETS, THEME_NAMES } from '../../src/store/ui'
import { useAuthStore } from '../../src/store/auth'
import { api } from '../../src/lib/api'
import type { Address, Currency, User } from '../../src/lib/types'
import { t } from '../../src/i18n'

function SectionTitle({ children }: { children: React.ReactNode }) {
  const { colors } = useTheme()
  return <Text style={{ color: colors.text, fontWeight: '800', fontSize: 15, marginVertical: 10 }}>{children}</Text>
}

export default function Profile() {
  const { colors, radius } = useTheme()
  const lang = useUiStore((s) => s.lang)
  const setLang = useUiStore((s) => s.setLang)
  const brand = useUiStore((s) => s.brand)
  const preset = useUiStore((s) => s.themePreset)
  const setPreset = useUiStore((s) => s.setPreset)
  const mode = useUiStore((s) => s.themeMode)
  const setMode = useUiStore((s) => s.setMode)

  const user = useAuthStore((s) => s.user)
  const updateUser = useAuthStore((s) => s.updateUser)
  const logout = useAuthStore((s) => s.logout)

  const [showAddr, setShowAddr] = useState(false)
  const [addr, setAddr] = useState({ label: 'home', full_name: user?.full_name ?? '', phone: user?.phone ?? '', city: '', street: '', notes: '' })
  const [busyAddr, setBusyAddr] = useState(false)

  if (!user) {
    return (
      <Screen>
        <EmptyState icon="person-circle-outline" title={t('app.loginSubtitle')} />
        <Button label={t('app.login')} onPress={() => router.push('/login')} />
      </Screen>
    )
  }

  const currencies: Currency[] = brand?.currencies ?? []
  const cur = user.currency || brand?.base_currency || 'EGP'

  const saveCurrency = async (code: string) => {
    try {
      const u = await api<User>(`/auth/me`, { method: 'PATCH', body: { currency: code } })
      updateUser(u)
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : '')
    }
  }

  const saveAddress = async () => {
    if (!addr.full_name || !addr.phone) return
    setBusyAddr(true)
    try {
      await api('/auth/addresses', { method: 'POST', body: addr })
      const u = await api<User>(`/auth/me`)
      updateUser(u)
      setShowAddr(false)
      setAddr({ label: 'home', full_name: '', phone: '', city: '', street: '', notes: '' })
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : '')
    } finally {
      setBusyAddr(false)
    }
  }

  const delAddress = (id: number) => {
    Alert.alert(t('app.delete'), t('app.confirmDelete'), [
      { text: t('app.cancel'), style: 'cancel' },
      {
        text: t('app.delete'),
        style: 'destructive',
        onPress: async () => {
          try {
            await api(`/auth/addresses/${id}`, { method: 'DELETE' })
            const u = await api<User>(`/auth/me`)
            updateUser(u)
          } catch {}
        },
      },
    ])
  }

  return (
    <Screen pad={0}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 4 }}>
        <View style={{ backgroundColor: colors.surface, borderRadius: radius, borderWidth: 1, borderColor: colors.border, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: colors.primarySoft, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ color: colors.primary, fontSize: 20, fontWeight: '800' }}>{(user.full_name || user.email)[0]?.toUpperCase()}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.text, fontSize: 16, fontWeight: '800' }} numberOfLines={1}>{user.full_name || user.email}</Text>
            <Text style={{ color: colors.textMuted, fontSize: 12 }} numberOfLines={1}>{user.email}</Text>
          </View>
        </View>

        <SectionTitle>{t('app.currency')}</SectionTitle>
        <View style={{ backgroundColor: colors.surface, borderRadius: radius, borderWidth: 1, borderColor: colors.border, padding: 12 }}>
          <Text style={{ color: colors.textMuted, fontSize: 12, marginBottom: 8 }}>{t('app.currencyHint')}</Text>
          <Select
            value={cur}
            onSelect={saveCurrency}
            options={currencies.map((c) => ({
              value: c.code,
              label: lang === 'ar' ? c.name_ar : c.name_en,
              hint: <Text style={{ color: colors.textMuted, fontSize: 11 }}>{c.code}</Text>,
            }))}
          />
        </View>

        <SectionTitle>{t('app.language')}</SectionTitle>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Chip label="العربية" active={lang === 'ar'} onPress={() => setLang('ar')} />
          <Chip label="English" active={lang === 'en'} onPress={() => setLang('en')} />
        </View>

        <SectionTitle>{t('app.theme')}</SectionTitle>
        <View style={{ backgroundColor: colors.surface, borderRadius: radius, borderWidth: 1, borderColor: colors.border, padding: 12, gap: 10 }}>
          <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: '700' }}>{t('app.preset')}</Text>
          <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
            {THEME_NAMES.map((p) => (
              <Chip key={p} label={PRESETS[p].label[lang]} active={preset === p} onPress={() => setPreset(p)} />
            ))}
          </View>
          <View style={{ height: 1, backgroundColor: colors.border }} />
          <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: '700' }}>{t('app.theme')}</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Chip label={t('app.light')} active={mode === 'light'} onPress={() => setMode('light')} />
            <Chip label={t('app.dark')} active={mode === 'dark'} onPress={() => setMode('dark')} />
            <Chip label={t('app.system')} active={mode === 'system'} onPress={() => setMode('system')} />
          </View>
        </View>

        <SectionTitle>{t('app.addresses')}</SectionTitle>
        <View style={{ gap: 8 }}>
          {user.addresses.map((a: Address) => (
            <View key={a.id} style={{ flexDirection: 'row', gap: 10, backgroundColor: colors.surface, borderRadius: radius, borderWidth: 1, borderColor: colors.border, padding: 12 }}>
              <Ionicons name="home" size={18} color={colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.text, fontSize: 13, fontWeight: '700' }}>{a.full_name}</Text>
                <Text style={{ color: colors.textMuted, fontSize: 12 }} numberOfLines={1}>{a.phone} — {a.city} {a.street}</Text>
              </View>
              <Pressable onPress={() => delAddress(a.id!)} hitSlop={8}>
                <Ionicons name="trash-outline" size={17} color={colors.danger} />
              </Pressable>
            </View>
          ))}
          {user.addresses.length === 0 ? <Text style={{ color: colors.textMuted, fontSize: 12 }}>{t('app.noAddresses')}</Text> : null}
          <Button small variant="outline" label={`+ ${t('app.addAddress')}`} onPress={() => setShowAddr(!showAddr)} />
          {showAddr ? (
            <View style={{ backgroundColor: colors.surface, borderRadius: radius, borderWidth: 1, borderColor: colors.border, padding: 12 }}>
              <Input label={t('app.fullName')} value={addr.full_name} onChangeText={(v) => setAddr({ ...addr, full_name: v })} />
              <Input label={t('app.phone')} value={addr.phone} onChangeText={(v) => setAddr({ ...addr, phone: v })} keyboardType="phone-pad" />
              <Input label={t('app.city')} value={addr.city} onChangeText={(v) => setAddr({ ...addr, city: v })} />
              <Input label={t('app.street')} value={addr.street} onChangeText={(v) => setAddr({ ...addr, street: v })} />
              <Button small label={t('app.saveAddress')} onPress={saveAddress} loading={busyAddr} />
            </View>
          ) : null}
        </View>

        {brand?.contact ? (
          <>
            <SectionTitle>{t('app.contact')}</SectionTitle>
            <View style={{ backgroundColor: colors.surface, borderRadius: radius, borderWidth: 1, borderColor: colors.border, padding: 12, gap: 8 }}>
              {brand.contact.phone ? (
                <ContactRow icon="call" text={brand.contact.phone} onPress={() => Platform.OS === 'web' ? void 0 : Linking.openURL(`tel:${brand.contact.phone}`)} />
              ) : null}
              {brand.contact.email ? (
                <ContactRow icon="mail" text={brand.contact.email} onPress={() => Linking.openURL(`mailto:${brand.contact.email}`)} />
              ) : null}
              {brand.contact.address ? <ContactRow icon="location" text={brand.contact.address} /> : null}
            </View>
          </>
        ) : null}

        <View style={{ gap: 10, marginTop: 16 }}>
          {user.role === 'admin' ? (
            <Button label={t('app.adminPortal')} icon={<Ionicons name="shield" size={16} color={colors.onPrimary} />} onPress={() => router.push('/admin')} />
          ) : null}
          <Button
            variant="outline"
            label={t('app.logout')}
            icon={<Ionicons name="log-out-outline" size={16} color={colors.primary} />}
            onPress={async () => {
              await logout()
              router.replace('/login')
            }}
          />
        </View>
        <Text style={{ color: colors.textMuted, fontSize: 11, textAlign: 'center', marginVertical: 14 }}>
          NexShop Template v1.0
        </Text>
      </ScrollView>
    </Screen>
  )
}

function ContactRow({ icon, text, onPress }: { icon: string; text: string; onPress?: () => void }) {
  const { colors } = useTheme()
  return (
    <Pressable onPress={onPress} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <Ionicons name={icon as never} size={17} color={colors.primary} />
      <Text style={{ color: colors.text, fontSize: 13 }}>{text}</Text>
    </Pressable>
  )
}
