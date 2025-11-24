import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';
import AdminMessagesContent from '@/components/pages/AdminMessagesContent';
import { generateMetadata as generateSEOMetadata } from '@/lib/seo';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'Admin' });

  return generateSEOMetadata({
    title: t('messages.title'),
    description: t('messages.description'),
    keywords: ['admin messages', 'chat'],
    path: '/admin/messages',
    noindex: true,
    nofollow: true,
  }, locale);
}

export default async function AdminMessagesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <AdminMessagesContent />;
}

