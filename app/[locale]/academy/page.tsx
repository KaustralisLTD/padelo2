import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';
import AcademyContent from '@/components/pages/AcademyContent';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Academy' });
  
  return {
    title: `${t('title')} - PadelO₂`,
    description: t('subhead'),
  };
}

export default async function AcademyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <AcademyContent />;
}


