import { I18n } from 'i18n-js';
import en from '../../messages/en.json';
import it from '../../messages/it.json';

// Get device locale (simplified for Phase 3)
// TODO: Use expo-localization when available
const getDeviceLocale = () => {
  // For Phase 3, default to 'en'
  // In production, use: Localization.getLocales()[0]?.languageCode || 'en'
  return 'en';
};

// Supported locales (same as web)
const locales = [
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
];

const i18n = new I18n({
  en,
  it,
  // TODO: Add other language files
  // fr, es, de, pt, ko, th, tr, pl, ar, id, vi, tl, ru, zh, ja
});

// Set default locale
i18n.defaultLocale = 'en';
i18n.enableFallback = true;

// Get device locale and set it
const deviceLocale = getDeviceLocale();
const supportedLocale = locales.includes(deviceLocale) ? deviceLocale : 'en';
i18n.locale = supportedLocale;

export { i18n, locales };
export const t = (key: string, params?: Record<string, string | number>) => {
  return i18n.t(key, params);
};

