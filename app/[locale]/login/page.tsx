import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';
import LoginContent from '@/components/pages/LoginContent';
import { generateMetadata as generateSEOMetadata } from '@/lib/seo';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'Login' });
  
  return generateSEOMetadata({
    title: t('title'),
    description: t('description'),
    keywords: ['padel login', 'padel account', 'padel access'],
    path: '/login',
    noindex: true, // Private page
    nofollow: true,
  }, locale);
}

export default async function LoginPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <LoginContent />;
}


