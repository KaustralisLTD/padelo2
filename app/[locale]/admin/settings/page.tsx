import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';
import AdminSettingsContent from '@/components/pages/AdminSettingsContent';
import { generateMetadata as generateSEOMetadata } from '@/lib/seo';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'Admin' });

  return generateSEOMetadata({
    title: t('settings.title'),
    description: t('settings.description'),
    keywords: ['admin settings', 'configuration'],
    path: '/admin/settings',
    noindex: true,
    nofollow: true,
  }, locale);
}

export default async function AdminSettingsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <AdminSettingsContent />;
}

