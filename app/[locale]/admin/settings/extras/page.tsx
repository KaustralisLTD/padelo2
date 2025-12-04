import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';
import { generateMetadata as generateSEOMetadata } from '@/lib/seo';
import ExtrasSettingsContent from '@/components/pages/ExtrasSettingsContent';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'Admin' });

  return generateSEOMetadata({
    title: t('settings.clubModules.extras.title'),
    description: t('settings.clubModules.extras.description'),
    keywords: ['admin settings', 'extras'],
    path: '/admin/settings/extras',
    noindex: true,
    nofollow: true,
  }, locale);
}

export default async function ExtrasSettingsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <ExtrasSettingsContent />;
}

