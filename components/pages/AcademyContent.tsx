'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';
import ContactForm from '@/components/forms/ContactForm';

export default function AcademyContent() {
  const t = useTranslations('Academy');

  const programs = [
    { key: 'coach', icon: '👨‍🏫' },
    { key: 'player', icon: '🎾' },
    { key: 'smart', icon: '🤖' },
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

        <div className="mb-12">
          <p className="text-text-secondary font-poppins text-lg leading-relaxed mb-8">
            {t('body')}
          </p>
        </div>

        {/* Main Academy Image */}
        <div className="mb-12">
          <div className="relative w-full h-64 md:h-96 rounded-lg overflow-hidden border border-gray-800">
            <Image
              src="/images/academy/academy-main.jpg"
              alt="Padel Academy"
              fill
              className="object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const parent = target.parentElement;
                if (parent) {
                  parent.innerHTML = '<div class="w-full h-full flex items-center justify-center bg-background-secondary"><p class="text-text-secondary font-poppins">Academy Image</p></div>';
                }
              }}
            />
          </div>
        </div>

        {/* Programs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {programs.map((program) => (
            <div
              key={program.key}
              className="bg-background-secondary p-6 rounded-lg border border-gray-800 hover:border-primary transition-colors"
            >
              <div className="text-4xl mb-4 text-center">{program.icon}</div>
              <h3 className="text-xl font-orbitron font-semibold mb-3 text-text text-center">
                {t(`programs.${program.key}.title`)}
              </h3>
              <p className="text-text-secondary font-poppins text-sm leading-relaxed">
                {t(`programs.${program.key}.description`)}
              </p>
            </div>
          ))}
        </div>

        {/* Contact Form */}
        <div className="mt-16">
          <h3 className="text-2xl font-orbitron font-semibold mb-6 text-center text-text">
            {t('cta')}
          </h3>
          <ContactForm email="coach@padelo2.com" subject="Academy Inquiry" />
        </div>
      </div>
    </div>
  );
}

