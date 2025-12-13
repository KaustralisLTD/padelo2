import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';
import StaffRegistrationsContent from '@/components/pages/StaffRegistrationsContent';
import { generateMetadata as generateSEOMetadata } from '@/lib/seo';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'Admin' });
  
  return generateSEOMetadata({
    title: t('staff.manageRegistrations'),
    description: 'Manage tournament registrations',
    keywords: ['padel staff', 'tournament registrations'],
    path: '/staff/registrations',
    noindex: true,
    nofollow: true,
  }, locale);
}

export default async function StaffRegistrationsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <StaffRegistrationsContent />;
}

