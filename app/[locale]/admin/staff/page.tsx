import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';
import AdminStaffContent from '@/components/pages/AdminStaffContent';
import { generateMetadata as generateSEOMetadata } from '@/lib/seo';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'Admin' });
  
  return generateSEOMetadata({
    title: t('staff.title'),
    description: t('staff.description'),
    keywords: ['padel admin', 'padel management', 'padel staff'],
    path: '/admin/staff',
    noindex: true, // Private admin page
    nofollow: true,
  }, locale);
}

export default async function AdminStaffPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <AdminStaffContent />;
}


