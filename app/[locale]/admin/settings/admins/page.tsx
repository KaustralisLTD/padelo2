import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';
import { generateMetadata as generateSEOMetadata } from '@/lib/seo';
import AdminsSettingsContent from '@/components/pages/AdminsSettingsContent';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'Admin' });

  return generateSEOMetadata({
    title: t('settings.companyAdmin.manageAdmins.title'),
    description: t('settings.companyAdmin.manageAdmins.description'),
    keywords: ['admin settings', 'admins'],
    path: '/admin/settings/admins',
    noindex: true,
    nofollow: true,
  }, locale);
}

export default async function AdminsSettingsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <AdminsSettingsContent />;
}

