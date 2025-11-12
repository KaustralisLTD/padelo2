import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';
import AdminTournamentsContent from '@/components/pages/AdminTournamentsContent';
import { generateMetadata as generateSEOMetadata } from '@/lib/seo';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'Admin' });
  
  return generateSEOMetadata({
    title: t('tournaments.title'),
    description: t('tournaments.description'),
    keywords: ['padel admin', 'padel management', 'padel tournaments'],
    path: '/admin/tournaments',
    noindex: true, // Private admin page
    nofollow: true,
  }, locale);
}

export default async function AdminTournamentsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <AdminTournamentsContent />;
}


