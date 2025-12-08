import { getRequestConfig } from 'next-intl/server';
import {
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
  getMessages,
  type SupportedLocale,
} from '@strike/shared-i18n';

export default getRequestConfig(async ({ requestLocale }) => {
  // This typically corresponds to the `[locale]` segment
  let locale = await requestLocale;

  // Ensure that a valid locale is used
  if (!locale || !SUPPORTED_LOCALES.includes(locale as SupportedLocale)) {
    locale = DEFAULT_LOCALE;
  }

  const safeLocale = locale as SupportedLocale;

  return {
    locale: safeLocale,
    messages: getMessages(safeLocale),
  };
});

