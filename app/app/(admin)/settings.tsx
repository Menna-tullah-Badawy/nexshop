import React, { useEffect, useState } from 'react'
import { Alert, ScrollView, Switch, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { AdminShell } from '../../src/components/admin/AdminShell'
import { Button } from '../../src/components/ui/Button'
import { Input } from '../../src/components/ui/Input'
import { Select } from '../../src/components/ui/Select'
import { Spinner } from '../../src/components/ui/EmptyState'
import { useTheme } from '../../src/theme/ThemeContext'
import { useUiStore } from '../../src/store/ui'
import { api } from '../../src/lib/api'
import { t } from '../../src/i18n'

interface Rate {
  code: string
  rate: string
  enabled: boolean
}

const CURRENCIES = [
  { code: 'EGP', ar: 'جنيه مصري', en: 'Egyptian Pound' },
  { code: 'USD', ar: 'دولار', en: 'US Dollar' },
  { code: 'SAR', ar: 'ريال سعودي', en: 'Saudi Riyal' },
  { code: 'AED', ar: 'درهم إماراتي', en: 'UAE Dirham' },
  { code: 'KWD', ar: 'دينار كويتي', en: 'Kuwaiti Dinar' },
  { code: 'QAR', ar: 'ريال قطري', en: 'Qatari Riyal' },
  { code: 'BHD', ar: 'دينار بحريني', en: 'Bahraini Dinar' },
  { code: 'OMR', ar: 'ريال عُماني', en: 'Omani Rial' },
  { code: 'GBP', ar: 'جنيه إسترليني', en: 'British Pound' },
  { code: 'EUR', ar: 'يورو', en: 'Euro' },
]

interface Settings {
  store_name: string
  tagline_ar: string
  tagline_en: string
  logo_url: string | null
  primary_color: string
  theme_preset: string
  dark_default: boolean
  announcement_ar: string
  announcement_en: string
  base_currency: string
  currencies: { code: string; rate: number; enabled: boolean }[]
  delivery_enabled: boolean
  cod_enabled: boolean
  stripe_enabled: boolean
  stripe_secret_key: string | null
  demo_payments: boolean
  contact_phone: string | null
  contact_email: string | null
  contact_address: string | null
  social: Record<string, string>
}

function Title({ children }: { children: React.ReactNode }) {
  const { colors } = useTheme()
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginVertical: 12 }}>
      <View style={{ width: 4, height: 16, borderRadius: 2, backgroundColor: colors.primary }} />
      <Text style={{ color: colors.text, fontWeight: '800', fontSize: 15 }}>{children}</Text>
    </View>
  )
}

