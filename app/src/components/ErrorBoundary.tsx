import React from 'react'
import { Pressable, Text, View } from 'react-native'
import { t } from '../i18n'

interface State {
  hasError: boolean
  message: string
}

/** Top-level error boundary: shows a friendly recovery screen instead of crashing. */
export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { hasError: false, message: '' }

  static getDerivedStateFromError(err: unknown): State {
    return { hasError: true, message: err instanceof Error ? err.message : String(err) }
  }

  render() {
    if (!this.state.hasError) return this.props.children
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, backgroundColor: '#0f1115' }}>
        <Text style={{ fontSize: 44 }}>😵</Text>
        <Text style={{ color: '#fff', fontSize: 18, fontWeight: '800', marginTop: 12 }}>{t('app.errorTitle')}</Text>
        <Text style={{ color: '#9ca3af', fontSize: 13, textAlign: 'center', marginTop: 8, maxWidth: 420 }}>
          {this.state.message || t('app.errorBody')}
        </Text>
        <Pressable
          onPress={() => this.setState({ hasError: false, message: '' })}
          style={{ marginTop: 20, paddingHorizontal: 22, paddingVertical: 12, borderRadius: 10, backgroundColor: '#6C4DF6' }}
        >
          <Text style={{ color: '#fff', fontWeight: '700' }}>{t('app.retry')}</Text>
        </Pressable>
      </View>
    )
  }
}
