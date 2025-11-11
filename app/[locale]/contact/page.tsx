import { getTranslations, setRequestLocale } from 'next-intl/server';
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

export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <ContactContent />;
}
