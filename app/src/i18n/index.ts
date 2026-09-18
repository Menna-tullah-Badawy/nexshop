import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { Platform } from 'react-native'
import ar from './ar.json'
import en from './en.json'

export const t = (key: string) => i18n.t(key) as string

void i18n.use(initReactI18next).init({
  resources: {
    ar: { translation: ar },
    en: { translation: en },
  },
  lng: 'ar',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
})

/** Keep the document direction in sync on web (native uses I18nManager elsewhere). */
export function applyDirection(lang: 'ar' | 'en') {
  if (Platform.OS === 'web' && typeof document !== 'undefined') {
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'
    document.documentElement.lang = lang
  }
}

export default i18n
