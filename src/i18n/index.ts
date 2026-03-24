import { createI18n } from 'vue-i18n'
import enUS from './locales/en-US'
import zhCN from './locales/zh-CN'
import {
  DEFAULT_LOCALE,
  FALLBACK_LOCALE,
  LOCALE_STORAGE_KEY,
  type SupportedLocale,
} from '../types/i18n'

const messages = {
  'zh-CN': zhCN,
  'en-US': enUS,
} as const

export const i18nPlugin = createI18n({
  legacy: false,
  locale: DEFAULT_LOCALE,
  fallbackLocale: FALLBACK_LOCALE,
  globalInjection: false,
  messages,
  missingWarn: false,
  fallbackWarn: false,
})

export function i18n(strings: TemplateStringsArray, ...values: unknown[]) {
  const key = strings.reduce((result, segment, index) => {
    const value = index < values.length ? String(values[index]) : ''
    return result + segment + value
  }, '')

  return i18nPlugin.global.t(key)
}

function updateDocumentLanguage(locale: SupportedLocale) {
  document.documentElement.lang = locale
}

export function setLocale(locale: SupportedLocale) {
  i18nPlugin.global.locale.value = locale
  localStorage.setItem(LOCALE_STORAGE_KEY, locale)
  updateDocumentLanguage(locale)
}

export { messages }