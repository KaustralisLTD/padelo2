import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';
import { generateMetadata as generateSEOMetadata } from '@/lib/seo';
import HolidaysSettingsContent from '@/components/pages/HolidaysSettingsContent';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'Admin' });

  return generateSEOMetadata({
    title: t('settings.clubModules.holidays.title'),
    description: t('settings.clubModules.holidays.description'),
    keywords: ['admin settings', 'holidays'],
    path: '/admin/settings/holidays',
    noindex: true,
    nofollow: true,
  }, locale);
}

export default async function HolidaysSettingsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <HolidaysSettingsContent />;
}

