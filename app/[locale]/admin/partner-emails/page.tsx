import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';
import { generateMetadata as generateSEOMetadata } from '@/lib/seo';
import EmailTemplatesContent from '@/components/pages/EmailTemplatesContent';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'Admin' });

  return generateSEOMetadata({
    title: 'Email Templates',
    description: 'Send emails to partners, clients, coaches, and staff',
    keywords: ['admin', 'email templates', 'partners', 'clients', 'coaches', 'staff'],
    path: '/admin/partner-emails',
    noindex: true,
    nofollow: true,
  }, locale);
}

export default async function PartnerEmailsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <EmailTemplatesContent />;
}

