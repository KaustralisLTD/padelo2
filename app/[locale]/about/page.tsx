import Image from 'next/image';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';
import { generateMetadata as generateSEOMetadata } from '@/lib/seo';
import { getSEOData } from '@/lib/seo-data';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const seo = getSEOData('/about', locale);
  
  if (!seo) {
    return generateSEOMetadata({
      title: 'About PadelO₂ — Innovation in the Padel Ecosystem',
      description: 'We build the future of padel: AI machines, global courts, academy and joint investments. Breathe and play.',
      keywords: ['about PadelO2', 'padel innovation brand', 'mission vision', 'history of padel'],
      path: '/about',
    }, locale);
  }
  
  return generateSEOMetadata({
    title: seo.title,
    description: seo.description,
    keywords: ['about PadelO2', 'padel innovation brand', 'mission vision', 'history of padel'],
    path: '/about',
  }, locale);
}

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'About' });
  
  const highlights = [
    { key: 'multilanguage', icon: '🌍' },
    { key: 'ecosystem', icon: '🔗' },
    { key: 'design', icon: '🎨' },
  ];

  return (
    <div className="container mx-auto px-4 py-20 mt-20">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-orbitron font-bold mb-4 gradient-text text-center title-with-subscript">
          {t('title')}
        </h1>
        
        <h2 className="text-3xl md:text-4xl font-orbitron font-semibold mb-3 text-center text-text mt-8">
          {t('headline')}
        </h2>
        
        <p className="text-xl text-text-secondary font-poppins text-center mb-12">
          {t('subhead')}
        </p>

        {/* Hero Image */}
        <div className="mb-12">
          <div className="relative w-full h-80 md:h-[500px] rounded-lg overflow-hidden border border-gray-800">
            <Image
              src="/images/about/about-hero.jpg"
              alt="About PadelO₂"
              fill
              className="object-contain"
            />
          </div>
        </div>

        <div className="mb-12">
          <p className="text-text-secondary font-poppins text-lg leading-relaxed mb-6">
            {t('body')}
          </p>
          <p className="text-text-secondary font-poppins text-lg leading-relaxed mb-8">
            {t('mission')}
          </p>
        </div>

        {/* Highlights */}
        <div className="mb-12">
          <h3 className="text-2xl font-orbitron font-semibold mb-6 text-center text-text">
            {t('highlights.title')}:
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {highlights.map((highlight) => (
              <div
                key={highlight.key}
                className="bg-background-secondary p-6 rounded-lg border border-gray-800 hover:border-primary transition-colors text-center"
              >
                <span className="text-4xl mb-4 block">{highlight.icon}</span>
                <h4 className="text-lg font-orbitron font-semibold mb-2 text-text">
                  {t(`highlights.${highlight.key}.title`)}
                </h4>
                <p className="text-text-secondary font-poppins text-sm">
                  {t(`highlights.${highlight.key}.description`)}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center">
          <button className="px-8 py-3 bg-gradient-primary text-background font-orbitron font-semibold rounded-lg hover:opacity-90 transition-opacity text-lg">
            {t('cta')} →
          </button>
        </div>
      </div>
    </div>
  );
}


