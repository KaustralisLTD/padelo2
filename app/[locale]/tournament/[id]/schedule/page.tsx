import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';
import { TournamentScheduleContent } from '@/components/pages/TournamentScheduleContent';
import { generateMetadata as generateSEOMetadata } from '@/lib/seo';

export async function generateMetadata({ params }: { params: Promise<{ locale: string; id: string }> }): Promise<Metadata> {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'TournamentSchedule' });
  
  return generateSEOMetadata({
    title: t('title'),
    description: t('description'),
    keywords: ['padel tournament schedule', 'tournament matches', 'padel schedule'],
    path: `/tournament/${id}/schedule`,
    noindex: true,
    nofollow: true,
  }, locale);
}

export default async function TournamentSchedulePage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  return <TournamentScheduleContent tournamentId={parseInt(id, 10)} />;
}

