import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';
import AdminDashboardContent from '@/components/pages/AdminDashboardContent';
import { generateMetadata as generateSEOMetadata } from '@/lib/seo';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'Admin' });
  
  return generateSEOMetadata({
    title: t('dashboard.title'),
    description: 'Admin Dashboard',
    keywords: ['padel admin', 'padel management'],
    path: '/admin/dashboard',
    noindex: true,
    nofollow: true,
  }, locale);
}

export default async function AdminDashboardPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <AdminDashboardContent />;
}

