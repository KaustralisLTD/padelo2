import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';
import ParticipantScheduleContent from '@/components/pages/ParticipantScheduleContent';
import { generateMetadata as generateSEOMetadata } from '@/lib/seo';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'ParticipantSchedule' });
  
  return generateSEOMetadata({
    title: t('title'),
    description: t('description'),
    keywords: ['padel schedule', 'padel bookings', 'padel training'],
    path: '/participant/schedule',
    noindex: true,
    nofollow: true,
  }, locale);
}

export default async function ParticipantSchedulePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <ParticipantScheduleContent />;
}

