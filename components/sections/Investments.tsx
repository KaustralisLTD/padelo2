'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { useInView } from 'react-intersection-observer';
import InvestmentModal from '@/components/modals/InvestmentModal';

const Investments = () => {
  const t = useTranslations('Investments');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.2 });

  return (
    <>
      <section ref={ref} className="py-20 bg-background relative overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 opacity-10">
          <Image
            src="/images/investments/investment-hero.jpg"
            alt=""
            fill
            className="object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="max-w-4xl mx-auto text-center"
          >
            <h2 className="text-4xl md:text-5xl font-poppins font-bold mb-6 gradient-text">
              {t('title')}
            </h2>
            <p className="text-text-secondary font-poppins text-lg mb-8 leading-relaxed">
              {t('subhead')}
            </p>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={inView ? { opacity: 1, scale: 1 } : {}}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="bg-background-secondary p-6 rounded-lg border border-gray-800"
              >
                <div className="text-3xl font-orbitron font-bold text-primary mb-2">50+</div>
                <div className="text-text-secondary font-poppins text-sm">{t('stats.projects')}</div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={inView ? { opacity: 1, scale: 1 } : {}}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="bg-background-secondary p-6 rounded-lg border border-gray-800"
              >
                <div className="text-3xl font-orbitron font-bold text-primary mb-2">€10M+</div>
                <div className="text-text-secondary font-poppins text-sm">{t('stats.funds')}</div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={inView ? { opacity: 1, scale: 1 } : {}}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="bg-background-secondary p-6 rounded-lg border border-gray-800"
              >
                <div className="text-3xl font-orbitron font-bold text-primary mb-2">25+</div>
                <div className="text-text-secondary font-poppins text-sm">{t('stats.countries')}</div>
              </motion.div>
            </div>

            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.8 }}
              onClick={() => setIsModalOpen(true)}
              className="px-8 py-4 bg-gradient-primary text-background font-orbitron font-semibold rounded-lg hover:opacity-90 transition-opacity text-lg"
            >
              {t('cta')}
            </motion.button>
          </motion.div>
        </div>
      </section>

      <InvestmentModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
};

export default Investments;


