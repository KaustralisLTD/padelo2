import { setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';
import Hero from '@/components/sections/Hero';
import HistoryTimeline from '@/components/sections/HistoryTimeline';
import Investments from '@/components/sections/Investments';
import Academy from '@/components/sections/Academy';
import Machines from '@/components/sections/Machines';
import Courts from '@/components/sections/Courts';
import Partners from '@/components/sections/Partners';
import { generateServiceSchema } from '@/lib/schema';
import { generateMetadata as generateSEOMetadata } from '@/lib/seo';
import { getSEOData } from '@/lib/seo-data';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const seo = getSEOData('/', locale);
  
  if (!seo) {
    return generateSEOMetadata({
      title: 'PadelO₂ — AI Training, Courts, Academy & Tournaments',
      description: 'The padel ecosystem: AI-powered training machines, pro court construction, academy and global tournaments. Breathe and play with PadelO₂.',
      path: '',
    }, locale);
  }
  
  return generateSEOMetadata({
    title: seo.title,
    description: seo.description,
    keywords: ['padel ecosystem', 'AI padel machines', 'padel courts', 'padel academy', 'tournaments'],
    path: '',
  }, locale);
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  
  // Generate service schemas for main services
  const services = [
    {
      name: 'Padel Tournaments',
      description: 'Professional and amateur padel tournaments worldwide',
      serviceType: 'Sports Event Organization',
      provider: 'PadelO₂',
    },
    {
      name: 'Padel Academy',
      description: 'World-class training programs for coaches and players',
      serviceType: 'Sports Education',
      provider: 'PadelO₂',
    },
    {
      name: 'AI Padel Machines',
      description: 'AI-powered training machines for padel players',
      serviceType: 'Sports Equipment',
      provider: 'PadelO₂',
    },
    {
      name: 'Padel Court Construction',
      description: 'Global padel court construction and infrastructure',
      serviceType: 'Construction Service',
      provider: 'PadelO₂',
    },
  ];

  const serviceSchemas = services.map(service => generateServiceSchema(locale, service));
  
  return (
    <>
      {/* Service Schemas */}
      {serviceSchemas.map((schema, index) => (
        <script
          key={`service-schema-${index}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(schema),
          }}
        />
      ))}
      <Hero />
      <HistoryTimeline />
      <Investments />
      <Academy />
      <Machines />
      <Courts />
      <Partners />
    </>
  );
}

