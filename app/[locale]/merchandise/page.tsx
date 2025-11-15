import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';
import MerchandiseContent from '@/components/pages/MerchandiseContent';
import { generateMetadata as generateSEOMetadata } from '@/lib/seo';
import { getSEOData } from '@/lib/seo-data';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const seo = getSEOData('/merchandise', locale);
  
  if (!seo) {
    return generateSEOMetadata({
      title: 'Merchandise & Custom Tournament Products | PadelO₂',
      description: 'Custom padel tournament merchandise: t-shirts, trophies, medals, accessories. Professional branding and bulk orders for your event.',
      keywords: ['padel merchandise', 'tournament products', 'custom t-shirts', 'padel trophies', 'sports medals', 'tournament accessories'],
      path: '/merchandise',
    }, locale);
  }
  
  return generateSEOMetadata({
    title: seo.title,
    description: seo.description,
    keywords: seo.keywords || ['padel merchandise', 'tournament products', 'custom t-shirts', 'padel trophies'],
    path: '/merchandise',
  }, locale);
}

export default async function MerchandisePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  
  return <MerchandiseContent />;
}

