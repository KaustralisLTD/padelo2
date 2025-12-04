import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';
import { generateMetadata as generateSEOMetadata } from '@/lib/seo';
import CourtsSettingsContent from '@/components/pages/CourtsSettingsContent';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'Admin' });

  return generateSEOMetadata({
    title: t('settings.clubModules.courts.title'),
    description: t('settings.clubModules.courts.description'),
    keywords: ['admin settings', 'courts'],
    path: '/admin/settings/courts',
    noindex: true,
    nofollow: true,
  }, locale);
}

export default async function CourtsSettingsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <CourtsSettingsContent />;
}

