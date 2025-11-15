import type { Metadata } from 'next';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import TournamentsContent from '@/components/pages/TournamentsContent';
import { generateMetadata as generateSEOMetadata } from '@/lib/seo';
import { getSEOData } from '@/lib/seo-data';
import { generateEventSchema } from '@/lib/schema';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const seo = getSEOData('/tournaments', locale);
  
  if (!seo) {
    return generateSEOMetadata({
      title: 'Padel Tournaments — Register & Compete Worldwide',
      description: 'Join PadelO₂ tournaments: categories, schedules, live results and registration. Compete globally with the best players.',
      keywords: ['padel tournaments', 'padel competitions', 'padel events', 'padel registration', 'padel matches'],
      path: '/tournaments',
    }, locale);
  }
  
  return generateSEOMetadata({
    title: seo.title,
    description: seo.description,
    keywords: ['padel tournaments', 'padel competitions', 'padel events', 'padel registration', 'padel matches'],
    path: '/tournaments',
  }, locale);
}

export default async function TournamentsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'Tournaments' });
  
  // Generate Event schema for tournaments page
  const eventSchema = generateEventSchema(locale, {
    name: t('title'),
    description: t('subhead') || t('body'),
    organizer: {
      name: 'PadelO₂',
      url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://padelo2.com'}/${locale}`,
    },
    image: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://padelo2.com'}/logo-hero.png`,
  });
  
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(eventSchema),
        }}
      />
      <TournamentsContent />
    </>
  );
}
