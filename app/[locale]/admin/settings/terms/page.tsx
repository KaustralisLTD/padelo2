import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';
import { generateMetadata as generateSEOMetadata } from '@/lib/seo';
import TermsSettingsContent from '@/components/pages/TermsSettingsContent';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'Admin' });

  return generateSEOMetadata({
    title: t('settings.companyAdmin.terms.title'),
    description: t('settings.companyAdmin.terms.description'),
    keywords: ['admin settings', 'terms'],
    path: '/admin/settings/terms',
    noindex: true,
    nofollow: true,
  }, locale);
}

export default async function TermsSettingsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <TermsSettingsContent />;
}

