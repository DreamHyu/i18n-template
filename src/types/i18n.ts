export const LOCALE_STORAGE_KEY = 'app_locale'

export const SUPPORTED_LOCALES = ['zh-CN', 'en-US'] as const

export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number]

export type FlatLocaleMessages = Readonly<Record<string, string>>

export const DEFAULT_LOCALE: SupportedLocale = 'zh-CN'

export const FALLBACK_LOCALE: SupportedLocale = 'zh-CN'

export function isSupportedLocale(value: string): value is SupportedLocale {
  return SUPPORTED_LOCALES.includes(value as SupportedLocale)
}

export function resolveInitialLocale(): SupportedLocale {
  const storedLocale = localStorage.getItem(LOCALE_STORAGE_KEY)

  if (storedLocale && isSupportedLocale(storedLocale)) {
    return storedLocale
  }

  return DEFAULT_LOCALE
}
