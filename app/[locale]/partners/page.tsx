import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import PartnersContent from '@/components/pages/PartnersContent';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Partners' });
  
  return {
    title: `${t('title')} - PadelO₂`,
    description: t('subhead'),
  };
}

export default function PartnersPage() {
  return <PartnersContent />;
}


