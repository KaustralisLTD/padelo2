import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import MachinesContent from '@/components/pages/MachinesContent';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Machines' });
  
  return {
    title: `${t('title')} - PadelO₂`,
    description: t('subhead'),
  };
}

export default function MachinesPage() {
  return <MachinesContent />;
}


