import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';
import { generateMetadata as generateSEOMetadata } from '@/lib/seo';
import ClubsSettingsContent from '@/components/pages/ClubsSettingsContent';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'Admin' });

  return generateSEOMetadata({
    title: t('settings.companyAdmin.clubs.title'),
    description: t('settings.companyAdmin.clubs.description'),
    keywords: ['admin settings', 'clubs'],
    path: '/admin/settings/clubs',
    noindex: true,
    nofollow: true,
  }, locale);
}

export default async function ClubsSettingsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <ClubsSettingsContent />;
}

