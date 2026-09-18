import { create } from 'zustand'
import { api } from '../lib/api'
import { kv } from '../lib/storage'
import { registerTokenProvider } from '../lib/tokenRegistry'
import type { TokenOut, User } from '../lib/types'

registerTokenProvider(() => useAuthStore.getState().accessToken)

const K_AT = 'nexshop_at'
const K_RT = 'nexshop_rt'
const K_USER = 'nexshop_user'

interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  hydrated: boolean
  hydrate: () => Promise<void>
  login: (email: string, password: string) => Promise<User>
  register: (email: string, password: string, fullName: string, phone?: string) => Promise<User>
  logout: () => Promise<void>
  updateUser: (u: User) => void
  tryRefresh: () => Promise<boolean>
}

function saveSession(t: TokenOut) {
  void kv.set(K_AT, t.access_token)
  void kv.set(K_RT, t.refresh_token)
  void kv.set(K_USER, JSON.stringify(t.user))
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  hydrated: false,

  hydrate: async () => {
    const at = await kv.get(K_AT)
    const rt = await kv.get(K_RT)
    const u = await kv.get(K_USER)
    if (at && rt) {
      let user: User | null = null
      try {
        user = JSON.parse(u || 'null')
      } catch {
        user = null
      }
      set({ accessToken: at, refreshToken: rt, user, hydrated: true })
    } else {
      set({ hydrated: true })
    }
  },

  login: async (email, password) => {
    const t = await api<TokenOut>('/auth/login', { method: 'POST', body: { email, password }, auth: false })
    saveSession(t)
    set({ user: t.user, accessToken: t.access_token, refreshToken: t.refresh_token })
    return t.user
  },

  register: async (email, password, fullName, phone) => {
    const t = await api<TokenOut>('/auth/register', {
      method: 'POST',
      body: { email, password, full_name: fullName, phone: phone || null },
      auth: false,
    })
    saveSession(t)
    set({ user: t.user, accessToken: t.access_token, refreshToken: t.refresh_token })
    return t.user
  },

  logout: async () => {
    await Promise.all([kv.del(K_AT), kv.del(K_RT), kv.del(K_USER)])
    set({ user: null, accessToken: null, refreshToken: null })
  },

  updateUser: (user) => {
    set({ user })
    void kv.set(K_USER, JSON.stringify(user))
  },

  tryRefresh: async () => {
    const rt = get().refreshToken || (await kv.get(K_RT))
    if (!rt) return false
    try {
      const t = await api<TokenOut>('/auth/refresh', { method: 'POST', body: { refresh_token: rt }, auth: false })
      saveSession(t)
      set({ user: t.user, accessToken: t.access_token, refreshToken: t.refresh_token })
      return true
    } catch {
      return false
    }
  },
}))
