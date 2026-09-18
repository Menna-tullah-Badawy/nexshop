import React, { useEffect, useState } from 'react'
import { Platform, Text, View } from 'react-native'
import { t } from '../i18n'

/** Thin banner shown while the device/browser is offline (web-first). */
export function OfflineBanner() {
  const [offline, setOffline] = useState(false)

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return
    const update = () => setOffline(!window.navigator.onLine)
    update()
    window.addEventListener('online', update)
    window.addEventListener('offline', update)
    return () => {
      window.removeEventListener('online', update)
      window.removeEventListener('offline', update)
    }
  }, [])

  if (!offline) return null
  return (
    <View style={{ backgroundColor: '#b45309', paddingVertical: 6, paddingHorizontal: 12, alignItems: 'center' }}>
      <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>📡 {t('app.offline')}</Text>
    </View>
  )
}
