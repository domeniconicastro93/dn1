export const SUPPORTED_LOCALES = [
  'en',
  'it',
  'fr',
  'es',
  'de',
  'pt',
  'ko',
  'th',
  'tr',
  'pl',
  'ar',
  'id',
  'vi',
  'tl',
  'ru',
  'zh',
  'ja',
] as const;

export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: SupportedLocale = 'en';

const LOCALE_LABELS: Record<SupportedLocale, string> = {
  en: 'English',
  it: 'Italiano',
  fr: 'Français',
  es: 'Español',
  de: 'Deutsch',
  pt: 'Português',
  ko: '한국어',
  th: 'ไทย',
  tr: 'Türkçe',
  pl: 'Polski',
  ar: 'العربية',
  id: 'Bahasa Indonesia',
  vi: 'Tiếng Việt',
  tl: 'Filipino',
  ru: 'Русский',
  zh: '中文',
  ja: '日本語',
};

const RTL_LOCALES: Set<SupportedLocale> = new Set(['ar']);

export function getLocaleName(locale: SupportedLocale): string {
  return LOCALE_LABELS[locale] ?? LOCALE_LABELS[DEFAULT_LOCALE];
}

export function getLocaleDirection(locale: SupportedLocale): 'ltr' | 'rtl' {
  return RTL_LOCALES.has(locale) ? 'rtl' : 'ltr';
}


