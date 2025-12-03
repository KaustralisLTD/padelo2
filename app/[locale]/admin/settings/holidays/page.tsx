import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';
import { generateMetadata as generateSEOMetadata } from '@/lib/seo';

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
  const t = await getTranslations({ locale, namespace: 'Admin' });

  return (
    <div className="w-full px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl md:text-5xl font-poppins font-bold mb-4 gradient-text">
          {t('settings.clubModules.holidays.title')}
        </h1>
        <p className="text-xl text-text-secondary font-poppins">
          {t('settings.clubModules.holidays.description')}
        </p>
      </div>
      <div className="bg-background-secondary rounded-lg border border-border p-8 text-center">
        <p className="text-text-secondary font-poppins">
          {t('settings.comingSoon') || 'This section is coming soon...'}
        </p>
      </div>
    </div>
  );
}

