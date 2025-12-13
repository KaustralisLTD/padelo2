import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';
import StaffPlayersContent from '@/components/pages/StaffPlayersContent';
import { generateMetadata as generateSEOMetadata } from '@/lib/seo';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'Admin' });
  
  return generateSEOMetadata({
    title: t('staff.editPlayers'),
    description: 'Manage tournament players',
    keywords: ['padel staff', 'tournament players'],
    path: '/staff/players',
    noindex: true,
    nofollow: true,
  }, locale);
}

export default async function StaffPlayersPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <StaffPlayersContent />;
}

