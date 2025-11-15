import { setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';
import AcademyContent from '@/components/pages/AcademyContent';
import { generateMetadata as generateSEOMetadata } from '@/lib/seo';
import { getSEOData } from '@/lib/seo-data';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const seo = getSEOData('/academy', locale);
  
  if (!seo) {
    return generateSEOMetadata({
      title: 'Padel Academy — Programs for Players & Coach Certification',
      description: 'Comprehensive padel programs: player pathways, coach certification, drills, analytics. Train smarter with PadelO₂ Academy.',
      keywords: ['padel academy', 'padel training', 'padel coaching', 'padel certification', 'padel education'],
      path: '/academy',
    }, locale);
  }
  
  return generateSEOMetadata({
    title: seo.title,
    description: seo.description,
    keywords: ['padel academy', 'padel coaching programs', 'certification for coaches', 'drills', 'junior padel training'],
    path: '/academy',
  }, locale);
}

export default async function AcademyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <AcademyContent />;
}


