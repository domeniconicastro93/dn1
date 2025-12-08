"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_LOCALE = exports.SUPPORTED_LOCALES = void 0;
exports.getLocaleName = getLocaleName;
exports.getLocaleDirection = getLocaleDirection;
exports.SUPPORTED_LOCALES = [
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
exports.DEFAULT_LOCALE = 'en';
const LOCALE_LABELS = {
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
const RTL_LOCALES = new Set(['ar']);
function getLocaleName(locale) {
    return LOCALE_LABELS[locale] ?? LOCALE_LABELS[exports.DEFAULT_LOCALE];
}
function getLocaleDirection(locale) {
    return RTL_LOCALES.has(locale) ? 'rtl' : 'ltr';
}
