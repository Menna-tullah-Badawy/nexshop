import { Platform } from 'react-native'
import { currentToken, registerTokenProvider } from './tokenRegistry'

/**
 * API base auto-detection (development friendly, production via env):
 * 1. EXPO_PUBLIC_API_URL (set it for production / devcontainer)
 * 2. web inside the sandboxed preview host  -> map port 8081 => 8000
 * 3. web on localhost -> same origin (docker proxy)
 * 4. native -> Android emulator loopback
 */
export function apiBase(): string {
  const env = process.env.EXPO_PUBLIC_API_URL
  if (env) return env.replace(/\/+$/, '')
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.location) {
      const h = window.location.hostname
      const m = h.match(/^(\d+)-([^.]+)\./)
      if (m && !h.includes('localhost')) {
        return `https://8000-${m[2]}.e2b.app/api`
      }
      return '/api'
    }
    return '/api'
  }
  return 'http://10.0.2.2:8000/api'
}

export class ApiError extends Error {
  status: number
  constructor(status: number, detail: string) {
    super(detail)
    this.status = status
  }
}

interface ApiOpts {
  method?: string
  body?: unknown
  auth?: boolean
  _retried?: boolean
}

export async function api<T = unknown>(path: string, opts: ApiOpts = {}): Promise<T> {
  const accessToken = opts.auth === false ? null : currentToken()
  const res = await fetch(`${apiBase()}${path}`, {
    method: opts.method ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  })
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown> & T

  if (!res.ok) {
    if (res.status === 401 && opts.auth !== false && !opts._retried) {
      const { useAuthStore } = await import('../store/auth')
      const refreshed = await useAuthStore.getState().tryRefresh()
      if (refreshed) return api<T>(path, { ...opts, _retried: true })
    }
    const detail =
      typeof data?.detail === 'string'
        ? data.detail
        : JSON.stringify(data?.detail ?? { message: res.statusText })
    throw new ApiError(res.status, detail)
  }
  return data
}
