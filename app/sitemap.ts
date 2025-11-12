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

  locales.forEach((locale) => {
    routes.forEach((route) => {
      sitemapEntries.push({
        url: `${baseUrl}/${locale}${route.path}`,
        lastModified: new Date(),
        changeFrequency: route.changeFrequency,
        priority: route.priority,
        alternates: {
          languages: Object.fromEntries(
            locales.map((loc) => [loc, `${baseUrl}/${loc}${route.path}`])
          ),
        },
      });
    });
  });

  return sitemapEntries;
}


