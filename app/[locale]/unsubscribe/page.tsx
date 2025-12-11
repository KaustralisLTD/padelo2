import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';
import UnsubscribeContent from '@/components/pages/UnsubscribeContent';
import { generateMetadata as generateSEOMetadata } from '@/lib/seo';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'Unsubscribe' });
  
  return generateSEOMetadata({
    title: t('title'),
    description: t('description'),
    keywords: ['unsubscribe', 'email preferences', 'padel unsubscribe'],
    path: '/unsubscribe',
  }, locale);
}

export default async function UnsubscribePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <UnsubscribeContent />;
}

