// Translation utilities for automatic translation of tournament content

const SUPPORTED_LANGUAGES = ['en', 'ru', 'ua', 'es', 'fr', 'de', 'it', 'ca', 'nl', 'da', 'sv', 'no', 'ar', 'zh'];

/**
 * Map our locale codes to Google Translate API language codes
 * Google Translate uses 'uk' for Ukrainian, not 'ua'
 */
const GOOGLE_TRANSLATE_LOCALE_MAP: Record<string, string> = {
  'en': 'en',
  'ru': 'ru',
  'ua': 'uk', // КРИТИЧНО: Google Translate использует 'uk' для украинского, а не 'ua'!
  'es': 'es',
  'fr': 'fr',
  'de': 'de',
  'it': 'it',
  'ca': 'ca',
  'nl': 'nl',
  'da': 'da',
  'sv': 'sv',
  'no': 'no',
  'ar': 'ar',
  'zh': 'zh',
};

/**
 * Translate text using Google Translate API or fallback
 * Requires GOOGLE_TRANSLATE_API_KEY environment variable
 */
async function translateText(text: string, targetLang: string, sourceLang: string = 'en'): Promise<string> {
  if (!text || text.trim() === '') return text;
  if (targetLang === sourceLang) return text;
  if (!SUPPORTED_LANGUAGES.includes(targetLang)) return text;

  // Map our locale codes to Google Translate API codes
  const googleTargetLang = GOOGLE_TRANSLATE_LOCALE_MAP[targetLang] || targetLang;
  const googleSourceLang = GOOGLE_TRANSLATE_LOCALE_MAP[sourceLang] || sourceLang;

  // Try Google Translate API if available
  if (process.env.GOOGLE_TRANSLATE_API_KEY) {
    try {
      const response = await fetch(
        `https://translation.googleapis.com/language/translate/v2?key=${process.env.GOOGLE_TRANSLATE_API_KEY}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            q: text,
            source: googleSourceLang,
            target: googleTargetLang, // Используем маппинг для правильного кода языка
            format: 'text',
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.data?.translations?.[0]?.translatedText) {
          return data.data.translations[0].translatedText;
        }
      }
    } catch (error) {
      console.warn('[translateText] Google Translate API error:', error);
    }
  }

  // Fallback: return original text (can be enhanced with other translation services)
  console.warn(`[translateText] Translation not available for ${sourceLang} -> ${targetLang}, returning original text`);
  return text;
}

/**
 * Translate tournament description to all supported languages
 */
export async function translateTournamentDescription(
  description: string | undefined,
  sourceLocale: string = 'en'
): Promise<Record<string, string>> {
  if (!description) return {};

  const translations: Record<string, string> = {};
  
  // Keep original in source locale
  translations[sourceLocale] = description;

  // Translate to all other languages
  const translationPromises = SUPPORTED_LANGUAGES
    .filter(lang => lang !== sourceLocale)
    .map(async (lang) => {
      const translated = await translateText(description, lang, sourceLocale);
      translations[lang] = translated;
    });

  await Promise.all(translationPromises);

  return translations;
}

/**
 * Translate event schedule items to all supported languages
 */
export async function translateEventSchedule(
  eventSchedule: Array<{ title: string; date: string; time: string; description?: string }> | undefined,
  sourceLocale: string = 'en'
): Promise<Record<string, Array<{ title: string; date: string; time: string; description?: string }>> | undefined> {
  if (!eventSchedule || eventSchedule.length === 0) return Promise.resolve(undefined);

  const translations: Record<string, Array<{ title: string; date: string; time: string; description?: string }>> = {};
  
  // Keep original in source locale
  translations[sourceLocale] = eventSchedule;

  // Translate to all other languages
  const translationPromises = SUPPORTED_LANGUAGES
    .filter(lang => lang !== sourceLocale)
    .map(async (lang) => {
      const translatedSchedule = await Promise.all(
        eventSchedule.map(async (event) => ({
          title: await translateText(event.title, lang, sourceLocale),
          date: event.date, // Dates don't need translation
          time: event.time, // Times don't need translation
          description: event.description ? await translateText(event.description, lang, sourceLocale) : undefined,
        }))
      );
      translations[lang] = translatedSchedule;
    });

  await Promise.all(translationPromises);

  return translations;
}

/**
 * Translate guest ticket title to all supported languages
 */
export async function translateGuestTicketTitle(
  title: string | undefined,
  sourceLocale: string = 'en'
): Promise<Record<string, string> | undefined> {
  if (!title || title.trim() === '') return undefined;
  
  return translateTournamentDescription(title, sourceLocale);
}

/**
 * Translate guest ticket description to all supported languages
 */
export async function translateGuestTicketDescription(
  description: string | undefined,
  sourceLocale: string = 'en'
): Promise<Record<string, string> | undefined> {
  if (!description || description.trim() === '') return undefined;
  
  return translateTournamentDescription(description, sourceLocale);
}

/**
 * Translate guest ticket event schedule to all supported languages
 */
export async function translateGuestTicketEventSchedule(
  eventSchedule: Array<{ title: string; date: string; time: string; description?: string }> | undefined,
  sourceLocale: string = 'en'
): Promise<Record<string, Array<{ title: string; date: string; time: string; description?: string }>> | undefined> {
  if (!eventSchedule || eventSchedule.length === 0) return undefined;
  
  return translateEventSchedule(eventSchedule, sourceLocale);
}

/**
 * Store translated content in database
 * This assumes we have a translations table or JSON column
 */
export async function storeTournamentTranslations(
  tournamentId: number,
  translations: {
    description?: Record<string, string>;
    eventSchedule?: Record<string, Array<{ title: string; date: string; time: string; description?: string }>>;
    guestTicketTitle?: Record<string, string>;
    guestTicketDescription?: Record<string, string>;
    guestTicketEventSchedule?: Record<string, Array<{ title: string; date: string; time: string; description?: string }>>;
  }
): Promise<void> {
  try {
    const { getDbPool } = await import('@/lib/db');
    const pool = getDbPool();
    
    const translationsJson = JSON.stringify(translations);
    
    // Update tournaments table with translations
    await pool.execute(
      `UPDATE tournaments SET translations = ? WHERE id = ?`,
      [translationsJson, tournamentId]
    );
    
    console.log(`[storeTournamentTranslations] Stored translations for tournament ${tournamentId}`);
  } catch (error: any) {
    // If translations column doesn't exist, log warning but don't fail
    if (error.message?.includes("Unknown column 'translations'")) {
      console.warn('[storeTournamentTranslations] Translations column not found. Run database migration to add it.');
    } else {
      console.error('[storeTournamentTranslations] Error storing translations:', error);
    }
    // Don't throw - translations are optional
  }
}

/**
 * Get translated content for a specific locale
 */
export function getTranslatedContent(
  translations: {
    description?: Record<string, string>;
    eventSchedule?: Record<string, Array<{ title: string; date: string; time: string; description?: string }>>;
  },
  locale: string,
  fallback: {
    description?: string;
    eventSchedule?: Array<{ title: string; date: string; time: string; description?: string }>;
  }
): {
  description?: string;
  eventSchedule?: Array<{ title: string; date: string; time: string; description?: string }>;
} {
  return {
    description: translations.description?.[locale] || fallback.description,
    eventSchedule: translations.eventSchedule?.[locale] || fallback.eventSchedule,
  };
}

