export declare const SUPPORTED_LOCALES: readonly ["en", "it", "fr", "es", "de", "pt", "ko", "th", "tr", "pl", "ar", "id", "vi", "tl", "ru", "zh", "ja"];
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];
export declare const DEFAULT_LOCALE: SupportedLocale;
export declare function getLocaleName(locale: SupportedLocale): string;
export declare function getLocaleDirection(locale: SupportedLocale): 'ltr' | 'rtl';
