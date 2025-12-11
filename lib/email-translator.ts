/**
 * Email HTML translator using Google Translate API
 * Translates HTML content while preserving structure and tags
 */

const SUPPORTED_LANGUAGES = ['en', 'ru', 'ua', 'es', 'fr', 'de', 'it', 'ca', 'nl', 'da', 'sv', 'no', 'ar', 'zh'];

const GOOGLE_TRANSLATE_LOCALE_MAP: Record<string, string> = {
  'en': 'en',
  'ru': 'ru',
  'ua': 'uk',
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
 * Extract text content from HTML while preserving structure
 * Returns text nodes and processed HTML with placeholders
 */
function extractTextNodes(html: string): { textNodes: Array<{ text: string; placeholder: string }>; processedHtml: string } {
  const textNodes: Array<{ text: string; placeholder: string }> = [];
  let placeholderIndex = 0;

  // Replace text content in tags with placeholders
  const processedHtml = html.replace(/>([^<]+)</g, (match, text) => {
    const trimmedText = text.trim();
    if (trimmedText && trimmedText.length > 0) {
      const placeholder = `__TRANSLATE_PLACEHOLDER_${placeholderIndex}__`;
      textNodes.push({ text: trimmedText, placeholder });
      placeholderIndex++;
      return `>${placeholder}<`;
    }
    return match;
  });

  return { textNodes, processedHtml };
}

/**
 * Translate HTML content using Google Translate API
 * Preserves HTML structure and only translates text content
 * Protects tournament names from translation
 */
export async function translateEmailHTML(html: string, targetLang: string, sourceLang: string = 'en'): Promise<string> {
  if (targetLang === sourceLang || !SUPPORTED_LANGUAGES.includes(targetLang)) {
    return html;
  }

  if (!process.env.GOOGLE_TRANSLATE_API_KEY) {
    console.warn('[translateEmailHTML] GOOGLE_TRANSLATE_API_KEY not configured, returning original HTML');
    return html;
  }

  const googleTargetLang = GOOGLE_TRANSLATE_LOCALE_MAP[targetLang] || targetLang;
  const googleSourceLang = GOOGLE_TRANSLATE_LOCALE_MAP[sourceLang] || sourceLang;

  try {
    // First, protect tournament names in the entire HTML
    const { protectedText: htmlWithProtectedNames, replacements: tournamentReplacements } = protectTournamentNames(html);
    
    // Extract text nodes from HTML
    const textNodes: Array<{ text: string; placeholder: string }> = [];
    let placeholderIndex = 0;
    let processedHtml = htmlWithProtectedNames;

    // Match text content between tags (but not inside script/style tags)
    processedHtml = htmlWithProtectedNames.replace(/>([^<]+)</g, (match, text) => {
      const trimmedText = text.trim();
      // Skip if it's just whitespace or very short
      if (trimmedText && trimmedText.length > 2 && !trimmedText.match(/^[\s\n\r]*$/)) {
        const placeholder = `__TRANSLATE_PLACEHOLDER_${placeholderIndex}__`;
        textNodes.push({ text: trimmedText, placeholder });
        placeholderIndex++;
        return `>${placeholder}<`;
      }
      return match;
    });

    if (textNodes.length === 0) {
      return html;
    }

    // Translate all text nodes in batch
    const textsToTranslate = textNodes.map(node => node.text);
    const translatedTexts = await translateTextsBatch(textsToTranslate, googleTargetLang, googleSourceLang);

    // Replace placeholders with translated text
    let translatedHtml = processedHtml;
    textNodes.forEach((node, index) => {
      const translatedText = translatedTexts[index] || node.text;
      translatedHtml = translatedHtml.replace(node.placeholder, translatedText);
    });

    // Restore tournament names
    translatedHtml = restoreTournamentNames(translatedHtml, tournamentReplacements);

    return translatedHtml;
  } catch (error) {
    console.error('[translateEmailHTML] Error translating HTML:', error);
    return html;
  }
}

/**
 * Translate multiple texts in batch using Google Translate API
 */
async function translateTextsBatch(texts: string[], targetLang: string, sourceLang: string): Promise<string[]> {
  if (texts.length === 0) return [];

  try {
    const response = await fetch(
      `https://translation.googleapis.com/language/translate/v2?key=${process.env.GOOGLE_TRANSLATE_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          q: texts,
          source: sourceLang,
          target: targetLang,
          format: 'text',
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[translateTextsBatch] Google Translate API error:', errorData);
      return texts; // Return original texts on error
    }

    const data = await response.json();
    if (data.data?.translations) {
      return data.data.translations.map((t: any) => t.translatedText || '');
    }

    return texts;
  } catch (error) {
    console.error('[translateTextsBatch] Error:', error);
    return texts;
  }
}

/**
 * Protect tournament names from translation by replacing them with placeholders
 */
function protectTournamentNames(text: string): { protectedText: string; replacements: Array<{ placeholder: string; original: string }> } {
  const replacements: Array<{ placeholder: string; original: string }> = [];
  let protectedText = text;
  let placeholderIndex = 0;

  // Pattern to match "UA PADEL OPEN" and variations (case-insensitive)
  // Also matches tournament names that might include year or other text
  const tournamentPatterns = [
    /UA\s+PADEL\s+OPEN/gi,
    /UA\s+PADEL\s+OPEN\s+\d{4}/gi,
    /UA\s+PADEL\s+OPEN\s+\|\s*[^–]+/gi,
  ];

  tournamentPatterns.forEach(pattern => {
    protectedText = protectedText.replace(pattern, (match) => {
      const placeholder = `__TOURNAMENT_NAME_${placeholderIndex}__`;
      replacements.push({ placeholder, original: match });
      placeholderIndex++;
      return placeholder;
    });
  });

  return { protectedText, replacements };
}

/**
 * Restore tournament names from placeholders
 */
function restoreTournamentNames(text: string, replacements: Array<{ placeholder: string; original: string }>): string {
  let restoredText = text;
  replacements.forEach(({ placeholder, original }) => {
    restoredText = restoredText.replace(placeholder, original);
  });
  return restoredText;
}

/**
 * Translate email subject line using Google Translate API
 * Protects tournament names from translation
 */
export async function translateEmailSubject(subject: string, targetLang: string, sourceLang: string = 'en'): Promise<string> {
  if (targetLang === sourceLang || !SUPPORTED_LANGUAGES.includes(targetLang)) {
    return subject;
  }

  if (!process.env.GOOGLE_TRANSLATE_API_KEY) {
    console.warn('[translateEmailSubject] GOOGLE_TRANSLATE_API_KEY not configured, returning original subject');
    return subject;
  }

  const googleTargetLang = GOOGLE_TRANSLATE_LOCALE_MAP[targetLang] || targetLang;
  const googleSourceLang = GOOGLE_TRANSLATE_LOCALE_MAP[sourceLang] || sourceLang;

  try {
    // Protect tournament names before translation
    const { protectedText, replacements } = protectTournamentNames(subject);
    
    // Translate protected text
    const translatedTexts = await translateTextsBatch([protectedText], googleTargetLang, googleSourceLang);
    let translated = translatedTexts[0] || protectedText;
    
    // Restore tournament names
    translated = restoreTournamentNames(translated, replacements);
    
    return translated;
  } catch (error) {
    console.error('[translateEmailSubject] Error translating subject:', error);
    return subject;
  }
}

