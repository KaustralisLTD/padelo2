'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import Image from 'next/image';

const Machines = () => {
  const t = useTranslations('Machines');
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.2 });

  return (
    <section ref={ref} className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl md:text-5xl font-poppins font-bold mb-6 gradient-text">
              {t('title')}
            </h2>
            <p className="text-text-secondary font-poppins text-lg mb-6 leading-relaxed">
              {t('body')}
            </p>
            <ul className="space-y-3 mb-8">
              {['aiDrills', 'visionAnalysis', 'virtualCoach'].map((feature, index) => (
                <motion.li
                  key={feature}
                  initial={{ opacity: 0, x: -20 }}
                  animate={inView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.6, delay: 0.3 + index * 0.1 }}
                  className="flex items-start space-x-3"
                >
                  <span className="text-primary mt-1">✓</span>
                  <span className="text-text-secondary font-poppins">{t(`features.${feature}.title`)}</span>
                </motion.li>
              ))}
            </ul>
            <button className="px-6 py-3 border-2 border-primary text-primary font-orbitron font-semibold rounded-lg hover:bg-primary/10 transition-colors">
              {t('cta')}
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            <div className="aspect-video bg-background-secondary rounded-lg border border-gray-800 overflow-hidden relative">
              <Image
                src="/images/machines/machine-main.jpg"
                alt="AI-Powered Training Machine"
                fill
                className="object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const parent = target.parentElement;
                  if (parent) {
                    parent.innerHTML = '<p class="text-text-secondary font-poppins flex items-center justify-center h-full">3D Machine Preview</p>';
                  }
                }}
              />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Machines;


