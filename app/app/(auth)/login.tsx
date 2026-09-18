import React, { useState } from 'react'
import { Alert, Pressable, Text, View } from 'react-native'
import { Link, router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { Screen } from '../../src/components/ui/Screen'
import { Button } from '../../src/components/ui/Button'
import { Input } from '../../src/components/ui/Input'
import { StoreHeader } from '../../src/components/StoreHeader'
import { useTheme } from '../../src/theme/ThemeContext'
import { useAuthStore } from '../../src/store/auth'
import { useUiStore } from '../../src/store/ui'
import { t } from '../../src/i18n'

export default function Login() {
  const { colors, radius } = useTheme()
  const brand = useUiStore((s) => s.brand)
  const login = useAuthStore((s) => s.login)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)

  const doLogin = async (e?: string, p?: string) => {
    const em = e ?? email
    const pw = p ?? password
    if (!em || !pw) return
    setBusy(true)
    try {
      const user = await login(em, pw)
      router.replace(user.role === 'admin' ? '/admin' : '/(shop)')
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Login failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Screen scroll>
      <View style={{ flex: 1, justifyContent: 'center', gap: 6 }}>
        <StoreHeader />
        <Text style={{ color: colors.text, fontSize: 24, fontWeight: '800', marginTop: 18 }}>{t('app.login')}</Text>
        <Text style={{ color: colors.textMuted, fontSize: 14 }}>{t('app.loginSubtitle')}</Text>

        <View style={{ marginTop: 16 }}>
          <Input
            label={t('app.email')}
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
          />
          <Input
            label={t('app.password')}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            onSubmitEditing={() => doLogin()}
          />
          <Button label={t('app.login')} onPress={() => doLogin()} loading={busy} />

          {brand?.payments?.demo ? (
            <View
              style={{
                marginTop: 16,
                backgroundColor: colors.surface,
                borderRadius: radius,
                borderWidth: 1,
                borderColor: colors.border,
                padding: 14,
                gap: 8,
              }}
            >
              <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: '700' }}>{t('app.demoHint')}:</Text>
              <Pressable onPress={() => doLogin('admin@nexshop.dev', 'Admin123!')} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="shield" size={15} color={colors.primary} />
                <Text style={{ color: colors.primary, fontSize: 13, fontWeight: '600' }}>admin@nexshop.dev / Admin123!</Text>
              </Pressable>
              <Pressable onPress={() => doLogin('customer@nexshop.dev', 'Customer123!')} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="person" size={15} color={colors.primary} />
                <Text style={{ color: colors.primary, fontSize: 13, fontWeight: '600' }}>customer@nexshop.dev / Customer123!</Text>
              </Pressable>
            </View>
          ) : null}

          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 4, marginTop: 18 }}>
            <Text style={{ color: colors.textMuted, fontSize: 14 }}>{t('app.noAccount')}</Text>
            <Link href="/register" asChild>
              <Pressable>
                <Text style={{ color: colors.primary, fontSize: 14, fontWeight: '700' }}>{t('app.register')}</Text>
              </Pressable>
            </Link>
          </View>
        </View>
      </View>
    </Screen>
  )
}
