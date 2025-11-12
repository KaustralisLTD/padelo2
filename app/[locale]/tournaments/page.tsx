import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import TournamentsContent from '@/components/pages/TournamentsContent';
import { generateMetadata as generateSEOMetadata } from '@/lib/seo';
import { generateEventSchema } from '@/lib/schema';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'Tournaments' });
  
  return generateSEOMetadata({
    title: t('title'),
    description: t('subhead') || t('body'),
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
