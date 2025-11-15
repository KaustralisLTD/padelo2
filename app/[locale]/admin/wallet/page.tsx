import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';
import AdminWalletContent from '@/components/pages/AdminWalletContent';
import { generateMetadata as generateSEOMetadata } from '@/lib/seo';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'Admin.wallet' });
  
  return generateSEOMetadata({
    title: t('title'),
    description: t('description'),
    keywords: ['padel admin', 'padel wallet', 'padel transactions'],
    path: '/admin/wallet',
    noindex: true,
    nofollow: true,
  }, locale);
}

export default async function AdminWalletPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <AdminWalletContent />;
}

