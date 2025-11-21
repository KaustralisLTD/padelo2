import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';
import ParticipantResultsContent from '@/components/pages/ParticipantResultsContent';
import { generateMetadata as generateSEOMetadata } from '@/lib/seo';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'ParticipantResults' });
  
  return generateSEOMetadata({
    title: t('title'),
    description: t('description'),
    keywords: ['padel results', 'padel matches', 'padel statistics'],
    path: '/participant/results',
    noindex: true,
    nofollow: true,
  }, locale);
}

export default async function ParticipantResultsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <ParticipantResultsContent />;
}

