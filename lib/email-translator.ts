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
 * Protects tournament names, person names, and company names from translation
 * 
 * @param html - HTML content to translate
 * @param targetLang - Target language code
 * @param sourceLang - Source language code (default: 'en')
 * @param protectedStrings - Optional array of strings that should not be translated (tournament names, person names, company names)
 */
export async function translateEmailHTML(
  html: string, 
  targetLang: string, 
  sourceLang: string = 'en',
  protectedStrings: string[] = []
): Promise<string> {
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
    // Extract text nodes from HTML first
    const textNodes: Array<{ 
      text: string; 
      placeholder: string; 
      leadingWhitespace?: string;
      trailingWhitespace?: string;
      protectedText?: string; 
      replacements?: Array<{ placeholder: string; original: string }> 
    }> = [];
    let placeholderIndex = 0;
    let processedHtml = html;

    // Match text content between tags (but not inside script/style tags)
    // Preserve whitespace around tags to maintain spacing
    processedHtml = html.replace(/>([^<]+)</g, (match, text) => {
      // Preserve leading and trailing whitespace
      const leadingWhitespace = text.match(/^(\s*)/)?.[1] || '';
      const trailingWhitespace = text.match(/(\s*)$/)?.[1] || '';
      const trimmedText = text.trim();
      
      // Skip if it's just whitespace or very short
      if (trimmedText && trimmedText.length > 2 && !trimmedText.match(/^[\s\n\r]*$/)) {
        // Check if this text contains any protected strings
        const containsProtectedString = protectedStrings.some(protectedStr => {
          if (!protectedStr || protectedStr.trim().length === 0) return false;
          // Case-insensitive check - also check in original text with whitespace
          const regex = new RegExp(protectedStr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
          return regex.test(trimmedText) || regex.test(text);
        });
        
        const placeholder = `__TRANSLATE_PLACEHOLDER_${placeholderIndex}__`;
        textNodes.push({ 
          text: trimmedText,
          placeholder,
          leadingWhitespace,
          trailingWhitespace,
          protectedText: containsProtectedString ? trimmedText : undefined, // Don't translate if contains protected strings
          replacements: containsProtectedString ? [] : undefined
        });
        placeholderIndex++;
        return `>${leadingWhitespace}${placeholder}${trailingWhitespace}<`;
      }
      return match;
    });

    if (textNodes.length === 0) {
      return html;
    }

    // Separate nodes that need translation from those that don't
    const nodesToTranslate: Array<{ node: typeof textNodes[0]; index: number }> = [];
    const nodesToSkip: Array<{ node: typeof textNodes[0]; index: number }> = [];
    
    textNodes.forEach((node, index) => {
      if (node.protectedText === undefined) {
        // This node needs translation
        nodesToTranslate.push({ node, index });
      } else {
        // This node contains tournament name - skip translation
        nodesToSkip.push({ node, index });
      }
    });

    // Translate only nodes that don't contain tournament names
    const textsToTranslate = nodesToTranslate.map(({ node }) => node.text);
    let translatedTexts: string[] = [];
    
    if (textsToTranslate.length > 0) {
      translatedTexts = await translateTextsBatch(textsToTranslate, googleTargetLang, googleSourceLang);
    }

    // Replace placeholders with translated or original text
    // Restore whitespace around text nodes
    let translatedHtml = processedHtml;
    
    // First, restore nodes that were translated
    let translationIndex = 0;
    nodesToTranslate.forEach(({ node }) => {
      const translatedText = translatedTexts[translationIndex] || node.text;
      // Restore with preserved whitespace
      const restoredText = `${node.leadingWhitespace || ''}${translatedText}${node.trailingWhitespace || ''}`;
      translatedHtml = translatedHtml.replace(
        new RegExp(`>\\s*${node.placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*<`, 'g'),
        `>${restoredText}<`
      );
      translationIndex++;
    });
    
    // Then, restore nodes that were skipped (contain protected strings)
    nodesToSkip.forEach(({ node }) => {
      // Restore original text with preserved whitespace
      const restoredText = `${node.leadingWhitespace || ''}${node.text}${node.trailingWhitespace || ''}`;
      translatedHtml = translatedHtml.replace(
        new RegExp(`>\\s*${node.placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*<`, 'g'),
        `>${restoredText}<`
      );
    });

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
 * Uses a format that Google Translate won't translate (all caps with underscores)
 */
function protectTournamentNames(text: string): { protectedText: string; replacements: Array<{ placeholder: string; original: string }> } {
  const replacements: Array<{ placeholder: string; original: string }> = [];
  let protectedText = text;
  let placeholderIndex = 0;

  // Pattern to match "UA PADEL OPEN" and variations (case-insensitive)
  // Match various formats: "UA PADEL OPEN", "UA PADEL OPEN 2025", "UA PADEL OPEN | Winter 2025"
  // Also handle cases where it might be split across tags
  const tournamentPatterns = [
    /UA\s+PADEL\s+OPEN(?:\s+\d{4})?(?:\s*\|\s*[^–<>\n]+)?/gi,
  ];

  tournamentPatterns.forEach(pattern => {
    protectedText = protectedText.replace(pattern, (match) => {
      // Use a placeholder that looks like a constant/identifier (all caps, underscores)
      // Google Translate typically doesn't translate these
      // Format: UAPADELOPEN_XXX where XXX is index
      const placeholder = `UAPADELOPEN_${placeholderIndex}`;
      replacements.push({ placeholder, original: match.trim() });
      placeholderIndex++;
      return placeholder;
    });
  });

  return { protectedText, replacements };
}

/**
 * Restore tournament names from placeholders
 * Handles cases where Google Translate might have modified the placeholder
 */
function restoreTournamentNames(text: string, replacements: Array<{ placeholder: string; original: string }>): string {
  let restoredText = text;
  
  // Restore in reverse order to avoid conflicts
  replacements.reverse().forEach(({ placeholder, original }) => {
    // Try multiple patterns to catch variations Google Translate might create
    const patterns = [
      placeholder, // Original placeholder
      placeholder.toLowerCase(), // Lowercase version
      placeholder.replace(/_/g, ' '), // With spaces instead of underscores
      placeholder.replace(/_/g, '-'), // With dashes instead of underscores
    ];
    
    patterns.forEach(pattern => {
      // Use word boundaries to ensure we match the whole placeholder
      const regex = new RegExp(`\\b${pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
      restoredText = restoredText.replace(regex, original);
    });
  });
  
  return restoredText;
}

/**
 * Translate email subject line using Google Translate API
 * Protects tournament names, person names, and company names from translation
 * 
 * @param subject - Subject line to translate
 * @param targetLang - Target language code
 * @param sourceLang - Source language code (default: 'en')
 * @param protectedStrings - Optional array of strings that should not be translated
 */
export async function translateEmailSubject(
  subject: string, 
  targetLang: string, 
  sourceLang: string = 'en',
  protectedStrings: string[] = []
): Promise<string> {
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
    // Check if subject contains any protected strings
    let containsProtected = false;
    let protectedMatch: { before: string; protected: string; after: string } | null = null;
    
    for (const protectedStr of protectedStrings) {
      if (!protectedStr || protectedStr.trim().length === 0) continue;
      
      // Escape special regex characters
      const escaped = protectedStr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const pattern = new RegExp(`(.*?)(${escaped})(.*)`, 'gi');
      const match = pattern.exec(subject);
      
      if (match) {
        containsProtected = true;
        protectedMatch = {
          before: match[1].trim(),
          protected: match[2].trim(),
          after: match[3].trim()
        };
        break; // Use first match
      }
    }
    
    if (containsProtected && protectedMatch) {
      // Split subject into parts, translate only parts without protected strings
      const partsToTranslate: string[] = [];
      if (protectedMatch.before) partsToTranslate.push(protectedMatch.before);
      if (protectedMatch.after) partsToTranslate.push(protectedMatch.after);
      
      let translatedBefore = protectedMatch.before;
      let translatedAfter = protectedMatch.after;
      
      if (partsToTranslate.length > 0) {
        const translatedParts = await translateTextsBatch(partsToTranslate, googleTargetLang, googleSourceLang);
        if (protectedMatch.before) translatedBefore = translatedParts[0] || protectedMatch.before;
        if (protectedMatch.after) translatedAfter = translatedParts[protectedMatch.before ? 1 : 0] || protectedMatch.after;
      }
      
      // Reconstruct subject with original protected string
      return `${translatedBefore} ${protectedMatch.protected}${translatedAfter ? ` ${translatedAfter}` : ''}`.trim();
    }
    
    // If no protected strings or pattern didn't match, translate normally
    const translatedTexts = await translateTextsBatch([subject], googleTargetLang, googleSourceLang);
    return translatedTexts[0] || subject;
  } catch (error) {
    console.error('[translateEmailSubject] Error translating subject:', error);
    return subject;
  }
}

