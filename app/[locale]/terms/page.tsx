import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';
import { generateMetadata as generateSEOMetadata } from '@/lib/seo';
import TermsContent from '@/components/pages/TermsContent';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'Terms' });
  
  return generateSEOMetadata({
    title: t('title'),
    description: t('description'),
    keywords: ['padel terms', 'padel service terms', 'padel conditions'],
    path: '/terms',
    noindex: false,
    nofollow: false,
  }, locale);
}

export default async function TermsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <TermsContent />;
}

