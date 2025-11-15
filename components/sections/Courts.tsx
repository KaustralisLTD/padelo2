'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';

const Courts = () => {
  const t = useTranslations('Courts');
  const [activeTab, setActiveTab] = useState('indoor');
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.2 });

  const tabs = ['indoor', 'outdoor', 'panoramic', 'mobile'];

  const getCourtImages = (tab: string) => {
    return [
      `/images/courts/${tab}-1.jpg`,
      `/images/courts/${tab}-2.jpg`,
    ];
  };

  return (
    <section ref={ref} className="py-20 bg-background-secondary">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-poppins font-bold mb-6 gradient-text">
            {t('title')}
          </h2>
          <p className="text-text-secondary font-poppins text-lg max-w-2xl mx-auto">
            {t('subhead')}
          </p>
        </motion.div>

        {/* Tabs */}
        <div className="flex flex-wrap justify-center gap-4 mb-12">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2 font-orbitron font-semibold rounded-lg transition-colors ${
                activeTab === tab
                  ? 'bg-gradient-primary text-background'
                  : 'bg-background border border-gray-800 text-text-secondary hover:border-primary'
              }`}
            >
              {t(`tabs.${tab}`)}
            </button>
          ))}
        </div>

        {/* Gallery */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        >
          {getCourtImages(activeTab).map((image, index) => (
            <motion.div
              key={`${activeTab}-${index}`}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={inView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.4, delay: 0.4 + index * 0.1 }}
              className="aspect-square bg-background rounded-lg border border-gray-800 overflow-hidden hover:border-primary transition-colors relative"
            >
              <Image
                src={image}
                alt={`${t(`tabs.${activeTab}`)} Court ${index + 1}`}
                fill
                className="object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const parent = target.parentElement;
                  if (parent) {
                    parent.innerHTML = '<div class="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center"><p class="text-text-secondary text-sm font-poppins">Court Image</p></div>';
                  }
                }}
              />
            </motion.div>
          ))}
        </motion.div>

        <div className="text-center">
          <button className="px-8 py-3 bg-gradient-primary text-background font-orbitron font-semibold rounded-lg hover:opacity-90 transition-opacity">
            {t('cta')}
          </button>
        </div>
      </div>
    </section>
  );
};

export default Courts;


