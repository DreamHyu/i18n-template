import { defineStore } from 'pinia'
import { setLocale } from '../i18n'
import { resolveInitialLocale, type SupportedLocale } from '../types/i18n'

type AppState = {
  locale: SupportedLocale
}

export const useAppStore = defineStore('app', {
  state: (): AppState => ({
    locale: resolveInitialLocale(),
  }),
  actions: {
    setLanguage(locale: SupportedLocale) {
      this.locale = locale
      setLocale(locale)
    },
  },
})
