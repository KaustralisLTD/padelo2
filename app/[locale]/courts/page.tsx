import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import CourtsContent from '@/components/pages/CourtsContent';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Courts' });
  
  return {
    title: `${t('title')} - PadelO₂`,
    description: t('subhead'),
  };
}

export default async function CourtsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <CourtsContent />;
}


