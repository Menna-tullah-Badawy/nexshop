import React, { useState } from 'react'
import { Alert, Pressable, Text, View } from 'react-native'
import { Link, router } from 'expo-router'
import { Screen } from '../../src/components/ui/Screen'
import { Button } from '../../src/components/ui/Button'
import { Input } from '../../src/components/ui/Input'
import { useTheme } from '../../src/theme/ThemeContext'
import { useAuthStore } from '../../src/store/auth'
import { t } from '../../src/i18n'

export default function Register() {
  const { colors } = useTheme()
  const register = useAuthStore((s) => s.register)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async () => {
    if (!name || !email || password.length < 8) {
      Alert.alert('Error', 'All fields required · password min 8 chars')
      return
    }
    setBusy(true)
    try {
      await register(email, password, name, phone || undefined)
      router.replace('/(shop)')
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Register failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Screen scroll>
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <Text style={{ color: colors.text, fontSize: 24, fontWeight: '800' }}>{t('app.register')}</Text>
        <Text style={{ color: colors.textMuted, fontSize: 14, marginTop: 4 }}>{t('app.registerSubtitle')}</Text>
        <View style={{ marginTop: 20 }}>
          <Input label={t('app.name')} value={name} onChangeText={setName} />
          <Input label={t('app.email')} autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
          <Input label={t('app.phone')} value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="+20 ..." />
          <Input label={t('app.password')} secureTextEntry value={password} onChangeText={setPassword} />
          <Button label={t('app.register')} onPress={submit} loading={busy} />
          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 4, marginTop: 18 }}>
            <Text style={{ color: colors.textMuted, fontSize: 14 }}>{t('app.haveAccount')}</Text>
            <Link href="/login" asChild>
              <Pressable>
                <Text style={{ color: colors.primary, fontSize: 14, fontWeight: '700' }}>{t('app.login')}</Text>
              </Pressable>
            </Link>
          </View>
        </View>
      </View>
    </Screen>
  )
}
