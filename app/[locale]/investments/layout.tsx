import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { generateMetadata as generateSEOMetadata } from '@/lib/seo';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'Investments' });
  
  return generateSEOMetadata({
    title: t('title'),
    description: t('subhead') || t('body'),
    keywords: ['padel investments', 'padel funding', 'padel opportunities', 'padel business', 'padel partnerships'],
    path: '/investments',
  }, locale);
}

export default function InvestmentsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

