import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';
import { generateMetadata as generateSEOMetadata } from '@/lib/seo';
import PartnerEmailsContent from '@/components/pages/PartnerEmailsContent';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'Admin' });

  return generateSEOMetadata({
    title: 'Partner Emails',
    description: 'Send sponsorship emails to partners',
    keywords: ['admin', 'partner emails', 'sponsorship'],
    path: '/admin/partner-emails',
    noindex: true,
    nofollow: true,
  }, locale);
}

export default async function PartnerEmailsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <PartnerEmailsContent />;
}

