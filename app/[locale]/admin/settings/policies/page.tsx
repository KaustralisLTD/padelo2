import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';
import { generateMetadata as generateSEOMetadata } from '@/lib/seo';
import PoliciesSettingsContent from '@/components/pages/PoliciesSettingsContent';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'Admin' });

  return generateSEOMetadata({
    title: t('settings.clubModules.policies.title'),
    description: t('settings.clubModules.policies.description'),
    keywords: ['admin settings', 'policies'],
    path: '/admin/settings/policies',
    noindex: true,
    nofollow: true,
  }, locale);
}

export default async function PoliciesSettingsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <PoliciesSettingsContent />;
}

