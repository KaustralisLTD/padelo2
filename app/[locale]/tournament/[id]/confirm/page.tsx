import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';
import { TournamentConfirmContent } from '@/components/pages/TournamentConfirmContent';
import { generateMetadata as generateSEOMetadata } from '@/lib/seo';

export async function generateMetadata({ params }: { params: Promise<{ locale: string; id: string }> }): Promise<Metadata> {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'TournamentConfirm' });
  
  return generateSEOMetadata({
    title: t('title'),
    description: t('description'),
    keywords: ['padel tournament', 'tournament payment', 'padel registration'],
    path: `/tournament/${id}/confirm`,
    noindex: true,
    nofollow: true,
  }, locale);
}

export default async function TournamentConfirmPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  return <TournamentConfirmContent tournamentId={parseInt(id, 10)} />;
}

