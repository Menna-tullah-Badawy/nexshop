import React, { useState } from 'react'
import { Text, View } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { Screen } from '../../src/components/ui/Screen'
import { Button } from '../../src/components/ui/Button'
import { Input } from '../../src/components/ui/Input'
import { useTheme } from '../../src/theme/ThemeContext'
import { api, ApiError } from '../../src/lib/api'
import { t } from '../../src/i18n'

export default function ResetPassword() {
  const { token } = useLocalSearchParams<{ token?: string }>()
  const { colors } = useTheme()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const [err, setErr] = useState('')

  const submit = async () => {
    setErr('')
    if (!token) {
      setErr(t('app.resetBadLink'))
      return
    }
    if (password.length < 8) {
      setErr(t('app.passwordShort'))
      return
    }
    if (password !== confirm) {
      setErr(t('app.passwordMismatch'))
      return
    }
    setBusy(true)
    try {
      await api('/auth/reset-password', { method: 'POST', body: { token, password }, auth: false })
      setDone(true)
      setTimeout(() => router.replace('/login'), 1800)
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : 'Error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Screen scroll>
      <View style={{ flex: 1, justifyContent: 'center', gap: 8 }}>
        <Text style={{ color: colors.text, fontSize: 24, fontWeight: '800' }}>{t('app.resetTitle')}</Text>
        {done ? (
          <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center', marginTop: 16, padding: 14, borderRadius: 12, backgroundColor: 'rgba(22,163,74,0.12)' }}>
            <Ionicons name="checkmark-circle" size={22} color={colors.success} />
            <Text style={{ color: colors.text, fontSize: 13, flex: 1 }}>{t('app.resetDone')}</Text>
          </View>
        ) : (
          <View style={{ marginTop: 16 }}>
            {!token ? <Text style={{ color: colors.danger, fontSize: 12, marginBottom: 8 }}>{t('app.resetBadLink')}</Text> : null}
            <Input label={t('app.newPassword')} secureTextEntry value={password} onChangeText={setPassword} placeholder="••••••••" />
            <Input label={t('app.confirmPassword')} secureTextEntry value={confirm} onChangeText={setConfirm} placeholder="••••••••" />
            {err ? <Text style={{ color: colors.danger, fontSize: 12, marginBottom: 8 }}>{err}</Text> : null}
            <Button label={t('app.resetSave')} onPress={submit} loading={busy} disabled={!token} />
          </View>
        )}
      </View>
    </Screen>
  )
}
