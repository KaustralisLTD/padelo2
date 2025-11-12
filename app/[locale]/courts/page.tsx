import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import CourtsContent from '@/components/pages/CourtsContent';
import { generateMetadata as generateSEOMetadata } from '@/lib/seo';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'Courts' });
  
  return generateSEOMetadata({
    title: t('title'),
    description: t('subhead') || t('body'),
    keywords: ['padel courts', 'padel court construction', 'padel facilities', 'padel infrastructure', 'padel venues'],
    path: '/courts',
  }, locale);
}

export default async function CourtsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <CourtsContent />;
}


