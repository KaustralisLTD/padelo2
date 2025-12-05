import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';
import { generateMetadata as generateSEOMetadata } from '@/lib/seo';
import CompanySettingsContent from '@/components/pages/CompanySettingsContent';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'Admin' });

  return generateSEOMetadata({
    title: t('settings.companyAdmin.company.title'),
    description: t('settings.companyAdmin.company.description'),
    keywords: ['admin settings', 'company'],
    path: '/admin/settings/company',
    noindex: true,
    nofollow: true,
  }, locale);
}

export default async function CompanySettingsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <CompanySettingsContent />;
}

