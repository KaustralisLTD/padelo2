'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import InvestmentModal from '@/components/modals/InvestmentModal';

export default function InvestmentsPage() {
  const t = useTranslations('Investments');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const models = [
    { key: 'revenueShare', icon: '💰' },
    { key: 'leaseToOwn', icon: '📋' },
    { key: 'localJv', icon: '🤝' },
    { key: 'techLicensing', icon: '🔧' },
  ];

  return (
    <>
      <div className="container mx-auto px-4 py-20 mt-20">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-poppins font-bold mb-4 gradient-text text-center">
            {t('title')}
          </h1>
          
          <h2 className="text-3xl md:text-4xl font-poppins font-semibold mb-3 text-center text-text mt-8">
            {t('headline')}
          </h2>
          
          <p className="text-xl text-text-secondary font-poppins text-center mb-12">
            {t('subhead')}
          </p>

          {/* Main Investment Image */}
          <div className="mb-12">
            <div className="relative w-full h-64 md:h-96 rounded-lg overflow-hidden border border-gray-800">
              <Image
                src="/images/investments/investment-hero.jpg"
                alt="Joint Investments"
                fill
                className="object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const parent = target.parentElement;
                  if (parent) {
                    parent.innerHTML = '<div class="w-full h-full flex items-center justify-center bg-background-secondary"><p class="text-text-secondary font-poppins">Investment Image</p></div>';
                  }
                }}
              />
            </div>
          </div>

          <div className="mb-12">
            <p className="text-text-secondary font-poppins text-lg leading-relaxed mb-8">
              {t('body')}
            </p>
          </div>

          {/* Investment Models */}
          <div className="mb-8">
            <h3 className="text-2xl font-poppins font-semibold mb-6 text-center text-text">
              {t('models.title')}:
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {models.map((model) => (
                <div
                  key={model.key}
                  className="bg-background-secondary p-6 rounded-lg border border-gray-800 hover:border-primary transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <span className="text-3xl">{model.icon}</span>
                    <div>
                      <h4 className="text-lg font-poppins font-semibold mb-2 text-text">
                        {t(`models.${model.key}.title`)}
                      </h4>
                      <p className="text-text-secondary font-poppins text-sm">
                        {t(`models.${model.key}.description`)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Note */}
          <div className="bg-background-secondary p-6 rounded-lg border border-gray-800 mb-12">
            <p className="text-text-secondary font-poppins text-sm italic">
              {t('note')}
            </p>
          </div>

          <div className="text-center">
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-8 py-3 bg-gradient-primary text-background font-poppins font-semibold rounded-lg hover:opacity-90 transition-opacity text-lg"
            >
              {t('cta')} →
            </button>
          </div>
        </div>
      </div>
      <InvestmentModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}
