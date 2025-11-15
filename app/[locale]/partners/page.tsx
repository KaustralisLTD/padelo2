import { setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';
import PartnersContent from '@/components/pages/PartnersContent';
import { generateMetadata as generateSEOMetadata } from '@/lib/seo';
import { getSEOData } from '@/lib/seo-data';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const seo = getSEOData('/partners', locale);
  
  if (!seo) {
    return generateSEOMetadata({
      title: 'Partners & Ecosystem — Clubs, Brands & Tech',
      description: 'Join the PadelO₂ ecosystem: clubs, brands and tech partners. Mutual growth, transparency and measurable impact.',
      keywords: ['padel partners', 'padel partnerships', 'padel collaboration', 'padel network', 'padel community'],
      path: '/partners',
    }, locale);
  }
  
  return generateSEOMetadata({
    title: seo.title,
    description: seo.description,
    keywords: ['padel partners', 'padel partnerships', 'padel collaboration', 'padel network', 'padel community'],
    path: '/partners',
  }, locale);
}

export default async function PartnersPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <PartnersContent />;
}


