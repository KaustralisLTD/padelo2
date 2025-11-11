'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import ContactForm from '@/components/forms/ContactForm';

export default function CourtsContent() {
  const t = useTranslations('Courts');
  const [activeTab, setActiveTab] = useState('indoor');
  const [showForm, setShowForm] = useState(false);

  const tabs = ['indoor', 'outdoor', 'panoramic', 'mobile'];
  
  const features = [
    { key: 'types', icon: '🏗️' },
    { key: 'certificates', icon: '✅' },
    { key: 'lighting', icon: '💡' },
    { key: 'options', icon: '⚙️' },
    { key: 'timeline', icon: '⏱️' },
  ];

  return (
    <div className="container mx-auto px-4 py-20 mt-20">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-orbitron font-bold mb-4 gradient-text text-center">
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

        {/* Tabs */}
        <div className="flex flex-wrap justify-center gap-4 mb-12">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2 font-orbitron font-semibold rounded-lg transition-colors ${
                activeTab === tab
                  ? 'bg-gradient-primary text-background'
                  : 'bg-background-secondary border border-gray-800 text-text-secondary hover:border-primary'
              }`}
            >
              {t(`tabs.${tab}`)}
            </button>
          ))}
        </div>

        {/* Court Images Gallery */}
        <div className="mb-12">
          <h3 className="text-2xl font-orbitron font-semibold mb-6 text-center text-text">
            {t('gallery', { defaultValue: 'Gallery' })}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {tabs.map((tab, index) => (
              <div
                key={tab}
                className="relative aspect-square rounded-lg overflow-hidden border border-gray-800 hover:border-primary transition-colors"
              >
                <Image
                  src={`/images/courts/${tab}-${(index % 2) + 1}.jpg`}
                  alt={`${t(`tabs.${tab}`)} Court`}
                  fill
                  className="object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent) {
                      parent.innerHTML = `<div class="w-full h-full flex items-center justify-center bg-background-secondary"><p class="text-text-secondary text-xs font-poppins">${t(`tabs.${tab}`)}</p></div>`;
                    }
                  }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {features.map((feature) => (
            <div
              key={feature.key}
              className="bg-background-secondary p-6 rounded-lg border border-gray-800 hover:border-primary transition-colors"
            >
              <div className="flex items-start gap-4">
                <span className="text-3xl">{feature.icon}</span>
                <div>
                  <h3 className="text-lg font-orbitron font-semibold mb-2 text-text">
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

        <div className="text-center mb-12">
          <button
            onClick={() => setShowForm(true)}
            className="px-8 py-3 bg-gradient-primary text-background font-orbitron font-semibold rounded-lg hover:opacity-90 transition-opacity text-lg"
          >
            {t('cta')} →
          </button>
        </div>

        {showForm && (
          <div className="mt-12">
            <button
              onClick={() => setShowForm(false)}
              className="mb-6 text-text-secondary hover:text-primary font-poppins transition-colors"
            >
              ← {t('back', { defaultValue: 'Back' })}
            </button>
            <ContactForm email="club@padelo2.com" subject="Court Quote Request" />
          </div>
        )}
      </div>
    </div>
  );
}

