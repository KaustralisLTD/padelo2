// Utility functions for localization

/**
 * Normalize category code (e.g., "Male 1" -> "male1", "Mixed 1" -> "mixed1")
 */
function normalizeCategoryCode(categoryCode: string): string {
  if (!categoryCode) return categoryCode;
  
  // Remove spaces and convert to lowercase
  const normalized = categoryCode.toLowerCase().replace(/\s+/g, '');
  
  // Map common variations
  const variations: Record<string, string> = {
    'male1': 'male1',
    'male2': 'male2',
    'men1': 'male1',
    'men2': 'male2',
    'men\'s1': 'male1',
    'men\'s2': 'male2',
    'female1': 'female1',
    'female2': 'female2',
    'women1': 'female1',
    'women2': 'female2',
    'women\'s1': 'female1',
    'women\'s2': 'female2',
    'mixed1': 'mixed1',
    'mixed2': 'mixed2',
  };
  
  return variations[normalized] || normalized;
}

/**
 * Get localized category name
 */
export function getLocalizedCategoryName(categoryCode: string, locale: string): string {
  // Normalize the category code first
  const normalizedCode = normalizeCategoryCode(categoryCode);
  
  const categoryTranslations: Record<string, Record<string, string>> = {
    en: {
      male1: "Men's 1",
      male2: "Men's 2",
      female1: "Women's 1",
      female2: "Women's 2",
      mixed1: "Mixed 1",
      mixed2: "Mixed 2",
    },
    ru: {
      male1: "Мужская 1",
      male2: "Мужская 2",
      female1: "Женская 1",
      female2: "Женская 2",
      mixed1: "Микста 1",
      mixed2: "Микста 2",
    },
    ua: {
      male1: "Чоловіча 1",
      male2: "Чоловіча 2",
      female1: "Жіноча 1",
      female2: "Жіноча 2",
      mixed1: "Мікст 1",
      mixed2: "Мікст 2",
    },
    es: {
      male1: "Masculino 1",
      male2: "Masculino 2",
      female1: "Femenino 1",
      female2: "Femenino 2",
      mixed1: "Mixto 1",
      mixed2: "Mixto 2",
    },
    fr: {
      male1: "Masculin 1",
      male2: "Masculin 2",
      female1: "Féminin 1",
      female2: "Féminin 2",
      mixed1: "Mixte 1",
      mixed2: "Mixte 2",
    },
    de: {
      male1: "Herren 1",
      male2: "Herren 2",
      female1: "Damen 1",
      female2: "Damen 2",
      mixed1: "Mixed 1",
      mixed2: "Mixed 2",
    },
    it: {
      male1: "Maschile 1",
      male2: "Maschile 2",
      female1: "Femminile 1",
      female2: "Femminile 2",
      mixed1: "Misto 1",
      mixed2: "Misto 2",
    },
    ca: {
      male1: "Masculí 1",
      male2: "Masculí 2",
      female1: "Femení 1",
      female2: "Femení 2",
      mixed1: "Mixt 1",
      mixed2: "Mixt 2",
    },
    nl: {
      male1: "Heren 1",
      male2: "Heren 2",
      female1: "Dames 1",
      female2: "Dames 2",
      mixed1: "Gemengd 1",
      mixed2: "Gemengd 2",
    },
    da: {
      male1: "Herre 1",
      male2: "Herre 2",
      female1: "Dame 1",
      female2: "Dame 2",
      mixed1: "Mixed 1",
      mixed2: "Mixed 2",
    },
    sv: {
      male1: "Herr 1",
      male2: "Herr 2",
      female1: "Dam 1",
      female2: "Dam 2",
      mixed1: "Mixed 1",
      mixed2: "Mixed 2",
    },
    no: {
      male1: "Herre 1",
      male2: "Herre 2",
      female1: "Dame 1",
      female2: "Dame 2",
      mixed1: "Mixed 1",
      mixed2: "Mixed 2",
    },
    ar: {
      male1: "رجال 1",
      male2: "رجال 2",
      female1: "سيدات 1",
      female2: "سيدات 2",
      mixed1: "مختلط 1",
      mixed2: "مختلط 2",
    },
    zh: {
      male1: "男子1组",
      male2: "男子2组",
      female1: "女子1组",
      female2: "女子2组",
      mixed1: "混合1组",
      mixed2: "混合2组",
    },
  };

  const translations = categoryTranslations[locale] || categoryTranslations.en;
  return translations[normalizedCode] || categoryCode;
}

/**
 * Get category level explanation (1 = advanced, 2 = beginner)
 */
export function getCategoryLevelExplanation(level: '1' | '2', locale: string): string {
  const explanations: Record<string, Record<string, string>> = {
    en: {
      '1': 'advanced level',
      '2': 'beginner level',
    },
    ru: {
      '1': 'продвинутый уровень',
      '2': 'начальный уровень',
    },
    ua: {
      '1': 'просунутий рівень',
      '2': 'початковий рівень',
    },
    es: {
      '1': 'nivel avanzado',
      '2': 'nivel inicial',
    },
    fr: {
      '1': 'niveau avancé',
      '2': 'niveau débutant',
    },
    de: {
      '1': 'Fortgeschrittenenniveau',
      '2': 'Anfängerniveau',
    },
    it: {
      '1': 'livello avanzato',
      '2': 'livello principiante',
    },
    ca: {
      '1': 'nivell avançat',
      '2': 'nivell inicial',
    },
    nl: {
      '1': 'gevorderd niveau',
      '2': 'beginnend niveau',
    },
    da: {
      '1': 'avanceret niveau',
      '2': 'begynderniveau',
    },
    sv: {
      '1': 'avancerad nivå',
      '2': 'nybörjarnivå',
    },
    no: {
      '1': 'avansert nivå',
      '2': 'nybegynnernivå',
    },
    ar: {
      '1': 'مستوى متقدم',
      '2': 'مستوى المبتدئين',
    },
    zh: {
      '1': '高级水平',
      '2': '初级水平',
    },
    pl: {
      '1': 'poziom zaawansowany',
      '2': 'poziom początkujący',
    },
  };

  const translations = explanations[locale] || explanations.en;
  return translations[level] || '';
}

/**
 * Format date with localized month names
 */
export function formatLocalizedDate(dateString: string, locale: string): string {
  try {
    const date = new Date(dateString);
    // Map locale codes to proper Intl locale strings
    const localeMap: Record<string, string> = {
      'en': 'en-US',
      'ru': 'ru-RU',
      'ua': 'uk-UA',
      'es': 'es-ES',
      'fr': 'fr-FR',
      'de': 'de-DE',
      'it': 'it-IT',
      'ca': 'ca-ES',
      'nl': 'nl-NL',
      'da': 'da-DK',
      'sv': 'sv-SE',
      'no': 'no-NO',
      'ar': 'ar-SA',
      'zh': 'zh-CN',
    };
    const intlLocale = localeMap[locale] || locale;
    return date.toLocaleDateString(intlLocale, { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  } catch {
    return dateString;
  }
}