export default function AdminSettings() {
  const { colors, radius } = useTheme()
  const lang = useUiStore((s) => s.lang)
  const setPrimary = useUiStore((s) => s.setPrimary)
  const loadBrand = useUiStore((s) => s.loadBrand)
  const [s, setS] = useState<Settings | null>(null)
  const [rates, setRates] = useState<Rate[]>([])
  const [busy, setBusy] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    api<Settings>('/admin/settings')
      .then((d) => {
        setS(d)
        const base = d.base_currency
        const list: Rate[] = CURRENCIES.filter((c) => c.code !== base).map((c) => {
          const found = (d.currencies ?? []).find((r) => r.code === c.code)
          return { code: c.code, rate: String(found?.rate ?? 0.02), enabled: found?.enabled ?? false }
        })
        setRates(list)
      })
      .catch(() => setS(null))
  }, [])

  if (!s) {
    return (
      <AdminShell title={t('app.settings')}>
        <Spinner />
      </AdminShell>
    )
  }

  const set = (patch: Partial<Settings>) => setS({ ...s, ...patch })

  const save = async () => {
    setBusy(true)
    try {
      const body: Record<string, unknown> = {
        store_name: s.store_name,
        tagline_ar: s.tagline_ar,
        tagline_en: s.tagline_en,
        logo_url: s.logo_url || null,
        primary_color: s.primary_color,
        theme_preset: s.theme_preset,
        dark_default: s.dark_default,
        announcement_ar: s.announcement_ar,
        announcement_en: s.announcement_en,
        base_currency: s.base_currency,
        currencies: rates.filter((r) => Number(r.rate) > 0).map((r) => ({ code: r.code, rate: Number(r.rate), enabled: r.enabled })),
        delivery_enabled: s.delivery_enabled,
        cod_enabled: s.cod_enabled,
        stripe_enabled: s.stripe_enabled,
        demo_payments: s.demo_payments,
        contact_phone: s.contact_phone || null,
        contact_email: s.contact_email || null,
        contact_address: s.contact_address || null,
        social: s.social,
      }
      if (s.stripe_secret_key && s.stripe_secret_key.trim()) {
        body.stripe_secret_key = s.stripe_secret_key.trim()
      }
      await api('/admin/settings', { method: 'PUT', body })
      setPrimary(s.primary_color || null)
      await loadBrand(true)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : '')
    } finally {
      setBusy(false)
    }
  }

  const setRate = (code: string, patch: Partial<Rate>) =>
    setRates((rs) => rs.map((r) => (r.code === code ? { ...r, ...patch } : r)))

  return (
    <AdminShell
      title={t('app.settings')}
      actions={<Button small label={saved ? t('app.saved') : t('app.saveSettings')} onPress={save} loading={busy} />}
    >
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        <Title>{t('app.storeName')}</Title>
        <View style={{ backgroundColor: colors.surface, borderRadius: radius, borderWidth: 1, borderColor: colors.border, padding: 14, gap: 2 }}>
          <Input label={t('app.storeName')} value={s.store_name} onChangeText={(v) => set({ store_name: v })} />
          <Input label={t('app.taglineAr')} value={s.tagline_ar} onChangeText={(v) => set({ tagline_ar: v })} />
          <Input label={t('app.taglineEn')} value={s.tagline_en} onChangeText={(v) => set({ tagline_en: v })} />
          <Input label={t('app.logo')} value={s.logo_url ?? ''} onChangeText={(v) => set({ logo_url: v })} autoCapitalize="none" placeholder="https://.../logo.png" />
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Input
              label={t('app.primaryColor')}
              style={{ flex: 1 }}
              value={s.primary_color}
              onChangeText={(v) => set({ primary_color: v })}
              autoCapitalize="characters"
              placeholder="#6C4DF6"
            />
            <View style={{ flex: 1 }}>
              <Select
                label={t('app.preset')}
                value={s.theme_preset}
                onSelect={(v) => set({ theme_preset: v })}
                options={[
                  { value: 'aurora', label: 'Aurora' },
                  { value: 'minimal', label: 'Minimal' },
                  { value: 'lux', label: 'Lux' },
                  { value: 'vibrant', label: 'Vibrant' },
                  { value: 'marketplace', label: 'Marketplace' },
                ]}
              />
            </View>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
            <Text style={{ color: colors.text, fontSize: 13, fontWeight: '600' }}>{t('app.darkDefault')}</Text>
            <Switch value={s.dark_default} onValueChange={(v) => set({ dark_default: v })} trackColor={{ true: colors.primary, false: colors.border }} thumbColor="#fff" />
          </View>
          <Input label={t('app.announceAr')} value={s.announcement_ar} onChangeText={(v) => set({ announcement_ar: v })} />
          <Input label={t('app.announceEn')} value={s.announcement_en} onChangeText={(v) => set({ announcement_en: v })} />
        </View>

        <Title>{t('app.baseCurrency')}</Title>
        <View style={{ backgroundColor: colors.surface, borderRadius: radius, borderWidth: 1, borderColor: colors.border, padding: 14, gap: 4 }}>
          <Select
            label={t('app.baseCurrency')}
            value={s.base_currency}
            onSelect={(v) => {
              set({ base_currency: v })
              const list: Rate[] = CURRENCIES.filter((c) => c.code !== v).map((c) => {
                const old = rates.find((r) => r.code === c.code)
                return { code: c.code, rate: old?.rate ?? '0.02', enabled: old?.enabled ?? false }
              })
              setRates(list)
            }}
            options={CURRENCIES.map((c) => ({ value: c.code, label: lang === 'ar' ? `${c.ar} (${c.code})` : `${c.en} (${c.code})` }))}
          />
          <Text style={{ color: colors.textMuted, fontSize: 11, marginBottom: 6 }}>{t('app.rates')}</Text>
          {rates.map((r) => {
            const meta = CURRENCIES.find((c) => c.code === r.code)
            return (
              <View key={r.code} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 }}>
                <Text style={{ color: colors.text, fontSize: 13, fontWeight: '700', width: 44 }}>{r.code}</Text>
                <Text style={{ color: colors.textMuted, fontSize: 11, flex: 1 }} numberOfLines={1}>
                  {lang === 'ar' ? meta?.ar : meta?.en}
                </Text>
                <View style={{ width: 30, height: 30, borderRadius: 8, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, justifyContent: 'center', alignItems: 'center' }}>
                  <Ionicons name="swap-horizontal" size={14} color={colors.textMuted} />
                </View>
                <Input
                  value={r.rate}
                  onChangeText={(v) => setRate(r.code, { rate: v })}
                  keyboardType="decimal-pad"
                  placeholder="0.02"
                />
                <Switch value={r.enabled} onValueChange={(v) => setRate(r.code, { enabled: v })} trackColor={{ true: colors.primary, false: colors.border }} thumbColor="#fff" />
              </View>
            )
          })}
        </View>

        <Title>{t('app.payments')}</Title>
        <View style={{ backgroundColor: colors.surface, borderRadius: radius, borderWidth: 1, borderColor: colors.border, padding: 14, gap: 10 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ color: colors.text, fontSize: 13, fontWeight: '600' }}>{t('app.codEnabled')}</Text>
            <Switch value={s.cod_enabled} onValueChange={(v) => set({ cod_enabled: v })} trackColor={{ true: colors.primary, false: colors.border }} thumbColor="#fff" />
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ color: colors.text, fontSize: 13, fontWeight: '600' }}>{t('app.stripeEnabled')}</Text>
            <Switch value={s.stripe_enabled} onValueChange={(v) => set({ stripe_enabled: v })} trackColor={{ true: colors.primary, false: colors.border }} thumbColor="#fff" />
          </View>
          <Input label={t('app.stripeKey')} value={s.stripe_secret_key ?? ''} onChangeText={(v) => set({ stripe_secret_key: v })} autoCapitalize="none" placeholder="sk_test_..." secureTextEntry={false} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ color: colors.textMuted, fontSize: 12, flex: 1, marginRight: 10 }}>{t('app.demoPayments')}</Text>
            <Switch value={s.demo_payments} onValueChange={(v) => set({ demo_payments: v })} trackColor={{ true: colors.primary, false: colors.border }} thumbColor="#fff" />
          </View>
        </View>

        <Title>{t('app.deliveryTitle')}</Title>
        <View style={{ backgroundColor: colors.surface, borderRadius: radius, borderWidth: 1, borderColor: colors.border, padding: 14 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ color: colors.text, fontSize: 13, fontWeight: '600' }}>{t('app.deliveryEnabled')}</Text>
            <Switch value={s.delivery_enabled} onValueChange={(v) => set({ delivery_enabled: v })} trackColor={{ true: colors.primary, false: colors.border }} thumbColor="#fff" />
          </View>
        </View>

        <Title>{t('app.contact')}</Title>
        <View style={{ backgroundColor: colors.surface, borderRadius: radius, borderWidth: 1, borderColor: colors.border, padding: 14, gap: 2 }}>
          <Input label={t('app.phone')} value={s.contact_phone ?? ''} onChangeText={(v) => set({ contact_phone: v })} />
          <Input label={t('app.email')} value={s.contact_email ?? ''} onChangeText={(v) => set({ contact_email: v })} autoCapitalize="none" />
          <Input label="Address" value={s.contact_address ?? ''} onChangeText={(v) => set({ contact_address: v })} />
          <Input label="Instagram" value={s.social?.instagram ?? ''} onChangeText={(v) => set({ social: { ...s.social, instagram: v } })} autoCapitalize="none" />
          <Input label="Facebook" value={s.social?.facebook ?? ''} onChangeText={(v) => set({ social: { ...s.social, facebook: v } })} autoCapitalize="none" />
          <Input label="WhatsApp" value={s.social?.whatsapp ?? ''} onChangeText={(v) => set({ social: { ...s.social, whatsapp: v } })} />
        </View>

        <Button label={saved ? t('app.saved') : t('app.saveSettings')} onPress={save} loading={busy} style={{ marginTop: 18 }} />
      </ScrollView>
    </AdminShell>
  )
}
