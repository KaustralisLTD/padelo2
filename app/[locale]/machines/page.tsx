import { setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';
import MachinesContent from '@/components/pages/MachinesContent';
import { generateMetadata as generateSEOMetadata } from '@/lib/seo';
import { getSEOData } from '@/lib/seo-data';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const seo = getSEOData('/machines', locale);
  
  if (!seo) {
    return generateSEOMetadata({
      title: 'AI Padel Training Machines — App-Controlled Drills & Analytics',
      description: 'Smart padel ball machines with AI patterns, spin/speed control, coaching app and IoT. Buy or rent with PadelO₂.',
      keywords: ['AI padel training machine', 'padel ball machine', 'app-controlled', 'drills', 'IoT', 'rental'],
      path: '/machines',
    }, locale);
  }
  
  return generateSEOMetadata({
    title: seo.title,
    description: seo.description,
    keywords: ['AI padel training machine', 'padel ball machine', 'app-controlled', 'drills', 'IoT', 'rental'],
    path: '/machines',
  }, locale);
}

export default async function MachinesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  
  // Generate Product schema for AI machines
  const { generateProductSchema } = await import('@/lib/schema');
  const productSchema = generateProductSchema(locale, {
    name: 'PadelO₂ AI Training Machine',
    description: 'App-controlled AI drills, spin & speed control, IoT.',
    brand: 'PadelO₂',
    category: 'Padel training ball machine',
    image: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://padelo2.com'}/images/machines/ai-machine-1.jpg`,
    offers: {
      availability: 'https://schema.org/PreOrder',
      priceCurrency: 'EUR',
    },
  });
  
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(productSchema),
        }}
      />
      <MachinesContent />
    </>
  );
}


