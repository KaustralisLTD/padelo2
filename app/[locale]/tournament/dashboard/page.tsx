import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';
import DashboardContent from '@/components/pages/DashboardContent';
import { generateMetadata as generateSEOMetadata } from '@/lib/seo';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'Tournaments' });
  
  return generateSEOMetadata({
    title: t('dashboard.title'),
    description: t('dashboard.description'),
    keywords: ['padel tournament dashboard', 'padel registration', 'padel participant'],
    path: '/tournament/dashboard',
    noindex: true, // Private page
    nofollow: true,
  }, locale);
}

export default async function DashboardPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <DashboardContent />;
}

