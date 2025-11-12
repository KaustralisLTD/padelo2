import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';
import AcademyContent from '@/components/pages/AcademyContent';
import { generateMetadata as generateSEOMetadata } from '@/lib/seo';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'Academy' });
  
  return generateSEOMetadata({
    title: t('title'),
    description: t('subhead') || t('body'),
    keywords: ['padel academy', 'padel training', 'padel coaching', 'padel certification', 'padel education'],
    path: '/academy',
  }, locale);
}

export default async function AcademyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <AcademyContent />;
}


