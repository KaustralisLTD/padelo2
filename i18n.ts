import { notFound } from 'next/navigation';
import { getRequestConfig } from 'next-intl/server';

export const locales = ['en', 'es', 'ua', 'ru', 'ca', 'zh', 'nl', 'da', 'sv', 'de', 'no', 'it', 'fr', 'ar'] as const;
export type Locale = (typeof locales)[number];

export default getRequestConfig(async ({ requestLocale }) => {
  const locale = await requestLocale;
  
  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  try {
    const messages = (await import(`./messages/${locale}.json`)).default;
    return {
      locale,
      messages
    };
  } catch (error) {
    console.error(`[i18n] Failed to load messages for locale ${locale}:`, error);
    // Fallback to English if locale file is missing
    const fallbackMessages = (await import(`./messages/en.json`)).default;
    return {
      locale,
      messages: fallbackMessages
    };
  }
});


