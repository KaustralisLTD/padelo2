import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';
import PartnersContent from '@/components/pages/PartnersContent';
import { generateMetadata as generateSEOMetadata } from '@/lib/seo';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'Partners' });
  
  return generateSEOMetadata({
    title: t('title'),
    description: t('subhead') || t('body'),
    keywords: ['padel partners', 'padel partnerships', 'padel collaboration', 'padel network', 'padel community'],
    path: '/partners',
  }, locale);
}

export default async function PartnersPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <PartnersContent />;
}


