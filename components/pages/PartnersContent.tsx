'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';
import ContactForm from '@/components/forms/ContactForm';

export default function PartnersContent() {
  const t = useTranslations('Partners');

  const benefits = [
    { key: 'visibility', icon: '👁️' },
    { key: 'roi', icon: '💰' },
    { key: 'marketing', icon: '📢' },
    { key: 'technology', icon: '🔧' },
    { key: 'network', icon: '🌐' },
  ];

  return (
    <div className="container mx-auto px-4 py-20 mt-20">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-orbitron font-bold mb-4 gradient-text text-center title-with-subscript">
          {t('title')}
        </h1>
        
        <h2 className="text-3xl md:text-4xl font-poppins font-bold mb-3 text-center text-text mt-8">
          {t('headline')}
        </h2>
        
        <p className="text-xl text-text-secondary font-poppins text-center mb-12">
          {t('subhead')}
        </p>

        <div className="mb-12">
          <p className="text-text-secondary font-poppins text-lg leading-relaxed mb-8">
            {t('body')}
          </p>
        </div>

        {/* Benefits */}
        <div className="mb-12">
          <h3 className="text-2xl font-poppins font-bold mb-6 text-center text-text">
            {t('benefits.title')}:
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((benefit) => (
              <div
                key={benefit.key}
                className="bg-background-secondary p-6 rounded-lg border border-gray-800 hover:border-primary transition-colors"
              >
                <div className="text-3xl mb-3">{benefit.icon}</div>
                <h4 className="text-lg font-poppins font-bold mb-2 text-text">
                  {t(`benefits.${benefit.key}.title`)}
                </h4>
                <p className="text-text-secondary font-poppins text-sm">
                  {t(`benefits.${benefit.key}.description`)}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Partner Logos */}
        <div className="mb-12">
          <h3 className="text-2xl font-poppins font-bold mb-6 text-center text-text">
            {t('partners')}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {Array.from({ length: 8 }, (_, i) => (
              <div
                key={i + 1}
                className="relative aspect-square bg-background-secondary p-6 rounded-lg border border-gray-800 hover:border-primary transition-colors"
              >
                <Image
                  src={`/images/partners/partner${i + 1}.png`}
                  alt={`Partner ${i + 1}`}
                  fill
                  className="object-contain p-4"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent) {
                      parent.innerHTML = `<p class="text-text-secondary text-xs font-poppins text-center flex items-center justify-center h-full">Partner ${i + 1}</p>`;
                    }
                  }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Contact Form */}
        <div className="mt-16">
          <h3 className="text-2xl font-poppins font-bold mb-6 text-center text-text">
            {t('cta')}
          </h3>
          <ContactForm email="partner@padelo2.com" subject="Partnership Inquiry" />
        </div>
      </div>
    </div>
  );
}

