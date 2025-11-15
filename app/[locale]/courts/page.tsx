import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import CourtsContent from '@/components/pages/CourtsContent';
import { generateMetadata as generateSEOMetadata } from '@/lib/seo';
import { getSEOData } from '@/lib/seo-data';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const seo = getSEOData('/courts', locale);
  
  if (!seo) {
    return generateSEOMetadata({
      title: 'Padel Court Construction — Indoor, Outdoor & Panoramic',
      description: 'Turnkey padel courts: indoor/outdoor, panoramic glass, foundations, lighting & maintenance. Global delivery by PadelO₂.',
      keywords: ['padel court construction', 'panoramic padel courts', 'indoor outdoor courts', 'turnkey installation', 'glass walls'],
      path: '/courts',
    }, locale);
  }
  
  return generateSEOMetadata({
    title: seo.title,
    description: seo.description,
    keywords: ['padel court construction', 'panoramic padel courts', 'indoor outdoor courts', 'turnkey installation', 'glass walls'],
    path: '/courts',
  }, locale);
}

export default async function CourtsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  
  // Generate Service schema for court construction
  const { generateCourtConstructionServiceSchema } = await import('@/lib/schema');
  const serviceSchema = generateCourtConstructionServiceSchema(locale);
  
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(serviceSchema),
        }}
      />
      <CourtsContent />
    </>
  );
}


