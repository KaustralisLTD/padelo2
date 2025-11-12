import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import ConfirmationContent from '@/components/pages/ConfirmationContent';
import { generateMetadata as generateSEOMetadata } from '@/lib/seo';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'Tournaments' });
  
  return generateSEOMetadata({
    title: t('confirmation.title'),
    description: t('confirmation.description'),
    keywords: ['padel tournament confirmation', 'padel registration confirmed'],
    path: '/tournament/confirmation',
    noindex: true, // Private page
    nofollow: true,
  }, locale);
}

export default async function ConfirmationPage({ 
  params,
  searchParams,
}: { 
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const { locale } = await params;
  const resolvedSearchParams = await searchParams;
  const token = resolvedSearchParams.token;
  
  setRequestLocale(locale);
  
  if (!token) {
    notFound();
  }
  
  return <ConfirmationContent token={token} />;
}

