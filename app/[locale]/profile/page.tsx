import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import ProfileContent from '@/components/pages/ProfileContent';
import { generateMetadata as generateSEOMetadata } from '@/lib/seo';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'Profile' });
  
  return generateSEOMetadata({
    title: t('title'),
    description: t('description'),
    keywords: ['profile', 'user profile', 'account settings', 'padel profile'],
    path: '/profile',
    noindex: true,
    nofollow: true,
  }, locale);
}

export default async function ProfilePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <ProfileContent />;
}

