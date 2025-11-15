import { MetadataRoute } from 'next';
import { locales } from '@/i18n';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://padelo2.com';
  
  const routes = [
    { path: '', priority: 1.0, changeFrequency: 'daily' as const },
    { path: '/tournaments', priority: 0.9, changeFrequency: 'weekly' as const },
    { path: '/academy', priority: 0.9, changeFrequency: 'weekly' as const },
    { path: '/machines', priority: 0.8, changeFrequency: 'weekly' as const },
    { path: '/courts', priority: 0.8, changeFrequency: 'weekly' as const },
    { path: '/investments', priority: 0.8, changeFrequency: 'monthly' as const },
    { path: '/partners', priority: 0.7, changeFrequency: 'monthly' as const },
    { path: '/about', priority: 0.7, changeFrequency: 'monthly' as const },
    { path: '/contact', priority: 0.6, changeFrequency: 'monthly' as const },
  ];

  const sitemapEntries: MetadataRoute.Sitemap = [];

  // Map internal locale codes to hreflang codes
  const hreflangMap: Record<string, string> = {
    en: 'en',
    es: 'es',
    ua: 'uk',
    ru: 'ru',
    ca: 'ca',
    de: 'de',
    fr: 'fr',
    it: 'it',
    nl: 'nl',
    da: 'da',
    sv: 'sv',
    no: 'nb',
    zh: 'zh-CN',
    ar: 'ar',
  };

  locales.forEach((locale) => {
    routes.forEach((route) => {
      const alternates: Record<string, string> = {};
      locales.forEach((loc) => {
        const hreflang = hreflangMap[loc] || loc;
        alternates[hreflang] = `${baseUrl}/${loc}${route.path}`;
      });
      
      sitemapEntries.push({
        url: `${baseUrl}/${locale}${route.path}`,
        lastModified: new Date(),
        changeFrequency: route.changeFrequency,
        priority: route.priority,
        alternates: {
          languages: alternates,
        },
      });
    });
  });

  return sitemapEntries;
}


