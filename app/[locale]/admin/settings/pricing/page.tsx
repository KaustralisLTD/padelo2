import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';
import { generateMetadata as generateSEOMetadata } from '@/lib/seo';
import PricingSettingsContent from '@/components/pages/PricingSettingsContent';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'Admin' });

  return generateSEOMetadata({
    title: t('settings.clubModules.pricing.title'),
    description: t('settings.clubModules.pricing.description'),
    keywords: ['admin settings', 'pricing'],
    path: '/admin/settings/pricing',
    noindex: true,
    nofollow: true,
  }, locale);
}

export default async function PricingSettingsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <PricingSettingsContent />;
}

