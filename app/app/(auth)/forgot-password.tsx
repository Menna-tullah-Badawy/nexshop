import React, { useState } from 'react'
import { Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Screen } from '../../src/components/ui/Screen'
import { Button } from '../../src/components/ui/Button'
import { Input } from '../../src/components/ui/Input'
import { useTheme } from '../../src/theme/ThemeContext'
import { api, ApiError } from '../../src/lib/api'
import { t } from '../../src/i18n'

export default function ForgotPassword() {
  const { colors } = useTheme()
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)
  const [err, setErr] = useState('')

  const send = async () => {
    if (!email) return
    setBusy(true)
    setErr('')
    try {
      await api('/auth/forgot-password', { method: 'POST', body: { email }, auth: false })
      setSent(true)
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : 'Error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Screen scroll>
      <View style={{ flex: 1, justifyContent: 'center', gap: 8 }}>
        <Text style={{ color: colors.text, fontSize: 24, fontWeight: '800' }}>{t('app.forgotPassword')}</Text>
        <Text style={{ color: colors.textMuted, fontSize: 14 }}>{t('app.forgotBody')}</Text>

        {sent ? (
          <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center', marginTop: 16, padding: 14, borderRadius: 12, backgroundColor: 'rgba(22,163,74,0.12)' }}>
            <Ionicons name="mail-open" size={22} color={colors.success} />
            <Text style={{ color: colors.text, fontSize: 13, flex: 1, lineHeight: 20 }}>{t('app.resetSent')}</Text>
          </View>
        ) : (
          <View style={{ marginTop: 16 }}>
            <Input label={t('app.email')} autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} placeholder="you@example.com" />
            {err ? <Text style={{ color: colors.danger, fontSize: 12, marginBottom: 8 }}>{err}</Text> : null}
            <Button label={t('app.sendReset')} onPress={send} loading={busy} />
          </View>
        )}
      </View>
    </Screen>
  )
}
