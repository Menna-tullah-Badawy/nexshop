import { Platform } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import * as SecureStore from 'expo-secure-store'

/** Cross-platform key-value: SecureStore on native, localStorage on web. */
export const kv = {
  async get(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      try {
        return globalThis.localStorage.getItem(key)
      } catch {
        return null
      }
    }
    try {
      return await SecureStore.getItemAsync(key)
    } catch {
      try {
        return await AsyncStorage.getItem(key)
      } catch {
        return null
      }
    }
  },
  async set(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      try {
        globalThis.localStorage.setItem(key, value)
      } catch {
        /* ignore */
      }
      return
    }
    try {
      await SecureStore.setItemAsync(key, value)
    } catch {
      try {
        await AsyncStorage.setItem(key, value)
      } catch {
        /* ignore */
      }
    }
  },
  async del(key: string): Promise<void> {
    if (Platform.OS === 'web') {
      try {
        globalThis.localStorage.removeItem(key)
      } catch {
        /* ignore */
      }
      return
    }
    try {
      await SecureStore.deleteItemAsync(key)
    } catch {
      try {
        await AsyncStorage.removeItem(key)
      } catch {
        /* ignore */
      }
    }
  },
}

/** zustand persist storage adapter */
export const persistStorage = {
  getItem: (name: string) => kv.get(name),
  setItem: (name: string, value: string) => kv.set(name, value),
  removeItem: (name: string) => kv.del(name),
}
