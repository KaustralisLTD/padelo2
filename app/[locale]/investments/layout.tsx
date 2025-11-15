import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { generateMetadata as generateSEOMetadata } from '@/lib/seo';
import { getSEOData } from '@/lib/seo-data';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const seo = getSEOData('/investments', locale);
  
  if (!seo) {
    return generateSEOMetadata({
      title: 'Joint Investments in Padel — Courts, Tech & Growth',
      description: 'Co-invest with PadelO₂: courts, AI tech and expansion. Transparent terms, ROI models and revenue sharing.',
      keywords: ['invest in padel courts', 'joint investments', 'ROI', 'revenue sharing', 'club partnerships'],
      path: '/investments',
    }, locale);
  }
  
  return generateSEOMetadata({
    title: seo.title,
    description: seo.description,
    keywords: ['invest in padel courts', 'joint investments', 'ROI', 'revenue sharing', 'club partnerships'],
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
