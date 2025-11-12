import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';
import AdminUsersContent from '@/components/pages/AdminUsersContent';
import { generateMetadata as generateSEOMetadata } from '@/lib/seo';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'Admin' });
  
  return generateSEOMetadata({
    title: t('users.title'),
    description: t('users.description'),
    keywords: ['padel admin', 'padel management', 'padel users'],
    path: '/admin/users',
    noindex: true, // Private admin page
    nofollow: true,
  }, locale);
}

export default async function AdminUsersPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <AdminUsersContent />;
}


