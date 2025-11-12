'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import ContactForm from '@/components/forms/ContactForm';

export default function MachinesContent() {
  const t = useTranslations('Machines');
  const [showForm, setShowForm] = useState(false);

  const features = [
    { key: 'aiDrills', icon: '🤖' },
    { key: 'visionAnalysis', icon: '👁️' },
    { key: 'virtualCoach', icon: '🎯' },
    { key: 'cloudApi', icon: '☁️' },
    { key: 'rentalMode', icon: '📱' },
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

        {/* Main Machine Image */}
        <div className="mb-12">
          <div className="relative w-full h-[500px] md:h-[600px] rounded-lg overflow-hidden border border-gray-800">
            <Image
              src="/images/machines/machine-main.jpg"
              alt="AI-Powered Training Machine"
              fill
              className="object-contain"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const parent = target.parentElement;
                if (parent) {
                  parent.innerHTML = '<div class="w-full h-full flex items-center justify-center bg-background-secondary"><p class="text-text-secondary font-poppins">Machine Image</p></div>';
                }
              }}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {features.map((feature) => (
            <div
              key={feature.key}
              className="bg-background-secondary p-6 rounded-lg border border-gray-800 hover:border-primary transition-colors"
            >
              <div className="flex items-start gap-4">
                <span className="text-3xl">{feature.icon}</span>
                <div>
                  <h3 className="text-lg font-poppins font-bold mb-2 text-text">
                    {t(`features.${feature.key}.title`)}
                  </h3>
                  <p className="text-text-secondary font-poppins text-sm">
                    {t(`features.${feature.key}.description`)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {!showForm ? (
          <div className="text-center">
            <button
              onClick={() => setShowForm(true)}
              className="px-8 py-3 bg-gradient-primary text-background font-orbitron font-semibold rounded-lg hover:opacity-90 transition-opacity text-lg"
            >
              {t('cta')} →
            </button>
          </div>
        ) : (
          <div>
            <button
              onClick={() => setShowForm(false)}
              className="mb-6 text-text-secondary hover:text-primary font-poppins transition-colors"
            >
              ← {t('back')}
            </button>
            <ContactForm email="rent@padelo2.com" subject="Machine Rental Inquiry" />
          </div>
        )}
      </div>
    </div>
  );
}

