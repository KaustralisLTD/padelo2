import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';
import ParticipantWalletContent from '@/components/pages/ParticipantWalletContent';
import { generateMetadata as generateSEOMetadata } from '@/lib/seo';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'ParticipantWallet' });
  
  return generateSEOMetadata({
    title: t('title'),
    description: t('description'),
    keywords: ['padel wallet', 'padel balance', 'padel payments'],
    path: '/participant/wallet',
    noindex: true,
    nofollow: true,
  }, locale);
}

export default async function ParticipantWalletPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <ParticipantWalletContent />;
}

