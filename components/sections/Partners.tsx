'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';

const Partners = () => {
  const t = useTranslations('Partners');
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.2 });

  const partners = Array.from({ length: 8 }, (_, i) => ({
    id: i + 1,
    name: `Partner ${i + 1}`,
    logo: `/images/partners/partner${i + 1}.png`,
  }));

  return (
    <section ref={ref} className="py-20 bg-background">
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
          <p className="text-text-secondary font-poppins text-lg max-w-2xl mx-auto mb-8">
            {t('description')}
          </p>
        </motion.div>

        {/* Benefits */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {['visibility', 'roi', 'marketing'].map((benefit, index) => (
            <motion.div
              key={benefit}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              className="bg-background-secondary p-6 rounded-lg border border-gray-800 text-center"
            >
              <h3 className="text-lg font-orbitron font-semibold mb-2">{t(`benefits.${benefit}.title`)}</h3>
              <p className="text-text-secondary font-poppins text-sm">{t(`benefits.${benefit}.description`)}</p>
            </motion.div>
          ))}
        </div>

        {/* Partner Logos Carousel */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-8"
        >
          {partners.map((partner, index) => (
            <motion.div
              key={partner.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={inView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.4, delay: 0.8 + index * 0.1 }}
              className="bg-background-secondary p-6 rounded-lg border border-gray-800 flex items-center justify-center hover:border-primary transition-colors aspect-square relative"
            >
              <Image
                src={partner.logo}
                alt={partner.name}
                fill
                className="object-contain p-4"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const parent = target.parentElement;
                  if (parent) {
                    parent.innerHTML = `<p class="text-text-secondary text-sm font-poppins">${partner.name}</p>`;
                  }
                }}
              />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default Partners;


