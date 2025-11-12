// SEO utilities for generating metadata
import { Metadata } from 'next';
import { locales } from '@/i18n';

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://padelo2.com';

export interface SEOConfig {
  title: string;
  description: string;
  keywords?: string[];
  path?: string;
  image?: string;
  noindex?: boolean;
  nofollow?: boolean;
}

const defaultKeywords = ['padel', 'tournaments', 'training', 'AI machines', 'padel courts', 'investments'];

// Language codes for Open Graph
const ogLocales: Record<string, string> = {
  en: 'en_US',
  es: 'es_ES',
  ua: 'uk_UA',
  ru: 'ru_RU',
  ca: 'ca_ES',
  zh: 'zh_CN',
  nl: 'nl_NL',
  da: 'da_DK',
  sv: 'sv_SE',
  de: 'de_DE',
  no: 'no_NO',
  it: 'it_IT',
  fr: 'fr_FR',
  ar: 'ar_SA',
};

export function generateMetadata(config: SEOConfig, locale: string): Metadata {
  const {
    title,
    description,
    keywords = defaultKeywords,
    path = '',
    image = '/logo-hero.png',
    noindex = false,
    nofollow = false,
  } = config;

  const url = `${baseUrl}/${locale}${path}`;
  const fullTitle = `${title} | PadelO₂`;
  const ogLocale = ogLocales[locale] || 'en_US';

  return {
    title: fullTitle,
    description,
    keywords: keywords.join(', '),
    authors: [{ name: 'Kaus Australis LTD' }],
    creator: 'Kaus Australis LTD',
    publisher: 'Kaus Australis LTD',
    applicationName: 'PadelO₂',
    referrer: 'origin-when-cross-origin',
    openGraph: {
      type: 'website',
      locale: ogLocale,
      url,
      siteName: 'PadelO₂',
      title: fullTitle,
      description,
      images: [
        {
          url: `${baseUrl}${image}`,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      alternateLocale: locales.map((loc) => ogLocales[loc] || loc),
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: [`${baseUrl}${image}`],
      creator: '@padelo2',
      site: '@padelo2',
    },
    alternates: {
      canonical: url,
      languages: generateAlternateLanguages(path, locale),
    },
    robots: {
      index: !noindex,
      follow: !nofollow,
      googleBot: {
        index: !noindex,
        follow: !nofollow,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    verification: {
      // Add verification codes when available
      // google: 'your-google-verification-code',
      // yandex: 'your-yandex-verification-code',
      // bing: 'your-bing-verification-code',
    },
    category: 'Sports',
    classification: 'Padel Sports Ecosystem',
    metadataBase: new URL(baseUrl),
    other: {
      'mobile-web-app-capable': 'yes',
      'apple-mobile-web-app-capable': 'yes',
      'apple-mobile-web-app-status-bar-style': 'black-translucent',
      'theme-color': '#00C4FF',
      'msapplication-TileColor': '#00C4FF',
    },
  };
}

// Generate alternate language links
function generateAlternateLanguages(path: string, currentLocale: string): Record<string, string> {
  const alternates: Record<string, string> = {};
  
  locales.forEach((locale) => {
    alternates[locale] = `${baseUrl}/${locale}${path}`;
  });

  return alternates;
}

// Generate hreflang tags for HTML head
export function generateHreflangTags(path: string): Array<{ rel: string; hreflang: string; href: string }> {
  const tags: Array<{ rel: string; hreflang: string; href: string }> = [];
  
  locales.forEach((locale) => {
    tags.push({
      rel: 'alternate',
      hreflang: locale,
      href: `${baseUrl}/${locale}${path}`,
    });
  });

  // Add x-default
  tags.push({
    rel: 'alternate',
    hreflang: 'x-default',
    href: `${baseUrl}/en${path}`,
  });

  return tags;
}

