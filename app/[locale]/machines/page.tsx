import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';
import MachinesContent from '@/components/pages/MachinesContent';
import { generateMetadata as generateSEOMetadata } from '@/lib/seo';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'Machines' });
  
  return generateSEOMetadata({
    title: t('title'),
    description: t('subhead') || t('body'),
    keywords: ['padel machines', 'AI padel training', 'padel equipment', 'padel technology', 'padel innovation'],
    path: '/machines',
  }, locale);
}

export default async function MachinesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <MachinesContent />;
}


