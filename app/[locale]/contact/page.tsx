import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import ContactContent from '@/components/pages/ContactContent';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Contact' });
  
  return {
    title: `${t('title')} - PadelO₂`,
    description: t('description'),
  };
}

export default function ContactPage() {
  return <ContactContent />;
}
