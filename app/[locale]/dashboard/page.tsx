import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';
import DashboardPageContent from '@/components/pages/DashboardPageContent';
import { generateMetadata as generateSEOMetadata } from '@/lib/seo';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'Dashboard' });
  
  return generateSEOMetadata({
    title: t('title'),
    description: t('description'),
    keywords: ['padel dashboard', 'padel account', 'padel profile'],
    path: '/dashboard',
    noindex: true, // Private page
    nofollow: true,
  }, locale);
}

export default async function DashboardPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <DashboardPageContent />;
}


